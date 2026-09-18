// Verifier — paste code, drop forwarded PDF, huge result (basic, no styling yet)
"use client";
import { useState } from "react";
import { verifyStatus } from "../../lib/verify";
import { hasApi, getVerify, sha256File } from "../../lib/api";

export default function Verify() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState("—");
  const [meta, setMeta] = useState<any>(null);
  const [note, setNote] = useState("");

  const lookup = async () => {
    setNote("");
    if (!hasApi()) return setNote("backend not configured — set NEXT_PUBLIC_API");
    try {
      const m = await getVerify(encodeURIComponent(code.trim()));
      setMeta(m);
      setResult(m.error ?? String(m.status ?? "—").toUpperCase());
    } catch {
      setNote("backend unreachable");
    }
  };

  const onDrop = async (f: File) => {
    if (!meta || meta.error) return setNote("lookup a code first, then drop the PDF");
    const actual = await sha256File(f);
    setResult(verifyStatus({
      contentHash: meta.contentHash,
      appSignatureValid: true, // full sig-recover wired once API returns binding fields
      holder: meta.holder, owner: meta.holder,
      revoked: meta.status === "revoked", expired: meta.status === "expired",
    }, actual, meta.holder));
  };

  return (
    <main style={{ padding: 32, maxWidth: 640, margin: "0 auto" }}>
      <h1>Verify</h1>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input style={{ border: "1px solid #ccc", padding: 12, width: "100%" }} placeholder="paste address or code" value={code} onChange={(e) => setCode(e.target.value)} />
        <button onClick={lookup}>Check</button>
      </div>
      {note && <p>{note}</p>}
      {meta && !meta.error && <p>signedBy {meta.signedBy} · {meta.schema} · {meta.status}</p>}
      <div
        style={{ border: "2px dashed #999", padding: 32, marginTop: 16 }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void onDrop(f); }}
      >
        drop forwarded PDF here (or <input type="file" accept="application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onDrop(f); }} />)
      </div>
      <div style={{ fontSize: 72, fontWeight: 900 }}>{result}</div>
    </main>
  );
}
