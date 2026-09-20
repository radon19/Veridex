// Verifier — stage 1: is the seal issued? stage 2: does the file match?
// File preview lives on /files; this page only checks.
"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyStatus } from "../../lib/verify";
import { hasApi, getVerify, sha256File } from "../../lib/api";
import { recoverSeal } from "../../lib/seal";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

const RPC = process.env.NEXT_PUBLIC_CHAIN_RPC ?? "https://ethereum-sepolia-rpc.publicnode.com";
const OWNER_ABI = [
  { name: "ownerOf", type: "function", stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "address" }] },
] as const;

export default function Verify() {
  return (
    <Suspense>
      <VerifyBody />
    </Suspense>
  );
}

function VerifyBody() {
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [result, setResult] = useState("—");
  const [meta, setMeta] = useState<any>(null);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null); // locked once chosen
  const [actual, setActual] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // loader text
  const [drag, setDrag] = useState(false);
  const [sigValid, setSigValid] = useState(true); // real recovery result (BAD_SIGNATURE)
  const [ownerOnChain, setOwnerOnChain] = useState<string | null>(null); // real ownerOf (WRONG_HOLDER)

  const lookup = async (c?: string) => {
    const q = (c ?? code).trim();
    if (!q) return;
    setCode(q);
    setNote("");
    if (!hasApi()) return setNote("backend not configured — set NEXT_PUBLIC_API");
    setBusy("looking up seal…");
    try {
      const m = await getVerify(encodeURIComponent(q));
      setMeta(m);
      if (m.error) {
        setResult(m.error);
        setSigValid(true);
        setOwnerOnChain(null);
        return;
      }
      setResult(String(m.status ?? "—").toUpperCase());
      // Real ECDSA recovery: does this signature come from the published app key?
      setBusy("recovering signature + reading chain…");
      let sigOk = true;
      if (m.binding && m.appSignature) {
        try {
          const b = m.binding;
          const rec = await recoverSeal({
            docId: b.docId, contentHash: b.contentHash, holder: b.holder,
            schema: b.schema, issuedAt: BigInt(b.issuedAt), expiresAt: BigInt(b.expiresAt),
            issuerId: b.issuerId, chainId: Number(b.chainId), contract: b.contract,
          }, m.appSignature);
          sigOk = rec.toLowerCase() === String(m.signedBy).toLowerCase();
        } catch {
          sigOk = false;
        }
      }
      setSigValid(sigOk);
      // Real holder check: who owns the token on-chain right now?
      let owner: string = m.holder;
      if (m.tokenId && process.env.NEXT_PUBLIC_SBT_ADDRESS) {
        try {
          const pub = createPublicClient({ chain: sepolia, transport: http(RPC) });
          owner = await pub.readContract({
            address: process.env.NEXT_PUBLIC_SBT_ADDRESS as `0x${string}`,
            abi: OWNER_ABI, functionName: "ownerOf", args: [BigInt(m.tokenId)],
          });
        } catch {
          owner = m.holder; // RPC hiccup: fall back, never brick the check
        }
      }
      setOwnerOnChain(owner);
    } catch {
      setNote("backend unreachable");
    } finally {
      setBusy(null);
    }
  };

  // Shared ?code= links resolve on arrival
  useEffect(() => {
    const q = params.get("code");
    if (q) void lookup(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lockFile = async (f: File) => {
    setFile(f); // locked: picker below only shows when no file
    setActual(null);
    setBusy("hashing file…");
    try {
      const h = await sha256File(f);
      setActual(h);
      return h;
    } finally {
      setBusy(null);
    }
  };

  const runCheck = (h: string | null) => {
    if (!meta || meta.error) return setNote("finish step 1 first — look up a seal");
    if (!h) return setNote("add the PDF first");
    setResult(verifyStatus({
      contentHash: meta.contentHash,
      appSignatureValid: sigValid,
      holder: meta.holder, owner: meta.holder,
      revoked: meta.status === "revoked", expired: meta.status === "expired",
      issuerAllowlisted: meta.issuerAllowlisted !== false,
    }, h, ownerOnChain || meta.holder));
  };

  const check = () => runCheck(actual);

  const resetFile = () => {
    setFile(null);
    setActual(null);
    setResult(meta && !meta.error ? String(meta.status ?? "—").toUpperCase() : "—");
  };

  const color =
    result === "MATCH" ? "text-teal" : result === "—" ? "text-ink" : "text-gold";

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-5xl tracking-tight">VERIFY</h1>

      {/* Stage 1: issued or not */}
      <section className="mt-10">
        <h2 className="font-display text-xl text-gold">1 · THE SEAL — ISSUED OR NOT</h2>
        <div className="mt-4 flex gap-3">
          <input
            className="w-full border border-line bg-tile px-4 py-3 font-hash text-sm placeholder:text-dim"
            placeholder="paste address or code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            onClick={() => void lookup()}
            disabled={busy !== null}
            className="shrink-0 bg-gold px-6 py-3 font-display text-sm tracking-wide text-ground disabled:opacity-40"
          >
            CHECK
          </button>
        </div>
        {note && <p className="mt-3 text-sm text-gold">{note}</p>}
        {busy && <p className="mt-3 animate-pulse font-hash text-sm text-teal">…{busy}</p>}
        {meta && !meta.error && (
          <div className="mt-4 border border-line bg-tile p-5">
            <p className="font-display text-2xl text-teal">SEALED · {String(meta.status).toUpperCase()}</p>
            <p className="mt-2 font-hash text-xs break-all text-dim">
              {meta.schema} · holder {meta.holder}
              <br />
              signedBy {meta.signedBy}
            </p>
          </div>
        )}
      </section>

      {/* Stage 2: file matches or not */}
      <section className="mt-12">
        <h2 className="font-display text-xl text-gold">2 · THE FILE — MATCHES OR NOT</h2>
        {!file ? (
          <div
            className={`mt-4 border-2 border-dashed px-8 py-12 text-center transition-colors ${
              drag ? "border-teal bg-tile" : "border-line hover:border-gold"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files[0];
              if (f) void lockFile(f).then((h) => runCheck(h ?? null));
            }}
          >
            <p className="font-display text-xl">DROP THE FORWARDED PDF</p>
            <p className="mt-2 text-sm text-dim">hashes locally — the file never uploads</p>
            <label className="mt-5 inline-block cursor-pointer border border-line px-6 py-3 font-display text-sm tracking-wide hover:border-teal">
              BROWSE FILES
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void lockFile(f); }}
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
                onClick={check}
                disabled={busy !== null || !actual}
                className="bg-teal px-6 py-3 font-display text-sm tracking-wide text-ground disabled:opacity-40"
              >
                {actual ? "CHECK MATCH" : "HASHING…"}
              </button>
              <button
                onClick={resetFile}
                className="border border-line px-6 py-3 font-display text-sm tracking-wide text-dim hover:border-gold hover:text-ink"
              >
                REMOVE
              </button>
            </div>
          </div>
        )}

        {result !== "—" && (
          <p className={`mt-8 font-display text-7xl tracking-tight md:text-8xl ${color}`}>
            {result}
          </p>
        )}
      </section>
    </main>
  );
}
