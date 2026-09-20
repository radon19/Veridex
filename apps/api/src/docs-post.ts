// Upload validation + Cognito group check (fail-closed, in Lambda not just UI)
import { isAddress, getAddress } from "viem";

export function validateUpload(o: { contentType: string; byteLength: number; holder: string; label?: string }) {
  if (o.contentType !== "application/pdf") return { ok: false as const, error: "INVALID_FILE" };
  if (o.byteLength > 8 * 1024 * 1024) return { ok: false as const, error: "INVALID_FILE" };
  if (!isAddress(o.holder)) return { ok: false as const, error: "INVALID_FILE" };
  // Human title only: short, printable, no PII promises — stored in DDB, never on-chain
  if (o.label !== undefined && (!/^[\x20-\x7E]{1,80}$/.test(o.label))) return { ok: false as const, error: "INVALID_FILE" };
  return { ok: true as const, holder: getAddress(o.holder) };
}

// Reads API GW Cognito-authorizer claims. Returns sub or null (no fallback — deny).
export function requireGroup(event: any, group: "issuer" | "verifier"): string | null {
  const claims = event?.requestContext?.authorizer?.claims;
  if (!claims?.sub) return null;
  const raw = claims["cognito:groups"];
  const groups = Array.isArray(raw) ? raw : String(raw || "").split(/[,\s]+/).filter(Boolean);
  if (!groups.includes(group)) return null;
  return claims.sub as string;
}
