import db from "../db/db.js";

export const createJob = async (job) => {
    try {

        const result = await db.query(
            `INSERT INTO jobs (job_type, requester_address, folder_cid, metadata_cid, reward)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [
                job.job_type,
                job.requesterAddress,
                job.folderCid,
                job.metadataCid,
                job.reward,
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
            `SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at DESC`
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
    if (!["pending", "in-progress", "completed", "failed"].includes(status)) {
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
            `SELECT * FROM jobs WHERE requester_address = $1`,
            [requesterAddress]
        );

        return result.rows;
    } catch (error) {
        throw new Error("Error fetching jobs by requester:", error);
    }
};

export const ContributorHasInProgressJob = async (contributorAddress) => {
    try {
        const response = await db.query(
            `SELECT * FROM jobs WHERE contributor_address = $1 AND status != 'completed'`,
            [contributorAddress]
        );
        if(response.rows.length > 0) {
            return true;
        } else {
            return false;
        }
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
            `SELECT * FROM jobs WHERE contributor_address = $1 ORDER BY created_at DESC`,
            [contributorAddress.toLowerCase()]
        );
        return result.rows;
    } catch (error) {
        console.error("Error fetching all jobs by contributor:", error);
        throw new Error("Database query failed");
    }
};