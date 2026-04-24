BEGIN;

ALTER TABLE contributor_profiles
    ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_contributed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS contributor_contributions (
    id BIGSERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    contributor_address VARCHAR(42) NOT NULL,
    requester_address VARCHAR(42),
    job_type VARCHAR(50) NOT NULL,
    contribution_status VARCHAR(30) NOT NULL,
    reward_earned NUMERIC(20,8) NOT NULL DEFAULT 0,
    submitted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, contributor_address)
);

CREATE TABLE IF NOT EXISTS contributor_ratings (
    id BIGSERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    requester_address VARCHAR(42) NOT NULL,
    contributor_address VARCHAR(42) NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, requester_address, contributor_address)
);

CREATE INDEX IF NOT EXISTS idx_profiles_pool_llm ON contributor_profiles (accepts_llm_jobs, total_jobs_completed DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_pool_yolo ON contributor_profiles (accepts_yolo_jobs, total_jobs_completed DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_pool_rating ON contributor_profiles (avg_rating DESC, rating_count DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON contributor_profiles (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_contrib_hist_addr ON contributor_contributions (contributor_address, completed_at DESC, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contrib_hist_job ON contributor_contributions (job_id);
CREATE INDEX IF NOT EXISTS idx_ratings_contrib ON contributor_ratings (contributor_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_requester ON contributor_ratings (requester_address, created_at DESC);

COMMIT;
