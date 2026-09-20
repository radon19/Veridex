// Site header — logo, nav, global auth (client: session lives in the browser)
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "../../lib/auth";

export function Header() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEmail(sessionStorage.getItem("veridex-email"));
    setReady(true);
  }, []);

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/diagram.svg" alt="Veridex seal" width={40} height={42} />
          <span className="font-display text-xl tracking-tight">VERIDEX</span>
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/issuer" className="text-dim hover:text-ink">Seal</Link>
          <Link href="/verify" className="text-dim hover:text-ink">Verify</Link>
          <Link href="/files" className="text-dim hover:text-ink">Files</Link>
          <Link href="/docs" className="text-dim hover:text-ink">Docs</Link>
          <Link href="/tech" className="text-dim hover:text-ink">Tech</Link>
          <Link href="/me" className="text-dim hover:text-ink">Seals</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {!ready ? null : email ? (
            <>
              <span className="flex items-center gap-2 font-hash text-xs text-teal">
                <span className="inline-block h-2 w-2 rounded-full bg-teal" />
                {email}
              </span>
              <button
                onClick={() => {
                  signOut();
                  sessionStorage.removeItem("veridex-email");
                  setEmail(null);
                }}
                className="bg-gold px-5 py-2 font-display text-xs tracking-wide text-ground"
              >
                SIGN OUT
              </button>
            </>
          ) : (
            <Link
              href="/signin"
              className="bg-gold px-5 py-2 font-display text-xs tracking-wide text-ground"
            >
              SIGN IN
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
