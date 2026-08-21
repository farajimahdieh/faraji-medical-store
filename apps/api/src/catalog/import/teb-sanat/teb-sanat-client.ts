import { Logger } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { TebSanatCategory, TebSanatProduct } from './teb-sanat.types';

const BASE_URL = 'https://teb-sanat.com/wp-json/wc/store/v1';
const USER_AGENT =
  'FarajiMedicalStoreImporter/1.0 (+https://teb-sanat.com catalog import, low-volume, contact via faraji medical store)';
const REQUEST_DELAY_MS = 400;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface TebSanatClientOptions {
  useCache: boolean;
  cacheDir: string;
}

// Thin, polite client for teb-sanat.com's public WooCommerce Store API:
// sequential requests, a fixed delay between them, limited retries on
// transient failures, and an optional on-disk response cache for
// development so repeated dry-runs don't re-hit the source site.
export class TebSanatClient {
  private readonly logger = new Logger(TebSanatClient.name);
  private lastRequestAt = 0;

  constructor(private readonly options: TebSanatClientOptions) {}

  async fetchCategories(): Promise<TebSanatCategory[]> {
    return this.getJson<TebSanatCategory[]>(
      `${BASE_URL}/products/categories?per_page=100`,
    );
  }

  async fetchProductsPage(
    categoryId: number,
    page: number,
    perPage = 50,
  ): Promise<TebSanatProduct[]> {
    return this.getJson<TebSanatProduct[]>(
      `${BASE_URL}/products?category=${categoryId}&page=${page}&per_page=${perPage}`,
    );
  }

  async fetchAllProductsForCategory(
    categoryId: number,
  ): Promise<TebSanatProduct[]> {
    const perPage = 50;
    const products: TebSanatProduct[] = [];
    for (let page = 1; ; page++) {
      const pageProducts = await this.fetchProductsPage(
        categoryId,
        page,
        perPage,
      );
      products.push(...pageProducts);
      if (pageProducts.length < perPage) break;
    }
    return products;
  }

  // Downloads an image. Not cached on disk as JSON (binary), but throttled
  // and retried the same as any other request to the source site.
  async fetchBinary(url: string): Promise<Buffer> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.throttle();
        const response = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT },
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} for ${url}`);
        }
        return Buffer.from(await response.arrayBuffer());
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Image download failed (attempt ${attempt}/${MAX_RETRIES}): ${url} — ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_BASE_DELAY_MS * attempt);
        }
      }
    }
    throw lastError;
  }

  private async getJson<T>(url: string): Promise<T> {
    const cached = await this.readCache<T>(url);
    if (cached !== null) {
      return cached;
    }

    const data = await this.requestWithRetry<T>(url);
    await this.writeCache(url, data);
    return data;
  }

  private async requestWithRetry<T>(url: string): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.throttle();
        const response = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} for ${url}`);
        }
        return (await response.json()) as T;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Request failed (attempt ${attempt}/${MAX_RETRIES}): ${url} — ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_BASE_DELAY_MS * attempt);
        }
      }
    }
    throw lastError;
  }

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < REQUEST_DELAY_MS) {
      await sleep(REQUEST_DELAY_MS - elapsed);
    }
    this.lastRequestAt = Date.now();
  }

  private cacheFilePath(url: string): string {
    const hash = createHash('sha256').update(url).digest('hex');
    return join(this.options.cacheDir, `${hash}.json`);
  }

  private async readCache<T>(url: string): Promise<T | null> {
    if (!this.options.useCache) return null;
    try {
      const raw = await readFile(this.cacheFilePath(url), 'utf8');
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private async writeCache<T>(url: string, data: T): Promise<void> {
    if (!this.options.useCache) return;
    await mkdir(this.options.cacheDir, { recursive: true });
    await writeFile(this.cacheFilePath(url), JSON.stringify(data), 'utf8');
  }
}
