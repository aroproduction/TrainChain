require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const platformWallet = process.env.PLATFORM_WALLET;
  // Get the contract factory
  const Contract = await ethers.getContractFactory("AIModelTraining");

  // Deploy the contract
  const contract = await Contract.deploy(platformWallet);

  // Wait for the contract to be deployed
  await contract.waitForDeployment(); 

  // Get the deployed contract address
  console.log(`Contract deployed at: ${await contract.getAddress()}`);
}

// Run the deployment script
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});