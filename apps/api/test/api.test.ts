// API tests — hash + upload validation + presign TTL
import { test } from "vitest";
import { sha256Hex } from "../src/lib/hash";
import { validateUpload, requireGroup } from "../src/docs-post";
import { presignTtl } from "../src/lib/store";
import { handler } from "../src/health";
import { handler as router } from "../src/index";


test("sha256 empty vector", () => {
  if (sha256Hex(Buffer.from("")) !== "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855") throw new Error("hash wrong");
});
test("reject non-pdf", () => {
  const r = validateUpload({ contentType: "image/png", byteLength: 10, holder: "0x000000000000000000000000000000000000dEaD" });
  if (r.ok) throw new Error("should reject png");
});
test("presign 90s", () => { if (presignTtl() !== 90) throw new Error("ttl must be 90"); });
test("health returns signedBy", async () => {
  process.env.APP_SIGNER_ADDRESS = "0x000000000000000000000000000000000000dEaD";
  const res: any = await handler();
  if (!JSON.parse(res.body).signedBy) throw new Error("missing signedBy");
});
test("POST /v1/docs rejects bad body without auth bypass", async () => {
  const noAuth: any = await router({ httpMethod: "POST", path: "/prod/v1/docs", pathParameters: null, requestContext: {}, headers: {}, body: "{}" });
  if (noAuth.statusCode !== 403) throw new Error("expected 403, got " + noAuth.statusCode);
  const badJson: any = await router({
    httpMethod: "POST", path: "/prod/v1/docs", pathParameters: null,
    requestContext: { authorizer: { claims: { sub: "u1", "cognito:groups": "issuer" } } },
    headers: {}, body: "not-json",
  });
  if (badJson.statusCode !== 400) throw new Error("expected 400, got " + badJson.statusCode);
});
test("requireGroup allows issuer, denies others", () => {
  const ev = (g: any) => ({ requestContext: { authorizer: { claims: { sub: "u1", "cognito:groups": g } } } });
  if (requireGroup(ev("issuer"), "issuer") !== "u1") throw new Error("issuer denied");
  if (requireGroup(ev("verifier"), "issuer") !== null) throw new Error("verifier passed as issuer");
  if (requireGroup(ev(["issuer", "verifier"]), "issuer") !== "u1") throw new Error("array groups failed");
  if (requireGroup({}, "issuer") !== null) throw new Error("no-claims passed");
});
test("router answers v1, v2, and bare paths", async () => {
  const v1: any = await router({ httpMethod: "GET", path: "/prod/v1/health", pathParameters: null, requestContext: {}, headers: {} });
  if (v1.statusCode !== 200) throw new Error("v1 stage path failed: " + v1.body);
  const v2: any = await router({ version: "2.0", rawPath: "/v1/health", requestContext: { http: { method: "GET" } }, headers: {} });
  if (v2.statusCode !== 200) throw new Error("v2 rawPath failed: " + v2.body);
  const bare: any = await router({ httpMethod: "GET", path: "/v1/health", pathParameters: null, requestContext: {}, headers: {} });
  if (bare.statusCode !== 200) throw new Error("bare path failed: " + bare.body);
});
test("official file needs verifier or issuer login", async () => {
  const anon: any = await router({ httpMethod: "GET", path: "/prod/v1/docs/abc/file", pathParameters: null, requestContext: {}, headers: {} });
  if (anon.statusCode !== 403) throw new Error("expected 403, got " + anon.statusCode);
});
test("label must be short printable ASCII", () => {
  const base = { contentType: "application/pdf", byteLength: 10, holder: "0x000000000000000000000000000000000000dEaD" };
  if (!validateUpload({ ...base, label: "SDE Intern - Acme" }).ok) throw new Error("good label rejected");
  if (validateUpload({ ...base, label: "x".repeat(81) }).ok) throw new Error("long label passed");
  if (validateUpload({ ...base, label: "bad\nnewline" }).ok) throw new Error("newline label passed");
});
