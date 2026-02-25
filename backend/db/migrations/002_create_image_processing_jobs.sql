-- Image classification / YOLO job parameters
CREATE TABLE IF NOT EXISTS image_processing_jobs (
    id            SERIAL PRIMARY KEY,
    job_id        INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    model         VARCHAR(100) NOT NULL,   -- e.g. 'yolov5s', 'yolov8m'
    epochs        INTEGER NOT NULL,
    imgsz         VARCHAR(20) NOT NULL,    -- e.g. '640'
    export_format VARCHAR(50),             -- e.g. 'ONNX', 'TFLite'
    num_classes   INTEGER NOT NULL,
    classes       TEXT[],                  -- PostgreSQL text array: {'cat','dog'}
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_processing_jobs_job_id ON image_processing_jobs(job_id);