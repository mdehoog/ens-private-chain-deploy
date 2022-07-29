require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("hardhat-abi-exporter");

module.exports = {
  solidity: "0.8.13",
  networks: {
    private: {
      url: process.env.JSON_RPC_URL,
      gasPrice: 20000000000,
      gas: 6000000,
      accounts: [process.env.WALLET_PRIVATE_KEY],
    },
  },
  abiExporter: [
    {
      path: "./abi/json",
      format: "json",
    },
  ],
};
