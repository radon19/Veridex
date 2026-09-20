// Verify order — must match Lambda: hash -> sig -> holder -> allowlist -> revoked -> expired
export function verifyStatus(
  m: { contentHash: string; appSignatureValid: boolean; holder: string; owner: string; revoked: boolean; expired: boolean; issuerAllowlisted?: boolean },
  actualHash: string,
  ownerOnChain: string
) {
  if (actualHash.toLowerCase() !== m.contentHash.toLowerCase()) return "TAMPERED" as const;
  if (!m.appSignatureValid) return "BAD_SIGNATURE" as const;
  if (m.holder.toLowerCase() !== ownerOnChain.toLowerCase()) return "WRONG_HOLDER" as const;
  if (m.issuerAllowlisted === false) return "UNKNOWN_ISSUER" as const;
  if (m.revoked) return "REVOKED" as const;
  if (m.expired) return "EXPIRED" as const;
  return "MATCH" as const;
}
