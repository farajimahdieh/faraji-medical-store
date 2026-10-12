// CLI entry point that applies product content files to the catalog.
// Usage (from apps/api):
//   pnpm content:apply -- --dry-run                       # validate every file
//   pnpm content:apply -- --path=../../content/products/dressing-wound-care
//   pnpm content:apply -- --only=<product-slug>
//   pnpm content:apply -- --path=... --publish   # owner-approved: go live,
//                                               # except files with "hold": true
//
// --dry-run never connects to the database or storage.
import 'reflect-metadata';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';

import { checkProductContent, ProductContent } from './product-content';
import { ContentApplyModule } from './content-apply.module';
import { ContentApplyService } from './content-apply.service';

const REPO_ROOT = resolve(__dirname, '../../../../..');
const DEFAULT_PATH = join(REPO_ROOT, 'content/products');

function parseArgs(argv: string[]) {
  const value = (name: string) =>
    argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];
  return {
    path: value('path') ? resolve(value('path')!) : DEFAULT_PATH,
    only: value('only'),
    dryRun: argv.includes('--dry-run'),
    publish: argv.includes('--publish'),
  };
}

function listJson(path: string): string[] {
  if (!existsSync(path)) return [];
  if (statSync(path).isFile()) return path.endsWith('.json') ? [path] : [];
  return readdirSync(path)
    .sort()
    .flatMap((entry) => listJson(join(path, entry)));
}

async function main() {
  const { path, only, dryRun, publish } = parseArgs(process.argv.slice(2));
  const files = listJson(path);
  if (files.length === 0) {
    console.error(`No content files found under ${path}`);
    process.exit(1);
  }

  const valid: ProductContent[] = [];
  const seenSlugs = new Map<string, string>();
  let invalid = 0;

  for (const file of files) {
    const label = relative(REPO_ROOT, file);
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(file, 'utf8'));
    } catch (error) {
      console.log(`✗ ${label}: invalid JSON (${(error as Error).message})`);
      invalid += 1;
      continue;
    }
    const { content, errors, warnings } = checkProductContent(raw);
    if (content) {
      const other = seenSlugs.get(content.slug);
      if (other) errors.push(`slug also used by ${other}`);
      seenSlugs.set(content.slug, label);
      for (const image of content.images) {
        if (image.file && !existsSync(join(REPO_ROOT, image.file))) {
          errors.push(`image file not found: ${image.file}`);
        }
      }
    }
    if (errors.length > 0 || !content) {
      console.log(`✗ ${label}`);
      errors.forEach((e) => console.log(`    ✗ ${e}`));
      invalid += 1;
      continue;
    }
    console.log(`${warnings.length ? '⚠' : '✓'} ${label}`);
    warnings.forEach((w) => console.log(`    ⚠ ${w}`));
    if (!only || content.slug === only) valid.push(content);
  }

  console.log(`\n${files.length} file(s), ${invalid} invalid`);
  if (invalid > 0) process.exitCode = 1;
  if (dryRun || valid.length === 0) return;

  const app = await NestFactory.createApplicationContext(ContentApplyModule, {
    logger: ['warn', 'error'],
  });
  try {
    const service = app.get(ContentApplyService);
    for (const content of valid) {
      try {
        const result = await service.apply(content, REPO_ROOT, { publish });
        console.log(`✓ ${result.slug}: ${result.imagesAdded} image(s) added`);
        result.messages.forEach((m) => console.log(`    • ${m}`));
      } catch (error) {
        console.log(`✗ ${content.slug}: ${(error as Error).message}`);
        process.exitCode = 1;
      }
    }
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error('content:apply failed to run:', error);
  process.exit(1);
});
