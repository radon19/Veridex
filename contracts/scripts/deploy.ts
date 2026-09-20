// Deploy to Sepolia — prints SBT_ADDRESS for Lambda env
import { network } from "hardhat";

async function main() {
  const { viem } = await network.getOrCreate();
  const [minter] = await viem.getWalletClients();
  const base = (process.env.API_BASE_URL || "https://api.example") + "/v1/tokens/";
  const SBT = await viem.deployContract("VeridexSBT", [minter.account.address, base]);
  console.log("SBT_ADDRESS=" + SBT.address);
  console.log("MINTER=" + minter.account.address);
}
main().catch((e) => { console.error(e); process.exit(1); });
