// sha256 of exact PDF bytes — integrity check
import { createHash, randomBytes } from "crypto";

export const sha256Hex = (b: Buffer) =>
  createHash("sha256").update(b).digest("hex");

export const randomDocId = () => "0x" + randomBytes(32).toString("hex");
export const schemaHash = () =>
  "0x" + createHash("sha256").update("OfferLetter/v1").digest("hex"); // demo: sha256 stands in for keccak
