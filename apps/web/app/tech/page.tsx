import Link from "next/link";

export const metadata = {
  title: "Tech — what runs Veridex",
  description: "Every AWS service in Veridex, what it does, and what it holds.",
};

const stack: Array<[string, string, string]> = [
  ["Amplify Hosting", "Serves the Next.js site and gives the public URL.", "The website you are reading."],
  ["API Gateway", "The front door: routes HTTP to Lambda, enforces login on private routes.", "Carries /v1/* traffic, nothing stored."],
  ["Lambda (Node 24)", "All brain, no memory: validates, hashes, signs, mints, presigns.", "The only part allowed to touch the app key. Stateless."],
  ["S3 (private)", "Holds the actual PDFs, block-public-access, encrypted.", "docs/{issuer}/{docId}.pdf — bytes only."],
  ["DynamoDB", "Key-value store for hashes, signatures, statuses, allowlist.", "DOC# rows, ISSUER# rows. Source of truth for state."],
  ["Cognito", "Login plus issuer / verifier group membership.", "Users and their hats. Tokens checked in Lambda."],
  ["IAM", "Permission slips: Lambda may touch docs/* and one table, nothing else.", "The blast-radius limiter."],
];

export default function Tech() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-tight">WHAT RUNS THIS PAGE</h1>
      <p className="mt-4 max-w-2xl text-lg text-dim">
        Every AWS service in Veridex, in plain words — what it does in general,
        and what it holds here. The chain holds pointers; everything below
        holds the product.
      </p>

      <div className="mt-12 divide-y divide-line border-y border-line">
        {stack.map(([name, does, holds]) => (
          <div key={name} className="grid gap-2 py-6 md:grid-cols-[220px_1fr_1fr] md:gap-8">
            <p className="font-display text-xl text-gold">{name}</p>
            <p className="text-dim">{does}</p>
            <p className="font-hash text-sm break-all">{holds}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 border border-line bg-tile p-8">
        <p className="font-display text-2xl">WHY A CHAIN AT ALL.</p>
        <div className="mt-4 max-w-2xl space-y-5 text-dim">
          <p>
            Sepolia (Ethereum testnet) hosts the VeridexSBT soulbound contract
            — four small values per seal, no files, no links, no names. Free,
            public, and verifiable by anyone with a block explorer.
          </p>
          <p>
            What the chain buys: once mined, a seal can't be edited, backdated,
            or quietly deleted — every copy of the ledger would have to agree,
            and they won't. Transfers revert in contract code, so the seal
            physically cannot change hands. Revocation flips a flag instead of
            erasing, leaving a permanent audit trail. AWS holds the file; the
            chain holds the proof that the file's story never changed.
          </p>
        </div>
        <Link
          href="/docs"
          className="mt-6 inline-block border border-line px-6 py-3 font-display text-sm tracking-wide text-dim hover:border-teal hover:text-ink"
        >
          HOW THEY FIT TOGETHER →
        </Link>
      </div>
    </main>
  );
}
