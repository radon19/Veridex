// POST /v1/docs — hash -> sign -> S3 -> DDB -> mint (mint best-effort)
import { sha256Hex, randomDocId, schemaHash } from "./lib/hash";
import { signSeal } from "./lib/seal";
import { ddbPutDoc, s3PutPdf } from "./lib/store";
import { chainReady, mintSeal } from "./lib/chain";
import { validateUpload } from "./docs-post";

const ISSUER_ALLOWLIST = () => (process.env.ISSUER_ALLOWLIST || "").split(",").filter(Boolean);

export const issueDoc = async (o: {
  issuerId: string; holder: string; schema: string; label?: string;
  bytes: Buffer; contentType: string; expiresAt?: bigint;
}) => {
  if (o.schema !== "OfferLetter/v1") return { error: "INVALID_FILE" };
  const v = validateUpload({ contentType: o.contentType, byteLength: o.bytes.length, holder: o.holder, label: o.label });
  if (!v.ok) return { error: v.error };
  if (ISSUER_ALLOWLIST().length && !ISSUER_ALLOWLIST().includes(o.issuerId)) return { error: "UNKNOWN_ISSUER" };
  const contentHash = ("0x" + sha256Hex(o.bytes)) as `0x${string}`;
  const docId = randomDocId() as `0x${string}`;
  const schema = schemaHash() as `0x${string}`;
  const issuedAt = BigInt(Math.floor(Date.now() / 1000));
  const expiresAt = o.expiresAt ?? 0n;
  const issuerId = ("0x" + Buffer.from(o.issuerId).toString("hex").padEnd(64, "0").slice(0, 64)) as `0x${string}`;
  // Sign binding with app key — only Lambda ever sees pk
  const pk = process.env.APP_SIGNER_PRIVATE_KEY as `0x${string}`;
  const chainId = Number(process.env.CHAIN_ID || 11155111);
  const contract = (process.env.SBT_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;
  const { sig, sigHash } = await signSeal({
    docId, contentHash, holder: v.holder, schema, issuedAt, expiresAt, issuerId,
    chainId, contract,
  }, pk);
  const s3Key = `docs/${o.issuerId}/${docId}.pdf`;
  await s3PutPdf(s3Key, o.bytes); // private bucket
  // Mint SBT; chain slip keeps DDB as truth (spec fallback)
  let tokenId: string | null = null;
  if (chainReady()) {
    try {
      ({ tokenId } = await mintSeal({ to: v.holder, docId, contentHash, schema, expiresAt, sigHash: sigHash as `0x${string}` }));
    } catch { tokenId = null; }
  }
  await ddbPutDoc({
    pk: `DOC#${docId}`, sk: "META", issuerId: o.issuerId, holderAddress: v.holder,
    schema: o.schema, label: o.label || "", contentHash, s3Key, status: "issued",
    createdAt: String(issuedAt), expiresAt: String(expiresAt),
    contentType: o.contentType, byteLength: o.bytes.length,
    appSignature: sig, appSignerAddress: process.env.APP_SIGNER_ADDRESS, sigHash,
    sealSchema: schema, sealIssuerId: issuerId, sealIssuedAt: String(issuedAt),
    sealExpiresAt: String(expiresAt), sealChainId: String(chainId), sealContract: contract,
    ...(tokenId ? { tokenId } : {}),
  });
  return { docId, contentHash, sigHash, tokenId };
};
