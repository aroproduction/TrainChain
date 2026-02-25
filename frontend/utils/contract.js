import { ethers, parseEther } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./constants";

// Polygon Amoy Testnet Configuration
const POLYGON_AMOY_CONFIG = {
  chainId: "0x13882", // 80002 in hex
  chainName: "Polygon Amoy Testnet",
  nativeCurrency: {
    name: "POL",
    symbol: "POL",
    decimals: 18,
  },
  rpcUrls: ["https://rpc-amoy.polygon.technology/"],
  blockExplorerUrls: ["https://amoy.polygonscan.com/"],
};

// Check if user is on Polygon Amoy network
export const checkNetwork = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  const chainId = network.chainId.toString();

  return chainId === "80002"; // Polygon Amoy chain ID
};

// Switch to Polygon Amoy network
export const switchToPolygonAmoy = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: POLYGON_AMOY_CONFIG.chainId }],
    });
    return true;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        // Add the network to MetaMask
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [POLYGON_AMOY_CONFIG],
        });
        return true;
      } catch (addError) {
        console.error("Error adding Polygon Amoy network:", addError);
        throw new Error("Failed to add Polygon Amoy network to MetaMask");
      }
    } else {
      console.error("Error switching to Polygon Amoy network:", switchError);
      throw new Error("Failed to switch to Polygon Amoy network");
    }
  }
};

// Ensure user is on the correct network before transactions
export const ensureCorrectNetwork = async () => {
  const isCorrectNetwork = await checkNetwork();
  
  if (!isCorrectNetwork) {
    const confirmSwitch = window.confirm(
      "You are not connected to Polygon Amoy Testnet. Would you like to switch networks now?"
    );
    
    if (confirmSwitch) {
      await switchToPolygonAmoy();
    } else {
      throw new Error("Please switch to Polygon Amoy Testnet to continue");
    }
  }
};

// Function to get Ethereum provider and contract instance from MetaMask
export const getEthereumContract = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("Ethereum wallet not found");
    }

    // Ensure user is on correct network
    await ensureCorrectNetwork();

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    return contract;
  } catch (error) {
    console.error("Error initializing contract:", error);
    throw error;
  }
};

// Create a job with a stake (in POL)
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

// ── Federated finetuning contract functions ──────────────────────────────────

/**
 * Create a new federated finetuning job on-chain.
 *
 * @param {number|string} jobId
 * @param {string}        datasetCID       - IPFS CID of the uploaded dataset ZIP
 * @param {string}        metadataCID      - IPFS CID of the metadata JSON
 * @param {string}        modelName        - HuggingFace model ID
 * @param {number}        maxContributors  - 2–10
 * @param {string}        stakeAmount      - Total POL to stake, as a decimal string e.g. "0.333333"
 */
export const createFederatedJob = async (
    jobId, datasetCID, metadataCID, modelName, maxContributors, stakeAmount
) => {
    if (!jobId || !datasetCID || !metadataCID || !modelName || !maxContributors || !stakeAmount) {
        throw new Error('All fields are required to create a federated job');
    }

    try {
        const contract = await getEthereumContract();
        const tx = await contract.createFederatedJob(
            jobId,
            datasetCID,
            metadataCID,
            modelName,
            maxContributors,
            { value: parseEther(String(stakeAmount)), gasLimit: 500000 }
        );
        await tx.wait();
        return tx;
    } catch (error) {
        console.error('Error creating federated job:', error.message || error);
        throw new Error('Failed to create federated job. Check your wallet and try again.');
    }
};

/**
 * Read federated job details from the contract (view call — no gas).
 *
 * @param {number|string} jobId
 */
export const getFederatedJobDetails = async (jobId) => {
    try {
        const contract = await getEthereumContract();
        const d = await contract.getFedJobDetails(jobId);
        return {
            datasetCID:       d.datasetCID,
            metadataCID:      d.metadataCID,
            modelName:        d.modelName,
            requester:        d.requester,
            maxContributors:  Number(d.maxContributors),
            submittedCount:   Number(d.submittedCount),
            contributorCount: Number(d.contributorCount),
            stakeAmount:      ethers.formatEther(d.stakeAmount),
            isCompleted:      d.isCompleted,
            mergedAdapterCID: d.mergedAdapterCID,
        };
    } catch (error) {
        console.error('Error fetching federated job details:', error.message || error);
        throw new Error('Failed to fetch federated job details.');
    }
};
