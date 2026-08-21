// CLI entry point for importing teb-sanat.com's orthopedic catalog.
// Usage (from apps/api):
//   pnpm import:teb-sanat -- --dry-run --limit=5
//   pnpm import:teb-sanat -- --limit=5
//   pnpm import:teb-sanat
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { TebSanatImportModule } from './teb-sanat-import.module';
import {
  TebSanatImportService,
  ImportSummary,
} from './teb-sanat-import.service';

function parseArgs(argv: string[]) {
  const dryRun = argv.includes('--dry-run');
  const noCache = argv.includes('--no-cache');
  const limitArg = argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined;
  return { dryRun, limit, useCache: !noCache };
}

function printSummary(summary: ImportSummary, dryRun: boolean): void {
  console.log('');
  console.log(dryRun ? '=== Dry Run Summary ===' : '=== Import Summary ===');
  console.log(`Found: ${summary.found}`);
  console.log(`Processed: ${summary.processed}`);
  console.log(`${dryRun ? 'New' : 'Created'}: ${summary.created}`);
  console.log(
    `${dryRun ? 'Existing (would update)' : 'Updated'}: ${summary.updated}`,
  );
  console.log(
    `Needs review (uncertain category or size): ${summary.needsReview}`,
  );
  console.log(`Failed: ${summary.failed}`);

  const reviewEntries = summary.entries.filter((e) => e.needsReview);
  if (reviewEntries.length > 0) {
    console.log('\n--- Needs review ---');
    for (const entry of reviewEntries) {
      console.log(`⚠ ${entry.productName}`);
    }
  }

  const failedEntries = summary.entries.filter((e) => e.outcome === 'failed');
  if (failedEntries.length > 0) {
    console.log('\n--- Failed ---');
    for (const entry of failedEntries) {
      console.log(`✗ ${entry.productName}: ${entry.message}`);
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  console.log(
    `Running teb-sanat import (dryRun=${options.dryRun}, limit=${
      options.limit ?? 'none'
    }, cache=${options.useCache})`,
  );

  const app = await NestFactory.createApplicationContext(TebSanatImportModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const service = app.get(TebSanatImportService);
    const summary = await service.run(options);
    printSummary(summary, options.dryRun);
    process.exitCode = summary.failed > 0 ? 1 : 0;
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error('Import failed to run:', error);
  process.exit(1);
});
