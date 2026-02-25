"""
ipfs_utils.py — Download and upload adapter ZIPs via Pinata.
"""

import io
import os
import zipfile
import requests

PINATA_API_KEY    = os.getenv("PINATA_API_KEY")
PINATA_API_SECRET = os.getenv("PINATA_API_SECRET")
GATEWAY           = "https://gateway.pinata.cloud/ipfs"


def download_adapter_zip(cid: str, dest_dir: str) -> str:
    """
    Download a shard/adapter ZIP from IPFS and extract it into dest_dir.
    Returns dest_dir (pass to the FedAvg aggregator as the adapter directory).
    """
    url = f"{GATEWAY}/{cid}"
    print(f"[ipfs] Downloading {cid} from {url}")
    resp = requests.get(url, timeout=120)
    resp.raise_for_status()

    os.makedirs(dest_dir, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        zf.extractall(dest_dir)

    # Guard against zip-in-zip: if the outer archive only contains a single .zip,
    # extract that inner ZIP too so adapter_model.safetensors ends up at dest_dir root.
    contents = os.listdir(dest_dir)
    if len(contents) == 1 and contents[0].lower().endswith(".zip"):
        inner_path = os.path.join(dest_dir, contents[0])
        print(f"[ipfs] Detected nested ZIP {contents[0]}, extracting inner archive...")
        with zipfile.ZipFile(inner_path) as inner_zf:
            inner_zf.extractall(dest_dir)
        os.remove(inner_path)   # remove the now-redundant inner .zip

    print(f"[ipfs] Extracted to {dest_dir}")
    return dest_dir


def upload_adapter_dir(adapter_dir: str, job_id: int) -> str:
    """
    Zip the merged adapter directory and upload to Pinata.
    Returns the IPFS CID (IpfsHash) of the uploaded ZIP.
    """
    if not PINATA_API_KEY or not PINATA_API_SECRET:
        raise RuntimeError("PINATA_API_KEY / PINATA_API_SECRET not set")

    # Pack directory into a ZIP buffer in memory
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(adapter_dir):
            for fname in files:
                full = os.path.join(root, fname)
                arc  = os.path.relpath(full, adapter_dir)
                zf.write(full, arc)
    buf.seek(0)

    file_name = f"merged_adapter_job_{job_id}.zip"
    print(f"[ipfs] Uploading merged adapter as {file_name}")

    resp = requests.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        files={"file": (file_name, buf, "application/zip")},
        headers={
            "pinata_api_key":        PINATA_API_KEY,
            "pinata_secret_api_key": PINATA_API_SECRET,
        },
        timeout=120,
    )
    resp.raise_for_status()
    cid = resp.json()["IpfsHash"]
    print(f"[ipfs] Merged adapter uploaded: {cid}")
    return cid