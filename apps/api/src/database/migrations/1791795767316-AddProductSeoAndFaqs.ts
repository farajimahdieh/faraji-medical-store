import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductSeoAndFaqs1791795767316 implements MigrationInterface {
  name = 'AddProductSeoAndFaqs1791795767316';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_faqs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "question" text NOT NULL, "answer" text NOT NULL, "sortOrder" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_aaf0942b97426c4618f230bb0ce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_faqs" ADD CONSTRAINT "FK_711bb0b25e2954b29141b7b6c78" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "metaTitle" character varying(70)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "metaDescription" character varying(170)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "metaDescription"`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "metaTitle"`);
    await queryRunner.query(
      `ALTER TABLE "product_faqs" DROP CONSTRAINT "FK_711bb0b25e2954b29141b7b6c78"`,
    );
    await queryRunner.query(`DROP TABLE "product_faqs"`);
  }
}
