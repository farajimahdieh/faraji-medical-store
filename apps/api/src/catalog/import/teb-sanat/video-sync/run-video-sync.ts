// CLI entry point for matching teb-sanat.com's official Aparat channel
// (aparat.com/tebosanat) videos to already-imported products.
// Usage (from apps/api):
//   pnpm sync:teb-sanat-videos -- --dry-run
//   pnpm sync:teb-sanat-videos
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { TebSanatVideoSyncModule } from './teb-sanat-video-sync.module';
import {
  TebSanatVideoSyncService,
  VideoSyncSummary,
} from './teb-sanat-video-sync.service';

function parseArgs(argv: string[]) {
  return { dryRun: argv.includes('--dry-run') };
}

function printSummary(summary: VideoSyncSummary, dryRun: boolean): void {
  console.log('');
  console.log(
    dryRun ? '=== Video Sync Dry Run ===' : '=== Video Sync Summary ===',
  );
  console.log(`Products checked: ${summary.productsChecked}`);
  console.log(`Videos found: ${summary.videosFound}`);
  console.log(`High confidence matches: ${summary.highConfidenceMatches}`);
  console.log(`Needs review: ${summary.needsReview}`);
  console.log(`No video found: ${summary.noVideoFound}`);

  const reviewEntries = summary.entries.filter(
    (entry) => entry.outcome === 'needs_review',
  );
  if (reviewEntries.length > 0) {
    console.log('\n--- Needs review ---');
    for (const entry of reviewEntries) {
      console.log(`\nProduct:\n${entry.productName}`);
      console.log(`\nCandidate video:\n${entry.videoTitle}`);
      console.log(`(${entry.videoUrl})`);
      console.log(`\nConfidence:\n${entry.confidencePercent}%`);
    }
  }

  const matchedEntries = summary.entries.filter(
    (entry) => entry.outcome !== 'needs_review',
  );
  if (matchedEntries.length > 0) {
    console.log('\n--- Matched ---');
    for (const entry of matchedEntries) {
      const marker = entry.outcome === 'updated' ? '✓' : '=';
      console.log(
        `${marker} ${entry.productName} → ${entry.videoTitle} (${entry.confidencePercent}%)`,
      );
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  console.log(`Running teb-sanat video sync (dryRun=${options.dryRun})`);

  const app = await NestFactory.createApplicationContext(
    TebSanatVideoSyncModule,
    { logger: ['log', 'warn', 'error'] },
  );

  try {
    const service = app.get(TebSanatVideoSyncService);
    const summary = await service.run(options);
    printSummary(summary, options.dryRun);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error('Video sync failed to run:', error);
  process.exit(1);
});
