// Holder — RainbowKit connect, seal lookup by code (basic, no styling yet)
"use client";
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { hasApi, getVerify } from "../../lib/api";

export default function Me() {
  const { address, isConnected } = useAccount();
  const [code, setCode] = useState("");
  const [seal, setSeal] = useState<any>(null);
  const [note, setNote] = useState("");

  const load = async () => {
    setNote("");
    if (!hasApi()) return setNote("backend not configured — set NEXT_PUBLIC_API");
    try {
      const m = await getVerify(encodeURIComponent(code.trim()));
      if (m.error) return setNote(m.error);
      if (m.holder && address && m.holder.toLowerCase() !== address.toLowerCase())
        setNote("this seal belongs to a different wallet");
      setSeal(m);
    } catch {
      setNote("backend unreachable");
    }
  };

  return (
    <main style={{ padding: 32, maxWidth: 640, margin: "0 auto" }}>
      <h1>My seals</h1>
      <div style={{ marginTop: 16 }}><ConnectButton showBalance={false} /></div>
      {isConnected && <p>connected {address}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input style={{ border: "1px solid #ccc", padding: 12, width: "100%" }} placeholder="paste your seal code" value={code} onChange={(e) => setCode(e.target.value)} />
        <button onClick={() => void load()}>Load</button>
      </div>
      {note && <p>{note}</p>}
      {seal && (
        <div style={{ border: "1px solid #ccc", padding: 16, marginTop: 16 }}>
          <p>{seal.schema} · {seal.status} · holder {seal.holder}</p>
          <button onClick={() => void navigator.clipboard.writeText(`${location.origin}/verify?code=${seal.docId}`)}>copy verify URL</button>
        </div>
      )}
    </main>
  );
}
