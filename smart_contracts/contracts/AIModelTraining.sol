// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AIModelTraining {
    // ─────────────────────────────────────────────
    // State Variables
    // ─────────────────────────────────────────────
    address public platformWallet;
    address public owner;                         // replaces hardcoded address
    uint256 public constant COMMITMENT_FEE = 0.02 ether;

    // ─────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────

    // Existing single-contributor job (image classification, YOLO, etc.)
    struct Job {
        uint256 jobId;
        string folderName;
        string folderCID;
        string metadataCID;
        string trainingType;
        string modelType;
        address requester;
        address contributor;
        uint256 stakeAmount;
        bool isCompleted;
        string trainedModelCID;
    }

    // New multi-contributor federated finetuning job
    struct FedJob {
        uint256 jobId;
        string datasetCID;          // IPFS CID of the full dataset folder
        string metadataCID;         // IPFS CID of job metadata JSON
        string modelName;           // e.g. "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
        address requester;
        uint8 maxContributors;      // how many shards / contributors are expected
        uint8 submittedCount;       // how many adapters have been submitted so far
        address[] contributors;     // ordered list of accepted contributors
        uint256 stakeAmount;        // total reward in wei posted by requester
        bool isCompleted;
        string mergedAdapterCID;    // set by backend after FedAvg aggregation
    }

    // ─────────────────────────────────────────────
    // Mappings
    // ─────────────────────────────────────────────
    mapping(uint256 => Job) public jobs;
    mapping(address => uint256) public contributorCommitments;

    mapping(uint256 => FedJob) public fedJobs;
    // fedJobAdapters[jobId][contributorAddress] = adapterCID
    mapping(uint256 => mapping(address => string)) public fedJobAdapters;
    // quick O(1) membership check
    mapping(uint256 => mapping(address => bool)) public isFedContributor;

    // ─────────────────────────────────────────────
    // Events — existing
    // ─────────────────────────────────────────────
    event JobCreated(uint256 jobId, address indexed requester, uint256 stakeAmount);
    event JobAccepted(uint256 jobId, address indexed contributor);
    event JobCancelled(uint256 jobId, address indexed requester);
    event JobFailed(uint256 jobId, address indexed contributor);
    event JobCompleted(uint256 jobId, address indexed contributor, uint256 reward, string trainedModelCID);

    // ─────────────────────────────────────────────
    // Events — federated
    // ─────────────────────────────────────────────
    event FedJobCreated(uint256 indexed jobId, address indexed requester, uint8 maxContributors, uint256 stakeAmount);
    event FedJobSlotAccepted(uint256 indexed jobId, address indexed contributor, uint8 slotIndex);
    event AdapterSubmitted(uint256 indexed jobId, address indexed contributor, string adapterCID, uint8 submittedCount);
    event FedJobCompleted(uint256 indexed jobId, address indexed requester, string mergedAdapterCID, uint256 rewardPerContributor);

    // ─────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────
    constructor(address _platformWallet) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        platformWallet = _platformWallet;
        owner = msg.sender;         // deployer becomes owner; backend wallet must be the deployer
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXISTING FUNCTIONS (single-contributor jobs — unchanged except auth fix)
    // ─────────────────────────────────────────────────────────────────────────

    function createJob(
        uint256 _jobId,
        string memory _folderName,
        string memory _folderCID,
        string memory _metadataCID,
        string memory _trainingType,
        string memory _modelType
    ) external payable {
        require(msg.value > 0, "Stake amount must be greater than 0");
        require(jobs[_jobId].jobId == 0, "Job ID already exists");

        jobs[_jobId] = Job({
            jobId: _jobId,
            folderName: _folderName,
            folderCID: _folderCID,
            metadataCID: _metadataCID,
            trainingType: _trainingType,
            modelType: _modelType,
            requester: msg.sender,
            contributor: address(0),
            stakeAmount: msg.value,
            isCompleted: false,
            trainedModelCID: ""
        });

        emit JobCreated(_jobId, msg.sender, msg.value);
    }

    function acceptJob(uint256 _jobId) external payable {
        Job storage job = jobs[_jobId];
        require(job.jobId != 0, "Job does not exist");
        require(job.contributor == address(0), "Job already taken");
        require(msg.value == COMMITMENT_FEE, "Incorrect commitment fee");

        job.contributor = msg.sender;
        contributorCommitments[msg.sender] += msg.value;
        payable(platformWallet).transfer(msg.value);

        emit JobAccepted(_jobId, msg.sender);
    }

    function deleteJob(uint256 _jobId) external {
        Job storage job = jobs[_jobId];
        require(job.jobId != 0, "Job does not exist");
        require(msg.sender == job.requester, "Only requester can delete job");
        require(job.contributor == address(0), "Job already taken");

        uint256 refundAmount = (job.stakeAmount * 95) / 100;
        uint256 feeAmount = job.stakeAmount - refundAmount;

        payable(job.requester).transfer(refundAmount);
        payable(platformWallet).transfer(feeAmount);

        delete jobs[_jobId];
        emit JobCancelled(_jobId, msg.sender);
    }

    function cancelJob(uint256 _jobId) external {
        Job storage job = jobs[_jobId];
        require(job.jobId != 0, "Job does not exist");
        require(job.contributor == msg.sender, "Only assigned contributor can cancel");
        require(!job.isCompleted, "Job already completed");

        uint256 refundAmount = (COMMITMENT_FEE * 95) / 100;
        payable(msg.sender).transfer(refundAmount);
        contributorCommitments[msg.sender] -= COMMITMENT_FEE;
        job.contributor = address(0);

        emit JobFailed(_jobId, msg.sender);
    }

    // Fixed: was hardcoded to 0xe003212E9A5b41a923566b3E093fe1c3D1c68A5A
    function completeJob(uint256 _jobId, string memory _trainedModelCID) external onlyOwner {
        Job storage job = jobs[_jobId];
        require(job.jobId != 0, "Job does not exist");
        require(!job.isCompleted, "Job already completed");
        require(bytes(_trainedModelCID).length > 0, "Trained model CID required");

        uint256 platformFee = (job.stakeAmount * 10) / 100;
        uint256 rewardAmount = job.stakeAmount - platformFee;

        payable(platformWallet).transfer(platformFee);
        payable(job.contributor).transfer(rewardAmount);

        job.isCompleted = true;
        job.trainedModelCID = _trainedModelCID;

        emit JobCompleted(_jobId, job.contributor, rewardAmount, _trainedModelCID);
    }

    function getJobDetails(uint256 _jobId)
        external
        view
        returns (
            string memory, string memory, string memory,
            string memory, string memory,
            address, address,
            uint256, bool, string memory
        )
    {
        Job storage job = jobs[_jobId];
        require(job.jobId != 0, "Job does not exist");
        return (
            job.folderName, job.folderCID, job.metadataCID,
            job.trainingType, job.modelType,
            job.requester, job.contributor,
            job.stakeAmount, job.isCompleted, job.trainedModelCID
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW FUNCTIONS — Federated Finetuning
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Requester posts a new federated finetuning job.
     * @param _jobId        Unique job ID (same namespace as regular jobs — pick non-overlapping range,
     *                      e.g. regular jobs: 1-9999, fed jobs: 10000+, or use a separate counter)
     * @param _datasetCID   IPFS CID of the full dataset folder uploaded by requester
     * @param _metadataCID  IPFS CID of metadata JSON (model name, hyperparams, etc.)
     * @param _modelName    HuggingFace model ID, e.g. "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
     * @param _maxContributors  Number of shards = number of expected contributors (2–10)
     */
    function createFederatedJob(
        uint256 _jobId,
        string memory _datasetCID,
        string memory _metadataCID,
        string memory _modelName,
        uint8 _maxContributors
    ) external payable {
        require(msg.value > 0, "Reward must be > 0");
        require(fedJobs[_jobId].jobId == 0, "Fed job ID already exists");
        require(jobs[_jobId].jobId == 0, "Job ID conflicts with regular job");
        require(_maxContributors >= 2 && _maxContributors <= 10, "Contributors must be 2-10");

        FedJob storage newJob = fedJobs[_jobId];
        newJob.jobId = _jobId;
        newJob.datasetCID = _datasetCID;
        newJob.metadataCID = _metadataCID;
        newJob.modelName = _modelName;
        newJob.requester = msg.sender;
        newJob.maxContributors = _maxContributors;
        newJob.submittedCount = 0;
        newJob.stakeAmount = msg.value;
        newJob.isCompleted = false;
        newJob.mergedAdapterCID = "";

        emit FedJobCreated(_jobId, msg.sender, _maxContributors, msg.value);
    }

    /**
     * @notice Records a contributor's slot acceptance for a federated job.
     *         Called by the backend (owner) after the contributor confirms via the frontend.
     *         No commitment fee for federated jobs.
     * @param _contributor  The contributor's wallet address.
     */
    function acceptFederatedJob(uint256 _jobId, address _contributor) external onlyOwner {
        FedJob storage job = fedJobs[_jobId];
        require(job.jobId != 0, "Fed job does not exist");
        require(!job.isCompleted, "Job already completed");
        require(job.contributors.length < job.maxContributors, "All slots filled");
        require(!isFedContributor[_jobId][_contributor], "Already a contributor");

        isFedContributor[_jobId][_contributor] = true;
        job.contributors.push(_contributor);

        emit FedJobSlotAccepted(_jobId, _contributor, uint8(job.contributors.length - 1));
    }

    /**
     * @notice Records a contributor's submitted LoRA adapter CID.
     *         Called by the backend (owner) after the contributor finishes training
     *         and the adapter has been uploaded to IPFS.
     * @param _contributor  The contributor's wallet address.
     * @param _adapterCID   IPFS CID of the uploaded adapter ZIP.
     */
    function submitAdapter(uint256 _jobId, address _contributor, string memory _adapterCID) external onlyOwner {
        FedJob storage job = fedJobs[_jobId];
        require(job.jobId != 0, "Fed job does not exist");
        require(!job.isCompleted, "Job already completed");
        require(isFedContributor[_jobId][_contributor], "Not a contributor on this job");
        require(bytes(fedJobAdapters[_jobId][_contributor]).length == 0, "Adapter already submitted");
        require(bytes(_adapterCID).length > 0, "CID cannot be empty");

        fedJobAdapters[_jobId][_contributor] = _adapterCID;
        job.submittedCount++;

        emit AdapterSubmitted(_jobId, _contributor, _adapterCID, job.submittedCount);
    }

    /**
     * @notice Backend calls this after running FedAvg aggregation and uploading merged adapter.
     *         Splits reward equally among all contributors who submitted adapters.
     *         Platform takes 10% fee from the total reward.
     */
    function completeFederatedJob(uint256 _jobId, string memory _mergedAdapterCID) external onlyOwner {
        FedJob storage job = fedJobs[_jobId];
        require(job.jobId != 0, "Fed job does not exist");
        require(!job.isCompleted, "Job already completed");
        require(job.submittedCount == job.maxContributors, "Not all adapters submitted yet");
        require(bytes(_mergedAdapterCID).length > 0, "Merged adapter CID required");

        uint256 platformFee = (job.stakeAmount * 10) / 100;
        uint256 totalReward = job.stakeAmount - platformFee;
        uint256 rewardPerContributor = totalReward / job.contributors.length;

        payable(platformWallet).transfer(platformFee);

        for (uint8 i = 0; i < job.contributors.length; i++) {
            // Only pay contributors who actually submitted an adapter
            if (bytes(fedJobAdapters[_jobId][job.contributors[i]]).length > 0) {
                payable(job.contributors[i]).transfer(rewardPerContributor);
            }
        }

        job.isCompleted = true;
        job.mergedAdapterCID = _mergedAdapterCID;

        emit FedJobCompleted(_jobId, job.requester, _mergedAdapterCID, rewardPerContributor);
    }

    /**
     * @notice Read all contributors and their adapter CIDs for a given fed job.
     *         Used by aggregation microservice to know which CIDs to download.
     */
    function getFedJobAdapters(uint256 _jobId)
        external
        view
        returns (address[] memory contributorList, string[] memory adapterCIDs)
    {
        FedJob storage job = fedJobs[_jobId];
        require(job.jobId != 0, "Fed job does not exist");

        uint256 len = job.contributors.length;
        contributorList = new address[](len);
        adapterCIDs = new string[](len);

        for (uint256 i = 0; i < len; i++) {
            contributorList[i] = job.contributors[i];
            adapterCIDs[i] = fedJobAdapters[_jobId][job.contributors[i]];
        }
    }

    /**
     * @notice Returns high-level info about a federated job.
     */
    function getFedJobDetails(uint256 _jobId)
        external
        view
        returns (
            string memory datasetCID,
            string memory metadataCID,
            string memory modelName,
            address requester,
            uint8 maxContributors,
            uint8 submittedCount,
            uint256 contributorCount,
            uint256 stakeAmount,
            bool isCompleted,
            string memory mergedAdapterCID
        )
    {
        FedJob storage job = fedJobs[_jobId];
        require(job.jobId != 0, "Fed job does not exist");
        return (
            job.datasetCID,
            job.metadataCID,
            job.modelName,
            job.requester,
            job.maxContributors,
            job.submittedCount,
            job.contributors.length,
            job.stakeAmount,
            job.isCompleted,
            job.mergedAdapterCID
        );
    }
}