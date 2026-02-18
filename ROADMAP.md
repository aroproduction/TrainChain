# TrainChain — Development Roadmap

## What is TrainChain?

TrainChain is a decentralized marketplace for AI model training. A **requester** uploads a dataset, specifies training parameters, and stakes a crypto reward. A **contributor** accepts the job, trains the model on their own hardware, and earns the reward upon verified completion — all enforced trustlessly via a smart contract on Polygon.

Currently, TrainChain supports **YOLO-based image classification** training. This roadmap outlines what needs to be built next to make TrainChain a genuinely useful, real-world platform.

---

## Objectives

### Why these changes?

1. **Federated LLM Finetuning** — The current single-contributor model has a major flaw: one person sees the entire dataset, which is a privacy risk, and one machine must handle all the compute. Federated learning splits the dataset across multiple contributors, each training a lightweight LoRA adapter on their shard. No contributor ever sees the full dataset. This makes TrainChain competitive as a privacy-preserving, decentralized ML platform — something no centralized service (Hugging Face AutoTrain, Replicate) can offer.

2. **Contributor Pool** — Right now requesters post jobs into a void. They have no idea who will train their model or whether that person is reliable. A transparent contributor pool, backed by on-chain data, gives requesters the trust signal they need and rewards high-performing contributors with visibility.

3. **Spec Detection** — Contributors don't know ahead of time if their machine can handle a job. Catching this at acceptance time (not signup) saves wasted time and failed jobs.

4. **UI & Routing Fixes** — The "Previous Requests" page is buried inside the Requester section and is not accessible as a direct link. Direct URL navigation to `/home`, `/contributor`, `/requester` returns 404 after deployment. These are fundamental usability issues that need to be resolved regardless of new features.

---

## Phase 1 — UI Fixes & Routing (Immediate Priority)

> These are bugs that affect existing users right now. Fix these first.

### 1.1 Fix SPA 404 on Direct URL Navigation

**Problem:** Navigating directly to `{host}/home`, `/contributor`, `/requester` returns a 404 because the hosting server doesn't know to serve `index.html` for all routes — it looks for a real file at that path.

**Fix:** 
- Add a `public/_redirects` file (for Netlify/Render static hosting) containing `/* /index.html 200`
- OR configure the Vite preview server / deployment target to serve `index.html` as fallback for all routes
- This is a standard React SPA fix and covers all existing and future routes

### 1.2 Make "Previous Requests" Accessible from Navbar

**Problem:** The "Previous Requests" / "My Requests" page is only reachable via a button buried in the Requester page. Users who want to check their job status must navigate to Requester first.

**Fix:**
- Add a "My Requests" link in the Navbar for logged-in users, alongside the existing Home/About/Contact links
- The navbar already has the logged-in state context (`userAddress`) — conditionally show this link when a wallet is connected
- This applies to both desktop and the mobile hamburger menu

### 1.3 Navbar Active Link Indicator

**Problem:** The navbar has no visual indicator of the currently active page.

**Fix:** Use React Router's `NavLink` instead of `Link` for navbar items and apply an active style class.

---

## Phase 2 — Foundation & Schema

> Before any new feature can be built, the data layer and smart contract need to be extended.

### 2.1 Update the Smart Contract (`AIModelTraining.sol`)

The current contract supports one contributor per job. For federated learning, it needs to support multiple contributors, each submitting their own output, with the reward split among them.

**Changes needed:**
- Add `minContributors` / `maxContributors` fields to the `Job` struct
- Allow multiple contributors to accept the same job (up to `maxContributors`)
- Add a `submitAdapter(jobId, adapterCID)` function for contributors to submit their LoRA output
- Change reward distribution: `stakeAmount / N` per contributor, released only after all adapters are collected and the job is marked complete
- Redeploy to Polygon Amoy testnet

### 2.2 Extend the PostgreSQL Schema

Add three new tables:

- **`llm_finetune_jobs`** — stores LLM-specific parameters: model name (e.g. `Qwen2.5-1.5B-Instruct`), LoRA rank, LoRA alpha, target modules, number of contributors required, dataset format, shard assignments (array of IPFS CIDs, one per contributor)
- **`contributor_submissions`** — stores each contributor's adapter CID submission per job, with timestamp and status
- **`contributor_profiles`** — stores optional self-reported GPU tier, join date derived from first `JobAccepted` event, and cached stats (jobs completed, completion rate)

### 2.3 Update Node.js Backend Routes

New API endpoints needed:
- `POST /jobs/llm-finetune` — create a new LLM finetune job
- `POST /jobs/submit-adapter` — contributor submits their adapter CID after training
- `GET /jobs/contributor-pool` — returns contributor pool data for the public leaderboard page
- `PUT /profile/gpu-tier` — contributor sets their GPU tier on their profile

---

## Phase 3 — Dataset Handling & IPFS

### 3.1 Dataset Sharding Service

A Python utility that runs on the backend server (not the contributor's machine):

- Accepts an uploaded JSONL dataset in Alpaca format (`instruction`, `input`, `output` fields)
- Validates the format before accepting
- Shuffles and splits into N equal shards (one per contributor)
- Uploads each shard separately to Pinata IPFS
- Returns one CID per shard — **each contributor only ever receives their own shard's CID**

This is the core of the privacy proposition: no single contributor downloads the full dataset.

### 3.2 Define the Standard Dataset Format

Document and enforce the input format for LLM finetune jobs:

```json
{"instruction": "Summarize the following text.", "input": "The quick brown fox...", "output": "A fox jumps over a dog."}
```

The frontend upload form will validate this format client-side before submitting. The backend will re-validate on receipt.

---

## Phase 4 — Training Environment: `uv`-Managed Venv (All Job Types)

> **Architecture decision:** The contributor app will no longer require Docker as an external dependency for any job type — including the existing YOLO image classification jobs. Instead, it uses `uv` — a single bundled binary (~10MB, written in Rust) — to create and manage a single isolated Python environment on the contributor's machine on first launch. This is the same pattern used by AUTOMATIC1111 Stable Diffusion WebUI and ComfyUI: widely accepted by non-technical users, no daemon or VM overhead, and works on Windows, Linux, and macOS.
>
> Both `train_yolo.py` (image classification) and `train_llm.py` (LLM finetuning) run inside the same shared venv. This means one first-time setup, one consistent environment, and no Docker dependency at all.

### 4.1 Build `train_yolo.py` — YOLO Image Classification Script

Extracts the logic currently inside the `aroproduction/trainchain:yolo-training` Docker image into a standalone Python script shipped with the contributor app. It is invoked inside the `uv`-managed venv:

1. Reads arguments: `--job-id`, `--dataset-cid`, `--model`, `--epochs`, `--imgsz`, `--num-classes`, `--classes`, `--export-format`, `--contributor-wallet`, `--api-url`
2. Downloads the dataset zip from IPFS via `dataset-cid`
3. Unzips and arranges the dataset into YOLO directory format
4. Runs YOLO training via `ultralytics`
5. Exports the trained model in the requested format
6. Uploads the trained model to IPFS via Pinata
7. POSTs the model CID back to `api-url/jobs/complete`

### 4.2 Build `train_llm.py` — LLM Finetuning Script

A self-contained Python script for the new LLM finetune job type, also invoked inside the same `uv`-managed venv:

1. Reads arguments: `--job-id`, `--shard-cid`, `--model-name`, `--lora-rank`, `--lora-alpha`, `--epochs`, `--contributor-wallet`, `--api-url`
2. Downloads the assigned shard from IPFS via `shard-cid`
3. Pulls the base model from HuggingFace (cached in `~/.cache/huggingface/` after first run)
4. Runs LoRA fine-tuning using `transformers` + `peft` + `bitsandbytes` (4-bit quantisation for low VRAM)
5. Saves the LoRA adapter (`.safetensors`)
6. Uploads the adapter to IPFS via Pinata
7. POSTs the adapter CID back to `api-url/jobs/submit-adapter`

**Supported models (initial set):**
- `Qwen/Qwen2.5-1.5B-Instruct`
- `microsoft/Phi-3-mini-4k-instruct`
- `HuggingFaceTB/SmolLM2-1.7B-Instruct`
- `TinyLlama/TinyLlama-1.1B-Chat-v1.0`

### 4.3 `uv`-Managed Environment Setup

The contributor app bundles a `uv` binary for the target platform (Windows x64, Linux x64, macOS ARM). On first launch:

1. App detects whether `.trainchain_env/` already exists
2. If not, shows a one-time **"Setting up training environment"** progress screen in the PyQt UI
3. Runs `uv venv .trainchain_env` and `uv pip install <packages>` — this downloads ~4–5GB of Python packages once
4. On every subsequent launch, the env is ready instantly — no setup step at all

The `.trainchain_env/` folder lives next to the app. If a user wants to reset, they delete that folder and re-run setup. Total disk footprint: ~5–7GB (covers both YOLO and LLM dependencies in one env).

**Python dependencies (single shared venv for all job types):** `torch`, `ultralytics`, `transformers`, `peft`, `bitsandbytes`, `datasets`, `accelerate`, `requests`, `huggingface_hub`, `psutil`

**What replaces the Docker subprocess calls in `jobs_window.py`:**
```python
python_bin = ".trainchain_env/Scripts/python.exe"  # Windows
# or ".trainchain_env/bin/python"                  # Linux / macOS

# Image classification job:
subprocess.run([python_bin, "train_yolo.py",
    "--job-id", job_id,
    "--dataset-cid", dataset_cid,
    "--model", model,
    "--epochs", str(epochs),
    "--contributor-wallet", wallet_address,
    "--api-url", API_URL
])

# LLM finetune job:
subprocess.run([python_bin, "train_llm.py",
    "--job-id", job_id,
    "--shard-cid", shard_cid,
    "--model-name", model_name,
    "--contributor-wallet", wallet_address,
    "--api-url", API_URL
])
```

### 4.4 Minimum Contributor Specs

| Path | Image Classification (YOLO) | LLM Finetuning |
|---|---|---|
| GPU (recommended) | 4GB VRAM, 8GB RAM, 10GB disk | 6GB VRAM, 8GB RAM, 10GB disk |
| CPU (supported) | 8GB RAM, 4-core CPU, 10GB disk | 16GB RAM, 4-core CPU, 10GB disk |
| Apple Silicon | M1/M2/M3 8GB — good | M1/M2/M3 8GB — excellent via MPS backend |

---

## Phase 5 — Aggregation Microservice

### 5.1 Build the Aggregation Server

A Python Flask/FastAPI microservice that runs on the backend server (not on contributor machines). It is triggered automatically once all N adapters for a job have been submitted.

**Process:**
1. Downloads all N LoRA adapters from IPFS
2. Runs **FedAvg** — computes a weighted average of the adapter weight matrices
3. Saves the merged final adapter
4. Uploads the merged adapter to IPFS
5. Calls `completeJob` on the smart contract with the final adapter CID
6. Rewards are distributed to all N contributors on-chain

**Why FedAvg works here:** LoRA adapters from the same base model live in the same weight space. Averaging them produces a valid adapter that captures knowledge from all shards — this is mathematically sound and well-established in the FL literature.

### 5.2 Deploy on Oracle Cloud Always Free

Run the entire backend stack on Oracle Cloud's Always Free ARM instance:
- 4 ARM vCPU, 24GB RAM, 200GB storage — **permanently free**
- Process manager (PM2 or systemd): Node.js API + Python aggregation service as separate processes
- PostgreSQL running as a system service
- No Docker needed on the server either — `uv` manages the aggregation service's Python environment on the server just as it does on contributor machines
- This replaces the current Render free tier for the aggregation workload (Render's 512MB RAM is insufficient)

---

## Phase 6 — Contributor App Updates

### 6.1 First-Launch Environment Setup Screen

Add a new **setup screen** to the PyQt app that runs exactly once:

- Detects whether `.trainchain_env/` already exists
- If not, shows a progress bar and status text while `uv` installs the ML dependencies
- Uses a background thread so the UI stays responsive during the ~3–4GB download
- On completion, saves a local flag so this screen never appears again
- If setup fails (e.g. network error), shows a clear error with a retry button

### 6.2 Spec Detection Pre-flight

In the PyQt contributor app (`jobs_window.py`), when a user accepts an LLM finetune job:

- Run a hardware check using the managed venv's Python: GPU VRAM via `torch.cuda.get_device_properties()`, available RAM via `psutil`, free disk space via `shutil.disk_usage()`
- Compare against the job's stated requirements (fetched from the API alongside job details)
- Show a clear pass/fail screen before invoking the training script
- If specs are insufficient, show exactly what is missing — don't silently fail mid-training
- This check runs inside the already-installed venv, so `torch` is guaranteed to be available

### 6.3 Migrate YOLO Job Type to `uv` Venv

Replace the existing `docker run aroproduction/trainchain:yolo-training` subprocess call in `jobs_window.py` with the new `train_yolo.py` invocation inside the `uv`-managed venv (see Phase 4.3 for the exact call). Behaviour from the user's perspective is identical — the training still runs in the background, progress is streamed to the UI, and the result is uploaded to IPFS on completion.

### 6.4 Add LLM Finetune Job Type

Extend `jobs_window.py` to handle `job_type == "llm_finetune"`:
- Invoke `train_llm.py` inside the `uv`-managed venv via subprocess (see Phase 4.3 for the exact call)
- Pass job-specific arguments (shard CID, model name, LoRA params, contributor wallet)
- Stream stdout from the training subprocess into the PyQt progress label so the contributor sees live training logs

---

## Phase 7 — Frontend: LLM Finetune Request Form

### 7.1 New `LLMFinetuneForm` Component

A new form component at `src/components/ModelForms/llmFinetune.jsx`, rendered when "LLM Finetuning" is selected from the model dropdown in the Requester page (alongside the existing "Image Classification" option).

**Form fields:**
- Model selector (dropdown of supported models)
- Dataset upload (`.jsonl` or `.csv`, with client-side format validation)
- Number of contributors (slider, 1–5)
- LoRA rank (dropdown: 8, 16, 32)
- Epochs per contributor
- Task description (free text, shown in contributor pool)
- Reward amount (ETH) — auto-display shows `reward / N` per contributor

### 7.2 Update Requester Page Model Dropdown

Add `"LLM Finetuning"` to the `modelTypes` array and its corresponding icon. The existing `"Image Classification"` entry and its form remain exactly as they are.

---

## Phase 8 — Contributor Pool Page

### 8.1 New `/contributor-pool` Route and Page

A public page (no login required) that shows all contributors on the platform.

**Table columns:**

| Column | Source |
|---|---|
| Wallet (truncated `0xAb3f...9c2`) | On-chain — links to Polygonscan |
| Jobs Completed | Count of `JobCompleted` events for this address |
| Completion Rate | `completed / accepted` — from DB |
| Active Status | Green dot if currently has an in-progress job |
| GPU Tier | Self-reported on profile (e.g. "6–8GB VRAM") |
| Member Since | First `JobAccepted` event timestamp |

**What is NOT shown:** Full wallet address, earnings, current job details.

### 8.2 Link Contributor Pool from Navbar and Home

- Add "Contributor Pool" as a navbar link (visible to all users, logged in or not)
- Add a CTA section on the Home page pointing to the pool

### 8.3 Show Contributor Info on My Requests

On the `MyRequests` page, for each job that has been accepted, show the accepting contributor's truncated wallet and their completion rate as a trust signal.

---

## Phase 9 — Profile & Polish

### 9.1 Contributor Profile Setup

When a wallet connects for the first time as a contributor (i.e. their address is not yet in `contributor_profiles`), show a lightweight modal:
- Optional GPU tier dropdown: "No GPU / CPU only", "4–6GB VRAM", "6–8GB VRAM", "8–16GB VRAM", "16GB+ VRAM", "Apple Silicon"
- One-click save — stores to `contributor_profiles` via the backend API

This data feeds directly into the contributor pool display and job compatibility filtering.

### 9.2 End-to-End Prototype Test

Run a full cycle on testnet before any mainnet deployment:
1. Requester uploads a small dataset (~500 Alpaca samples)
2. System shards it into 2 parts, uploads shards to IPFS
3. Two contributors (with different machines) accept the job and run training
4. Both adapters are submitted, aggregation runs automatically
5. Final adapter uploaded to IPFS, `completeJob` called on-chain
6. Both contributors receive their share of the reward

---

## Dependency Order

```
Phase 1 (UI Fixes)              ← Independent, do immediately
Phase 2 (Schema + Contract)     ← Required before everything below
    ├── Phase 3 (Dataset/IPFS sharding)
    ├── Phase 4 (Training Scripts + uv env — both job types)
    │       └── Phase 5 (Aggregation Service)
    │       └── Phase 6 (Contributor App Updates)
    └── Phase 7 (Frontend Form)
    └── Phase 8 (Contributor Pool)
            └── Phase 9 (Profile + E2E Test)
```

Phases 3, 4, 7, and 8 can be developed in parallel once Phase 2 is complete.
Phase 1 is entirely independent and should be done first.

---

## What Is NOT Changing

- The existing **YOLO image classification** job type, database table, API routes, frontend form, and smart contract functions are all preserved. Phase 6.3 migrates the training execution from Docker to the `uv` venv — the behaviour, inputs, and outputs stay identical.
- The existing **MetaMask login flow** is unchanged.
- The existing **IPFS upload via Pinata** is reused as-is for all dataset and model uploads.
- The existing **Polygon smart contract** is extended, not replaced — all jobs already recorded on-chain remain valid.
