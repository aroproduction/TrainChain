-- LLM federated finetuning job parameters
CREATE TABLE IF NOT EXISTS llm_finetune_jobs (
    id                  SERIAL PRIMARY KEY,
    job_id              INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

    -- Model & training config
    model_name          VARCHAR(255) NOT NULL,  -- HuggingFace model ID
    max_contributors    SMALLINT NOT NULL DEFAULT 3 CHECK (max_contributors BETWEEN 2 AND 10),
    epochs              SMALLINT NOT NULL DEFAULT 3,
    learning_rate       NUMERIC(10, 8) NOT NULL DEFAULT 0.00020,
    lora_rank           SMALLINT NOT NULL DEFAULT 8,
    lora_alpha          SMALLINT NOT NULL DEFAULT 16,
    max_seq_length      INTEGER NOT NULL DEFAULT 512,

    -- Dataset info (duplicated from jobs for quick access)
    dataset_cid         TEXT NOT NULL,         -- same as jobs.folder_cid, kept for clarity
    total_samples       INTEGER,               -- filled in after dataset is processed/sharded

    -- Aggregation outputs
    merged_adapter_cid  TEXT,                  -- IPFS CID of the FedAvg merged adapter
    aggregation_log     TEXT,                  -- stdout/stderr from aggregation script

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_finetune_jobs_job_id ON llm_finetune_jobs(job_id);