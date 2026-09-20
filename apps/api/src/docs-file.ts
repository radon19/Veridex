// GET /v1/docs/:id/file — 90s presign, no bytes in API
import { ddbGet, presignGet, presignTtl } from "./lib/store";

export const fileUrl = async (docId: string) => {
  const r: any = await ddbGet(`DOC#${docId}`, "META");
  const item = r.Item;
  if (!item) return { error: "NOT_FOUND" };
  const s3Key = item.s3Key.S;
  const url = await presignGet(s3Key); // never log this
  return { url, exp: presignTtl(), contentHash: item.contentHash.S };
};
