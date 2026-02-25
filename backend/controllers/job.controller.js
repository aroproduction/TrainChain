import { validationResult } from "express-validator";
import { uploadFolderHandler, downloadFolderAsZip, uploadRawFile } from "../services/ipfs.services.js";
import { createJob, insert_image_processing_table, getJobById, getJobs, get_image_processing_job, updateTrainedJobModel, JobsByRequester, updateJobStatus, ContributorHasInProgressJob, updateContributor, getJobByContributor, getAllJobsByContributor, confirmJobCreation, deleteUnconfirmedJob, initiateJobAcceptance, confirmJobAcceptance, revertJobAcceptance, getRetryInfo, getLlmFinetuneJob, acceptLlmJobSlot, getLlmJobSlots, getPendingLlmJobs, createLlmFinetuneJob, submitLlmAdapter, finalizeLlmJob, deleteUnconfirmedLlmJob, getLlmJobsByRequester, markLlmJobFailed, getMyLlmSlot } from "../services/db.services.js";
import { completeJob, acceptFederatedJob, submitAdapter, completeFederatedJob } from "../utils/blockchain.js";
import { shardDatasetForJob } from "../services/sharding.services.js";
import axios from 'axios';
import { calculateStake, validateReward, classifyModelTier } from "../utils/feeCalculator.js";

export const uploadImageProcessingJob = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    console.log("Received request:", req.body);

    const { folderName, model, epochs, imgsz, exportFormat, numClasses, requesterAddress, reward } = req.body;
    // classes may arrive as a comma-separated string ("C, D") or already an array
    const rawClasses = req.body.classes;
    const classes = Array.isArray(rawClasses)
        ? rawClasses
        : typeof rawClasses === "string"
            ? rawClasses.split(",").map((c) => c.trim()).filter(Boolean)
            : [];
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
    }

    console.log("Received folderName:", folderName);
    console.log("Number of files:", files.length);

    try {
        // Upload to IPFS
        const { folderCid, metadataCid } = await uploadFolderHandler(folderName, files);
        console.log("Folder CID:", folderCid);


        const job = {
            job_type: "image_processing",
            requesterAddress,
            folderCid,
            metadataCid,
            reward,
            folderName,
        };

        const jobResult = await createJob(job);


        const imageProcessingJob = {
            job_id: jobResult.id,
            model,
            epochs,
            imgsz,
            exportFormat,
            numClasses,
            classes,
        };

        const result = await insert_image_processing_table(imageProcessingJob);

        res.status(200).json({ message: "Job uploaded successfully", job: jobResult });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getImageProcessingJobDetails = async (req, res) => {
    const { jobId } = req.params;
    if (!jobId) {
        return res.status(400).json({ message: "Job ID is required" });
    }

    try {
        const job = await get_image_processing_job(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        res.status(200).json(job);
    } catch (error) {
        console.error("Error in getImageProcessingJobDetails:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getDataset = async (req, res) => {
    const { jobId } = req.params;
    if (!jobId) {
        return res.status(400).json({ message: "Job ID is required" });
    }

    try {
        const job = await getJobById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        const folderCid = job.folder_cid;
        const zipBuffer = await downloadFolderAsZip(folderCid);

        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename="dataset_${jobId}.zip"`);
        // Remove Content-Length to avoid partial download
        res.status(200);
        res.end(zipBuffer, "binary");

    } catch (error) {
        console.error("Error in getDatasetController:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getJobsController = async (req, res) => {
    try {
        const jobs = await getJobs();
        res.status(200).json(jobs);
    } catch (error) {
        console.error("Error in getJobsController:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Upload trained model folder to IPFS and update job record.
export const uploadModelController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { jobId } = req.body;
        const folderName = `trained_model_${jobId}`;

        if (!jobId || !folderName) {
            return res.status(400).json({ message: "Job ID and folderName are required." });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "Files are required." });
        }

        // Retrieve the job from the database.
        const job = await getJobById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Upload the folder (as a zip file) to IPFS.
        const { folderCid } = await uploadFolderHandler(folderName, req.files);
        
        // Update the job record with the trained model metadata.
        await updateJobStatus(jobId, "completed");
        const updatedJob = await updateTrainedJobModel(jobId, folderCid);
        
        // Call the blockchain function to complete the job.
        await completeJob(jobId, folderCid);
        
        res.status(200).json({
            message: "Trained model uploaded successfully and job marked as complete on blockchain",
            job: updatedJob
        });
    } catch (error) {
        console.error("Error uploading trained model:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getRequesterRequests = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { requesterAddress } = req.query;
    if (!requesterAddress) {
        return res.status(400).json({ message: "Requester address is required" });
    }

    try {
        const jobs = await JobsByRequester(requesterAddress);
        res.status(200).json(jobs);
    } catch (error) {
        console.error("Error in getRequesterRequests:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getModel = async (req, res) => {
    console.log("getModel request:", req.params);

    const { jobId } = req.params;
    console.log("Job ID:", jobId);
    if (!jobId) {
        return res.status(400).json({ message: "Job ID is required" });
    }

    try {
        const job = await getJobById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (!job.trained_model_cid) {
            return res.status(404).json({ message: "Model not found" });
        }

        const folderCid = job.trained_model_cid;
        const zipBuffer = await downloadFolderAsZip(folderCid);

        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename="model_${jobId}.zip"`);
        // Remove Content-Length to avoid partial download
        res.status(200);
        res.end(zipBuffer, "binary");

    } catch (error) {
        console.error("Error in getModel:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const jobApply = async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { jobId, contributorAddress } = req.body;
    if (!jobId || !contributorAddress) {
        return res.status(400).json({ message: "Job ID and contributor address are required" });
    }

    const contributor_address = contributorAddress.toLowerCase();

    try {
        const job = await getJobById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }
        if(job.status !== "pending") {
            return res.status(400).json({ message: "Job is not available for application" });
        }

        const hasInProgressJob = await ContributorHasInProgressJob(contributor_address);
        if (hasInProgressJob) {
            return res.status(400).json({ message: "Contributor already has an in-progress job" });
        }

        const updatedJob = await updateContributor(jobId, contributor_address);
        res.status(200).json({ message: "Job application successful", job: updatedJob });

    } catch (error) {
        console.error("Error in jobApply:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ── Two-phase controllers ───────────────────────────────────────────

// Confirm a job creation after blockchain payment succeeds
export const confirmJobController = async (req, res) => {
    const { jobId } = req.params;
    try {
        const job = await confirmJobCreation(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found or already confirmed" });
        }
        res.status(200).json({ message: "Job confirmed successfully", job });
    } catch (error) {
        console.error("Error in confirmJobController:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete an unconfirmed job (user chose not to pay)
export const deleteUnconfirmedJobController = async (req, res) => {
    const { jobId } = req.params;
    try {
        const job = await deleteUnconfirmedJob(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found or not in unconfirmed state" });
        }
        res.status(200).json({ message: "Job deleted successfully" });
    } catch (error) {
        console.error("Error in deleteUnconfirmedJobController:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get info needed for retrying blockchain payment
export const retryInfoController = async (req, res) => {
    const { jobId } = req.params;
    try {
        const info = await getRetryInfo(jobId);
        if (!info) {
            return res.status(404).json({ message: "No unconfirmed job found" });
        }
        res.status(200).json(info);
    } catch (error) {
        console.error("Error in retryInfoController:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Initiate job acceptance (sets contributor_unconfirmed)
export const jobApplyInitiate = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { jobId, contributorAddress } = req.body;
    if (!jobId || !contributorAddress) {
        return res.status(400).json({ message: "Job ID and contributor address are required" });
    }

    const contributor_address = contributorAddress.toLowerCase();

    try {
        const job = await getJobById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }
        if (job.status !== "pending") {
            return res.status(400).json({ message: "Job is not available for application" });
        }

        const hasInProgressJob = await ContributorHasInProgressJob(contributor_address);
        if (hasInProgressJob) {
            return res.status(400).json({ message: "Contributor already has an in-progress job" });
        }

        const updatedJob = await initiateJobAcceptance(jobId, contributor_address);
        if (!updatedJob) {
            return res.status(400).json({ message: "Failed to initiate job acceptance" });
        }
        res.status(200).json({ message: "Job acceptance initiated", job: updatedJob });
    } catch (error) {
        console.error("Error in jobApplyInitiate:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Confirm job acceptance after blockchain payment succeeds
export const jobApplyConfirm = async (req, res) => {
    const { jobId } = req.body;
    if (!jobId) {
        return res.status(400).json({ message: "Job ID is required" });
    }

    try {
        const job = await confirmJobAcceptance(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found or not in correct state" });
        }
        res.status(200).json({ message: "Job acceptance confirmed", job });
    } catch (error) {
        console.error("Error in jobApplyConfirm:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Revert job acceptance after blockchain payment fails
export const jobApplyRevert = async (req, res) => {
    const { jobId } = req.body;
    if (!jobId) {
        return res.status(400).json({ message: "Job ID is required" });
    }

    try {
        const job = await revertJobAcceptance(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found or not in correct state" });
        }
        res.status(200).json({ message: "Job acceptance reverted", job });
    } catch (error) {
        console.error("Error in jobApplyRevert:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getContributorJob = async (req, res) => {
    const { contributorAddress } = req.query;

    if (!contributorAddress) {
        return res.status(400).json({ message: "Contributor address is required" });
    }

    try {
        const job = await getJobByContributor(contributorAddress);

        if (!job) {
            return res.status(201).json({ message: "Currently, no job is assigned to this contributor" });
        }

        res.status(200).json(job);
    } catch (error) {
        console.error("Error in getContributorJob:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getContributorAllJobs = async (req, res) => {
    const { contributorAddress } = req.query;

    if (!contributorAddress) {
        return res.status(400).json({ message: "Contributor address is required" });
    }

    try {
        const jobs = await getAllJobsByContributor(contributorAddress);
        res.status(200).json(jobs);
    } catch (error) {
        console.error("Error in getContributorAllJobs:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ── LLM Federated Job controllers ────────────────────────────────────────────

/**
 * POST /jobs/llm/accept-slot
 * Body: { jobId, contributorAddress }
 *
 * Flow:
 *   1. Frontend calls this endpoint — backend reserves the DB slot
 *   2. Backend calls acceptFederatedJob() on-chain (owner signs on behalf of contributor)
 *   3. If last slot filled → kicks off dataset sharding in the background
 */
export const acceptLlmSlotController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { jobId, contributorAddress } = req.body;

    try {
        // Verify job exists and is an LLM finetune job
        const llmJob = await getLlmFinetuneJob(jobId);
        if (!llmJob) {
            return res.status(404).json({ message: 'LLM finetune job not found' });
        }
        if (!['pending', 'in_progress'].includes(llmJob.status)) {
            return res.status(400).json({ message: `Job is not accepting contributors (status: ${llmJob.status})` });
        }

        // Reserve the slot in DB — throws if no slots available or already a contributor
        let slot;
        try {
            slot = await acceptLlmJobSlot(jobId, contributorAddress);
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }

        // Respond immediately so the contributor UI updates
        res.status(200).json({
            message: 'Slot accepted successfully',
            slotIndex: slot.slot_index,
            jobId: slot.job_id,
        });

        // Call acceptFederatedJob on-chain (owner signs) — fire-and-forget, non-blocking
        acceptFederatedJob(jobId, contributorAddress).then(receipt => {
            console.log(`[Job ${jobId}] acceptFederatedJob on-chain OK (slot ${slot.slot_index}), tx: ${receipt.transactionHash}`);
        }).catch(err => {
            console.error(`[Job ${jobId}] acceptFederatedJob on-chain FAILED for ${contributorAddress}:`, err.message);
        });

        // If this was the last slot → shard the dataset
        if (llmJob.status === 'in_progress' || slot.slot_index + 1 >= llmJob.max_contributors) {
            const slots = await getLlmJobSlots(jobId);
            if (slots.length >= llmJob.max_contributors) {
                console.log(`[Job ${jobId}] All slots filled — starting sharding`);
                shardDatasetForJob(jobId, llmJob.dataset_cid, slots).catch(err => {
                    console.error(`[Job ${jobId}] Sharding failed:`, err.message);
                });
            }
        }

    } catch (error) {
        console.error('Error in acceptLlmSlotController:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
};

/**
 * GET /jobs/llm/get-shard/:jobId
 * Query: ?contributorAddress=0x...
 *
 * Downloads the shard ZIP assigned to this contributor for the given job.
 * Used by the contributor app to fetch training data.
 */
export const getLlmShardController = async (req, res) => {
    const { jobId } = req.params;
    const { contributorAddress } = req.query;

    if (!jobId || !contributorAddress) {
        return res.status(400).json({ message: 'jobId and contributorAddress are required' });
    }

    try {
        const slots = await getLlmJobSlots(jobId);
        const slot = slots.find(
            s => s.contributor_address === contributorAddress.toLowerCase()
        );

        if (!slot) {
            return res.status(404).json({ message: 'No slot found for this contributor on this job' });
        }
        if (!slot.shard_cid) {
            return res.status(202).json({ message: 'Sharding is still in progress — try again in a few seconds' });
        }

        // Proxy the shard ZIP from IPFS
        const zipUrl = `https://gateway.pinata.cloud/ipfs/${slot.shard_cid}`;
        const response = await axios.get(zipUrl, { responseType: 'arraybuffer', timeout: 60_000 });

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="shard_${slot.slot_index}_job_${jobId}.zip"`);
        res.status(200).end(Buffer.from(response.data), 'binary');

    } catch (error) {
        console.error('Error in getLlmShardController:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * GET /jobs/llm/get-jobs
 * Returns all pending/in_progress LLM finetune jobs for the job browsing page.
 */
export const getLlmJobsController = async (req, res) => {
    try {
        const jobs = await getPendingLlmJobs();
        res.status(200).json(jobs);
    } catch (error) {
        console.error('Error in getLlmJobsController:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// LLM FINETUNE JOB CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /jobs/llm/upload
 * Multipart form-data. Uploads dataset to IPFS, creates unconfirmed DB record.
 * Frontend calls this BEFORE asking MetaMask to sign the blockchain tx.
 *
 * Body fields:
 *   folderName        string   — display name shown in job list
 *   modelName         string   — HuggingFace model ID e.g. "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
 *   maxContributors   integer  — 2–10
 *   epochs            integer  — default 3
 *   learningRate      float    — default 0.0002
 *   loraRank          integer  — default 8
 *   loraAlpha         integer  — default 16
 *   maxSeqLength      integer  — default 512
 *   rewardPerContributor float — POL per contributor
 *   requesterAddress  string   — wallet address
 *
 * Files:
 *   files[]  — dataset file(s). Recommend: single dataset.jsonl or dataset.json
 */
export const uploadLlmFinetuneJob = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        folderName,
        modelName,
        maxContributors,
        epochs,
        learningRate,
        loraRank,
        loraAlpha,
        maxSeqLength,
        rewardPerContributor,
        requesterAddress,
    } = req.body;

    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ message: 'Dataset file(s) required' });
    }

    try {
        // Validate reward against model tier
        const tier = classifyModelTier(modelName);
        const validation = validateReward(
            parseFloat(rewardPerContributor),
            parseInt(maxContributors),
            tier
        );
        if (!validation.valid) {
            return res.status(400).json({ message: validation.message });
        }

        // Calculate total stake the blockchain tx must send
        const breakdown = calculateStake(
            parseFloat(rewardPerContributor),
            parseInt(maxContributors)
        );

        // 1. Upload dataset to IPFS
        const { folderCid, metadataCid } = await uploadFolderHandler(folderName, files);

        // 2. Create DB records (unconfirmed until MetaMask tx confirms)
        const job = await createLlmFinetuneJob({
            requesterAddress,
            datasetCid:      folderCid,
            metadataCid,
            reward:          breakdown.stakeAmount,   // total POL the requester will send
            folderName,
            modelName,
            maxContributors: parseInt(maxContributors),
            epochs:          parseInt(epochs)           || 3,
            learningRate:    parseFloat(learningRate)   || 0.0002,
            loraRank:        parseInt(loraRank)         || 8,
            loraAlpha:       parseInt(loraAlpha)        || 16,
            maxSeqLength:    parseInt(maxSeqLength)     || 512,
        });

        res.status(200).json({
            message:     'LLM finetune job uploaded successfully',
            jobId:       job.id,
            folderCid,
            metadataCid,
            stakeAmount: breakdown.stakeAmount,  // frontend passes this to MetaMask
            breakdown,
        });
    } catch (error) {
        console.error('Error in uploadLlmFinetuneJob:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * POST /jobs/llm/confirm/:jobId
 * Called by frontend after MetaMask createFederatedJob() tx is confirmed.
 * Transitions job: unconfirmed → pending (visible in job list).
 */
export const confirmLlmJobController = async (req, res) => {
    const { jobId } = req.params;
    try {
        // confirmJobCreation is the generic version — works for all job types
        const job = await confirmJobCreation(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found or already confirmed' });
        }
        res.status(200).json({ message: 'LLM job confirmed', job });
    } catch (error) {
        console.error('Error in confirmLlmJobController:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * DELETE /jobs/llm/delete/:jobId
 * Called if the user closes MetaMask without confirming, or tx fails.
 * Deletes the unconfirmed job (cascade removes llm_finetune_jobs rows too).
 */
export const deleteLlmJobController = async (req, res) => {
    const { jobId } = req.params;
    try {
        const job = await deleteUnconfirmedLlmJob(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found or not in unconfirmed state' });
        }
        res.status(200).json({ message: 'Unconfirmed LLM job deleted' });
    } catch (error) {
        console.error('Error in deleteLlmJobController:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * POST /jobs/llm/submit-adapter
 * Called by the contributor app after:
 *   1. Training is complete
 *   2. Adapter ZIP was uploaded to IPFS → adapterCid obtained
 *   3. submitAdapter() blockchain tx was confirmed
 *
 * Body: { jobId, contributorAddress, adapterCid, txHash }
 *
 * This records the adapter in DB and triggers finalization if it's the last one.
 */
/**
 * POST /jobs/llm/submit-adapter
 * Called by the contributor app after:
 *   1. Training is complete
 *   2. Adapter ZIP was uploaded to IPFS → adapterCid obtained
 *
 * Calls submitAdapter() on-chain (owner signs on behalf of contributor),
 * records in DB, and triggers aggregation if it's the last adapter.
 *
 * Body: { jobId, contributorAddress, adapterCid }
 */
export const submitAdapterController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { jobId, contributorAddress, adapterCid } = req.body;

    try {
        // 1. Call submitAdapter() on-chain — owner signs on behalf of contributor.
        //    This must succeed before we store the CID so submittedCount tracks correctly.
        let txHash = null;
        try {
            const receipt = await submitAdapter(jobId, contributorAddress, adapterCid);
            txHash = receipt.transactionHash;
            console.log(`[Job ${jobId}] submitAdapter on-chain OK, tx: ${txHash}`);
        } catch (chainErr) {
            console.error(`[Job ${jobId}] submitAdapter on-chain FAILED:`, chainErr.message);
            return res.status(502).json({
                message: 'On-chain submitAdapter failed',
                error: chainErr.message,
            });
        }

        // 2. Record in DB
        const { slot, allSubmitted } = await submitLlmAdapter(
            jobId,
            contributorAddress,
            adapterCid,
            txHash
        );

        res.status(200).json({
            message:      allSubmitted
                ? 'Adapter submitted — all adapters received, aggregation starting'
                : 'Adapter submitted successfully',
            slotIndex:    slot.slot_index,
            allSubmitted,
            txHash,
        });

        // 3. Trigger aggregation if last adapter
        if (allSubmitted) {
            triggerAggregation(jobId).catch(err => {
                console.error(`[Job ${jobId}] Aggregation trigger failed:`, err.message);
            });
        }
    } catch (error) {
        console.error('Error in submitAdapterController:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
};

/**
 * GET /jobs/llm/my-requests
 * Query: ?requesterAddress=0x...
 * Returns all LLM finetune jobs posted by the requester (for My Requests page).
 */
export const getLlmRequesterJobsController = async (req, res) => {
    const { requesterAddress } = req.query;
    if (!requesterAddress) {
        return res.status(400).json({ message: 'requesterAddress is required' });
    }

    try {
        const jobs = await getLlmJobsByRequester(requesterAddress);
        res.status(200).json(jobs);
    } catch (error) {
        console.error('Error in getLlmRequesterJobsController:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATION TRIGGER (internal — called after all adapters submitted)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calls the aggregation microservice (Step 6) via HTTP.
 * The aggregation service runs as a separate Python process.
 *
 * If the microservice is not yet running (Step 6 not done), this logs a warning
 * and does nothing — the job stays in 'aggregating' status.
 */
const triggerAggregation = async (jobId) => {
    const AGGREGATION_URL = process.env.AGGREGATION_SERVICE_URL || 'http://localhost:5001';

    console.log(`[Job ${jobId}] Triggering aggregation at ${AGGREGATION_URL}/aggregate`);

    try {
        const response = await axios.post(
            `${AGGREGATION_URL}/aggregate`,
            { job_id: jobId },
            { timeout: 10_000 }     // just the trigger — aggregation itself is async
        );
        console.log(`[Job ${jobId}] Aggregation triggered:`, response.data);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.warn(
                `[Job ${jobId}] Aggregation service not reachable at ${AGGREGATION_URL}. ` +
                `Job stays in 'aggregating' status. Start the service (Step 6) to proceed.`
            );
        } else {
            throw error;
        }
    }
};

/**
 * GET /jobs/llm/slots/:jobId
 * Returns all slot rows for a job — used by the aggregation microservice.
 */
export const getLlmSlotsController = async (req, res) => {
    const { jobId } = req.params;
    try {
        const slots = await getLlmJobSlots(jobId);
        res.status(200).json(slots);
    } catch (error) {
        console.error('Error in getLlmSlotsController:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * POST /jobs/llm/finalize/:jobId
 * Body: { mergedAdapterCid, txHash, aggregationLog }
 * Called by aggregation microservice on success.
 * Updates llm_finetune_jobs.merged_adapter_cid and jobs.status = 'completed'.
 */
export const finalizeLlmJobController = async (req, res) => {
    const { jobId } = req.params;
    const { mergedAdapterCid, aggregationLog } = req.body;

    if (!mergedAdapterCid) {
        return res.status(400).json({ message: 'mergedAdapterCid is required' });
    }

    try {
        await finalizeLlmJob(jobId, mergedAdapterCid, aggregationLog ?? null);
        res.status(200).json({ message: 'Job finalized successfully', jobId });
    } catch (error) {
        console.error('Error in finalizeLlmJobController:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * POST /jobs/llm/aggregation-failed/:jobId
 * Body: { error }
 * Called by aggregation microservice on failure — marks job as failed.
 */
export const aggregationFailedController = async (req, res) => {
    const { jobId } = req.params;
    const { error } = req.body;
    try {
        await markLlmJobFailed(jobId, error ?? 'Aggregation failed');
        res.status(200).json({ message: 'Job marked as failed', jobId });
    } catch (err) {
        console.error('Error in aggregationFailedController:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
/**
 * GET /jobs/llm/my-slot
 * Query: ?contributorAddress=0x...
 * Returns the contributor's active LLM slot + all training params.
 * Used by the desktop contributor app to retrieve job details and shard info.
 */
export const getMyLlmSlotController = async (req, res) => {
    const { contributorAddress } = req.query;
    if (!contributorAddress) {
        return res.status(400).json({ message: 'contributorAddress is required' });
    }
    try {
        const slot = await getMyLlmSlot(contributorAddress);
        if (!slot) {
            return res.status(204).json({ message: 'No active LLM slot found' });
        }
        res.status(200).json(slot);
    } catch (error) {
        console.error('Error in getMyLlmSlotController:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * POST /jobs/llm/upload-adapter
 * Multipart: { jobId, contributorAddress } + file: adapter.zip
 * Receives the adapter ZIP from the contributor's training app, uploads it
 * to Pinata/IPFS, and returns the CID.
 * The contributor app then calls POST /jobs/llm/submit-adapter with the CID.
 */
export const uploadAdapterController = async (req, res) => {
    const { jobId, contributorAddress } = req.body;
    const files = req.files;

    if (!jobId || !contributorAddress) {
        return res.status(400).json({ message: 'jobId and contributorAddress are required' });
    }
    if (!files || files.length === 0) {
        return res.status(400).json({ message: 'adapter file is required' });
    }

    try {
        // Upload the raw ZIP buffer directly — no re-wrapping in another ZIP.
        // This keeps the aggregation service's extraction one level deep:
        //   download CID -> extract ZIP -> adapter_model.safetensors at root
        const adapterFile = files[0];
        const addrFrag   = contributorAddress.replace(/^0x/i, '').slice(0, 8);
        const fileName   = `adapter_job${jobId}_${addrFrag}.zip`;
        const adapterCid = await uploadRawFile(fileName, adapterFile.buffer, 'application/zip');
        res.status(200).json({ adapterCid });
    } catch (error) {
        console.error('Error in uploadAdapterController:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};