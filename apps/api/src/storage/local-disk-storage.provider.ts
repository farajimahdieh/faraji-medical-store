import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { StorageProvider, StoredFile } from './storage-provider.interface';

// Local filesystem storage for development. Swap for an S3/R2/Cloudinary
// provider behind the same interface before production — the DB only ever
// stores the public `url`, never a local path, so callers don't change.
@Injectable()
export class LocalDiskStorageProvider implements StorageProvider {
  private readonly rootDir: string;
  private readonly urlPrefix: string;

  constructor(private readonly configService: ConfigService) {
    this.rootDir = this.configService.get<string>(
      'STORAGE_ROOT_DIR',
      join(process.cwd(), 'storage'),
    );
    this.urlPrefix = this.configService.get<string>(
      'STORAGE_URL_PREFIX',
      '/media',
    );
  }

  async save(key: string, data: Buffer): Promise<StoredFile> {
    const filePath = join(this.rootDir, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
    return { url: `${this.urlPrefix}/${key.split(/[\\/]/).join('/')}` };
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(join(this.rootDir, key));
      return true;
    } catch {
      return false;
    }
  }
}
