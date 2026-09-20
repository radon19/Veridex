// POST /v1/docs/:id/revoke — DDB + contract.revoke (chain best-effort)
import { ddbRevoke, ddbGet } from "./lib/store";
import { chainReady, revokeToken } from "./lib/chain";

export const revokeDoc = async (docId: string) => {
  const r: any = await ddbGet(`DOC#${docId}`, "META").catch(() => null);
  const tokenId = r?.Item?.tokenId?.S as string | undefined;
  if (tokenId && chainReady()) {
    try { await revokeToken(tokenId); } catch { /* DDB stays truth */ }
  }
  await ddbRevoke(docId);
  return { docId, status: "revoked" };
};
