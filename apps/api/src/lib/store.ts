// DDB + S3 thin wrappers — one table, docs/* only
import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ddb = new DynamoDBClient({});
const s3 = new S3Client({});
const TableName = () => process.env.TABLE_NAME!;
const Bucket = () => process.env.DOCS_BUCKET!;

export const ddbGet = (pk: string, sk: string) =>
  ddb.send(new GetItemCommand({ TableName: TableName(), Key: { pk: { S: pk }, sk: { S: sk } } }));

export const ddbPutDoc = (doc: Record<string, any>) =>
  ddb.send(new PutItemCommand({
    TableName: TableName(),
    Item: Object.fromEntries(Object.entries(doc).map(([k, v]) => [k, typeof v === "number" ? { N: String(v) } : { S: String(v) }])),
  }));

export const ddbRevoke = (docId: string) =>
  ddb.send(new UpdateItemCommand({
    TableName: TableName(), Key: { pk: { S: `DOC#${docId}` }, sk: { S: "META" } },
    UpdateExpression: "SET #s = :r", ExpressionAttributeNames: { "#s": "status" }, ExpressionAttributeValues: { ":r": { S: "revoked" } },
  }));

export const s3PutPdf = (key: string, bytes: Buffer) =>
  s3.send(new PutObjectCommand({ Bucket: Bucket(), Key: key, Body: bytes, ContentType: "application/pdf" }));

export const presignTtl = () => 90; // seconds, never log URL

export const presignGet = (key: string) =>
  getSignedUrl(s3, new GetObjectCommand({ Bucket: Bucket(), Key: key }), { expiresIn: presignTtl() });
