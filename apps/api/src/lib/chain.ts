// Chain calls — minter wallet only. Best-effort: DDB stays source of truth if chain slips.
import { createWalletClient, createPublicClient, http, parseEventLogs } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const SBT_ABI = [
  { name: "seal", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }, { name: "docId", type: "bytes32" },
      { name: "contentHash", type: "bytes32" }, { name: "schema", type: "bytes32" },
      { name: "expiresAt", type: "uint64" }, { name: "sigHash", type: "bytes32" }],
    outputs: [{ name: "tokenId", type: "uint256" }] },
  { name: "revoke", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }], outputs: [] },
  { name: "Sealed", type: "event",
    inputs: [{ name: "to", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true },
      { name: "docId", type: "bytes32" }, { name: "contentHash", type: "bytes32" },
      { name: "schema", type: "bytes32" }, { name: "sigHash", type: "bytes32" }] },
] as const;

const rpc = () => process.env.CHAIN_RPC || "https://ethereum-sepolia-rpc.publicnode.com";
const sbt = () => process.env.SBT_ADDRESS as `0x${string}`;

// Skip chain when keys/addresses missing (local dev, pre-deploy)
export const chainReady = () => Boolean(process.env.MINTER_PRIVATE_KEY && process.env.SBT_ADDRESS);

const wallet = () => {
  const account = privateKeyToAccount(process.env.MINTER_PRIVATE_KEY as `0x${string}`);
  return createWalletClient({ account, chain: sepolia, transport: http(rpc()) });
};
const pub = () => createPublicClient({ chain: sepolia, transport: http(rpc()) });

export async function mintSeal(o: {
  to: `0x${string}`; docId: `0x${string}`; contentHash: `0x${string}`;
  schema: `0x${string}`; expiresAt: bigint; sigHash: `0x${string}`;
}) {
  const c = wallet();
  const txHash = await c.writeContract({
    address: sbt(), abi: SBT_ABI, functionName: "seal",
    args: [o.to, o.docId, o.contentHash, o.schema, o.expiresAt, o.sigHash],
  });
  const receipt = await pub().waitForTransactionReceipt({ hash: txHash });
  const logs = parseEventLogs({ abi: SBT_ABI, logs: receipt.logs, eventName: "Sealed" });
  return { txHash, tokenId: logs[0]?.args.tokenId?.toString() ?? null };
}

export async function revokeToken(tokenId: string) {
  return wallet().writeContract({
    address: sbt(), abi: SBT_ABI, functionName: "revoke", args: [BigInt(tokenId)],
  });
}
