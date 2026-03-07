# TrainChain

## Overview

TrainChain is a decentralized AI training marketplace built on Polygon. It connects people who need a model trained with people who have the GPU hardware to do it — without either side needing to trust the other. Requesters post training jobs and stake a crypto reward; contributors accept jobs, train on their own hardware, and earn the reward upon verified completion, all enforced automatically by a smart contract.

The goal is to lower the barrier on both sides. Getting a model trained should not require cloud credits, vendor lock-in, or negotiating with a managed service. Contributing compute should not require deep ML expertise — just hardware and the TrainChain desktop app. Blockchain brings transparency and security to every step: dataset provenance, payment, and result delivery are all on-chain and publicly verifiable, removing the need for a central authority.

This is just the beginning. The current job types are a foundation; the platform is designed to grow to support any kind of ML workload where distributed compute, privacy, or trustless incentives add value.

## Try It

The platform is live and fully usable without any local setup:

- **Web App** — [train-chain.vercel.app](https://train-chain.vercel.app) (frontend hosted on Vercel, backend on Render)
- **Desktop App** — [Download TrainChain Setup v1.3](https://github.com/aroproduction/TrainChain/releases/download/v1.3/TrainChain-Setup.exe) — install and start contributing in minutes

## Current Job Types

- **Image Processing (YOLO)** — Object detection model training. A requester uploads a labelled dataset and training parameters; a contributor trains a YOLO model on their machine and delivers the trained weights.
- **Federated LLM Finetuning** — Privacy-preserving distributed fine-tuning of large language models. The dataset is automatically sharded across multiple contributors, each of whom trains a LoRA adapter on their shard. The adapters are then merged into a single model by an aggregation service. No contributor ever sees the full dataset.

## Features

- **Extensible job system** — built to support any ML training workload; current job types are the starting point
- **Decentralized data storage** — datasets and trained models stored on IPFS via Pinata
- **Smart contract enforcement** — job creation, contributor acceptance, adapter submission, and reward distribution are all on-chain (Polygon), transparent and tamper-proof
- **Dataset sharding** — for federated jobs, the backend automatically partitions the dataset across contributors after all slots are filled
- **Aggregation microservice** — merges LoRA adapters once all contributors have submitted, then finalises the job on-chain
- **Contributor desktop app** — a single-file installer; handles wallet login, job browsing, hardware spec checking, training, and result upload with no manual environment setup
- **Two-phase job creation** — dataset upload and blockchain payment are decoupled so the database stays consistent if a MetaMask transaction is cancelled
- **Token-based incentives** — contributors earn POL rewards held in the contract until the job completes

## Project Structure

```
TrainChain/
├── backend/              # Node.js / Express REST API
├── frontend/             # React / Vite web application
├── smart_contracts/      # Solidity contracts (Hardhat)
├── aggregation_service/  # Python microservice — merges LoRA adapters
└── trainchain_app/       # Standalone PyQt6 contributor desktop app
```

## Prerequisites

- Node.js v18+
- Python 3.10+
- PostgreSQL
- MetaMask wallet
- Pinata account (IPFS)
- Polygon Amoy RPC endpoint
- NVIDIA GPU (for contributors)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/aroproduction/TrainChain.git
cd TrainChain
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in POSTGRES_URL, PINATA keys, POLYGON_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS
npm start          # runs on port 4000 by default
```

Run the SQL migration files in `backend/db/migrations/` (001–005) against your PostgreSQL instance before starting.

### 3. Frontend

```bash
cd frontend
npm install
# Set VITE_API_URL and VITE_CONTRACT_ADDRESS in .env
npm run dev        # development server on port 5173
npm run build      # production build
```

### 4. Smart Contracts

```bash
cd smart_contracts
npm install
# Configure hardhat.config.js with your network and deployer key
npx hardhat compile
npx hardhat run scripts/deploy.js --network amoy
```

### 5. Aggregation Service

```bash
cd aggregation_service
pip install -r requirements.txt
# Set PINATA keys, BACKEND_URL, and PRIVATE_KEY in .env
python server.py   # runs on port 5001 by default
```

The aggregation service is triggered automatically by the backend when all contributors have submitted their adapters. It can also be exposed via ngrok for remote deployments (`AGGREGATION_SERVICE_URL` in the backend `.env`).

### 6. Contributor Desktop App

```bash
cd trainchain_app
pip install -r requirements.txt
python frontend/main.py
```

The app bundles a lightweight Flask backend that handles local training coordination. To build a standalone executable:

```bash
cd trainchain_app/frontend
pyinstaller main.spec
# Output: frontend/dist/main.exe
```

## How It Works

### Image Processing Job

1. Requester uploads a labelled image dataset and training parameters (model, epochs, image size, classes) via the web app and stakes a POL reward on-chain.
2. A contributor browses available jobs, accepts one, and downloads the dataset ZIP.
3. The contributor's desktop app trains a YOLO model locally inside a managed virtual environment.
4. On completion, the trained model is uploaded to IPFS and the job is marked complete on-chain; the reward is released to the contributor.

### Federated LLM Finetuning Job

1. Requester uploads a JSONL dataset, specifies a HuggingFace model ID, LoRA hyperparameters, number of contributors, and reward per contributor, then stakes the total on-chain.
2. Contributors browse and accept slots; once all slots are filled the backend automatically shards the dataset across contributors.
3. Each contributor downloads their shard via the desktop app and trains a LoRA adapter locally.
4. Each finished adapter is uploaded to IPFS and submitted on-chain.
5. When the last adapter is received, the aggregation microservice merges all adapters, uploads the merged model to IPFS, and finalises the job on-chain; rewards are distributed.

## Directory Details

| Directory | Description |
|---|---|
| `backend/` | Express API — job CRUD, IPFS upload/download, blockchain calls, dataset sharding trigger |
| `frontend/` | React SPA — job browsing, job creation wizard, requester dashboard, contributor view |
| `smart_contracts/` | `AIModelTraining.sol` — job creation, contributor acceptance, adapter submission, reward release |
| `aggregation_service/` | Python Flask service — downloads adapter ZIPs from IPFS, merges with PEFT, uploads merged model |
| `trainchain_app/` | PyQt6 desktop app — login, job selection, hardware spec check, training runner, adapter upload |

## Authors

- *Aritra Dutta Banik*
- *Shibam Pandit*
- *Trisagni Mandal*
- *Sharnabho Cahtterjee*
- *Sayan Patra*

## License

This project is licensed under the MIT License.
