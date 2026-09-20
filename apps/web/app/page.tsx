import Image from "next/image";
import Link from "next/link";

const verdicts: Array<[string, string, string]> = [
  ["MATCH", "text-teal", "These exact bytes were sealed to this address."],
  ["TAMPERED", "text-gold", "One byte differs from what was sealed."],
  ["BAD_SIGNATURE", "text-dim", "The seal was not made by Veridex."],
  ["WRONG_HOLDER", "text-dim", "Genuine seal, presented by the wrong wallet."],
  ["REVOKED", "text-dim", "The issuer cancelled this seal."],
  ["EXPIRED", "text-dim", "The seal's validity window has passed."],
  ["UNKNOWN_ISSUER", "text-dim", "Sealed by no one on the allowlist."],
  ["NOT_FOUND", "text-dim", "No seal exists for that code."],
];

export default function Home() {
  return (
    <main>
      {/* First viewport: the mechanism, demonstrated */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="font-display text-5xl leading-[0.95] tracking-tight md:text-6xl">
              THE TOKEN
              <br />
              IS A SEAL.
            </h1>
            <p className="mt-6 max-w-md text-lg text-dim">
              Veridex binds one PDF to one address with an app-signed,
              on-chain soulbound seal anyone can check. Forward it, edit it,
              fake it — the seal knows.
            </p>
            <div className="mt-8 flex gap-4">
              <Link href="/verify" className="bg-gold px-8 py-4 font-display text-sm tracking-wide text-ground">
                VERIFY A SEAL
              </Link>
              <Link href="/issuer" className="border border-line px-8 py-4 font-display text-sm tracking-wide hover:border-gold">
                SEAL A FILE
              </Link>
            </div>
          </div>
          <div className="border border-line bg-tile p-6">
            <div className="flex items-center gap-3">
              <Image src="/diagram.svg" alt="" width={36} height={38} />
              <p className="font-hash text-xs text-dim">sample seal · doc 0xD0…F1 · OfferLetter/v1</p>
            </div>
            <p className="mt-6 font-hash text-xs break-all text-dim">
              contentHash 0x8f2a…c41d
              <br />
              holder 0xA1…77 · signedBy 0x11f3…28b
              <br />
              soulbound token #12 · Sepolia · immutable
            </p>
            <div className="mt-6 grid grid-cols-2 gap-px bg-line">
              <div className="bg-tile p-5">
                <p className="font-display text-3xl text-teal">MATCH</p>
                <p className="mt-2 text-sm text-dim">official PDF, byte for byte</p>
              </div>
              <div className="bg-tile p-5">
                <p className="font-display text-3xl text-gold">TAMPERED</p>
                <p className="mt-2 text-sm text-dim">same letter, one digit edited</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto: why the old answers fail */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl space-y-8 px-6 py-16">
          <p className="font-display text-3xl leading-tight tracking-tight md:text-4xl">
            A raw hash proves nothing — anyone can hash a forgery.
          </p>
          <p className="font-display text-3xl leading-tight tracking-tight text-dim md:text-4xl">
            A cloud link leaks forever. A database answers only its owner.
          </p>
          <p className="font-display text-3xl leading-tight tracking-tight text-teal md:text-4xl">
            So the file stays private, and the seal is public.
          </p>
        </div>
      </section>

      {/* Chain strip: why the ledger matters */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-px px-6 py-16 md:grid-cols-3">
          {[
            ["SOULBOUND", "The seal is a non-transferable token. Transfers revert in contract code — it cannot change hands, ever."],
            ["IMMUTABLE", "Once mined, the record can't be edited or backdated. Revocation flips a flag; history is never erased."],
            ["PUBLIC", "Anyone with a block explorer reads the seal without our permission. No account, no API key, no trust required."],
          ].map(([h, p]) => (
            <div key={h} className="border border-line bg-tile p-8">
              <h2 className="font-display text-2xl text-teal">{h}</h2>
              <p className="mt-4 text-dim">{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-px px-6 py-16 md:grid-cols-3">
          {[
            ["SEAL", "An allowlisted issuer uploads the PDF. Veridex hashes the bytes, signs hash + holder + schema with the app key, and mints an on-chain soulbound token."],
            ["SHARE", "The holder owns a non-transferable token and one link: verify?code. Nothing to install, nothing to trust."],
            ["CHECK", "Anyone pastes the code, opens the official file through a 90-second URL, or drops the forwarded PDF. One word answers."],
          ].map(([h, p]) => (
            <div key={h} className="border border-line bg-tile p-8">
              <h2 className="font-display text-2xl text-gold">{h}</h2>
              <p className="mt-4 text-dim">{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Verdicts */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-4xl tracking-tight">EIGHT ANSWERS. NO MAYBE.</h2>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {verdicts.map(([v, c, d]) => (
              <div key={v} className="grid gap-2 py-5 md:grid-cols-[240px_1fr] md:items-baseline">
                <p className={`font-display text-2xl ${c}`}>{v}</p>
                <p className="text-dim">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-4xl leading-tight tracking-tight md:text-5xl">
            BRING THE PDF
            <br />
            SOMEONE FORWARDED YOU.
          </h2>
          <div className="mt-8">
            <Link href="/verify" className="bg-teal px-8 py-4 font-display text-sm tracking-wide text-ground">
              CHECK IT NOW
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
