// Issuer — upload PDF + holder (auth lives in the header)
"use client";
import { useState } from "react";
import Link from "next/link";
import { hasApi, api, sha256File } from "../../lib/api";
import { authHeader } from "../../lib/auth";

export default function Issuer() {
  const [holder, setHolder] = useState("");
  const [label, setLabel] = useState(""); // human title, DDB only, never on-chain
  const [file, setFile] = useState<File | null>(null); // locked once chosen
  const [msg, setMsg] = useState("");
  const [docId, setDocId] = useState(""); // copyable: 66 hex chars, never hand-type
  const [busy, setBusy] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [revokeCode, setRevokeCode] = useState("");

  const revoke = async () => {
    const id = revokeCode.trim();
    if (!id) return setMsg("paste a seal code to revoke");
    setBusy("revoking…");
    try {
      const r = await fetch(api(`/v1/docs/${encodeURIComponent(id)}/revoke`), {
        method: "POST",
        headers: authHeader(),
      });
      if (r.status === 403) return setMsg("not signed in — sign in from the header first");
      const j = await r.json();
      setMsg(j.status === "revoked" ? `revoked ${j.docId}` : `backend said: ${await JSON.stringify(j)}`);
    } catch {
      setMsg("backend unreachable");
    } finally {
      setBusy(null);
    }
  };

  const pick = (f: File) => {
    setFile(f);
    setDocId("");
    setMsg("");
  };

  const issue = async () => {
    if (!file) return setMsg("pick a PDF first");
    if (!/^0x[0-9a-fA-F]{40}$/.test(holder.trim())) return setMsg("holder must be 0x + 40 hex chars");
    if (file.type !== "application/pdf") return setMsg("only application/pdf");
    if (file.size > 8 * 1024 * 1024) return setMsg("max 8MB");
    setBusy("hashing file…");
    const hash = await sha256File(file);
    if (!hasApi()) { setBusy(null); return setMsg(`local sha256 ${hash} (backend not configured)`); }
    setBusy("sealing… (Sepolia receipt takes seconds)");
    try {
      // Base64 JSON upload: byte-exact through API Gateway, no binary config needed
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",", 2)[1] || "");
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const r = await fetch(api("/v1/docs"), {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeader() },
        body: JSON.stringify({ holderAddress: holder.trim(), schema: "OfferLetter/v1", label: label.trim(), contentType: file.type, fileBase64 }),
      });
      if (r.ok) {
        const j = await r.json();
        setDocId(j.docId);
        setMsg(`issued ${j.docId} · hash ${hash}`);
      } else if (r.status === 403) {
        setDocId("");
        setMsg("not signed in — sign in from the header, then Seal again");
      } else {
        setDocId("");
        setMsg(`backend said: ${await r.text()}`);
      }
    } catch {
      setDocId("");
      setMsg(`local sha256 ${hash} (backend unreachable)`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-5xl tracking-tight">ISSUE SEAL</h1>

      <input
        className="mt-8 w-full border border-line bg-tile px-4 py-3 font-hash text-sm placeholder:text-dim"
        placeholder="holder must be a valid 0x address"
        value={holder}
        onChange={(e) => setHolder(e.target.value)}
      />
      <input
        className="mt-3 w-full border border-line bg-tile px-4 py-3 font-hash text-sm placeholder:text-dim"
        placeholder="certificate title, e.g. SDE Intern — Acme (no names, no salary)"
        value={label}
        maxLength={80}
        onChange={(e) => setLabel(e.target.value)}
      />

      {!file ? (
        <div
          className={`mt-4 border-2 border-dashed px-8 py-10 text-center transition-colors ${
            drag ? "border-teal bg-tile" : "border-line hover:border-gold"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f) pick(f);
          }}
        >
          <p className="font-display text-xl">DROP THE OFFICIAL PDF</p>
          <p className="mt-2 text-sm text-dim">PDF only · max 8MB</p>
          <label className="mt-5 inline-block cursor-pointer border border-line px-6 py-3 font-display text-sm tracking-wide hover:border-teal">
            BROWSE FILES
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }}
            />
          </label>
        </div>
      ) : (
        <div className="mt-4 border border-line bg-tile p-5">
          <p className="font-hash text-sm break-all">
            locked: {file.name}{" "}
            <span className="text-dim">({Math.round(file.size / 1024)} KB)</span>
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => void issue()}
              disabled={busy !== null}
              className="bg-gold px-6 py-3 font-display text-sm tracking-wide text-ground disabled:opacity-40"
            >
              {busy ? "WORKING…" : "SEAL PDF"}
            </button>
            <button
              onClick={() => { setFile(null); setDocId(""); setMsg(""); }}
              className="border border-line px-6 py-3 font-display text-sm tracking-wide text-dim hover:border-gold hover:text-ink"
            >
              REMOVE
            </button>
          </div>
        </div>
      )}

      {busy && <p className="mt-4 animate-pulse font-hash text-sm text-teal">…{busy}</p>}
      <div className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-xl text-gold">REVOKE A SEAL</h2>
        <div className="mt-4 flex gap-3">
          <input
            className="w-full border border-line bg-tile px-4 py-3 font-hash text-sm placeholder:text-dim"
            placeholder="paste seal code to kill it"
            value={revokeCode}
            onChange={(e) => setRevokeCode(e.target.value)}
          />
          <button
            onClick={() => void revoke()}
            disabled={busy !== null}
            className="shrink-0 border border-gold px-6 py-3 font-display text-sm tracking-wide text-gold hover:bg-gold hover:text-ground disabled:opacity-40"
          >
            REVOKE
          </button>
        </div>
      </div>
      {msg && <p className="mt-4 font-hash text-sm break-all">{msg}</p>}
      {msg.startsWith("not signed in") && (
        <p className="mt-2 text-sm">
          <Link href="/signin?next=/issuer" className="text-teal">Go to sign in →</Link>
        </p>
      )}
      {docId && (
        <div className="mt-2 flex gap-3">
          <button
            onClick={() => void navigator.clipboard.writeText(docId)}
            className="border border-line px-6 py-3 font-display text-sm tracking-wide text-dim hover:border-teal hover:text-ink"
          >
            COPY DOCID
          </button>
          <button
            onClick={() => window.open(`/verify?code=${docId}`, "_blank", "noopener")}
            className="bg-teal px-6 py-3 font-display text-sm tracking-wide text-ground"
          >
            OPEN VERIFY LINK
          </button>
        </div>
      )}
    </main>
  );
}
