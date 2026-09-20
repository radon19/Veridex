// GET /v1/tokens/:id — ERC-721 JSON, never S3 URL
import { ddbGet } from "./lib/store";

export const tokenJson = async (tokenId: string) => {
  // Weekend: tokenId == docId mapping stored in DDB; replace with tokenOfDoc after mint
  const v: any = await ddbGet(`DOC#${tokenId}`, "META");
  const m = v.Item;
  if (!m) return { error: "NOT_FOUND" };
  return {
    name: `Veridex Seal #${tokenId}`,
    description: "Soulbound seal. File stays off-chain in private S3.",
    external_url: `${process.env.WEB_BASE_URL}/verify?code=${tokenId}`,
    attributes: [
      { trait_type: "schema", value: m.schema.S },
      { trait_type: "contentHash", value: m.contentHash.S },
      { trait_type: "sigHash", value: m.sigHash.S },
    ],
  };
};
