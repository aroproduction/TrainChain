import { validationResult } from "express-validator";
import { uploadFolderHandler, downloadFolderAsZip } from "../services/ipfs.services.js";
import { createJob, insert_image_processing_table, getJobById, getJobs, get_image_processing_job, updateTrainedJobModel, JobsByRequester, updateJobStatus, ContributorHasInProgressJob, updateContributor, getJobByContributor } from "../services/db.services.js";
import { completeJob } from "../utils/blockchain.js";

export const uploadImageProcessingJob = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    console.log("Received request:", req.body);

    const { folderName, model, epochs, imgsz, exportFormat, numClasses, classes, requesterAddress, reward } = req.body;
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
