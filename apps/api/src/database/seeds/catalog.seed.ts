// One-off seed script for manual/local verification of the catalog schema.
// Not wired into app startup. Run with:
//   node --env-file=.env -r ts-node/register -r tsconfig-paths/register src/database/seeds/catalog.seed.ts
import dataSource from '../data-source';
import { Brand } from '../../catalog/entities/brand.entity';
import { Category } from '../../catalog/entities/category.entity';
import { Product, ProductStatus } from '../../catalog/entities/product.entity';
import { ProductVariant } from '../../catalog/entities/product-variant.entity';

// Mock accounting IDs — placeholders to prove the schema works end to end.
// Not real IDs from the store's accounting software; overwrite via sync later.
const MOCK_ACCOUNTING_ID_PREFIX = 'MOCK-ACC-';

async function seed() {
  await dataSource.initialize();

  const brandRepo = dataSource.getRepository(Brand);
  const categoryRepo = dataSource.getRepository(Category);
  const productRepo = dataSource.getRepository(Product);
  const variantRepo = dataSource.getRepository(ProductVariant);

  let brand = await brandRepo.findOneBy({ slug: 'teb-o-sanat' });
  if (!brand) {
    brand = await brandRepo.save(
      brandRepo.create({
        name: 'طب و صنعت',
        slug: 'teb-o-sanat',
        website: 'https://teb-sanat.com',
      }),
    );
  }

  let rootCategory = await categoryRepo.findOneBy({
    slug: 'orthopedic-mobility-rehab',
  });
  if (!rootCategory) {
    rootCategory = await categoryRepo.save(
      categoryRepo.create({
        name: 'ارتوپدی، حرکتی و توانبخشی',
        slug: 'orthopedic-mobility-rehab',
      }),
    );
  }

  const subcategoryNames: Array<{ name: string; slug: string }> = [
    { name: 'زانوبند', slug: 'knee-support' },
    { name: 'کمربند طبی', slug: 'lumbar-support' },
    { name: 'مچ‌بند', slug: 'wrist-support' },
    { name: 'آرنج‌بند', slug: 'elbow-support' },
    { name: 'گردنبند طبی', slug: 'cervical-collar' },
    { name: 'قوزبند', slug: 'posture-corrector' },
    { name: 'شکم‌بند', slug: 'abdominal-belt' },
    { name: 'آویز دست', slug: 'arm-sling' },
    { name: 'مچ پا', slug: 'ankle-support' },
    { name: 'محصولات پا', slug: 'foot-products' },
    { name: 'کفی طبی', slug: 'orthopedic-insole' },
  ];

  const subcategories: Category[] = [];
  for (const { name, slug } of subcategoryNames) {
    let subcategory = await categoryRepo.findOneBy({ slug });
    if (!subcategory) {
      subcategory = await categoryRepo.save(
        categoryRepo.create({ name, slug, parentId: rootCategory.id }),
      );
    }
    subcategories.push(subcategory);
  }

  const lumbarSupport = subcategories.find((c) => c.slug === 'lumbar-support')!;

  let product = await productRepo.findOneBy({ slug: 'kamarband-kar' });
  if (!product) {
    product = await productRepo.save(
      productRepo.create({
        name: 'کمربند کار',
        slug: 'kamarband-kar',
        brandId: brand.id,
        categoryId: lumbarSupport.id,
        shortDescription: 'کمربند طبی مناسب کار و فعالیت روزانه',
        status: ProductStatus.ACTIVE,
      }),
    );
  }

  const variantSpecs = [
    { size: 'M', accountingId: `${MOCK_ACCOUNTING_ID_PREFIX}101`, stock: 4 },
    { size: 'L', accountingId: `${MOCK_ACCOUNTING_ID_PREFIX}102`, stock: 8 },
    { size: 'XL', accountingId: `${MOCK_ACCOUNTING_ID_PREFIX}103`, stock: 0 },
  ];

  for (const { size, accountingId, stock } of variantSpecs) {
    const existing = await variantRepo.findOneBy({
      productId: product.id,
      size,
    });
    if (!existing) {
      await variantRepo.save(
        variantRepo.create({
          productId: product.id,
          accountingId,
          accountingName: `کمربند کار - ${size}`,
          size,
          price: 1_250_000,
          stock,
          isActive: true,
        }),
      );
    }
  }

  console.log('Seed complete: brand, categories, product, variants ready.');
  await dataSource.destroy();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
