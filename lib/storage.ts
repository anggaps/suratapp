import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "node:fs/promises";
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

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
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

  // Fallback: local file system
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const filePath = path.join(LOCAL_UPLOAD_DIR, filename);
  await fs.writeFile(filePath, buffer);

  return {
    filename,
    originalName,
    mimeType,
    size: file.size,
    url: `/uploads/${filename}`,
  };
}

export async function deleteFile(filename: string, url: string): Promise<void> {
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

  // Fallback: local file system
  try {
    const localPath = path.join(LOCAL_UPLOAD_DIR, filename);
    await fs.unlink(localPath);
  } catch {
    // ignore if file not found
  }
}
