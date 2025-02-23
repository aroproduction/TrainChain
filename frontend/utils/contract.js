import { ethers, parseEther } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./constants";

// Function to get Ethereum provider and contract instance from MetaMask
export const getEthereumContract = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("Ethereum wallet not found");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    return contract;
  } catch (error) {
    console.error("Error initializing contract:", error);
    throw error;
  }
};

// Create a job with a stake (in ETH)
export const createJob = async (jobId, folderName, folderCID, metadataCID, trainingType, modelType, stakeAmount) => {
  console.table({ jobId, folderName, folderCID, metadataCID, trainingType, modelType, stakeAmount });

  if (!jobId || !folderName || !folderCID || !metadataCID || !trainingType || !modelType || !stakeAmount) {
    throw new Error("All fields are required");
  }

  try {
    const contract = await getEthereumContract();

    const tx = await contract.createJob(
      jobId,
      folderName,
      folderCID,
      metadataCID,
      trainingType,
      modelType,
      { value: parseEther(stakeAmount), gasLimit: 5000000 }
    );

    await tx.wait();
    return tx;
  } catch (error) {
    console.error("Error creating job:", error.message || error);
    throw new Error("Failed to create job. Please check your wallet and try again.");
  }
};

// Accept a job by sending the fixed commitment fee
export const acceptJob = async (jobId) => {
  try {
    if (!jobId) {
      throw new Error("Job ID is required");
    }

    const contract = await getEthereumContract();
    
    // Ensure we're sending exactly 0.02 ETH
    const commitmentFee = parseEther("0.02");
    
    // First, check if the job exists and is available
    const jobDetails = await contract.getJobDetails(jobId);
    if (!jobDetails) {
      throw new Error("Job not found");
    }
    
    // Send the transaction with explicit parameters
    const tx = await contract.acceptJob(
      jobId,
      {
        value: commitmentFee,
        gasLimit: 500000, // Increased gas limit
      }
    );

    // Wait for confirmation
    const receipt = await tx.wait();
    
    // Check if transaction was successful
    if (receipt.status === 0) {
      throw new Error("Transaction failed");
    }

    return tx;
  } catch (error) {
    console.error("Error accepting job:", error);
    if (error.reason) {
      throw new Error(`Failed to accept job: ${error.reason}`);
    } else if (error.message) {
      throw new Error(`Failed to accept job: ${error.message}`);
    } else {
      throw new Error("Failed to accept job. Please ensure you have sufficient funds and try again.");
    }
  }
};

// Cancel a job (Only the contributor can cancel)
export const cancelJob = async (jobId) => {
  try {
    const contract = await getEthereumContract();
    const tx = await contract.cancelJob(jobId);
    await tx.wait();
    return tx;
  } catch (error) {
    console.error("Error canceling job:", error.message || error);
    throw new Error("Failed to cancel job. Please try again.");
  }
};

// Delete a job (Only the requester can delete)
export const deleteJob = async (jobId) => {
  try {
    const contract = await getEthereumContract();
    const tx = await contract.deleteJob(jobId);
    await tx.wait();
    return tx;
  } catch (error) {
    console.error("Error deleting job:", error.message || error);
    throw new Error("Failed to delete job. Please try again.");
  }
};

// Complete a job by storing the trained model CID
export const completeJob = async (jobId, trainedModelCID) => {
  try {
    if (!trainedModelCID) {
      throw new Error("Trained model CID is required.");
    }

    const contract = await getEthereumContract();
    const tx = await contract.completeJob(jobId, trainedModelCID, { gasLimit: 300000 });
    await tx.wait();
    return tx;
  } catch (error) {
    console.error("Error completing job:", error.message || error);
    throw new Error("Failed to complete job. Ensure the job is ready for completion.");
  }
};

// Get job details
export const getJobDetails = async (jobId) => {
  try {
    const contract = await getEthereumContract();
    const job = await contract.getJobDetails(jobId);

    return {
      folderName: job[0],
      folderCID: job[1],
      metadataCID: job[2],
      trainingType: job[3],
      modelType: job[4],
      requester: job[5],
      contributor: job[6],
      stakeAmount: ethers.formatEther(job[7]), // Convert from Wei to ETH
      isCompleted: job[8],
      trainedModelCID: job[9],
    };
  } catch (error) {
    console.error("Error fetching job details:", error.message || error);
    throw new Error("Failed to fetch job details. Please try again.");
  }
};
