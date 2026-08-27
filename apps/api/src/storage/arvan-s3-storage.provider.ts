import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { StorageProvider, StoredFile } from './storage-provider.interface';

interface ArvanConfig {
  client: S3Client;
  bucket: string;
  publicBaseUrl: string;
}

// ArvanCloud Object Storage is S3-compatible. Credentials come only from
// env vars (ARVAN_S3_*) -- never hard-coded, never exposed outside this
// class. Callers only ever see keys/URLs, never the client or credentials.
//
// Config is read lazily (on first real use), not in the constructor: this
// provider is always instantiated by StorageModule regardless of which
// driver is active, so eagerly requiring ARVAN_S3_* would break local dev
// (STORAGE_DRIVER=local) when those vars aren't set.
@Injectable()
export class ArvanS3StorageProvider implements StorageProvider {
  private config?: ArvanConfig;

  constructor(private readonly configService: ConfigService) {}

  async save(
    key: string,
    data: Buffer,
    contentType: string,
  ): Promise<StoredFile> {
    const { client, bucket } = this.getConfig();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
        ACL: 'public-read',
      }),
    );
    return { url: this.resolveUrl(key) };
  }

  async delete(key: string): Promise<void> {
    const { client, bucket } = this.getConfig();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  async exists(key: string): Promise<boolean> {
    const { client, bucket } = this.getConfig();
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  resolveUrl(key: string): string {
    return `${this.getConfig().publicBaseUrl}/${key}`;
  }

  private getConfig(): ArvanConfig {
    if (this.config) return this.config;

    const endpoint = this.configService.getOrThrow<string>('ARVAN_S3_ENDPOINT');
    const region = this.configService.getOrThrow<string>('ARVAN_S3_REGION');
    const bucket = this.configService.getOrThrow<string>('ARVAN_S3_BUCKET');

    const client = new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>(
          'ARVAN_S3_ACCESS_KEY',
        ),
        secretAccessKey: this.configService.getOrThrow<string>(
          'ARVAN_S3_SECRET_KEY',
        ),
      },
    });

    // Overridable so switching to a custom CDN domain later is a config
    // change, not a code change (and not a DB migration -- see StorageService).
    const publicBaseUrl =
      this.configService.get<string>('STORAGE_PUBLIC_BASE_URL') ||
      `${endpoint}/${bucket}`;

    this.config = { client, bucket, publicBaseUrl };
    return this.config;
  }
}
