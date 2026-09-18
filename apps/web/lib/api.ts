// Tiny API client — works with or without backend configured
const BASE = process.env.NEXT_PUBLIC_API ?? "";

export const api = (p: string) => `${BASE}${p}`;
export const hasApi = () => BASE.length > 0;
export const getVerify = (code: string) => fetch(api(`/v1/verify?code=${code}`)).then((r) => r.json());
export const getFileUrl = (id: string) => fetch(api(`/v1/docs/${id}/file`)).then((r) => r.json());

// sha256 of dropped file — Web Crypto only, no Node imports
export async function sha256File(f: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await f.arrayBuffer());
  return "0x" + [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
