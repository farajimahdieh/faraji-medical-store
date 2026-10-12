// Creates content/products/<category>/<code>.json skeletons for every
// product in a category that doesn't have a content file yet.
// Usage (from apps/api):
//   pnpm content:scaffold -- --category=dressing-wound-care
import 'reflect-metadata';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { Product } from '../entities/product.entity';
import { ProductSource } from '../entities/product-source.entity';
import { ContentApplyModule } from './content-apply.module';
import { buildContentSkeleton } from './content-scaffold';

const REPO_ROOT = resolve(__dirname, '../../../../..');

function existingSlugs(dir: string): Set<string> {
  if (!existsSync(dir)) return new Set();
  return new Set(
    readdirSync(dir)
      .filter((file) => file.endsWith('.json'))
      .map(
        (file) =>
          (
            JSON.parse(readFileSync(join(dir, file), 'utf8')) as {
              slug?: string;
            }
          ).slug,
      )
      .filter((slug): slug is string => typeof slug === 'string'),
  );
}

async function main() {
  const category = process.argv
    .find((arg) => arg.startsWith('--category='))
    ?.split('=')[1];
  if (!category) {
    console.error('Usage: --category=<category-slug>');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(ContentApplyModule, {
    logger: ['warn', 'error'],
  });
  try {
    const dataSource = app.get(DataSource);
    const products = await dataSource.getRepository(Product).find({
      where: { category: { slug: category } },
      relations: { variants: true },
      order: { name: 'ASC' },
    });
    const dir = join(REPO_ROOT, 'content/products', category);
    const done = existingSlugs(dir);
    mkdirSync(dir, { recursive: true });

    let created = 0;
    for (const product of products) {
      if (done.has(product.slug)) continue;
      const source = await dataSource
        .getRepository(ProductSource)
        .findOneBy({ productId: product.id });
      // ASCII file names (the Holoo code) keep paths portable across OSes.
      const fileName = `${source?.externalProductCode ?? product.id}.json`;
      const skeleton = buildContentSkeleton({
        slug: product.slug,
        name: product.name,
        accountingNames: product.variants
          .map((variant) => variant.accountingName)
          .filter((name): name is string => name !== null),
        sizes: product.variants.map((variant) => variant.size),
      });
      writeFileSync(
        join(dir, fileName),
        JSON.stringify(skeleton, null, 2) + '\n',
      );
      created += 1;
    }
    console.log(
      `${products.length} product(s) in ${category}, ${created} new skeleton(s) in content/products/${category}/`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error('content:scaffold failed to run:', error);
  process.exit(1);
});
