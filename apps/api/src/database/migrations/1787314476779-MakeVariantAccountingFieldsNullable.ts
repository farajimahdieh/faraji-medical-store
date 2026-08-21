import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeVariantAccountingFieldsNullable1787314476779 implements MigrationInterface {
  name = 'MakeVariantAccountingFieldsNullable1787314476779';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "accountingId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "price" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "stock" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "stock" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "stock" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "stock" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "price" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "accountingId" SET NOT NULL`,
    );
  }
}
