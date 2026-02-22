-- Core jobs table — all job types share this
CREATE TABLE IF NOT EXISTS jobs (
    id                  SERIAL PRIMARY KEY,
    job_type            VARCHAR(50) NOT NULL,          -- 'image_processing' | 'llm_finetune'
    requester_address   VARCHAR(42) NOT NULL,
    folder_cid          TEXT,                          -- IPFS CID of dataset folder
    metadata_cid        TEXT,                          -- IPFS CID of metadata JSON
    reward              NUMERIC(20, 8) NOT NULL,       -- reward in ETH (display value)
    folder_name         VARCHAR(255),
    status              VARCHAR(30) NOT NULL DEFAULT 'unconfirmed',
                        -- unconfirmed | pending | contributor_unconfirmed | in_progress | aggregating | completed | failed
    contributor_address VARCHAR(42),
    trained_model_cid   TEXT,                          -- final model CID after training/aggregation
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);