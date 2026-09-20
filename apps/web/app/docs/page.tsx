import Link from "next/link";

export const metadata = {
  title: "Docs — how Veridex works",
  description: "What Veridex seals, why the seal holds, and where it admits limits.",
};

const sections = ["what", "why", "workflow", "aws", "limits"];

export default function Docs() {
  return (
    <main className="mx-auto max-w-6xl gap-10 px-6 py-16 md:grid md:grid-cols-[200px_1fr]">
      <aside className="mb-10 md:mb-0">
        <nav className="flex gap-4 font-hash text-xs md:sticky md:top-8 md:flex-col">
          {sections.map((s) => (
            <a key={s} href={`#${s}`} className="text-dim hover:text-teal">
              /{s}
            </a>
          ))}
        </nav>
      </aside>

      <article className="max-w-2xl">
        <h1 className="font-display text-5xl tracking-tight">HOW THE SEAL WORKS</h1>
        <p className="mt-4 text-lg text-dim">
          The full mechanism, the reasons it holds, and the limits it admits.
          Everything below maps to a check you can run on{" "}
          <Link href="/verify" className="text-teal">/verify</Link>.
        </p>

        <h2 id="what" className="mt-16 font-display text-3xl text-gold">WHAT VERIDEX DOES</h2>
        <div className="mt-6 space-y-5 text-lg">
          <p>
            Offer letters travel as forwarded PDFs. Anyone can change a digit,
            a private HR database cannot be queried by strangers, and a raw
            cloud link left on-chain leaks forever.
          </p>
          <p>
            Veridex seals the exact bytes of one PDF to one wallet address for
            one schema (<span className="font-hash text-base">OfferLetter/v1</span>),
            and signs that binding with the Veridex app key. A soulbound token
            carries the seal: document id, content hash, schema, signature hash.
            The file itself never leaves private storage except through a
            90-second viewing URL.
          </p>
        </div>

        <h2 id="why" className="mt-16 font-display text-3xl text-gold">WHY THE SEAL HOLDS</h2>
        <div className="mt-6 space-y-5 text-lg">
          <p>
            <strong className="text-ink">The signature names the sealer.</strong>{" "}
            Anyone can hash a forged PDF — but only the app key produces a
            signature that recovers to the published Veridex address. Your
            browser checks this, no account needed.
          </p>
          <p>
            <strong className="text-ink">The holder is inside the signature.</strong>{" "}
            A valid hash cannot be replayed onto another wallet; moving it
            breaks recovery and the verdict turns.
          </p>
          <p>
            <strong className="text-ink">The token cannot move.</strong>{" "}
            Transfers, approvals, all of it reverts on-chain. A seal found on
            the wrong address is evidence of nothing.
          </p>
          <p>
            <strong className="text-ink">The file is never public.</strong>{" "}
            Private bucket, block-public-access, per-request 90-second URLs
            that are never logged or stored.
          </p>
          <p>
            <strong className="text-ink">Revocation is on the record.</strong>{" "}
            An issuer can cancel; the chain flag and the database agree, and
            every later check reads REVOKED.
          </p>
          <p>
            <strong className="text-ink">The record can't be rewritten.</strong>{" "}
            Once a seal is mined, its bytes sit in thousands of copies of the
            same ledger — no admin panel, no database edit, no backdoor can
            quietly change what was sealed, to whom, or when. Revoking flips a
            flag; it never erases history, so the full story stays auditable.
            Anyone with a block explorer can read the seal without asking us
            for permission. Demo runs on the Sepolia testnet; the same contract
            carries the same guarantees on mainnet.
          </p>
        </div>

        <h2 id="workflow" className="mt-16 font-display text-3xl text-gold">THE WORKFLOW</h2>
        <div className="mt-6 space-y-5 text-lg">
          <p>
            <strong className="text-ink">1. Seal.</strong> Issuer signs in,
            pastes a holder address, uploads one PDF. The backend validates,
            hashes, signs, stores bytes privately, stores hash plus signature
            in the database, and mints the seal.
          </p>
          <p>
            <strong className="text-ink">2. Share.</strong> The holder keeps a
            non-transferable token and a verify link. Nothing else changes
            hands.
          </p>
          <p>
            <strong className="text-ink">3. Check.</strong> The verifier pastes
            a code or address, optionally opens the official file, or drops the
            PDF they were sent. Hash, signature, holder, revocation, and expiry
            are evaluated in that order — the first failure names the verdict.
          </p>
          <p>
            <strong className="text-ink">One account, two hats.</strong> Issuer
            and verifier are permission labels, not separate logins: a single
            account carries both, so sealing and viewing need just one sign-in
            — while the backend still checks each permission independently.
          </p>
        </div>

        <h2 id="aws" className="mt-16 font-display text-3xl text-gold">WHERE AWS FITS</h2>
        <div className="mt-6 space-y-5 text-lg">
          <p>
            S3 is the system of record for bytes. Lambda is the only component
            permitted to sign, mint, revoke, or presign. Cognito draws the role
            boundary between issuers and everyone else. DynamoDB holds the
            allowlist, the idempotency record, and the full signatures. The
            chain holds pointers, never data, and scales to zero with the rest.
          </p>
        </div>

        <h2 id="limits" className="mt-16 font-display text-3xl text-gold">WHAT IT DOES NOT DO</h2>
        <div className="mt-6 space-y-5 text-lg">
          <p>
            A stolen app key breaks everything it signed. An allowlisted issuer
            can seal a lie. A lost holder wallet has no recovery in this
            version. Verifier file access is coarse by design for the weekend,
            and everything runs on testnet. Stated here so the seal means what
            it says.
          </p>
        </div>

        <div className="mt-16 border border-line bg-tile p-8">
          <p className="font-display text-2xl">TRY THE MECHANISM, NOT THE MARKETING.</p>
          <Link href="/verify" className="mt-4 inline-block bg-gold px-8 py-4 font-display text-sm tracking-wide text-ground">
            VERIFY A SEAL
          </Link>
        </div>
      </article>
    </main>
  );
}
