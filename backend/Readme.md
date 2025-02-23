# /jobs Routes

**This document** describes the API endpoints for managing jobs, including uploading image processing jobs, downloading datasets, and retrieving job listings.

---

## /jobs/image_processing/upload
**Method:** POST

**Description:**  
Upload a new image processing job along with its dataset. Expects `multipart/form-data` with both job details and dataset files.

**Body Parameters:**

- **folderName** (string, **required**)  
  The name of the dataset folder.

- **model** (string, **required**)  
  The model to be used (e.g., `"yolov5"`).

- **epochs** (integer, **required**)  
  The number of training epochs.

- **imgsz** (string, **required**)  
  The image size (e.g., `"640"`).

- **exportFormat** (string, **required**)  
  The export format (e.g., `"ONNX"`).

- **numClasses** (integer, **required**)  
  The number of classes.

- **classes** (JSON array or string, **required**)  
  The list of class names (e.g., `["cat","dog"]`).

- **reward** (float, **required**)  
  The reward for the job (e.g., `0.5`).

- **requesterAddress** (string, **required**)  
  The wallet address of the requester.

**Files:**

- **files** (array, **required**)  
  The dataset images.

**Response:**

```json
{
  "message": "Job uploaded successfully",
  "job": { /* createdJobObject */ }
}
```

---

## /jobs/get-dataset/:jobId
**Method:** GET

**Description:**  
Download the dataset (zipped) for a specific job.

**URL Parameter:**  
- **:jobId** (integer/string, **required**)  
  The unique ID of the job.

**Response:**  
• File (type: `application/zip`)

Example request:
```
GET /get-dataset/5
```
Example response:
• Returns a ZIP file with the requested dataset

---

## /jobs/get-jobs
**Method:** GET

**Description:**  
Retrieve a list of pending jobs.

**Parameters:**  
• None

**Response:**  
```json
[
  {
    "id": 1,
    "job_type": "image_processing",
    "requester_address": "0x123...",
    "status": "pending",
    "created_at": "2023-05-01T12:00:00.000Z",
    // ...other fields...
  },
  // ...additional job objects...
]
```

---

## /jobs/image_processing/get-job/:jobId
**Method:** `GET`

**Description:**  
Retrieve detailed information about a specific image processing job by job ID.

**URL Parameter:**  
- **:jobId** (integer/string, **required**)  
  The unique ID of the job.

**Example Response:**  
```json
{
  "id": 14,
  "job_id": 14,
  "model": "yolo v11",
  "epochs": 3000,
  "imgsz": "1024",
  "export_format": "tfjs",
  "num_classes": 2,
  "classes": "dog, cat",
  "job_type": "image_processing",
  "requester_address": "0xe003212E9A5b41a923566b3E093fe1c3D1c68A5A",
  "folder_cid": "QmZ6VCSSyZGtkkjLKi7AKzyYY2sQubBFP64Qm433GWKSkA",
  "metadata_cid": "QmU99U7zZyTUc5a9K3WqSwgV3Kr8DFJUG1zsdWCKXrZNNe",
  "reward": "500.000000",
  "status": "pending",
  "created_at": "2025-02-14T04:36:47.332Z"
}
```
