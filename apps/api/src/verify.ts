// GET /v1/verify + GET /v1/docs/:id — metadata only, no file bytes
import { ddbGet } from "./lib/store";

const ALLOWLIST = () => (process.env.ISSUER_ALLOWLIST || "").split(",").filter(Boolean);

export const getVerify = async (code: string) => {
  const r: any = await ddbGet(`DOC#${code}`, "META");
  const m = r.Item;
  if (!m) return { error: "NOT_FOUND" };
  const now = Math.floor(Date.now() / 1000);
  const expired = m.expiresAt?.S !== "0" && Number(m.expiresAt.S) < now;
  const allow = ALLOWLIST();
  return {
    docId: code, holder: m.holderAddress.S, schema: m.schema.S,
    label: m.label?.S || "", contentHash: m.contentHash.S, appSignature: m.appSignature.S,
    signedBy: m.appSignerAddress.S, issuerId: m.issuerId.S,
    issuerAllowlisted: allow.length === 0 || allow.includes(m.issuerId.S),
    // Exact bytes the app key signed — browser recovers these (BAD_SIGNATURE).
    // Old seals lack them -> client keeps previous assume-valid behavior.
    binding: m.sealSchema?.S ? {
      docId: code, contentHash: m.contentHash.S, holder: m.holderAddress.S,
      schema: m.sealSchema.S, issuedAt: m.sealIssuedAt?.S || m.createdAt?.S || "0",
      expiresAt: m.sealExpiresAt?.S || m.expiresAt?.S || "0",
      issuerId: m.sealIssuerId.S,
      chainId: Number(m.sealChainId?.S || process.env.CHAIN_ID || 11155111),
      contract: m.sealContract?.S || process.env.SBT_ADDRESS,
    } : null,
    status: m.status.S === "revoked" ? "revoked" : expired ? "expired" : "issued",
    tokenId: m.tokenId?.S, createdAt: m.createdAt?.S, expiresAt: m.expiresAt?.S,
  };
};
