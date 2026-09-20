# Veridex — judge brief

**One line:** an issuer seals a PDF to a wallet with an app-signed, on-chain soulbound seal; anyone verifies MATCH or TAMPERED in seconds, no account needed.

- **Site:** TBD (Amplify deploy pending)
- **API:** `https://r1jmabwu49.execute-api.ap-south-1.amazonaws.com/prod`
- **Contract (Sepolia 11155111):** [`0xaf9a48586e4aa7ebafe5258b836939a58ba71a68`](https://sepolia.etherscan.io/address/0xaf9a48586e4aa7ebafe5258b836939a58ba71a68)
- **App signer (recover every signature against this):** `0x11f310dd52937D247091f07f88982ba510fe328b`
- **Demo video (≤3 min):** TBD
- **Spec:** [`VERIDEX.md`](./VERIDEX.md) · **Front door:** [`README.md`](./README.md)

---

## Verify it yourself in 4 minutes (no account)

1. **Health** — open `/v1/health`. Expect `ok:true`, the `signedBy` above, the contract, `11155111`, `OfferLetter/v1`.
2. **A live seal** — open `/v1/verify?code=0x44d05fa87264abefbabba2d5319f1bb5f857eb5d12fb0269df27c459d0b3bc39`. Expect holder, schema, `contentHash`, full `appSignature`, `signedBy`, `status:issued`.
3. **The contract agrees** — on the explorer link above, read `getSeal` for that seal's `tokenId`: same `contentHash`, `revoked:false`. Read `ownerOf`: equals the holder.
4. **Signature math** — take that seal's binding + `appSignature`, EIP-712-recover (`SealBinding`, domain `Veridex/1`). Expect the signer address above.
5. **The file is private** — open the S3 object URL pattern directly (`https://<bucket>.s3.amazonaws.com/docs/...`) without a presigned signature. Expect `AccessDenied`. Only `GET /v1/docs/:id/file` (signed-in) mints 90-second URLs.

## The eight verdicts (status)

| Verdict | Meaning | Status |
|---|---|---|
| MATCH | Exact bytes sealed to this address | Proven live |
| TAMPERED | One byte differs | Proven live |
| BAD_SIGNATURE | Not sealed by Veridex | Wired (browser ECDSA recovery) |
| WRONG_HOLDER | Genuine seal, wrong wallet | Wired (live `ownerOf` read) |
| REVOKED | Issuer cancelled | Proven live (API + chain flag) |
| EXPIRED | Validity window passed | Logic-only (no expiry input yet) |
| UNKNOWN_ISSUER | Sealer not allowlisted | Enforced at issue + returned by API |
| NOT_FOUND | No seal for that code | Proven live |

## How the seal is built (per issue)

1. Validate: PDF only, ≤8MB, checksummed holder, Cognito `issuer` group, allowlist.
2. `sha256` exact bytes → `contentHash`.
3. EIP-712 `SealBinding(docId, contentHash, holder, schema, issuedAt, expiresAt, issuerId)` signed by the app key in Lambda — the only place the key exists.
4. Bytes → private S3 (`docs/{issuer}/{docId}.pdf`, AES256, block-public).
5. Hash + full signature + status → DynamoDB (`DOC#` row).
6. `seal(to, docId, contentHash, schema, expiresAt, sigHash)` from the minter wallet → soulbound token (transfers revert).

`tokenURI` serves API JSON, never an S3 URL. PII never touches the chain.

## Where AWS fits (Ship It surface)

Amplify (URL) · API Gateway + Lambda Node 24 (sole signer/minter/presigner, JWT + group checks fail-closed) · S3 private · DynamoDB · Cognito (one demo account, both groups; checks stay separate in code) · IAM least privilege (`docs/*` + one table). Chain holds pointers, not data.

## Limits (admitted, not hidden)

Stolen app key breaks its seals · allowlisted issuer can seal a lie · no wallet recovery · coarse verifier ACL · testnet only · EXPIRED unreachable until expiry input ships. Single demo account holds both groups by design (see README).

## Reproduce locally

```bash
cp .env.example .env   # fill, never commit
sam build --template infra/template.yaml && sam deploy --guided
cd contracts && npx hardhat run scripts/deploy.ts --network sepolia
cd ../apps/web && npm install && npm run dev
```

Acceptance checklist: `VERIDEX.md` §17. AI tools used: OpenCode + Muse Spark.
