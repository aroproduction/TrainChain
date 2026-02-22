"""
server.py — Flask aggregation microservice.
Triggered by the Node.js backend after all adapters are submitted.

Endpoints:
    POST /aggregate      { "job_id": 123 }   — start aggregation for a job
    GET  /health                              — liveness check
"""

import os
import shutil
import threading
import traceback

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request

load_dotenv()

from aggregator  import run_fedavg
from ipfs_utils  import download_adapter_zip, upload_adapter_dir
from blockchain  import complete_federated_job_on_chain

app = Flask(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
WORK_DIR    = os.getenv("WORK_DIR", "./tmp_aggregation")

# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/health")
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/aggregate", methods=["POST"])
def aggregate():
    """
    Accepts { "job_id": <int> } and kicks off aggregation in a background thread.
    Returns immediately so the Node backend is not blocked.
    """
    data = request.get_json(silent=True)
    if not data or "job_id" not in data:
        return jsonify({"error": "job_id required"}), 400

    job_id = int(data["job_id"])
    print(f"\n[server] Aggregation requested for job {job_id}")

    thread = threading.Thread(
        target=_run_aggregation_safe,
        args=(job_id,),
        daemon=True,
    )
    thread.start()

    return jsonify({"message": f"Aggregation started for job {job_id}"}), 202


# ─────────────────────────────────────────────────────────────────────────────
# Core aggregation pipeline (runs in background thread)
# ─────────────────────────────────────────────────────────────────────────────

def _run_aggregation_safe(job_id: int):
    """Wrapper that catches all exceptions and reports failure to backend."""
    try:
        _run_aggregation(job_id)
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[error] Aggregation failed for job {job_id}:\n{tb}")
        _notify_backend_failure(job_id, str(e))


def _run_aggregation(job_id: int):
    log_lines = []

    def log(msg: str):
        print(msg)
        log_lines.append(msg)

    log(f"[agg] ══ Start aggregation for job {job_id} ══")

    # ── 1. Fetch slot info from Node backend ──────────────────────────────────
    log(f"[agg] Fetching slot info from backend...")
    resp = requests.get(
        f"{BACKEND_URL}/jobs/llm/slots/{job_id}",
        timeout=15,
    )
    resp.raise_for_status()
    slots = resp.json()   # list of { slot_index, contributor_address, adapter_cid, shard_size }

    if not slots:
        raise ValueError(f"No slots found for job {job_id}")

    missing = [s for s in slots if not s.get("adapter_cid")]
    if missing:
        raise ValueError(
            f"Slots {[s['slot_index'] for s in missing]} have no adapter_cid — "
            "cannot aggregate yet."
        )

    log(f"[agg] {len(slots)} slots with adapters.")

    # ── 2. Download all adapter ZIPs from IPFS ────────────────────────────────
    job_work_dir = os.path.join(WORK_DIR, f"job_{job_id}")
    shutil.rmtree(job_work_dir, ignore_errors=True)   # clean any previous attempt

    adapter_dirs  = []
    shard_sizes   = []

    for slot in sorted(slots, key=lambda s: s["slot_index"]):
        dest = os.path.join(job_work_dir, f"adapter_{slot['slot_index']}")
        log(f"[agg] Downloading adapter for slot {slot['slot_index']}: {slot['adapter_cid']}")
        download_adapter_zip(slot["adapter_cid"], dest)
        adapter_dirs.append(dest)
        shard_sizes.append(int(slot.get("shard_size") or 1))

    # ── 3. Run FedAvg ─────────────────────────────────────────────────────────
    merged_dir = os.path.join(job_work_dir, "merged_adapter")
    log(f"[agg] Running FedAvg over {len(adapter_dirs)} adapters...")
    run_fedavg(adapter_dirs, shard_sizes, merged_dir)
    log(f"[agg] FedAvg complete. Merged adapter at: {merged_dir}")

    # ── 4. Upload merged adapter to Pinata ────────────────────────────────────
    log(f"[agg] Uploading merged adapter to IPFS...")
    merged_cid = upload_adapter_dir(merged_dir, job_id)
    log(f"[agg] Merged adapter CID: {merged_cid}")

    # ── 5. Call completeFederatedJob() on-chain ───────────────────────────────
    log(f"[agg] Calling completeFederatedJob on-chain...")
    tx_hash = complete_federated_job_on_chain(job_id, merged_cid)
    log(f"[agg] On-chain tx confirmed: {tx_hash}")

    # ── 6. Notify backend to update DB ────────────────────────────────────────
    log(f"[agg] Notifying backend to finalize job {job_id}...")
    aggregation_log = "\n".join(log_lines)
    _notify_backend_success(job_id, merged_cid, tx_hash, aggregation_log)

    # ── 7. Cleanup temp files ─────────────────────────────────────────────────
    shutil.rmtree(job_work_dir, ignore_errors=True)
    log(f"[agg] ══ Aggregation complete for job {job_id} ══\n")


def _notify_backend_success(job_id: int, merged_cid: str, tx_hash: str, log: str):
    try:
        resp = requests.post(
            f"{BACKEND_URL}/jobs/llm/finalize/{job_id}",
            json={"mergedAdapterCid": merged_cid, "txHash": tx_hash, "aggregationLog": log},
            timeout=15,
        )
        resp.raise_for_status()
        print(f"[agg] Backend finalization confirmed for job {job_id}")
    except Exception as e:
        print(f"[warn] Backend finalization call failed for job {job_id}: {e}")


def _notify_backend_failure(job_id: int, error_msg: str):
    try:
        requests.post(
            f"{BACKEND_URL}/jobs/llm/aggregation-failed/{job_id}",
            json={"error": error_msg},
            timeout=10,
        )
    except Exception:
        pass   # best-effort only


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    os.makedirs(WORK_DIR, exist_ok=True)
    print(f"[server] Aggregation microservice starting on port {port}")
    print(f"[server] Backend URL: {BACKEND_URL}")
    print(f"[server] Work dir:    {WORK_DIR}")
    app.run(host="0.0.0.0", port=port, debug=False)