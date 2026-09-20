// Sign in — one account seals and views (dual-group member)
"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cognitoReady, signIn } from "../../lib/auth";

export default function SignIn() {
  return (
    <Suspense>
      <SignInBody />
    </Suspense>
  );
}

function SignInBody() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/issuer";
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async () => {
    setMsg("");
    setBusy(true);
    try {
      await signIn(email.trim(), pw);
      sessionStorage.setItem("veridex-email", email.trim());
      router.push(next);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-5xl tracking-tight">SIGN IN</h1>
      <p className="mt-3 text-dim">One account seals documents and opens previews.</p>
      <input
        className="mt-8 w-full border border-line bg-tile px-4 py-3 font-hash text-sm placeholder:text-dim"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="mt-3 w-full border border-line bg-tile px-4 py-3 font-hash text-sm placeholder:text-dim"
        placeholder="password"
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />
      <button
        onClick={() => void login()}
        disabled={!cognitoReady() || busy}
        className="mt-4 w-full bg-gold px-6 py-3 font-display text-sm tracking-wide text-ground disabled:opacity-40"
      >
        {busy ? "SIGNING IN…" : "SIGN IN"}
      </button>
      {!cognitoReady() && <p className="mt-3 text-sm text-gold">set NEXT_PUBLIC_COGNITO_POOL/CLIENT first</p>}
      {msg && <p className="mt-3 text-sm text-gold">{msg}</p>}
      <p className="mt-6 text-sm text-dim">
        No account? One is created for you at demo time — <Link href="/docs" className="text-teal">how it works</Link>.
      </p>
    </main>
  );
}
