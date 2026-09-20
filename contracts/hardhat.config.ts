// Hardhat 3 + viem — Sepolia (chainId 11155111)
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";

export default {
  plugins: [hardhatToolboxViemPlugin],
  solidity: "0.8.24",
  networks: {
    sepolia: {
      type: "http",
      url: process.env.CHAIN_RPC || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: process.env.MINTER_PRIVATE_KEY ? [process.env.MINTER_PRIVATE_KEY] : [],
    },
  },
};
