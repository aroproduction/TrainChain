# TrainChain — Backend API

The backend is a **Node.js / Express** REST API that manages jobs, IPFS storage, PostgreSQL persistence, and Polygon smart-contract interactions for the TrainChain platform.  
All routes are mounted under the `/jobs` prefix.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express 4 |
| Database | PostgreSQL (via `pg` Pool) |
| File handling | Multer (memory storage) |
| IPFS / Pinata | Axios + Pinata REST API |
| Blockchain | Web3.js — Polygon (Amoy testnet) |
| Validation | express-validator |
| Dev server | nodemon |

---

## Project Structure

```
backend/
├── app.js                   # Express app setup, CORS, middleware, route mounting
├── server.js                # HTTP server bootstrap
├── package.json
├── .env.example             # Required environment variables
├── controllers/
│   └── job.controller.js    # All request handlers
├── routes/
│   └── job.routes.js        # Route definitions and input validation rules
├── services/
│   ├── db.services.js       # All PostgreSQL queries
│   ├── ipfs.services.js     # Pinata upload / download helpers
│   └── sharding.services.js # Dataset sharding logic for LLM federated jobs
├── db/
│   ├── db.js                # PostgreSQL pool + connectToDB()
│   └── migrations/
│       ├── 001_create_jobs.sql
│       ├── 002_create_image_processing_jobs.sql
│       ├── 003_create_llm_finetune_jobs.sql
│       ├── 004_create_llm_contributor_slots.sql
│       └── 005_create_contributor_profiles.sql
└── utils/
    ├── blockchain.js        # completeJob, acceptFederatedJob, submitAdapter, completeFederatedJob
    ├── constants.js
    └── feeCalculator.js     # Stake calculation and reward validation
```

---

## Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in the values:

```env
POSTGRES_URL=<your_postgres_url>
FRONTEND_URL=http://localhost:5173
PORT=4000

PINATA_API_Key=<your_pinata_api_key>
PINATA_API_Secret=<your_pinata_api_secret>

POLYGON_RPC_URL=<your_polygon_rpc_url>
PRIVATE_KEY=<owner_wallet_private_key>
CONTRACT_ADDRESS=<deployed_contract_address>

# URL of the Python aggregation microservice
AGGREGATION_SERVICE_URL=http://localhost:5001
```

### 3. Run database migrations
Execute the SQL files in `db/migrations/` against your PostgreSQL instance in order (001 through 005).

### 4. Start the server
```bash
npm start          # runs: nodemon server.js
```
The server listens on `PORT` (default **4000**).

---

## API Reference

### Common error responses

| Status | Meaning |
|---|---|
| 400 | Validation error — missing or invalid field |
| 404 | Resource not found |
| 500 | Internal server error |
| 502 | On-chain transaction failed (blockchain call) |

---

## Image Processing Jobs

### POST `/jobs/image_processing/upload`

Upload a new image-processing (YOLO) training job with its dataset.  
Expects `multipart/form-data`.

**Body fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `folderName` | string | ✓ | Dataset folder display name |
| `model` | string | ✓ | Model identifier, e.g. `"yolo v11"` |
| `epochs` | integer | ✓ | Number of training epochs |
| `imgsz` | string | ✓ | Input image size, e.g. `"640"` |
| `exportFormat` | string | ✓ | Export format, e.g. `"ONNX"`, `"tfjs"` |
| `numClasses` | integer | ✓ | Number of object classes |
| `classes` | string \| array | ✓ | Class names — comma-separated string or JSON array |
| `reward` | float | ✓ | Reward in POL |
| `requesterAddress` | string | ✓ | Requester wallet address |

**Files:** `files[]` — dataset images (one or more).

**Response `200`:**
```json
{
  "message": "Job uploaded successfully",
  "job": { /* jobs table row */ }
}
```

> **Note:** This endpoint creates the job in `unconfirmed` status. Call `POST /jobs/confirm/:jobId` after the blockchain transaction succeeds to make it visible.

---

### GET `/jobs/image_processing/get-job/:jobId`

Retrieve details of a specific image-processing job.

**URL parameter:** `:jobId`

**Response `200`:**
```json
{
  "id": 14,
  "job_id": 14,
  "model": "yolo v11",
  "epochs": 3000,
  "imgsz": "1024",
  "export_format": "tfjs",
  "num_classes": 2,
  "classes": "dog, cat",
  "job_type": "image_processing",
  "requester_address": "0xe003...",
  "folder_cid": "QmZ6V...",
  "metadata_cid": "QmU99...",
  "reward": "500.000000",
  "status": "pending",
  "created_at": "2025-02-14T04:36:47.332Z"
}
```

---

## General Job Routes

### GET `/jobs/get-jobs`

Returns all pending image-processing jobs (for the job browsing page).

**Response `200`:** Array of job objects.

---

### GET `/jobs/get-dataset/:jobId`

Download the dataset ZIP for a job (fetched from IPFS via Pinata).

**URL parameter:** `:jobId`

**Response:** `application/zip` file — `dataset_<jobId>.zip`

---

### POST `/jobs/model/upload`

Upload a trained model folder to IPFS and mark the job as completed on-chain.  
Expects `multipart/form-data`.

**Body fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `jobId` | string/integer | ✓ | ID of the completed job |

**Files:** `files[]` — trained model files.

**Response `200`:**
```json
{
  "message": "Trained model uploaded successfully and job marked as complete on blockchain",
  "job": { /* updated job row */ }
}
```

---

### GET `/jobs/get-model/:jobId`

Download the trained model ZIP for a completed job (fetched from IPFS).

**URL parameter:** `:jobId`

**Response:** `application/zip` file — `model_<jobId>.zip`

---

### GET `/jobs/my-requests`

Retrieve all jobs posted by a specific requester (image-processing jobs).

**Query parameters:**

| Param | Required | Description |
|---|---|---|
| `requesterAddress` | ✓ | Requester wallet address |

**Response `200`:** Array of job objects.

---

## Two-Phase Job Creation (Image Processing)

Job creation follows a two-phase commit to keep the DB in sync with the blockchain.

### POST `/jobs/confirm/:jobId`

Transitions the job from `unconfirmed` → `pending` after the blockchain `createJob()` transaction is confirmed.

**Response `200`:**
```json
{ "message": "Job confirmed successfully", "job": { /* job row */ } }
```

---

### DELETE `/jobs/delete/:jobId`

Deletes an unconfirmed job — called if the user cancels or the MetaMask transaction fails.

**Response `200`:**
```json
{ "message": "Job deleted successfully" }
```

---

### GET `/jobs/retry-info/:jobId`

Returns the parameters needed to retry the blockchain payment for an unconfirmed job.

**Response `200`:** Job info object for retry.

---

## Contributor Routes (Image Processing)

### POST `/jobs/contributor/apply`

Directly assign a contributor to a pending job (legacy single-phase flow).

**Body:**

| Field | Type | Required |
|---|---|---|
| `jobId` | integer | ✓ |
| `contributorAddress` | string | ✓ |

**Response `200`:**
```json
{ "message": "Job application successful", "job": { /* updated job row */ } }
```

---

### POST `/jobs/contributor/apply/initiate`

Phase 1 of a two-phase contributor acceptance — reserves the slot in the DB before the blockchain transaction.

**Body fields:** `jobId`, `contributorAddress`

**Response `200`:**
```json
{ "message": "Job acceptance initiated", "job": { /* updated job row */ } }
```

---

### POST `/jobs/contributor/apply/confirm`

Phase 2 — confirms acceptance after the blockchain `acceptJob()` transaction succeeds.

**Body fields:** `jobId`

**Response `200`:**
```json
{ "message": "Job acceptance confirmed", "job": { /* updated job row */ } }
```

---

### POST `/jobs/contributor/apply/revert`

Reverts the reserved slot if the blockchain transaction fails.

**Body fields:** `jobId`

**Response `200`:**
```json
{ "message": "Job acceptance reverted", "job": { /* updated job row */ } }
```

---

### GET `/jobs/contributor/get-job`

Returns the current in-progress job assigned to a contributor.

**Query parameter:** `contributorAddress`

**Response `200`:** Job object, or `201` with a message if no job is assigned.

---

### GET `/jobs/contributor/all-jobs`

Returns all jobs (historical) for a contributor.

**Query parameter:** `contributorAddress`

**Response `200`:** Array of job objects.

---

## LLM Federated Finetuning

These routes manage the full lifecycle of a federated LoRA fine-tuning job:  
dataset upload → contributor slot acceptance → dataset sharding → adapter submission → aggregation → finalization.

---

### POST `/jobs/llm/upload`

Phase 1 — upload dataset to IPFS and create an `unconfirmed` DB record.  
Call this **before** prompting MetaMask.  
Expects `multipart/form-data`.

**Body fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `folderName` | string | ✓ | — | Display name for the job |
| `modelName` | string | ✓ | — | HuggingFace model ID, e.g. `"TinyLlama/TinyLlama-1.1B-Chat-v1.0"` |
| `maxContributors` | integer | ✓ | — | Number of training contributors (2–10) |
| `rewardPerContributor` | float | ✓ | — | POL reward per contributor (must meet tier minimum) |
| `requesterAddress` | string | ✓ | — | Requester wallet address |
| `epochs` | integer | | 3 | Training epochs |
| `learningRate` | float | | 0.0002 | LoRA learning rate |
| `loraRank` | integer | | 8 | LoRA rank `r` |
| `loraAlpha` | integer | | 16 | LoRA alpha |
| `maxSeqLength` | integer | | 512 | Max token sequence length |

**Files:** `files[]` — dataset file(s). Recommend a single `dataset.jsonl`.

**Response `200`:**
```json
{
  "message": "LLM finetune job uploaded successfully",
  "jobId": 7,
  "folderCid": "Qm...",
  "metadataCid": "Qm...",
  "stakeAmount": "1050.0",
  "breakdown": { /* fee breakdown object */ }
}
```
Pass `stakeAmount` to the MetaMask `createFederatedJob()` call.

---

### POST `/jobs/llm/confirm/:jobId`

Phase 2 — transitions the LLM job from `unconfirmed` → `pending` after the blockchain transaction is confirmed.

**Response `200`:**
```json
{ "message": "LLM job confirmed", "job": { /* job row */ } }
```

---

### DELETE `/jobs/llm/delete/:jobId`

Deletes an unconfirmed LLM job and cascades to `llm_finetune_jobs` rows.  
Called if the user cancels or the MetaMask transaction fails.

**Response `200`:**
```json
{ "message": "Unconfirmed LLM job deleted" }
```

---

### GET `/jobs/llm/get-jobs`

Returns all `pending` / `in_progress` LLM fine-tuning jobs for the contributor browsing page.

**Response `200`:** Array of LLM job objects.

---

### POST `/jobs/llm/accept-slot`

The contributor accepts an available slot in a federated job.  
The backend reserves the DB slot and fires an on-chain `acceptFederatedJob()` call asynchronously.  
When all slots are filled, dataset sharding is triggered automatically.

**Body:**

| Field | Type | Required |
|---|---|---|
| `jobId` | integer | ✓ |
| `contributorAddress` | string | ✓ |

**Response `200`:**
```json
{
  "message": "Slot accepted successfully",
  "slotIndex": 1,
  "jobId": 7
}
```

---

### GET `/jobs/llm/get-shard/:jobId`

Download the dataset shard ZIP assigned to this contributor (proxied from IPFS).

**URL parameter:** `:jobId`  
**Query parameter:** `contributorAddress`

**Response:**
- `200` — `application/zip` file — `shard_<slotIndex>_job_<jobId>.zip`
- `202` — sharding still in progress, retry later

---

### POST `/jobs/llm/upload-adapter`

Upload a trained LoRA adapter ZIP from the contributor's desktop app to IPFS.  
Returns the IPFS CID to be passed to `/jobs/llm/submit-adapter`.  
Expects `multipart/form-data`.

**Body fields:** `jobId`, `contributorAddress`  
**Files:** `file` — adapter ZIP (single file).

**Response `200`:**
```json
{ "adapterCid": "Qm..." }
```

---

### POST `/jobs/llm/submit-adapter`

Record the adapter CID with the job, call `submitAdapter()` on-chain, and trigger aggregation when all contributors have submitted.

**Body:**

| Field | Type | Required |
|---|---|---|
| `jobId` | integer | ✓ |
| `contributorAddress` | string | ✓ |
| `adapterCid` | string | ✓ |

**Response `200`:**
```json
{
  "message": "Adapter submitted — all adapters received, aggregation starting",
  "slotIndex": 0,
  "allSubmitted": true,
  "txHash": "0x..."
}
```

---

### GET `/jobs/llm/my-requests`

Returns all LLM fine-tuning jobs posted by the requester.

**Query parameter:** `requesterAddress`

**Response `200`:** Array of LLM job objects.

---

### GET `/jobs/llm/my-slot`

Returns the contributor's active LLM slot, including all training hyperparameters and shard info.  
Used by the contributor desktop app.

**Query parameter:** `contributorAddress`

**Response:** `200` with slot object, or `204` if no active slot found.

---

## Internal / Aggregation Service Routes

These endpoints are called by the **Python aggregation microservice** (`aggregation_service/`), not by the frontend.

### GET `/jobs/llm/slots/:jobId`

Returns all slot rows for a job (adapter CIDs, contributor addresses, shard CIDs, etc.).

---

### POST `/jobs/llm/finalize/:jobId`

Called by the aggregation service on success. Stores the merged adapter CID and marks the job as `completed`.

**Body:**

| Field | Type | Required |
|---|---|---|
| `mergedAdapterCid` | string | ✓ |
| `aggregationLog` | string | |

---

### POST `/jobs/llm/aggregation-failed/:jobId`

Called by the aggregation service on failure. Marks the job as `failed`.

**Body:**

| Field | Type | Required |
|---|---|---|
| `error` | string | |

---

## Job Status Flow

### Image Processing
```
unconfirmed → pending → in_progress → completed
                    ↘ (deleted if unconfirmed)
```

### LLM Federated Finetuning
```
unconfirmed → pending → in_progress → aggregating → completed
                    ↘ (deleted)                  ↘ failed
```

