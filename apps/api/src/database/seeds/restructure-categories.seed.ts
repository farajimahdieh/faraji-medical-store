// One-off, idempotent restructuring of the category taxonomy into the 8
// top-level groups the store actually sells across -- matching the exact
// names/slugs the frontend's static nav data (apps/web/src/data/categories.ts)
// already links to, so MegaMenu/homepage links resolve against real DB rows.
// Safe to re-run: root categories are upserted by slug, and the only
// existing-data change is re-parenting "کفی طبی" (previously an Orthopedic
// subcategory) under the new "کفش و کفی طبی" root -- no product rows are
// touched, since products point at whichever category row already holds them.
// Run with:
//   node --env-file=.env -r ts-node/register -r tsconfig-paths/register src/database/seeds/restructure-categories.seed.ts
import dataSource from '../data-source';
import { Category } from '../../catalog/entities/category.entity';

const ROOT_CATEGORIES = [
  { name: 'پانسمان و زخم بستر', slug: 'dressing-wound-care', sortOrder: 1 },
  {
    name: 'ابزار جراحی و تجهیزات مطب',
    slug: 'surgical-instruments',
    sortOrder: 2,
  },
  {
    name: 'تشخیص، پایش سلامت و تجهیزات تنفسی',
    slug: 'diagnostics-respiratory',
    sortOrder: 3,
  },
  { name: 'بهداشت و ضدعفونی', slug: 'hygiene-disinfection', sortOrder: 4 },
  { name: 'کفش و کفی طبی', slug: 'medical-footwear', sortOrder: 5 },
  {
    name: 'تجهیزات مصرفی پزشکی و بیمارستانی',
    slug: 'medical-consumables',
    sortOrder: 6,
  },
  {
    name: 'ارتوپدی، حرکتی و توانبخشی',
    slug: 'orthopedic-mobility-rehab',
    sortOrder: 7,
  },
  { name: 'تجهیزات و ملزومات آزمایشگاهی', slug: 'lab-equipment', sortOrder: 8 },
] as const;

// Corrects the slugs this script itself created on its first (wrong) run --
// harmless no-op anywhere that never had these.
const SLUG_RENAMES: Record<string, string> = {
  'wound-care-dressing': 'dressing-wound-care',
  'surgical-instruments-clinic-equipment': 'surgical-instruments',
  'diagnostics-monitoring-respiratory': 'diagnostics-respiratory',
  'orthopedic-shoes-insoles': 'medical-footwear',
  'medical-hospital-consumables': 'medical-consumables',
  'laboratory-equipment-supplies': 'lab-equipment',
};

async function seed() {
  await dataSource.initialize();
  const categoryRepo = dataSource.getRepository(Category);

  for (const [oldSlug, newSlug] of Object.entries(SLUG_RENAMES)) {
    const old = await categoryRepo.findOneBy({ slug: oldSlug });
    const alreadyCorrect = await categoryRepo.findOneBy({ slug: newSlug });
    if (old && !alreadyCorrect) {
      old.slug = newSlug;
      await categoryRepo.save(old);
      console.log(`renamed slug: ${oldSlug} -> ${newSlug}`);
    }
  }

  const rootsBySlug = new Map<string, Category>();
  for (const root of ROOT_CATEGORIES) {
    let category = await categoryRepo.findOneBy({ slug: root.slug });
    if (!category) {
      category = categoryRepo.create({
        name: root.name,
        slug: root.slug,
        sortOrder: root.sortOrder,
        parentId: null,
      });
      console.log(`creating root category: ${root.name}`);
    } else {
      category.name = root.name;
      category.sortOrder = root.sortOrder;
      category.parentId = null;
    }
    category = await categoryRepo.save(category);
    rootsBySlug.set(root.slug, category);
  }

  // "کفی طبی" already exists as an Orthopedic subcategory with real
  // products on it -- move it under the new "کفش و کفی طبی" root instead
  // of creating a duplicate.
  const insoles = await categoryRepo.findOneBy({ slug: 'orthopedic-insole' });
  const shoesRoot = rootsBySlug.get('medical-footwear')!;
  if (insoles && insoles.parentId !== shoesRoot.id) {
    insoles.parentId = shoesRoot.id;
    await categoryRepo.save(insoles);
    console.log('moved "کفی طبی" under "کفش و کفی طبی"');
  }

  console.log('done');
  await dataSource.destroy();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
