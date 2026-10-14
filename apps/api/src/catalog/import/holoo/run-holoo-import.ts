// CLI entry point for importing a Holoo Excel export (one category per file).
// Usage (from apps/api):
//   pnpm import:holoo -- --file=../../data-private/Holo_01_Wound_Care.xlsx --category=dressing-wound-care --dry-run
//   pnpm import:holoo -- --file=../../data-private/Holo_01_Wound_Care.xlsx --category=dressing-wound-care
//   pnpm import:holoo -- --file=... --category=... --plan   # show how rows map to
//                                                          # existing products; writes nothing
//
// Manual decisions for ambiguous matches go in content/holoo-matches.json
// (or --matches=<path>): { "<holoo code>": "<product slug>" | "new" | "skip" },
// or { "<holoo code>": { "product"?, "group"?, "size"? } } to regroup a row
// or fix its size (see ItemOverride).
//
// --dry-run only reads the file and prints the report -- it never connects
// to the database, so it is safe to run on any machine.
import 'reflect-metadata';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { readSheet } from 'read-excel-file/node';
import { NestFactory } from '@nestjs/core';

import {
  applyItemOverrides,
  groupBySize,
  HolooGroup,
  parseHolooSheet,
  SheetCell,
} from './holoo-sheet';
import { HolooImportModule } from './holoo-import.module';
import {
  HolooImportService,
  HolooImportSummary,
  MatchOverrides,
} from './holoo-import.service';

const REPO_ROOT = resolve(__dirname, '../../../../../..');

function parseArgs(argv: string[]) {
  const value = (name: string) =>
    argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];
  return {
    file: value('file'),
    category: value('category'),
    dryRun: argv.includes('--dry-run'),
    planOnly: argv.includes('--plan'),
    matches: value('matches'),
  };
}

function printReport(groups: HolooGroup[], errors: string[]): void {
  const items = groups.flatMap((g) => g.items);
  console.log(`\nکالا (ردیف): ${items.length}`);
  console.log(`محصول روی سایت (بعد از ادغام سایزها): ${groups.length}`);

  const merged = groups.filter((g) => g.items.length > 1);
  if (merged.length > 0) {
    console.log('\n--- ادغام سایزها ---');
    for (const group of merged) {
      console.log(
        `• ${group.name}: ${group.items.map((i) => i.size).join('، ')}`,
      );
    }
  }

  const flagged = items.filter((i) => i.issues.length > 0);
  if (flagged.length > 0 || errors.length > 0) {
    console.log('\n--- نیاز به بررسی (در هلو اصلاح کنید) ---');
    for (const error of errors) console.log(`✗ ${error}`);
    for (const item of flagged) {
      console.log(
        `⚠ ردیف ${item.rowNumber} «${item.name}»: ${item.issues.join('؛ ')}`,
      );
    }
  }
}

function loadOverrides(path: string | undefined): MatchOverrides {
  const file = path
    ? resolve(path)
    : join(REPO_ROOT, 'content/holoo-matches.json');
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, 'utf8')) as MatchOverrides;
}

function printPlan(summary: HolooImportSummary): void {
  const byKind = (kind: string) =>
    summary.plan.filter((entry) => entry.action.kind === kind);
  console.log(
    `\nوصل به محصول موجود: ${byKind('matched').length}، قبلاً وصل‌شده: ${byKind('linked').length}، محصول جدید: ${byKind('new').length}، رد شده: ${byKind('skip').length}`,
  );
  for (const { group, action } of summary.plan) {
    if (action.kind === 'matched') {
      const score = action.score === null ? 'دستی' : action.score.toFixed(2);
      console.log(`↔ ${group.name} ← «${action.productName}» (${score})`);
    } else if (action.kind === 'skip') {
      console.log(
        `✗ ${group.name} [${group.items.map((i) => i.code).join(',')}]: ${action.reason}`,
      );
    } else if (action.kind === 'new') {
      console.log(`+ ${group.name}`);
    } else if (action.mergeFrom.length > 0) {
      console.log(
        `⇉ ${group.name}: ${action.mergeFrom.length} صفحه‌ی جدا در «${action.productName}» ادغام می‌شود`,
      );
    }
  }
  for (const conflict of summary.conflicts) console.log(`⚠ ${conflict}`);
}

async function main() {
  const { file, category, dryRun, planOnly, matches } = parseArgs(
    process.argv.slice(2),
  );
  if (!file || (!dryRun && !category)) {
    console.error(
      'Usage: --file=<path.xlsx> --category=<category-slug> [--dry-run]',
    );
    process.exit(1);
  }
  const path = resolve(file);
  if (!existsSync(path)) {
    console.error(`فایل پیدا نشد: ${path}`);
    process.exit(1);
  }
  if (extname(path).toLowerCase() !== '.xlsx') {
    console.error(
      'فقط فایل .xlsx پشتیبانی می‌شود. فایل را در Excel باز کنید و با Save As به فرمت «Excel Workbook (*.xlsx)» ذخیره کنید.',
    );
    process.exit(1);
  }

  const rows = (await readSheet(path)) as SheetCell[][];
  const { items, errors } = parseHolooSheet(rows);
  const overrides = loadOverrides(matches);
  const groups = groupBySize(applyItemOverrides(items, overrides));
  printReport(groups, errors);

  if (dryRun) {
    console.log('\n(dry run -- چیزی در دیتابیس ذخیره نشد)');
    return;
  }
  if (errors.length > 0) {
    console.error('\nبه‌خاطر خطاهای بالا چیزی وارد نشد.');
    process.exitCode = 1;
    return;
  }

  const app = await NestFactory.createApplicationContext(HolooImportModule, {
    logger: ['warn', 'error'],
  });
  try {
    const summary = await app
      .get(HolooImportService)
      .run(groups, category!, { planOnly, overrides });
    printPlan(summary);
    if (planOnly) {
      console.log('\n(plan -- چیزی در دیتابیس ذخیره نشد)');
      return;
    }
    console.log(
      `\nمحصول جدید: ${summary.createdProducts}، تنوع جدید: ${summary.createdVariants}، تنوع به‌روزشده: ${summary.updatedVariants}، تنوع منتقل‌شده: ${summary.movedVariants}`,
    );
    for (const slug of summary.archivedProducts) {
      console.log(`▣ بایگانی شد (ادغام شده در محصول دیگر): ${slug}`);
    }
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error('Import failed to run:', error);
  process.exit(1);
});
