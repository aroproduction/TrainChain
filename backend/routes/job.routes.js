import express from "express";
import { query, body, param } from "express-validator";
import multer from "multer";
import { uploadImageProcessingJob, getDataset, getJobsController, getImageProcessingJobDetails, uploadModelController, getRequesterRequests, getModel, jobApply, getContributorJob, getContributorAllJobs, confirmJobController, deleteUnconfirmedJobController, retryInfoController, jobApplyInitiate, jobApplyConfirm, jobApplyRevert, acceptLlmSlotController, getLlmShardController, getLlmJobsController, uploadLlmFinetuneJob, confirmLlmJobController, deleteLlmJobController, submitAdapterController, getLlmRequesterJobsController, getLlmSlotsController, finalizeLlmJobController, aggregationFailedController, getMyLlmSlotController, uploadAdapterController, } from "../controllers/job.controller.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
    "/image_processing/upload",
    upload.array("files"),
    [
        body("folderName").notEmpty().withMessage("Folder name is required"),
        body("model").notEmpty().withMessage("Model is required"),
        body("epochs").isInt().withMessage("Epochs must be a number"),
        body("imgsz").notEmpty().withMessage("Image size is required"),
        body("exportFormat").notEmpty().withMessage("Export format is required"),
        body("numClasses").isInt().withMessage("Number of classes must be a number"),
        body("classes").notEmpty().withMessage("Classes are required"),
        body("reward").isFloat().withMessage("Reward must be a number"),
        body("requesterAddress").notEmpty().withMessage("Requester address is required"),
    ],
    uploadImageProcessingJob
);

router.get (
    "/get-dataset/:jobId",
    query("jobId").notEmpty().withMessage("Job ID is required"),
    getDataset
);

router.get (
    "/get-jobs",
    getJobsController
);

router.get (
    "/image_processing/get-job/:jobId",
    query("jobId").notEmpty().withMessage("Job ID is required"),
    getImageProcessingJobDetails
);

router.post(
    '/model/upload', 
    upload.array("files"), 
    body("jobId").notEmpty().withMessage("Job ID is required"),
    uploadModelController
);

router.get(
    '/my-requests',
    query("requesterAddress").notEmpty().withMessage("Requester address is required"),
    getRequesterRequests
);

router.get (
    "/get-model/:jobId",
    param("jobId").notEmpty().withMessage("Job ID is required"),
    getModel
);

router.post (
    "/contributor/apply",
    body("jobId").notEmpty().withMessage("Job ID is required"),
    body("contributorAddress").notEmpty().withMessage("Contributor address is required"),
    jobApply
);

// Two-phase: Job creation confirm / delete / retry
router.post("/confirm/:jobId", confirmJobController);
router.delete("/delete/:jobId", deleteUnconfirmedJobController);
router.get("/retry-info/:jobId", retryInfoController);

// Two-phase: Contributor apply initiate / confirm / revert
router.post(
    "/contributor/apply/initiate",
    body("jobId").notEmpty().withMessage("Job ID is required"),
    body("contributorAddress").notEmpty().withMessage("Contributor address is required"),
    jobApplyInitiate
);

router.post(
    "/contributor/apply/confirm",
    body("jobId").notEmpty().withMessage("Job ID is required"),
    jobApplyConfirm
);

router.post(
    "/contributor/apply/revert",
    body("jobId").notEmpty().withMessage("Job ID is required"),
    jobApplyRevert
);

router.get (
    "/contributor/get-job",
    query("contributorAddress").notEmpty().withMessage("Contributor address is required"),
    getContributorJob
);

router.get (
    "/contributor/all-jobs",
    query("contributorAddress").notEmpty().withMessage("Contributor address is required"),
    getContributorAllJobs
);

// ── LLM Federated Finetuning routes ──────────────────────────────────────────

// Browse available LLM jobs
router.get('/llm/get-jobs', getLlmJobsController);

// Contributor accepts a slot (called AFTER MetaMask tx succeeds)
router.post(
    '/llm/accept-slot',
    body('jobId').isInt().withMessage('jobId must be an integer'),
    body('contributorAddress').notEmpty().withMessage('contributorAddress is required'),
    acceptLlmSlotController
);

// Contributor downloads their data shard
router.get(
    '/llm/get-shard/:jobId',
    param('jobId').isInt().withMessage('jobId must be an integer'),
    query('contributorAddress').notEmpty().withMessage('contributorAddress is required'),
    getLlmShardController
);

// ── LLM job creation two-phase + adapter submission ──────────────────

// Upload dataset to IPFS + create unconfirmed DB record
router.post(
    '/llm/upload',
    upload.array('files'),
    [
        body('folderName').notEmpty().withMessage('folderName is required'),
        body('modelName').notEmpty().withMessage('modelName is required'),
        body('maxContributors').isInt({ min: 2, max: 10 }).withMessage('maxContributors must be 2–10'),
        body('rewardPerContributor').isFloat({ gt: 0 }).withMessage('rewardPerContributor must be > 0'),
        body('requesterAddress').notEmpty().withMessage('requesterAddress is required'),
    ],
    uploadLlmFinetuneJob
);

// Confirm after MetaMask tx succeeds: unconfirmed → pending
router.post('/llm/confirm/:jobId', confirmLlmJobController);

// Delete if MetaMask tx cancelled or failed
router.delete('/llm/delete/:jobId', deleteLlmJobController);

// Contributor submits their LoRA adapter CID (after blockchain tx)
router.post(
    '/llm/submit-adapter',
    [
        body('jobId').isInt().withMessage('jobId must be an integer'),
        body('contributorAddress').notEmpty().withMessage('contributorAddress is required'),
        body('adapterCid').notEmpty().withMessage('adapterCid is required'),
    ],
    submitAdapterController
);

// Requester's LLM job history
router.get(
    '/llm/my-requests',
    query('requesterAddress').notEmpty().withMessage('requesterAddress is required'),
    getLlmRequesterJobsController
);

// Used by aggregation microservice
router.get('/llm/slots/:jobId', getLlmSlotsController);
router.post('/llm/finalize/:jobId', finalizeLlmJobController);
router.post('/llm/aggregation-failed/:jobId', aggregationFailedController);

// Used by contributor desktop app
router.get(
    '/llm/my-slot',
    query('contributorAddress').notEmpty().withMessage('contributorAddress is required'),
    getMyLlmSlotController
);
router.post(
    '/llm/upload-adapter',
    upload.array('file'),
    [
        body('jobId').notEmpty().withMessage('jobId is required'),
        body('contributorAddress').notEmpty().withMessage('contributorAddress is required'),
    ],
    uploadAdapterController
);

export default router;
