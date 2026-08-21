import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWishlistItems1787344186299 implements MigrationInterface {
  name = 'AddWishlistItems1787344186299';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "wishlist_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "productId" uuid NOT NULL, "variantId" uuid, "note" character varying(500), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0bd52924a97cda208ed2a07bd69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3167e7490f12ed329a36703d98" ON "wishlist_items"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_wishlist_user_product_variant" ON "wishlist_items"  ("userId", "productId", "variantId") WHERE "variantId" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_wishlist_user_product_no_variant" ON "wishlist_items"  ("userId", "productId") WHERE "variantId" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_3167e7490f12ed329a36703d980" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_485ece8ab9b569d1c560144aa25" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_60d00c5eb5d7373097aa5e1668b" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" DROP CONSTRAINT "FK_60d00c5eb5d7373097aa5e1668b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" DROP CONSTRAINT "FK_485ece8ab9b569d1c560144aa25"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" DROP CONSTRAINT "FK_3167e7490f12ed329a36703d980"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_wishlist_user_product_no_variant"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_wishlist_user_product_variant"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3167e7490f12ed329a36703d98"`,
    );
    await queryRunner.query(`DROP TABLE "wishlist_items"`);
  }
}
