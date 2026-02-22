require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",

  networks: {
    // ── Local Ganache ─────────────────────────────────────────────────────────
    localhost: {
      url: "http://127.0.0.1:7545",   // Ganache GUI default
      // accounts are auto-imported from Ganache; or use:
      // accounts: [process.env.GANACHE_PRIVATE_KEY]
      chainId: 1337,
    },

    // ── Ganache CLI (alternative — different default port) ───────────────────
    ganache: {
      url: "http://127.0.0.1:8545",   // ganache CLI default
      accounts: process.env.GANACHE_PRIVATE_KEY
        ? [process.env.GANACHE_PRIVATE_KEY]
        : [],
      chainId: 1337,
    },

    // ── Polygon Amoy Testnet ──────────────────────────────────────────────────
    polygonAmoy: {
      url: process.env.AMOY_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80002,
    },
  },

  paths: {
    artifacts: "./artifacts",
  },
};