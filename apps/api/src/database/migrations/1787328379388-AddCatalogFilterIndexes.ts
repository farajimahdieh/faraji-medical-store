import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCatalogFilterIndexes1787328379388 implements MigrationInterface {
  name = 'AddCatalogFilterIndexes1787328379388';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_46737aaee612228b83e0313e1c" ON "product_variants"  ("size") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ea86d0c514c4ecbb5694cbf57d" ON "products"  ("brandId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff56834e735fa78a15d0cf2192" ON "products"  ("categoryId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ff56834e735fa78a15d0cf2192"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ea86d0c514c4ecbb5694cbf57d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_46737aaee612228b83e0313e1c"`,
    );
  }
}
