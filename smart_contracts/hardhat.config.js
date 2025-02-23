require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    polygonAmoy: {
      url: process.env.AMOY_RPC_URL, // Your Alchemy RPC URL
      accounts: [process.env.PRIVATE_KEY], // Uses the private key from .env file
    },
  },
  paths: {
    artifacts:"./artifacts"
  }
};