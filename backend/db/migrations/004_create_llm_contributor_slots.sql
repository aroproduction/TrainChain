-- One row per contributor per federated job
-- Tracks which shard they have, their adapter CID, and payment status
CREATE TABLE IF NOT EXISTS llm_contributor_slots (
    id                  SERIAL PRIMARY KEY,
    job_id              INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    contributor_address VARCHAR(42) NOT NULL,
    slot_index          SMALLINT NOT NULL,        -- 0-based shard index assigned to this contributor
    shard_cid           TEXT,                     -- IPFS CID of this contributor's data shard
    shard_size          INTEGER,                  -- number of training samples in this shard
    adapter_cid         TEXT,                     -- IPFS CID of submitted LoRA adapter (NULL until submitted)
    status              VARCHAR(30) NOT NULL DEFAULT 'accepted',
                        -- accepted | training | submitted | failed
    accepted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at        TIMESTAMPTZ,              -- set when adapter_cid is stored
    tx_hash             VARCHAR(66),              -- blockchain tx hash of submitAdapter() call

    UNIQUE (job_id, contributor_address),         -- one slot per contributor per job
    UNIQUE (job_id, slot_index)                   -- no two contributors share same shard
);

CREATE INDEX IF NOT EXISTS idx_llm_slots_job_id ON llm_contributor_slots(job_id);
CREATE INDEX IF NOT EXISTS idx_llm_slots_contributor ON llm_contributor_slots(contributor_address);