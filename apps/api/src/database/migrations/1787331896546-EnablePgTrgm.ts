import { MigrationInterface, QueryRunner } from 'typeorm';

// Powers the typo-tolerant fallback tier in product search suggestions
// (similarity()/% operator) — see product-suggestions.service.ts. No index
// added: the catalog is small enough that a sequential scan is instant, and
// premature indexing here would just be dead weight.
export class EnablePgTrgm1787331896546 implements MigrationInterface {
  name = 'EnablePgTrgm1787331896546';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP EXTENSION IF EXISTS "pg_trgm"`);
  }
}
