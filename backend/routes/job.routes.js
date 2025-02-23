import express from "express";
import { query, body, param } from "express-validator";
import multer from "multer";
import { uploadImageProcessingJob, getDataset, getJobsController, getImageProcessingJobDetails, uploadModelController, getRequesterRequests, getModel, jobApply, getContributorJob } from "../controllers/job.controller.js";

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

router.get (
    "/contributor/get-job",
    query("contributorAddress").notEmpty().withMessage("Contributor address is required"),
    getContributorJob
);

export default router;
