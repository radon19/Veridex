// Single Lambda router — explicit API GW routes (proxy+ retired)
import { handler as health } from "./health";
import { getVerify } from "./verify";
import { fileUrl } from "./docs-file";
import { tokenJson } from "./tokens";
import { revokeDoc } from "./revoke";
import { issueDoc } from "./issue";
import { requireGroup } from "./docs-post";

const json = (statusCode: number, body: any) => ({
  statusCode,
  headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  body: JSON.stringify(body),
});

// Works with REST (v1), HTTP (v2), stage-prefixed, bare, and legacy proxy+ events
const candidates = (event: any): string[] => {
  const raw: string = event.pathParameters?.proxy || event.path || event.rawPath || "";
  const noLead = raw.replace(/^\//, "");
  return [noLead, noLead.replace(/^[^/]+\//, "")];
};
const isMethod = (event: any, m: string) =>
  (event.httpMethod || event.requestContext?.http?.method || "GET") === m;
const isPath = (c: string[], want: string) => c.includes(want);
const startsPath = (c: string[], pre: string) => c.some((p) => p.startsWith(pre));

export const handler = async (event: any) => {
  const c = candidates(event);
  if (isMethod(event, "GET") && isPath(c, "v1/health")) return health();
  if (isMethod(event, "GET") && startsPath(c, "v1/verify")) {
    const code = event.queryStringParameters?.code || "";
    return json(200, await getVerify(code));
  }
  if (isMethod(event, "GET") && startsPath(c, "v1/docs/") && c.some((p) => p.endsWith("/file"))) {
    // Official file: any signed-in issuer OR verifier (coarse weekend ACL)
    const who = requireGroup(event, "issuer") || requireGroup(event, "verifier");
    if (!who) return json(403, { error: "FORBIDDEN" });
    const segs = c[0].split("/");
    const id = segs[segs.indexOf("docs") + 1] || "";
    return json(200, await fileUrl(id));
  }
  if (isMethod(event, "GET") && startsPath(c, "v1/tokens/")) {
    const segs = c[0].split("/");
    return json(200, await tokenJson(segs[segs.indexOf("tokens") + 1] || ""));
  }
  if (isMethod(event, "POST") && isPath(c, "v1/docs")) {
    const issuerId = requireGroup(event, "issuer");
    if (!issuerId) return json(403, { error: "FORBIDDEN" });
    // JSON + base64: byte-exact through API GW, no binary-media config needed.
    // Note: base64 inflates ~33%, so the 8MB file cap stays well under GW's 10MB event cap.
    let body: any = {};
    try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "INVALID_FILE" }); }
    if (typeof body.fileBase64 !== "string") return json(400, { error: "INVALID_FILE" });
    let bytes: Buffer;
    try { bytes = Buffer.from(body.fileBase64, "base64"); } catch { return json(400, { error: "INVALID_FILE" }); }
    const out = await issueDoc({
      issuerId, holder: body.holderAddress || "", schema: body.schema || "",
      label: typeof body.label === "string" ? body.label : "",
      bytes, contentType: body.contentType || "application/pdf",
    });
    if ((out as any).error) return json(400, out);
    return json(200, out);
  }
  if (isMethod(event, "POST") && startsPath(c, "v1/docs/") && c.some((p) => p.endsWith("/revoke"))) {
    if (!requireGroup(event, "issuer")) return json(403, { error: "FORBIDDEN" });
    const segs = c[0].split("/");
    return json(200, await revokeDoc(segs[segs.indexOf("docs") + 1] || ""));
  }
  return json(404, { error: "NOT_FOUND" });
};
