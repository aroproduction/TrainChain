import dotenv from 'dotenv';
import Web3 from 'web3';
// import ABI from '../../smart_contracts/artifacts/contracts/AIModelTraining.sol/AIModelTraining.json';

dotenv.config();

const { CONTRACT_ADDRESS, PRIVATE_KEY, POLYGON_RPC_URL } = process.env;
const web3 = new Web3(new Web3.providers.HttpProvider(POLYGON_RPC_URL));

export const contractABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_platformWallet",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "jobId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "contributor",
          "type": "address"
        }
      ],
      "name": "JobAccepted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "jobId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "requester",
          "type": "address"
        }
      ],
      "name": "JobCancelled",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "jobId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "contributor",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "reward",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "trainedModelCID",
          "type": "string"
        }
      ],
      "name": "JobCompleted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "jobId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "requester",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "stakeAmount",
          "type": "uint256"
        }
      ],
      "name": "JobCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "jobId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "contributor",
          "type": "address"
        }
      ],
      "name": "JobFailed",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "COMMITMENT_FEE",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_jobId",
          "type": "uint256"
        }
      ],
      "name": "acceptJob",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_jobId",
          "type": "uint256"
        }
      ],
      "name": "cancelJob",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_jobId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_trainedModelCID",
          "type": "string"
        }
      ],
      "name": "completeJob",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "contributorCommitments",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_folderName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_folderCID",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_metadataCID",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_trainingType",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_modelType",
          "type": "string"
        }
      ],
      "name": "createJob",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_jobId",
          "type": "uint256"
        }
      ],
      "name": "deleteJob",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_jobId",
          "type": "uint256"
        }
      ],
      "name": "getJobDetails",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "jobCounter",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "jobs",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "jobId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "folderName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "folderCID",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "metadataCID",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "trainingType",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "modelType",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "requester",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "contributor",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "stakeAmount",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isCompleted",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "trainedModelCID",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "platformWallet",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

// Add private key validation and formatting
const formatPrivateKey = (privateKey) => {
  if (!privateKey) {
    throw new Error('Private key is required');
  }
  
  // Remove '0x' prefix if present
  let cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  
  // Ensure key is 64 characters (32 bytes)
  if (cleanKey.length !== 64) {
    throw new Error('Invalid private key length');
  }
  
  // Add '0x' prefix back
  return '0x' + cleanKey;
};

const FORMATTED_PRIVATE_KEY = formatPrivateKey(PRIVATE_KEY);

const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
const account = web3.eth.accounts.privateKeyToAccount(FORMATTED_PRIVATE_KEY);

web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

// Function to create a job
const createJob = async (_folderName, _folderCID, _metadataCID, _trainingType, _modelType, stakeAmount) => {
    try {
        const tx = contract.methods.createJob(_folderName, _folderCID, _metadataCID, _trainingType, _modelType);
        const nonce = await web3.eth.getTransactionCount(account.address);
        const gas = await tx.estimateGas({ from: account.address, value: stakeAmount });
        const gasPrice = await web3.eth.getGasPrice();

        const data = tx.encodeABI();
        const signedTx = await web3.eth.accounts.signTransaction(
            {
                nonce: nonce,
                from: account.address,
                to: CONTRACT_ADDRESS,
                data,
                value: stakeAmount,
                gas,
                gasPrice
            },
            FORMATTED_PRIVATE_KEY
        );

        return await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    } catch (error) {
        console.error('Error creating job:', error);
        throw error;
    }
};

// Function to accept a job
const acceptJob = async (jobId, commitmentFee) => {
    try {
        const tx = contract.methods.acceptJob(jobId);
        const nonce = await web3.eth.getTransactionCount(account.address);
        const gas = await tx.estimateGas({ 
            from: account.address,
            value: commitmentFee 
        });
        const gasPrice = await web3.eth.getGasPrice();

        const data = tx.encodeABI();
        const signedTx = await web3.eth.accounts.signTransaction(
            {
                nonce: nonce,
                from: account.address,
                to: CONTRACT_ADDRESS,
                data,
                value: commitmentFee,
                gas,
                gasPrice
            },
            FORMATTED_PRIVATE_KEY
        );

        return await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    } catch (error) {
        console.error('Error accepting job:', error);
        throw error;
    }
};

// Function to delete a job
const deleteJob = async (jobId) => {
    try {
        const tx = contract.methods.deleteJob(jobId);
        const nonce = await web3.eth.getTransactionCount(account.address);
        const gas = await tx.estimateGas({ from: account.address });
        const gasPrice = await web3.eth.getGasPrice();

        const data = tx.encodeABI();
        const signedTx = await web3.eth.accounts.signTransaction(
            {
                nonce: nonce,
                from: account.address,
                to: CONTRACT_ADDRESS,
                data,
                gas,
                gasPrice
            },
            FORMATTED_PRIVATE_KEY
        );

        return await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    } catch (error) {
        console.error('Error deleting job:', error);
        throw error;
    }
};

// Function to cancel a job
const cancelJob = async (jobId) => {
    try {
        const tx = contract.methods.cancelJob(jobId);
        const nonce = await web3.eth.getTransactionCount(account.address);
        const gas = await tx.estimateGas({ from: account.address });
        const gasPrice = await web3.eth.getGasPrice();

        const data = tx.encodeABI();
        const signedTx = await web3.eth.accounts.signTransaction(
            {
                nonce: nonce,
                from: account.address,
                to: CONTRACT_ADDRESS,
                data,
                gas,
                gasPrice
            },
            FORMATTED_PRIVATE_KEY
        );

        return await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    } catch (error) {
        console.error('Error canceling job:', error);
        throw error;
    }
};

// Function to complete a job
const completeJob = async (jobId, trainedModelCID) => {
    try {
        const tx = contract.methods.completeJob(jobId, trainedModelCID);
        
        // Get the nonce for the account
        const nonce = await web3.eth.getTransactionCount(account.address);
        
        // Estimate gas with from address
        const gas = await tx.estimateGas({ 
            from: account.address 
        });
        
        const gasPrice = await web3.eth.getGasPrice();

        const data = tx.encodeABI();
        const signedTx = await web3.eth.accounts.signTransaction(
            {
                nonce: nonce,
                from: account.address,
                to: CONTRACT_ADDRESS,
                data,
                gas,
                gasPrice
            },
            FORMATTED_PRIVATE_KEY // Use formatted private key instead of raw PRIVATE_KEY
        );

        return await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    } catch (error) {
        console.error('Error completing job:', error);
        throw error;
    }
};

// Function to get job details
const getJobDetails = async (jobId) => {
    try {
        const job = await contract.methods.getJobDetails(jobId).call();
        return {
            folderName: job[0],
            folderCID: job[1],
            metadataCID: job[2],
            trainingType: job[3],
            modelType: job[4],
            requester: job[5],
            contributor: job[6],
            stakeAmount: web3.utils.fromWei(job[7], 'ether'),
            isCompleted: job[8],
            trainedModelCID: job[9]
        };
    } catch (error) {
        console.error('Error fetching job details:', error);
        throw error;
    }
};

// Add debug logging to help troubleshoot
const debugTransaction = async () => {
    try {
        console.log('Account Address:', account.address);
        console.log('Account Balance:', await web3.eth.getBalance(account.address));
        console.log('Network ID:', await web3.eth.net.getId());
        console.log('Is Connected:', await web3.eth.net.isListening());
    } catch (error) {
        console.error('Debug Error:', error);
    }
};

// Add this line after creating the account
debugTransaction().catch(console.error);

export { createJob, acceptJob, deleteJob, cancelJob, completeJob, getJobDetails };
