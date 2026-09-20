// Files — live 90-second official preview, separate from verify
"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { hasApi, getFileUrl } from "../../lib/api";
import { idToken, authHeader } from "../../lib/auth";

export default function Files() {
  return (
    <Suspense>
      <FilesBody />
    </Suspense>
  );
}

function FilesBody() {
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [left, setLeft] = useState(0); // seconds remaining on the URL
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setLogged(Boolean(idToken()));
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const load = async (c?: string) => {
    const q = (c ?? code).trim();
    if (!q) return;
    setCode(q);
    setNote("");
    setUrl(null);
    if (!idToken()) return setNote("sign in from the header first");
    if (!hasApi()) return setNote("backend not configured — set NEXT_PUBLIC_API");
    setBusy("fetching 90-second preview…");
    try {
      const f = await getFileUrl(encodeURIComponent(q), authHeader());
      if (!f.url) {
        if (f.error === "FORBIDDEN") return setNote("sign in first — preview needs a login");
        return setNote(f.message ? `denied: ${f.message} — sign in again, tokens expire hourly` : "preview denied — sign in again");
      }
      const secs = f.exp ?? 90;
      setUrl(f.url);
      try {
        sessionStorage.setItem("veridex-preview", JSON.stringify({ code: q, url: f.url, exp: Date.now() + secs * 1000 }));
      } catch { /* private mode: preview works, persistence skipped */ }
      startCountdown(secs);
    } catch {
      setNote("backend unreachable");
    } finally {
      setBusy(null);
    }
  };

  // Shared ?code= links (e.g. from Seals) resolve on arrival,
  // otherwise restore an unexpired preview from this tab
  useEffect(() => {
    const q = params.get("code");
    if (q) {
      void load(q);
      return;
    }
    try {
      const raw = sessionStorage.getItem("veridex-preview");
      if (!raw) return;
      const saved = JSON.parse(raw);
      const leftMs = saved.exp - Date.now();
      if (!saved.url || leftMs <= 0) {
        sessionStorage.removeItem("veridex-preview");
        return;
      }
      setCode(saved.code || "");
      setUrl(saved.url);
      startCountdown(Math.ceil(leftMs / 1000));
    } catch { /* corrupted cache: start clean */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCountdown = (secs: number) => {
    setLeft(secs);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          if (timer.current) clearInterval(timer.current);
          setUrl(null);
          sessionStorage.removeItem("veridex-preview");
          setNote("preview expired — load again for a fresh 90 seconds");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-5xl tracking-tight">FILES</h1>
      <p className="mt-3 text-dim">The official document, live for 90 seconds. Then the link dies.</p>

      {!logged ? (
        <div className="mt-8 border border-line bg-tile p-5">
          <p className="text-sm text-dim">
            Preview needs a signed-in account.{" "}
            <a href="/signin?next=/files" className="text-teal">Go to sign in →</a>
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex gap-3">
        <input
          className="w-full border border-line bg-tile px-4 py-3 font-hash text-sm placeholder:text-dim"
          placeholder="paste seal code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          onClick={() => void load()}
          disabled={busy !== null}
          className="shrink-0 bg-gold px-6 py-3 font-display text-sm tracking-wide text-ground disabled:opacity-40"
        >
          PREVIEW
        </button>
      </div>
      {note && <p className="mt-3 text-sm text-gold">{note}</p>}
      {busy && <p className="mt-3 animate-pulse font-hash text-sm text-teal">…{busy}</p>}

      {url && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-4">
            <p className="font-hash text-sm text-teal">live — dies in {left}s</p>
            <button
              onClick={() => void navigator.clipboard.writeText(url)}
              className="border border-line px-4 py-2 font-display text-xs tracking-wide text-dim hover:border-teal hover:text-ink"
            >
              COPY FILE ADDRESS
            </button>
          </div>
          <iframe src={url} title="official document preview" className="mt-3 h-[70vh] w-full border border-line bg-tile" />
        </div>
      )}
    </main>
  );
}
