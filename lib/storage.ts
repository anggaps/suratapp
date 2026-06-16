import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import path from "node:path";
import { randomUUID } from "node:crypto";

const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_REGION = process.env.S3_REGION ?? "auto";
const S3_BUCKET = process.env.S3_BUCKET;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL;

const USE_S3 = S3_ENDPOINT && S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY;

const s3Client = USE_S3
  ? new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    })
  : null;

const DATA_URL_MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

function isDataUrl(url: string) {
  return url.startsWith("data:");
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const originalName = file.name;
  const ext = path.extname(originalName) || ".bin";
  const filename = `${randomUUID()}${ext}`;
  const mimeType = file.type || "application/octet-stream";

  if (s3Client && S3_BUCKET) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: filename,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    const url = S3_PUBLIC_URL
      ? `${S3_PUBLIC_URL.replace(/\/$/, "")}/${filename}`
      : `${S3_ENDPOINT?.replace(/\/$/, "")}/${S3_BUCKET}/${filename}`;

    return {
      filename,
      originalName,
      mimeType,
      size: file.size,
      url,
    };
  }

  // Fallback: persist file content as a data URL inside the database so it survives serverless restarts.
  if (file.size > DATA_URL_MAX_SIZE) {
    throw new Error(
      `File terlalu besar untuk disimpan tanpa S3 (maksimal ${DATA_URL_MAX_SIZE / 1024 / 1024} MB). ` +
        "Silakan konfigurasi S3/R2 untuk file besar."
    );
  }

  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  return {
    filename,
    originalName,
    mimeType,
    size: file.size,
    url: dataUrl,
  };
}

export async function deleteFile(filename: string, url: string): Promise<void> {
  if (isDataUrl(url)) {
    // Nothing to delete on disk; the data URL lives in the database row.
    return;
  }

  if (s3Client && S3_BUCKET) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: S3_BUCKET,
          Key: filename,
        })
      );
    } catch (error) {
      console.warn("Failed to delete file from S3:", error);
    }
    return;
  }
}
