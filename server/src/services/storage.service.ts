import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { env } from '../config/env.js';
import crypto from 'crypto';
import { Readable } from 'stream';

class StorageService {
  private client: S3Client;
  private defaultBucket: string;

  constructor() {
    this.defaultBucket = env.MINIO_BUCKET;
    this.client = new S3Client({
      endpoint: `http${env.MINIO_USE_SSL ? 's' : ''}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`,
      region: env.MINIO_REGION,
      credentials: {
        accessKeyId: env.MINIO_ACCESS_KEY,
        secretAccessKey: env.MINIO_SECRET_KEY,
      },
      forcePathStyle: true, // Necessary for MinIO
    });
  }

  public async initBuckets(): Promise<void> {
    const buckets = ['evidence', 'documents', 'exports'];
    for (const bucket of buckets) {
      try {
        await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch (err: any) {
        try {
          await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
          console.log(`🪣 Created MinIO Bucket: ${bucket}`);
        } catch (createErr) {
          console.warn(`Could not auto-create bucket ${bucket} (may already exist or minio-init handles it):`, createErr);
        }
      }
    }
  }

  public generateStorageKey(caseId: string, documentId: string, originalFileName: string): string {
    const cleanName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const nonce = crypto.randomBytes(4).toString('hex');
    return `cases/${caseId}/documents/${documentId}/${nonce}_${cleanName}`;
  }

  public async uploadBuffer(
    buffer: Buffer,
    key: string,
    mimeType: string,
    bucket: string = this.defaultBucket
  ): Promise<{ sha256Hash: string; fileSize: number; storageKey: string }> {
    const sha256Hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const fileSize = buffer.length;

    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          sha256: sha256Hash,
          uploadedAt: new Date().toISOString(),
        },
      })
    );

    return { sha256Hash, fileSize, storageKey: key };
  }

  public async getObjectBuffer(key: string, bucket: string = this.defaultBucket): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    if (!response.Body) {
      throw new Error(`Object not found in storage: ${key}`);
    }

    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
  }

  public async checkHealth(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.defaultBucket }));
      return true;
    } catch {
      return false;
    }
  }
}

export const storageService = new StorageService();
