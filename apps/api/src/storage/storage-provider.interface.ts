export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export interface StoredFile {
  // Public path/URL the file can be served from (relative, e.g. "/media/products/...").
  url: string;
}

export interface StorageProvider {
  // `key` is a storage-relative path, e.g. "products/teb-41200/card.webp".
  save(key: string, data: Buffer, contentType: string): Promise<StoredFile>;
  exists(key: string): Promise<boolean>;
}
