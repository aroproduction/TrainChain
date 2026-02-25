-- Optional self-reported hardware profile for Contributor Pool page
CREATE TABLE IF NOT EXISTS contributor_profiles (
    id                  SERIAL PRIMARY KEY,
    wallet_address      VARCHAR(42) NOT NULL UNIQUE,
    display_name        VARCHAR(100),
    gpu_model           VARCHAR(100),            -- e.g. 'RTX 3080', 'M2 Pro', 'CPU only'
    vram_gb             SMALLINT,                -- self-reported VRAM in GB
    ram_gb              SMALLINT,                -- RAM in GB
    accepts_llm_jobs    BOOLEAN NOT NULL DEFAULT FALSE,
    accepts_yolo_jobs   BOOLEAN NOT NULL DEFAULT TRUE,
    total_jobs_completed INTEGER NOT NULL DEFAULT 0,
    total_earnings_eth  NUMERIC(20, 8) NOT NULL DEFAULT 0,
    last_seen_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contributor_profiles_wallet ON contributor_profiles(wallet_address);