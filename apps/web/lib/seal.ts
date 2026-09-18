// Browser EIP-712 recover — proves Veridex signed it
import { recoverTypedDataAddress } from "viem";

export const recoverSeal = (p: any, sig: `0x${string}`) =>
  recoverTypedDataAddress({
    domain: { name: "Veridex", version: "1", chainId: p.chainId, verifyingContract: p.contract },
    types: { SealBinding: [
      { name: "docId", type: "bytes32" }, { name: "contentHash", type: "bytes32" },
      { name: "holder", type: "address" }, { name: "schema", type: "bytes32" },
      { name: "issuedAt", type: "uint64" }, { name: "expiresAt", type: "uint64" },
      { name: "issuerId", type: "bytes32" },
    ]},
    primaryType: "SealBinding",
    message: { docId: p.docId, contentHash: p.contentHash, holder: p.holder, schema: p.schema, issuedAt: p.issuedAt, expiresAt: p.expiresAt, issuerId: p.issuerId },
    signature: sig,
  });
