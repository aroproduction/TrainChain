"""
train_llm.py — Federated LoRA finetuning script for TrainChain.

Invoked by jobs_window.py inside the uv-managed venv:
    .trainchain_env/Scripts/python.exe train_llm.py
        --job-id <id>
        --api-url <url>
        --contributor-wallet <0x...>

Flow
----
  1. GET  {api}/jobs/llm/my-slot?contributorAddress=...
         → model_name, epochs, lora_rank, lora_alpha, max_seq_length,
           learning_rate, shard_cid
  2. GET  {api}/jobs/llm/get-shard/{jobId}?contributorAddress=...
         → dataset shard ZIP (JSONL inside)
  3. Fine-tune the base model with LoRA via PEFT + HuggingFace Transformers
  4. Save adapter files (adapter_config.json + adapter_model.safetensors)
  5. POST {api}/jobs/llm/upload-adapter (multipart)
         → adapterCid (IPFS CID stored by backend via Pinata)
  6. POST {api}/jobs/llm/submit-adapter
         → records CID in DB; triggers aggregation if last contributor

Exit codes
----------
  0  — success
  1  — slot not found
  2  — shard not ready yet (retry later)
  3  — training / upload error
"""

import argparse
import json
import os
import sys
import tempfile
import zipfile
from pathlib import Path

# Force UTF-8 stdout so emoji log lines don't crash on Windows cp1252 terminals.
# The Popen caller already uses encoding="utf-8" but the subprocess's own stdout
# defaults to the system code page unless we reconfigure it here.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import requests
import torch
from datasets import Dataset
from peft import LoraConfig, TaskType, get_peft_model
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    DataCollatorForLanguageModeling,
    Trainer,
    TrainingArguments,
)


# ─────────────────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────────────────

def log(msg: str) -> None:
    """Print a tagged, immediately-flushed log line (read by jobs_window.py)."""
    print(f"[trainchain-llm] {msg}", flush=True)


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="TrainChain LLM finetuning script")
    p.add_argument("--job-id",             required=True,  help="TrainChain job ID")
    p.add_argument("--api-url",            required=True,  help="Backend API base URL")
    p.add_argument("--contributor-wallet", required=True,  help="Contributor wallet address")
    return p.parse_args()


# ─────────────────────────────────────────────────────────────────────────────
# Step 1 — Fetch slot / training parameters
# ─────────────────────────────────────────────────────────────────────────────

def fetch_slot_info(api_url: str, contributor_wallet: str) -> dict | None:
    url = f"{api_url}/jobs/llm/my-slot"
    log(f"GET {url}")
    r = requests.get(url, params={"contributorAddress": contributor_wallet}, timeout=30)
    if r.status_code == 204:
        return None
    r.raise_for_status()
    data = r.json()
    if not data or "job_id" not in data:
        return None
    log(
        f"Slot info | job={data.get('job_id')}  model={data.get('model_name')}  "
        f"rank={data.get('lora_rank')}  epochs={data.get('epochs')}"
    )
    return data


# ─────────────────────────────────────────────────────────────────────────────
# Step 2 — Download shard
# ─────────────────────────────────────────────────────────────────────────────

def download_shard(api_url: str, job_id: str, contributor_wallet: str, dest: Path) -> Path:
    url = f"{api_url}/jobs/llm/get-shard/{job_id}"
    log(f"Downloading shard: {url}")
    r = requests.get(
        url,
        params={"contributorAddress": contributor_wallet},
        timeout=300,
        stream=True,
    )
    if r.status_code == 202:
        raise RuntimeError(
            "Dataset shard is not ready yet — sharding is still in progress. "
            "Please wait a few minutes and try again."
        )
    r.raise_for_status()

    zip_path = dest / "shard.zip"
    with open(zip_path, "wb") as fh:
        for chunk in r.iter_content(8192):
            fh.write(chunk)
    log(f"Shard saved ({zip_path.stat().st_size // 1024} KB)")

    extract_dir = dest / "shard_data"
    extract_dir.mkdir()
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(extract_dir)
    log(f"Shard extracted to {extract_dir}")
    return extract_dir


# ─────────────────────────────────────────────────────────────────────────────
# Step 3a — Load dataset from extracted shard
# ─────────────────────────────────────────────────────────────────────────────

def _load_samples(data_dir: Path) -> list[dict]:
    """Find and parse the first JSONL / JSON file in the shard directory."""
    for pattern in ("*.jsonl", "*.json"):
        files = list(data_dir.rglob(pattern))
        if files:
            with open(files[0], encoding="utf-8") as fh:
                if files[0].suffix == ".jsonl":
                    return [json.loads(ln) for ln in fh if ln.strip()]
                data = json.load(fh)
                return data if isinstance(data, list) else [data]
    raise FileNotFoundError(f"No JSONL/JSON dataset file found under {data_dir}")


def _build_prompt(sample: dict) -> str:
    """Alpaca-format prompt builder."""
    prompt = f"### Instruction:\n{sample.get('instruction', '')}\n"
    if sample.get("input"):
        prompt += f"\n### Input:\n{sample['input']}\n"
    prompt += f"\n### Response:\n{sample.get('output', '')}"
    return prompt


# ─────────────────────────────────────────────────────────────────────────────
# Step 3b — Train
# ─────────────────────────────────────────────────────────────────────────────

def run_training(slot: dict, data_dir: Path, output_dir: Path) -> Path:
    model_name  = slot["model_name"]
    epochs      = int(slot.get("epochs", 3))
    lora_rank   = int(slot.get("lora_rank", 8))
    lora_alpha  = int(slot.get("lora_alpha", 16))
    max_seq_len = int(slot.get("max_seq_length", 512))
    lr          = float(slot.get("learning_rate", 2e-4))

    use_gpu = torch.cuda.is_available()
    device  = "cuda" if use_gpu else "cpu"
    log(f"Device: {device}  (GPU={use_gpu})")
    log(
        f"Hyperparams | model={model_name}  epochs={epochs}  rank={lora_rank}  "
        f"alpha={lora_alpha}  seq={max_seq_len}  lr={lr}"
    )

    # ── Tokenizer ──────────────────────────────────────────────────────────────
    log("Loading tokenizer …")
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    if tokenizer.pad_token is None:
        # Most causal LMs don't set a pad token; use EOS as padding
        tokenizer.pad_token = tokenizer.eos_token

    # ── Base model ─────────────────────────────────────────────────────────────
    log("Loading base model (this may download weights on first run) …")
    load_kw: dict = {"trust_remote_code": True}
    if use_gpu:
        load_kw["torch_dtype"] = torch.float16
        load_kw["device_map"]  = "auto"
    else:
        load_kw["torch_dtype"] = torch.float32
    model = AutoModelForCausalLM.from_pretrained(model_name, **load_kw)

    # ── LoRA config ──────────────────────────────────────────────────────────
    lora_cfg = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=lora_rank,
        lora_alpha=lora_alpha,
        lora_dropout=0.05,
        target_modules=["q_proj", "v_proj"],
        bias="none",
    )
    model = get_peft_model(model, lora_cfg)
    model.print_trainable_parameters()

    # ── Dataset ────────────────────────────────────────────────────────────────
    log("Preparing dataset …")
    raw_samples = _load_samples(data_dir)
    prompts     = [_build_prompt(s) for s in raw_samples]
    log(f"Loaded {len(prompts)} samples from shard")

    def _tokenize(batch: dict) -> dict:
        out = tokenizer(
            batch["text"],
            max_length=max_seq_len,
            truncation=True,
            padding="max_length",
            return_tensors=None,
        )
        # For causal LM the labels ARE the input_ids (shifted inside the model)
        out["labels"] = out["input_ids"].copy()
        return out

    hf_ds = Dataset.from_dict({"text": prompts})
    tok_ds = hf_ds.map(_tokenize, batched=True, remove_columns=["text"])
    tok_ds.set_format("torch")
    log(f"Tokenized dataset: {len(tok_ds)} rows")

    # ── Training arguments ─────────────────────────────────────────────────────
    ckpt_dir = output_dir / "checkpoints"
    ckpt_dir.mkdir(parents=True, exist_ok=True)

    train_args = TrainingArguments(
        output_dir=str(ckpt_dir),
        num_train_epochs=epochs,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        learning_rate=lr,
        fp16=use_gpu,          # enable mixed precision on GPU
        bf16=False,
        logging_steps=5,
        save_strategy="no",    # no checkpoints — adapter saved once at the end
        report_to="none",      # disable wandb / tensorboard
        dataloader_pin_memory=use_gpu,
        use_cpu=not use_gpu,   # no_cuda was removed in Transformers ≥4.37
        ddp_find_unused_parameters=False,
    )

    trainer = Trainer(
        model=model,
        args=train_args,
        train_dataset=tok_ds,
        data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
    )

    log("Training started …")
    trainer.train()
    log("Training complete.")

    # ── Save LoRA adapter ──────────────────────────────────────────────────────
    adapter_dir = output_dir / "adapter"
    adapter_dir.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(adapter_dir))
    tokenizer.save_pretrained(str(adapter_dir))
    log(f"Adapter saved to {adapter_dir}")
    return adapter_dir


# ─────────────────────────────────────────────────────────────────────────────
# Step 4 — Zip adapter files
# ─────────────────────────────────────────────────────────────────────────────

def zip_adapter(adapter_dir: Path, out_dir: Path) -> Path:
    zip_path = out_dir / "adapter.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for item in adapter_dir.iterdir():
            if item.is_file():
                zf.write(item, item.name)
    size_kb = zip_path.stat().st_size // 1024
    log(f"Adapter zipped: {zip_path.name} ({size_kb} KB)")
    return zip_path


# ─────────────────────────────────────────────────────────────────────────────
# Step 5 — Upload adapter ZIP to backend → IPFS
# ─────────────────────────────────────────────────────────────────────────────

def upload_adapter(
    api_url: str, job_id: str, contributor_wallet: str, zip_path: Path
) -> str:
    url = f"{api_url}/jobs/llm/upload-adapter"
    log(f"Uploading adapter: POST {url}")
    with open(zip_path, "rb") as fh:
        r = requests.post(
            url,
            data={
                "jobId":              job_id,
                "contributorAddress": contributor_wallet,
            },
            files={"file": ("adapter.zip", fh, "application/zip")},
            timeout=300,
        )
    r.raise_for_status()
    cid = r.json()["adapterCid"]
    log(f"Adapter CID: {cid}")
    return cid


# ─────────────────────────────────────────────────────────────────────────────
# Step 6 — Submit adapter CID to backend
# ─────────────────────────────────────────────────────────────────────────────

def submit_adapter(
    api_url: str, job_id: str, contributor_wallet: str, adapter_cid: str
) -> None:
    url = f"{api_url}/jobs/llm/submit-adapter"
    log(f"Submitting adapter CID: POST {url}")
    # Longer timeout: backend now signs submitAdapter() on-chain before responding
    r = requests.post(
        url,
        json={
            "jobId":              int(job_id),
            "contributorAddress": contributor_wallet,
            "adapterCid":         adapter_cid,
        },
        timeout=180,
    )
    r.raise_for_status()
    resp = r.json()
    log(f"Submit response: {resp.get('message', 'ok')}")
    if resp.get("allSubmitted"):
        log("All adapters submitted — aggregation is starting on the server.")


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    args = _parse_args()
    log(f"job={args.job_id} | wallet={args.contributor_wallet}")

    # 1. Fetch training params
    slot = fetch_slot_info(args.api_url, args.contributor_wallet)
    if not slot:
        log("ERROR: No active LLM slot found for this wallet.")
        sys.exit(1)

    if not slot.get("shard_cid"):
        log(
            "ERROR: Dataset shard is not ready yet. "
            "The backend is still sharding the dataset — please wait and retry."
        )
        sys.exit(2)

    # 2-6. Run full pipeline inside a temp directory (auto-cleaned on exit)
    with tempfile.TemporaryDirectory(prefix="tc_llm_") as tmp:
        tmp_p = Path(tmp)

        # 2. Download shard
        data_dir   = download_shard(args.api_url, args.job_id, args.contributor_wallet, tmp_p)

        # 3. Train
        output_dir = tmp_p / "output"
        output_dir.mkdir()
        adapter_dir = run_training(slot, data_dir, output_dir)

        # 4. Zip
        zip_path = zip_adapter(adapter_dir, tmp_p)

        # 5. Upload to IPFS via backend
        adapter_cid = upload_adapter(
            args.api_url, args.job_id, args.contributor_wallet, zip_path
        )

        # 6. Record in DB, trigger aggregation if last slot
        submit_adapter(args.api_url, args.job_id, args.contributor_wallet, adapter_cid)

    log("✅ Done — adapter submitted successfully.")


if __name__ == "__main__":
    main()
