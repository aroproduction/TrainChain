import db from "../db/db.js";

export const createJob = async (job) => {
    try {

        const result = await db.query(
            `INSERT INTO jobs (job_type, requester_address, folder_cid, metadata_cid, reward, folder_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'unconfirmed') RETURNING *`,
            [
                job.job_type,
                job.requesterAddress,
                job.folderCid,
                job.metadataCid,
                job.reward,
                job.folderName,
            ]
        );

        return result.rows[0];
    } catch (error) {
        console.error("Error inserting in jobs table:", error);
        return error;
    }
}

export const insert_image_processing_table = async (job) => {
    try {

        const result = await db.query(
            `INSERT INTO image_processing_jobs (job_id, model, epochs, imgsz, export_format, num_classes, classes)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                job.job_id,
                job.model,
                job.epochs,
                job.imgsz,
                job.exportFormat,
                job.numClasses,
                job.classes,
            ]
        );

        return result.rows[0];
    } catch (error) {
        console.error("Error inserting in image processing jobs table:", error);
        return error;
    }
};

export const get_image_processing_job = async (jobId) => {
    try {
        const result = await db.query(
            `SELECT *
FROM image_processing_jobs
JOIN jobs ON image_processing_jobs.job_id = jobs.id
WHERE jobs.id = $1;`,
            [jobId]
        );

        return result.rows[0];
    } catch (error) {
        console.error("Error fetching image processing job by id:", error);
        return error;
    }
};

export const getJobById = async (jobId) => {
    try {
        const result = await db.query(
            `SELECT * FROM jobs WHERE id = $1`,
            [jobId]
        );

        return result.rows[0];
    } catch (error) {
        console.error("Error fetching job by id:", error);
        return error;
    }
};

export const getJobs = async () => {
    try {
        const result = await db.query(
            `SELECT j.*,
                    lf.model_name,
                    lf.max_contributors,
                    (SELECT COUNT(*) FROM llm_contributor_slots WHERE job_id = j.id) AS filled_slots
             FROM jobs j
             LEFT JOIN llm_finetune_jobs lf ON lf.job_id = j.id
             WHERE j.status = 'pending'
             ORDER BY j.created_at DESC`
        );

        return result.rows;
    } catch (error) {
        console.error("Error fetching jobs:", error);
        return error;
    }
};

export const updateTrainedJobModel = async (jobId, modelCid) => {
    try {
        const result = await db.query(
            `UPDATE jobs SET trained_model_cid = $1 WHERE id = $2 RETURNING *`,
            [modelCid, jobId]
        );
    } catch (error) {
        console.error("Error uploading model:", error);
        return error;
    }
};

export const updateJobStatus = async (jobId, status) => {
    if (!["pending", "unconfirmed", "contributor_unconfirmed", "in_progress", "completed", "failed"].includes(status)) {
        throw new Error("Invalid status");
    }

    try {
        const result = await db.query(
            `UPDATE jobs SET status = $1 WHERE id = $2 RETURNING *`,
            [status, jobId]
        );

        return result.rows[0];
    } catch (error) {
        console.error("Error updating job status:", error);
        return error;
    }
};

export const JobsByRequester = async (requesterAddress) => {
    if (!requesterAddress) {
        throw new Error("Requester address is required to get jobs");
    }

    try {
        const result = await db.query(
            `SELECT j.*,
                    lf.model_name,
                    lf.max_contributors,
                    (SELECT COUNT(*) FROM llm_contributor_slots WHERE job_id = j.id) AS filled_slots
             FROM jobs j
             LEFT JOIN llm_finetune_jobs lf ON lf.job_id = j.id
             WHERE LOWER(j.requester_address) = LOWER($1)
             ORDER BY j.created_at DESC`,
            [requesterAddress]
        );

        return result.rows;
    } catch (error) {
        throw new Error("Error fetching jobs by requester: " + error.message);
    }
};

export const ContributorHasInProgressJob = async (contributorAddress) => {
    try {
        const response = await db.query(
            `SELECT * FROM jobs WHERE contributor_address = $1 AND status = 'in_progress'`,
            [contributorAddress]
        );
        return response.rows.length > 0;
    } catch (error) {
        throw new Error("Error fetching in-progress job by contributor:", error);
    }
};

export const updateContributor = async (jobId, contributorAddress) => {
    try {
        const result = await db.query(
            `UPDATE jobs 
             SET contributor_address = $1, status = 'in_progress' 
             WHERE id = $2 
             RETURNING *`,
            [contributorAddress, jobId]
        );

        return result.rows[0];
    } catch (error) {
        throw new Error("Error updating contributor:", error);
    }
};

export const getJobByContributor = async (contributorAddress) => {
    try {
        const result = await db.query(
            `SELECT * FROM jobs WHERE contributor_address = $1 AND status = 'in_progress'`,
            [contributorAddress]
        );

        return result.rows.length > 0 ? result.rows[0] : null;  // Return null if no job is found
    } catch (error) {
        console.error("Error fetching job by contributor:", error);
        throw new Error("Database query failed");
    }
};

export const getAllJobsByContributor = async (contributorAddress) => {
    try {
        const result = await db.query(
            `SELECT j.*, NULL::text AS model_name, NULL::integer AS max_contributors, NULL::integer AS slot_index
             FROM jobs j
             WHERE LOWER(j.contributor_address) = LOWER($1)
             UNION ALL
             SELECT j.*, lf.model_name, lf.max_contributors, ls.slot_index
             FROM jobs j
             JOIN llm_finetune_jobs lf ON lf.job_id = j.id
             JOIN llm_contributor_slots ls ON ls.job_id = j.id
                  AND LOWER(ls.contributor_address) = LOWER($1)
             ORDER BY created_at DESC`,
            [contributorAddress.toLowerCase()]
        );
        return result.rows;
    } catch (error) {
        console.error("Error fetching all jobs by contributor:", error);
        throw new Error("Database query failed");
    }
};

// ── Two-phase commit helpers ───────────────────────────────────────────

// Confirm job creation: unconfirmed → pending
export const confirmJobCreation = async (jobId) => {
    try {
        const result = await db.query(
            `UPDATE jobs SET status = 'pending' WHERE id = $1 AND status = 'unconfirmed' RETURNING *`,
            [jobId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Error confirming job creation:", error);
        throw error;
    }
};

// Delete an unconfirmed job and its related records
export const deleteUnconfirmedJob = async (jobId) => {
    try {
        await db.query(`DELETE FROM image_processing_jobs WHERE job_id = $1`, [jobId]);
        const result = await db.query(
            `DELETE FROM jobs WHERE id = $1 AND status = 'unconfirmed' RETURNING *`,
            [jobId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Error deleting unconfirmed job:", error);
        throw error;
    }
};

// Initiate job acceptance: pending → contributor_unconfirmed + set contributor
export const initiateJobAcceptance = async (jobId, contributorAddress) => {
    try {
        const result = await db.query(
            `UPDATE jobs 
             SET contributor_address = $1, status = 'contributor_unconfirmed' 
             WHERE id = $2 AND status = 'pending'
             RETURNING *`,
            [contributorAddress, jobId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Error initiating job acceptance:", error);
        throw error;
    }
};

// Confirm job acceptance: contributor_unconfirmed → in_progress
export const confirmJobAcceptance = async (jobId) => {
    try {
        const result = await db.query(
            `UPDATE jobs SET status = 'in_progress' WHERE id = $1 AND status = 'contributor_unconfirmed' RETURNING *`,
            [jobId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Error confirming job acceptance:", error);
        throw error;
    }
};

// Revert job acceptance: contributor_unconfirmed → pending, clear contributor
export const revertJobAcceptance = async (jobId) => {
    try {
        const result = await db.query(
            `UPDATE jobs 
             SET contributor_address = NULL, status = 'pending' 
             WHERE id = $1 AND status = 'contributor_unconfirmed'
             RETURNING *`,
            [jobId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Error reverting job acceptance:", error);
        throw error;
    }
};

// Get all info needed for a blockchain payment retry
export const getRetryInfo = async (jobId) => {
    try {
        const result = await db.query(
            `SELECT j.*, ip.model, lf.model_name, lf.max_contributors
             FROM jobs j
             LEFT JOIN image_processing_jobs ip ON j.id = ip.job_id
             LEFT JOIN llm_finetune_jobs lf ON j.id = lf.job_id
             WHERE j.id = $1 AND j.status = 'unconfirmed'`,
            [jobId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Error fetching retry info:", error);
        throw error;
    }
};

// ── LLM Federated Finetuning DB helpers ──────────────────────────────────────

/**
 * Insert master job row + llm_finetune_jobs detail row in one transaction.
 * Returns the created jobs row.
 */
export const createLlmFinetuneJob = async (job) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const jobRow = await client.query(
            `INSERT INTO jobs (job_type, requester_address, folder_cid, metadata_cid, reward, folder_name, status)
             VALUES ('llm_finetune', $1, $2, $3, $4, $5, 'unconfirmed') RETURNING *`,
            [job.requesterAddress.toLowerCase(), job.datasetCid, job.metadataCid, job.reward, job.folderName]
        );

        const createdJob = jobRow.rows[0];

        await client.query(
            `INSERT INTO llm_finetune_jobs
             (job_id, model_name, max_contributors, epochs, learning_rate, lora_rank, lora_alpha, max_seq_length, dataset_cid)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                createdJob.id,
                job.modelName,
                job.maxContributors,
                job.epochs        ?? 3,
                job.learningRate  ?? 0.0002,
                job.loraRank      ?? 8,
                job.loraAlpha     ?? 16,
                job.maxSeqLength  ?? 512,
                job.datasetCid,
            ]
        );

        await client.query('COMMIT');
        return createdJob;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating LLM finetune job:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get full LLM job detail (jobs JOIN llm_finetune_jobs).
 */
export const getLlmFinetuneJob = async (jobId) => {
    try {
        const result = await db.query(
            `SELECT j.*, lf.model_name, lf.max_contributors, lf.epochs, lf.learning_rate,
                    lf.lora_rank, lf.lora_alpha, lf.max_seq_length, lf.dataset_cid,
                    lf.total_samples, lf.merged_adapter_cid, lf.aggregation_log
             FROM jobs j
             JOIN llm_finetune_jobs lf ON lf.job_id = j.id
             WHERE j.id = $1`,
            [jobId]
        );
        return result.rows[0] ?? null;
    } catch (error) {
        console.error('Error fetching LLM finetune job:', error);
        throw error;
    }
};

/**
 * Get all pending LLM finetune jobs (for contributor pool / job list).
 */
export const getPendingLlmJobs = async () => {
    try {
        const result = await db.query(
            `SELECT j.*, lf.model_name, lf.max_contributors, lf.epochs,
                    (SELECT COUNT(*) FROM llm_contributor_slots WHERE job_id = j.id) AS filled_slots
             FROM jobs j
             JOIN llm_finetune_jobs lf ON lf.job_id = j.id
             WHERE j.status IN ('pending', 'in_progress')
             ORDER BY j.created_at DESC`
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching pending LLM jobs:', error);
        throw error;
    }
};

/**
 * Accept a slot: insert row into llm_contributor_slots.
 * slot_index is auto-assigned as the next available index.
 */
export const acceptLlmJobSlot = async (jobId, contributorAddress) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Check slot availability
        const countRes = await client.query(
            `SELECT lf.max_contributors,
                    COUNT(ls.id) AS filled
             FROM llm_finetune_jobs lf
             LEFT JOIN llm_contributor_slots ls ON ls.job_id = lf.job_id
             WHERE lf.job_id = $1
             GROUP BY lf.max_contributors`,
            [jobId]
        );

        if (!countRes.rows[0]) throw new Error('LLM job not found');
        const { max_contributors, filled } = countRes.rows[0];
        if (Number(filled) >= Number(max_contributors)) throw new Error('All slots are filled');

        const slotIndex = Number(filled); // next 0-based index

        const slotRow = await client.query(
            `INSERT INTO llm_contributor_slots (job_id, contributor_address, slot_index, status)
             VALUES ($1, $2, $3, 'accepted') RETURNING *`,
            [jobId, contributorAddress.toLowerCase(), slotIndex]
        );

        // If all slots now filled, update master job status to in_progress
        if (slotIndex + 1 >= Number(max_contributors)) {
            await client.query(
                `UPDATE jobs SET status = 'in_progress' WHERE id = $1`,
                [jobId]
            );
        }

        await client.query('COMMIT');
        return slotRow.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error accepting LLM slot:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Store the shard CID assigned to a contributor after dataset is sharded.
 */
export const setLlmSlotShardCid = async (jobId, contributorAddress, shardCid, shardSize) => {
    try {
        const result = await db.query(
            `UPDATE llm_contributor_slots
             SET shard_cid = $1, shard_size = $2
             WHERE job_id = $3 AND contributor_address = $4
             RETURNING *`,
            [shardCid, shardSize, jobId, contributorAddress.toLowerCase()]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error setting shard CID:', error);
        throw error;
    }
};

/**
 * Record a submitted adapter CID from a contributor.
 * Updates both llm_contributor_slots and checks if all adapters are in.
 * Returns { slot, allSubmitted: boolean }
 */
export const submitLlmAdapter = async (jobId, contributorAddress, adapterCid, txHash) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const slotRes = await client.query(
            `UPDATE llm_contributor_slots
             SET adapter_cid = $1, status = 'submitted', submitted_at = NOW(), tx_hash = $2
             WHERE job_id = $3 AND contributor_address = $4
             RETURNING *`,
            [adapterCid, txHash ?? null, jobId, contributorAddress.toLowerCase()]
        );

        if (!slotRes.rows[0]) throw new Error('Slot not found');

        // Check if all adapters are now submitted
        const checkRes = await client.query(
            `SELECT lf.max_contributors,
                    COUNT(ls.adapter_cid) AS submitted
             FROM llm_finetune_jobs lf
             JOIN llm_contributor_slots ls ON ls.job_id = lf.job_id
             WHERE lf.job_id = $1
             GROUP BY lf.max_contributors`,
            [jobId]
        );

        const { max_contributors, submitted } = checkRes.rows[0];
        const allSubmitted = Number(submitted) >= Number(max_contributors);

        if (allSubmitted) {
            // Transition master job to 'aggregating' — signals aggregation microservice
            await client.query(
                `UPDATE jobs SET status = 'aggregating' WHERE id = $1`,
                [jobId]
            );
        }

        await client.query('COMMIT');
        return { slot: slotRes.rows[0], allSubmitted };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting adapter:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Return the contributor's active LLM slot with full training params.
 * Returns null if no active slot exists.
 * "Active" = slot status is 'accepted' or 'submitted' and job is in_progress/aggregating.
 */
export const getMyLlmSlot = async (contributorAddress) => {
    try {
        const result = await db.query(
            `SELECT ls.job_id, ls.slot_index, ls.shard_cid, ls.shard_size,
                    ls.status AS slot_status, ls.adapter_cid, ls.accepted_at,
                    j.reward, j.status AS job_status, j.folder_cid, j.metadata_cid,
                    lf.model_name, lf.max_contributors, lf.epochs, lf.learning_rate,
                    lf.lora_rank, lf.lora_alpha, lf.max_seq_length
             FROM llm_contributor_slots ls
             JOIN jobs j ON j.id = ls.job_id
             JOIN llm_finetune_jobs lf ON lf.job_id = ls.job_id
             WHERE LOWER(ls.contributor_address) = LOWER($1)
               AND ls.status IN ('accepted', 'submitted')
               AND j.status IN ('in_progress', 'aggregating', 'completed')
             ORDER BY ls.accepted_at DESC
             LIMIT 1`,
            [contributorAddress]
        );
        return result.rows[0] ?? null;
    } catch (error) {
        console.error('Error fetching contributor LLM slot:', error);
        throw error;
    }
};

/**
 * Store aggregation result after FedAvg completes.
 */
export const finalizeLlmJob = async (jobId, mergedAdapterCid, aggregationLog) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            `UPDATE llm_finetune_jobs
             SET merged_adapter_cid = $1, aggregation_log = $2
             WHERE job_id = $3`,
            [mergedAdapterCid, aggregationLog ?? null, jobId]
        );

        await client.query(
            `UPDATE jobs
             SET status = 'completed', trained_model_cid = $1
             WHERE id = $2`,
            [mergedAdapterCid, jobId]
        );

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error finalizing LLM job:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get all slots for a job — used by aggregation service to collect adapter CIDs.
 */
export const getLlmJobSlots = async (jobId) => {
    try {
        const result = await db.query(
            `SELECT * FROM llm_contributor_slots WHERE job_id = $1 ORDER BY slot_index ASC`,
            [jobId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching LLM job slots:', error);
        throw error;
    }
};

// ── Contributor Profile helpers ───────────────────────────────────────────────

/**
 * Upsert a contributor profile (create on first login, update on edit).
 */
export const upsertContributorProfile = async (walletAddress, profileData = {}) => {
    try {
        const result = await db.query(
            `INSERT INTO contributor_profiles (wallet_address, display_name, gpu_model, vram_gb, ram_gb,
                accepts_llm_jobs, accepts_yolo_jobs, last_seen_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             ON CONFLICT (wallet_address) DO UPDATE SET
                display_name     = COALESCE(EXCLUDED.display_name, contributor_profiles.display_name),
                gpu_model        = COALESCE(EXCLUDED.gpu_model, contributor_profiles.gpu_model),
                vram_gb          = COALESCE(EXCLUDED.vram_gb, contributor_profiles.vram_gb),
                ram_gb           = COALESCE(EXCLUDED.ram_gb, contributor_profiles.ram_gb),
                accepts_llm_jobs = EXCLUDED.accepts_llm_jobs,
                accepts_yolo_jobs= EXCLUDED.accepts_yolo_jobs,
                last_seen_at     = NOW(),
                updated_at       = NOW()
             RETURNING *`,
            [
                walletAddress.toLowerCase(),
                profileData.displayName   ?? null,
                profileData.gpuModel      ?? null,
                profileData.vramGb        ?? null,
                profileData.ramGb         ?? null,
                profileData.acceptsLlmJobs  ?? false,
                profileData.acceptsYoloJobs ?? true,
            ]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error upserting contributor profile:', error);
        throw error;
    }
};

/**
 * Get all contributor profiles for the Contributor Pool page.
 */
export const getAllContributorProfiles = async () => {
    try {
        const result = await db.query(
            `SELECT * FROM contributor_profiles ORDER BY total_jobs_completed DESC, last_seen_at DESC`
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching contributor profiles:', error);
        throw error;
    }
};

/**
 * Increment completed job count and add earnings for a contributor (called after finalization).
 */
export const incrementContributorStats = async (walletAddress, earningsEth) => {
    try {
        await db.query(
            `UPDATE contributor_profiles
             SET total_jobs_completed = total_jobs_completed + 1,
                 total_earnings_eth   = total_earnings_eth + $1,
                 updated_at           = NOW()
             WHERE wallet_address = $2`,
            [earningsEth, walletAddress.toLowerCase()]
        );
    } catch (error) {
        console.error('Error incrementing contributor stats:', error);
        throw error;
    }
};

// ── LLM job two-phase helpers ─────────────────────────────────────────────────

/**
 * Confirm LLM job creation: unconfirmed → pending.
 * Reuses the generic confirmJobCreation already in this file — no new function needed.
 * Listed here as a reminder that confirmJobCreation(jobId) works for all job types.
 */

/**
 * Delete an unconfirmed LLM finetune job and its related records.
 * Must cascade-delete llm_finetune_jobs before removing the jobs row.
 */
export const deleteUnconfirmedLlmJob = async (jobId) => {
    try {
        // llm_contributor_slots and llm_finetune_jobs both cascade-delete via FK ON DELETE CASCADE
        const result = await db.query(
            `DELETE FROM jobs WHERE id = $1 AND status = 'unconfirmed' RETURNING *`,
            [jobId]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error deleting unconfirmed LLM job:', error);
        throw error;
    }
};

/**
 * Get all LLM finetune jobs posted by a requester (for My Requests page).
 */
export const getLlmJobsByRequester = async (requesterAddress) => {
    try {
        const result = await db.query(
            `SELECT j.*, lf.model_name, lf.max_contributors, lf.epochs,
                    lf.merged_adapter_cid,
                    (SELECT COUNT(*) FROM llm_contributor_slots WHERE job_id = j.id) AS filled_slots
             FROM jobs j
             JOIN llm_finetune_jobs lf ON lf.job_id = j.id
             WHERE LOWER(j.requester_address) = LOWER($1)
             ORDER BY j.created_at DESC`,
            [requesterAddress]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching LLM jobs by requester:', error);
        throw error;
    }
};

/**
 * Mark a federated job as failed (called when aggregation errors out).
 */
export const markLlmJobFailed = async (jobId, errorMsg) => {
    try {
        await db.query(
            `UPDATE jobs SET status = 'failed' WHERE id = $1`,
            [jobId]
        );
        await db.query(
            `UPDATE llm_finetune_jobs SET aggregation_log = $1 WHERE job_id = $2`,
            [errorMsg, jobId]
        );
    } catch (error) {
        console.error('Error marking LLM job failed:', error);
        throw error;
    }
};
