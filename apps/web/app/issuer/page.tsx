// Issuer — local hash preview now, API submit when configured (basic, no styling yet)
"use client";
import { useState } from "react";
import { hasApi, api, sha256File } from "../../lib/api";

export default function Issuer() {
  const [holder, setHolder] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");

  const issue = async () => {
    if (!file) return setMsg("pick a PDF first");
    if (!/^0x[0-9a-fA-F]{40}$/.test(holder.trim())) return setMsg("holder must be 0x + 40 hex chars");
    if (file.type !== "application/pdf") return setMsg("only application/pdf");
    if (file.size > 8 * 1024 * 1024) return setMsg("max 8MB");
    const hash = await sha256File(file);
    if (!hasApi()) return setMsg(`local sha256 ${hash} (backend not configured)`);
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("holderAddress", holder.trim()); fd.append("schema", "OfferLetter/v1");
      const r = await fetch(api("/v1/docs"), { method: "POST", body: fd });
      setMsg(r.ok ? `issued ${(await r.json()).docId} · hash ${hash}` : `backend said: ${await r.text()}`);
    } catch {
      setMsg(`local sha256 ${hash} (backend unreachable)`);
    }
  };

  return (
    <main style={{ padding: 32, maxWidth: 640, margin: "0 auto" }}>
      <h1>Issue seal</h1>
      <input style={{ border: "1px solid #ccc", padding: 12, width: "100%", marginTop: 16 }} placeholder="holder 0x..." value={holder} onChange={(e) => setHolder(e.target.value)} />
      <input style={{ marginTop: 12 }} type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <div style={{ marginTop: 12 }}><button onClick={() => void issue()}>Seal PDF</button></div>
      <p>{msg}</p>
    </main>
  );
}
