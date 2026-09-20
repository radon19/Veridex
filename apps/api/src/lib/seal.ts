// EIP-712 SealBinding — app key IS Veridex
import { createWalletClient, http, recoverTypedDataAddress, keccak256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const SealTypes = {
  SealBinding: [
    { name: "docId", type: "bytes32" },
    { name: "contentHash", type: "bytes32" },
    { name: "holder", type: "address" },
    { name: "schema", type: "bytes32" },
    { name: "issuedAt", type: "uint64" },
    { name: "expiresAt", type: "uint64" },
    { name: "issuerId", type: "bytes32" },
  ],
} as const;

export type SealParams = {
  docId: `0x${string}`; contentHash: `0x${string}`; holder: `0x${string}`;
  schema: `0x${string}`; issuedAt: bigint; expiresAt: bigint;
  issuerId: `0x${string}`; chainId: number; contract: `0x${string}`;
};

const domain = (p: SealParams) => ({
  name: "Veridex", version: "1", chainId: p.chainId, verifyingContract: p.contract,
});

const message = (p: SealParams) => ({
  docId: p.docId, contentHash: p.contentHash, holder: p.holder,
  schema: p.schema, issuedAt: p.issuedAt, expiresAt: p.expiresAt, issuerId: p.issuerId,
});

// Lambda only — never ship pk to browser
export async function signSeal(p: SealParams, pk: `0x${string}`) {
  const account = privateKeyToAccount(pk);
  const rpc = process.env.CHAIN_RPC || "https://ethereum-sepolia-rpc.publicnode.com";
  const client = createWalletClient({ account, transport: http(rpc) });
  const sig = await client.signTypedData({
    account, domain: domain(p), types: SealTypes, primaryType: "SealBinding", message: message(p),
  });
  return { sig, sigHash: keccak256(sig) };
}

// Browser + Lambda verify
export const recoverSeal = (p: SealParams, sig: `0x${string}`) =>
  recoverTypedDataAddress({
    domain: domain(p), types: SealTypes, primaryType: "SealBinding",
    message: message(p), signature: sig,
  });
