// Holder — seal lookup by code, optional address cross-check (no wallet needed)
"use client";
import { useState } from "react";
import { hasApi, getVerify } from "../../lib/api";

export default function Me() {
  const [addr, setAddr] = useState("");
  const [code, setCode] = useState("");
  const [seal, setSeal] = useState<any>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setNote("");
    if (!hasApi()) return setNote("backend not configured — set NEXT_PUBLIC_API");
    setBusy(true);
    try {
      const m = await getVerify(encodeURIComponent(code.trim()));
      if (m.error) return setNote(m.error);
      const a = addr.trim().toLowerCase();
      if (a && m.holder && m.holder.toLowerCase() !== a)
        setNote("this seal belongs to a different wallet");
      setSeal(m);
    } catch {
      setNote("backend unreachable");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-5xl tracking-tight">MY SEALS</h1>

      <input
        className="mt-8 w-full border border-line bg-tile px-4 py-3 font-hash text-sm placeholder:text-dim"
        placeholder="your wallet 0x… (optional cross-check)"
        value={addr}
        onChange={(e) => setAddr(e.target.value)}
      />
      <div className="mt-3 flex gap-3">
        <input
          className="w-full border border-line bg-tile px-4 py-3 font-hash text-sm placeholder:text-dim"
          placeholder="paste your seal code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          onClick={() => void load()}
          disabled={busy}
          className="shrink-0 bg-gold px-6 py-3 font-display text-sm tracking-wide text-ground disabled:opacity-40"
        >
          LOAD
        </button>
      </div>
      {note && <p className="mt-3 text-sm text-gold">{note}</p>}

      {seal && (
        <div className="mt-6 border border-line bg-tile p-5">
          <p className="font-display text-2xl text-teal">{seal.label || "Untitled seal"}</p>
          <p className="mt-2 font-hash text-xs break-all text-dim">
            {seal.status} · holder {seal.holder}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => void navigator.clipboard.writeText(`${location.origin}/verify?code=${seal.docId}`)}
              className="border border-line px-6 py-3 font-display text-sm tracking-wide text-dim hover:border-teal hover:text-ink"
            >
              COPY VERIFY URL
            </button>
            <a
              href={`/files?code=${seal.docId}`}
              className="bg-teal px-6 py-3 font-display text-sm tracking-wide text-ground"
            >
              OPEN FILE
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
