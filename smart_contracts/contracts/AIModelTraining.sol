// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AIModelTraining {
    address public platformWallet;
    uint256 public constant COMMITMENT_FEE = 0.02 ether; // Adjusted for market rates

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

    mapping(uint256 => Job) public jobs;
    mapping(address => uint256) public contributorCommitments;

    event JobCreated(uint256 jobId, address indexed requester, uint256 stakeAmount);
    event JobAccepted(uint256 jobId, address indexed contributor);
    event JobCancelled(uint256 jobId, address indexed requester);
    event JobFailed(uint256 jobId, address indexed contributor);
    event JobCompleted(uint256 jobId, address indexed contributor, uint256 reward, string trainedModelCID);

    constructor(address _platformWallet) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        platformWallet = _platformWallet;
    }

    function createJob(
        uint256 _jobId, // User-defined job ID
        string memory _folderName,
        string memory _folderCID,
        string memory _metadataCID,
        string memory _trainingType,
        string memory _modelType
    ) external payable {
        require(msg.value > 0, "Stake amount must be greater than 0");
        require(jobs[_jobId].jobId == 0, "Job ID already exists"); // Ensure uniqueness

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

    function completeJob(uint256 _jobId, string memory _trainedModelCID) external {
        Job storage job = jobs[_jobId];

        require(job.jobId != 0, "Job does not exist");
        require(msg.sender == job.requester, "Only requester can finalize");
        require(job.contributor != address(0), "No contributor assigned");
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
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            address,
            address,
            uint256,
            bool,
            string memory
        )
    {
        Job storage job = jobs[_jobId];
        require(job.jobId != 0, "Job does not exist");

        return (
            job.folderName,
            job.folderCID,
            job.metadataCID,
            job.trainingType,
            job.modelType,
            job.requester,
            job.contributor,
            job.stakeAmount,
            job.isCompleted,
            job.trainedModelCID
        );
    }
}
