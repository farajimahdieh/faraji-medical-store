import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_PROVIDER, StoredFile } from './storage-provider.interface';
import type { StorageProvider } from './storage-provider.interface';

// The only thing the rest of the app is allowed to depend on for files --
// never STORAGE_PROVIDER/an S3 client directly, and never a secret (those
// stay inside the active provider). Swapping providers or adding a CDN
// base later never requires touching a caller.
@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly provider: StorageProvider,
  ) {}

  upload(key: string, data: Buffer, contentType: string): Promise<StoredFile> {
    return this.provider.save(key, data, contentType);
  }

  delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  resolveUrl(key: string): string {
    return this.provider.resolveUrl(key);
  }
}
