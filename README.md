<div align="center">

<img src="apps/web/public/diagram.svg" alt="Veridex seal" width="96" />

# Veridex

### The token is a seal. The file stays off-chain.

**Soulbound credential seals. One PDF, one address, one signature anyone can check.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![AWS](https://img.shields.io/badge/AWS-Serverless-orange?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Sepolia](https://img.shields.io/badge/Sepolia-11155111-627EEA?logo=ethereum&logoColor=white)](https://sepolia.etherscan.io/)

</div>

Built for **WeMakeDevs × AWS First Commit (Bharat Builds Tour, Sep 17–20 2026)** — targeting **Ship It** + **Best UI**.

> **Judges start here:** [`docs.md`](./docs.md) — 4-minute self-verification script, verdict status, limits. No video required to check our work.

---

## Verify live

- **Site:** TBD (Amplify deploy pending)
- **API health:** `https://r1jmabwu49.execute-api.ap-south-1.amazonaws.com/prod/v1/health`
- **Contract (Sepolia):** [`0xaf9a48586e4aa7ebafe5258b836939a58ba71a68`](https://sepolia.etherscan.io/address/0xaf9a48586e4aa7ebafe5258b836939a58ba71a68)
- **App signer:** `0x11f310dd52937D247091f07f88982ba510fe328b` (recover every signature against this)

---

## Problem → Veridex solution

| Problem | Veridex solution |
|---|---|
| Forwarded PDFs get edited — one digit changes everything | `sha256` of exact bytes; 1-byte edit reads **TAMPERED** |
| Anyone can hash a forgery, so raw hashes prove nothing | EIP-712 app signature over hash + holder + schema + doc id, recoverable in the browser |
| A valid seal replayed onto another wallet | Holder is inside the signed payload — replay reads **WRONG_HOLDER** / **BAD_SIGNATURE** |
| Private HR databases can't be queried by strangers | Public verify needs no account and no DB access |
| Raw cloud links on-chain leak forever | Chain stores 4 small values; file lives in a private bucket, served via 90-second URLs |
| Cancelled credentials keep verifying | On-chain revoke + DB status → **REVOKED**, history preserved |

---

## How it works

**Seal** (`/issuer`, issuer login) — upload PDF + holder address + title → backend validates, hashes, EIP-712-signs with the app key, stores bytes in private S3, stores hash + full signature in DynamoDB, mints a soulbound token.

**Check** (`/verify`, public) — paste code → seal card → drop the forwarded PDF (hashed locally, never uploads) → one huge word: `MATCH | TAMPERED | BAD_SIGNATURE | WRONG_HOLDER | REVOKED | EXPIRED | UNKNOWN_ISSUER | NOT_FOUND`.

**Preview** (`/files`, signed in) — the official document embedded live; the presigned URL dies in 90 seconds, countdown on screen.

**Hold** (`/me`, no wallet needed) — look up seals by code, copy verify links.

Signature recovery and on-chain `ownerOf` run live in the browser — `BAD_SIGNATURE` and `WRONG_HOLDER` are real checks, not copy.

---

## Architecture

```
Browser (Next.js on Amplify)
  → API Gateway (/v1/*, Cognito authorizer on writes)
    → Lambda ApiFn (Node 24 — only signer/minter/presigner)
        ├── Cognito (issuer/verifier groups, enforced in Lambda)
        ├── S3 private  docs/{issuerId}/{docId}.pdf (AES256, block-public)
        ├── DynamoDB    DOC# rows (hash+sig+status) / ISSUER# rows (allowlist)
        └── Sepolia     VeridexSBT: {docId, contentHash, schema, sigHash}
```

`tokenURI` serves API JSON, never an S3 URL. Full narrative: [`architecture.md`](./architecture.md).

### Where AWS fits

| Service | Role |
|---|---|
| Amplify Hosting | Public URL |
| API Gateway + Lambda | All compute, JWT + group checks |
| S3 | Private system of record for bytes |
| DynamoDB | Hashes, signatures, statuses, allowlist |
| Cognito | Role boundary (one demo account carries both groups) |
| IAM | Least privilege: `docs/*` + one table |

---

## Run it

Prereqs: Node 20+, AWS CLI, SAM CLI, Hardhat.

```bash
# 1. env
cp .env.example .env            # fill keys + outputs (never commit .env)

# 2. backend
sam build --template infra/template.yaml
sam deploy --template-file infra/template.yaml --stack-name veridex \
  --capabilities CAPABILITY_IAM --resolve-s3 --parameter-overrides \
  AppSignerAddress=$APP_SIGNER_ADDRESS SbtAddress=$SBT_ADDRESS ...

# 3. contract (Sepolia)
cd contracts && npx hardhat run scripts/deploy.ts --network sepolia

# 4. web
cd ../apps/web && npm install && npm run dev
```

Repo layout: `apps/web` (Next.js + Tailwind), `apps/api` (Lambda TS), `contracts` (Hardhat + `VeridexSBT.sol`), `infra` (SAM). Spec: [`VERIDEX.md`](./VERIDEX.md). Design record: [`PRODUCT.md`](./PRODUCT.md).

---

## Security model + honest limits

Enforced: private bucket, 90s presigned URLs (never logged), group checks in Lambda (fail-closed 403), soulbound transfers revert, idempotent mint, no PII/URLs on-chain.

Admitted: stolen app key breaks everything it signed · allowlisted issuer can seal a lie · no wallet recovery · coarse verifier ACL · testnet only · single demo account holds both groups.

## What we learned

First app-key EIP-712 flow end to end (Lambda signs, browser recovers); first private-bucket presign loop; soulbound transfer lock wired to a minter role; CORS + binary-upload lessons the hard way (JSON+base64 won); API Gateway v1/v2 event shapes in one router.

## AI tools used

OpenCode with Muse Spark (architecture, implementation, debugging). _Add any others used during the event._

## Roadmap (known, not built)

- [ ] Expiry input at issue time (EXPIRED is logic-only today)
- [ ] Selective disclosure / per-field proofs
- [ ] Mainnet deployment + audit before real value
- [ ] Wallet recovery for holders
