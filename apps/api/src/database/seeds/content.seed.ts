// Seeds the 3 admin-editable content blocks so the admin content list isn't
// empty on first load. Idempotent -- upserts by key.
// Run with:
//   node --env-file=.env -r ts-node/register -r tsconfig-paths/register src/database/seeds/content.seed.ts
import dataSource from '../data-source';
import { SiteContent } from '../../content/entities/site-content.entity';

const DEFAULTS = [
  { key: 'about', title: 'درباره ما', body: '' },
  { key: 'contact', title: 'تماس با ما', body: '' },
  { key: 'faq', title: 'سوالات متداول', body: '' },
];

async function seed() {
  await dataSource.initialize();
  const contentRepo = dataSource.getRepository(SiteContent);

  for (const item of DEFAULTS) {
    const existing = await contentRepo.findOneBy({ key: item.key });
    if (!existing) {
      await contentRepo.save(contentRepo.create(item));
      console.log(`created content block: ${item.key}`);
    }
  }

  console.log('done');
  await dataSource.destroy();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
