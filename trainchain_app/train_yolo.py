"""
train_yolo.py — Standalone YOLO image-classification training script.

Faithfully replicates the logic in yoloDockerImage/entrypoint.sh +
dataset_arrange.py + model_train.py + create_yaml.py, without Docker.

Invoked by jobs_window.py inside the uv-managed venv:
    .trainchain_env/Scripts/python.exe train_yolo.py --job-id <id> --api-url <url> ...

API endpoints (same as the Docker entrypoint used):
    GET  {api_url}/jobs/get-dataset/{job_id}/           -> dataset zip
    GET  {api_url}/jobs/image_processing/get-job/{job_id}/ -> job details JSON
    POST {api_url}/jobs/model/upload                    -> multipart upload of output files
"""

import argparse
import os
import random
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

import requests


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(description="TrainChain YOLO training script")
    parser.add_argument("--job-id",             required=True)
    parser.add_argument("--api-url",            required=True)
    parser.add_argument("--contributor-wallet", required=True)
    return parser.parse_args()

def fetch_job_details(api_url: str, job_id: str) -> dict:
    url = f"{api_url}/jobs/image_processing/get-job/{job_id}/"
    print(f"[trainchain] Fetching job details: {url}")
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    data = r.json()
    print(f"[trainchain] Job details: {data}")
    return data


# ---------------------------------------------------------------------------
# Step 2 — download + unzip dataset  (mirrors: curl .../jobs/get-dataset/{id}/)
# ---------------------------------------------------------------------------

def download_dataset(api_url: str, job_id: str, dest_dir: Path) -> Path:
    url = f"{api_url}/jobs/get-dataset/{job_id}/"
    print(f"[trainchain] Downloading dataset from {url}")
    r = requests.get(url, timeout=300, stream=True)
    r.raise_for_status()

    zip_path = dest_dir / "dataset.zip"
    with open(zip_path, "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"[trainchain] Dataset zip saved ({zip_path.stat().st_size // 1024} KB)")

    extract_dir = dest_dir / "dataset_files"
    extract_dir.mkdir(exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(extract_dir)
    print(f"[trainchain] Dataset extracted to {extract_dir}")
    return extract_dir


# ---------------------------------------------------------------------------
# Step 3 — arrange dataset  (mirrors: dataset_arrange.py)
# 70 % train / 20 % valid / 10 % test — flat images+labels layout
# ---------------------------------------------------------------------------

def arrange_dataset(source_dir: Path, dest_dir: Path) -> None:
    """Replicate dataset_arrange.py exactly."""
    # Collect all image files (flat — same as Docker script)
    image_files = []
    for ext in [".jpg", ".jpeg", ".png"]:
        image_files.extend(source_dir.glob(f"*{ext}"))
    random.shuffle(image_files)

    total = len(image_files)
    if total == 0:
        raise RuntimeError(f"No images found in {source_dir}")

    train_size = int(0.7 * total)
    valid_size = int(0.2 * total)

    splits = {
        "train": image_files[:train_size],
        "valid": image_files[train_size:train_size + valid_size],
        "test":  image_files[train_size + valid_size:],
    }

    for split in splits:
        (dest_dir / split / "images").mkdir(parents=True, exist_ok=True)
        (dest_dir / split / "labels").mkdir(parents=True, exist_ok=True)

    for split, files in splits.items():
        for img_path in files:
            label_path = img_path.with_suffix(".txt")
            shutil.copy2(img_path, dest_dir / split / "images" / img_path.name)
            if label_path.exists():
                shutil.copy2(label_path, dest_dir / split / "labels" / label_path.name)

    print(f"[trainchain] Dataset arranged: {train_size} train / {valid_size} valid / {total - train_size - valid_size} test")


# ---------------------------------------------------------------------------
# Step 4 — create data.yaml  (mirrors: create_yaml.py)
# ---------------------------------------------------------------------------

def create_data_yaml(dataset_dir: Path, num_classes: int, classes: list[str]) -> Path:
    yaml_path = dataset_dir.parent / "data.yaml"
    quoted = [f'"{c}"' for c in classes]
    yaml_path.write_text(
        f"path: {dataset_dir}\n"
        f"train: train/images\n"
        f"val: valid/images\n"
        f"test: test/images\n"
        f"nc: {num_classes}\n"
        f"names: [{', '.join(quoted)}]\n"
    )
    print(f"[trainchain] data.yaml written to {yaml_path}")
    return yaml_path


# ---------------------------------------------------------------------------
# Step 5 — model name mapping  (mirrors: model_train.py)
# ---------------------------------------------------------------------------

_MODEL_MAP = {
    "yolo v8":  "yolov8n.pt",
    "yolo v9":  "yolov9t.pt",
    "yolo v10": "yolov10n.pt",
    "yolo v11": "yolo11n.pt",
}

def resolve_model(model_str: str) -> str:
    return _MODEL_MAP.get(model_str.strip().lower(), model_str)


# ---------------------------------------------------------------------------
# Step 6 — train  (mirrors: model_train.py)
# ---------------------------------------------------------------------------

def train(work_dir: Path, yaml_path: Path, model_name: str, epochs: int, imgsz: int) -> Path:
    from ultralytics import YOLO  # only available inside the managed venv

    print(f"[trainchain] Training: model={model_name}  epochs={epochs}  imgsz={imgsz}")

    # Change cwd to work_dir so YOLO downloads base model weights there,
    # not into the trainchain_app source/install directory.
    original_cwd = os.getcwd()
    os.chdir(work_dir)
    try:
        model = YOLO(model=model_name)
        model.train(
            data=str(yaml_path),
            imgsz=imgsz,
            epochs=epochs,
            project=str(work_dir / "trained_model"),
            name="train1",
            plots=True,
        )
    finally:
        os.chdir(original_cwd)

    output_dir = work_dir / "trained_model" / "train1"
    print(f"[trainchain] Training complete. Output: {output_dir}")
    return output_dir


# ---------------------------------------------------------------------------
# Step 7 — upload ALL files in trained_model/train1/
#           (mirrors: curl -X POST -F jobId=... -F files=@... .../jobs/model/upload)
# ---------------------------------------------------------------------------

def upload_results(api_url: str, job_id: str, output_dir: Path) -> None:
    url = f"{api_url}/jobs/model/upload"

    # Walk the entire output tree so weights/best.pt and weights/last.pt
    # are included alongside the top-level CSVs, PNGs and confusion matrices.
    files_in_dir = [f for f in output_dir.rglob("*") if f.is_file()]

    if not files_in_dir:
        raise RuntimeError(f"No output files found in {output_dir}")

    print(f"[trainchain] Uploading {len(files_in_dir)} file(s) to {url}")

    # Build multipart payload: one 'files' field per file + jobId
    # Matches the Docker entrypoint: -F jobId="$JOB_ID" -F files=@"$file" ...
    file_handles = []
    try:
        multipart = [("jobId", (None, str(job_id)))]
        for fp in files_in_dir:
            fh = open(fp, "rb")
            file_handles.append(fh)
            multipart.append(("files", (fp.name, fh)))

        r = requests.post(url, files=multipart, timeout=300)
        r.raise_for_status()
        print(f"[trainchain] Upload response: {r.text}")
    finally:
        for fh in file_handles:
            fh.close()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    args = parse_args()
    api_url = args.api_url.rstrip("/")

    work_dir = Path(tempfile.mkdtemp(prefix="trainchain_"))
    print(f"[trainchain] Working directory: {work_dir}")

    try:
        # 1. Job details
        job = fetch_job_details(api_url, args.job_id)

        model_name  = resolve_model(job.get("model", "yolo11n.pt"))
        epochs      = int(job.get("epochs", 100))
        imgsz       = int(job.get("imgsz", 640))
        num_classes = int(job.get("num_classes", 1))
        # classes field is a comma-separated string e.g. "no_mask, mask"
        classes     = [c.strip() for c in str(job.get("classes", "object")).split(",")]

        # 2. Download + unzip
        extract_dir = download_dataset(api_url, args.job_id, work_dir)

        # 3. Arrange
        dataset_dir = work_dir / "dataset"
        arrange_dataset(extract_dir, dataset_dir)

        # 4. YAML
        yaml_path = create_data_yaml(dataset_dir, num_classes, classes)

        # 5 + 6. Train
        output_dir = train(work_dir, yaml_path, model_name, epochs, imgsz)

        # 7. Upload
        upload_results(api_url, args.job_id, output_dir)

        print("[trainchain] Pipeline finished successfully.")

    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
