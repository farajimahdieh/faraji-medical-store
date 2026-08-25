import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecentlyViewedAndSearchHistory1787429141096 implements MigrationInterface {
  name = 'AddRecentlyViewedAndSearchHistory1787429141096';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_search_histories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "query" character varying(200) NOT NULL, "normalizedQuery" character varying(200) NOT NULL, "searchedAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_79658f1537da510196cb60da3e7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c425497929a47dad29ab739e4d" ON "user_search_histories"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_search_history_user_query" ON "user_search_histories"  ("userId", "normalizedQuery") `,
    );
    await queryRunner.query(
      `CREATE TABLE "recently_viewed_products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "productId" uuid NOT NULL, "viewedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b1ef2db473bb280c432141f5a8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a7e9a9cdec9a7524d34d1d54e7" ON "recently_viewed_products"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_recently_viewed_user_product" ON "recently_viewed_products"  ("userId", "productId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_search_histories" ADD CONSTRAINT "FK_c425497929a47dad29ab739e4df" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recently_viewed_products" ADD CONSTRAINT "FK_a7e9a9cdec9a7524d34d1d54e7a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recently_viewed_products" ADD CONSTRAINT "FK_e5a3b31eb918b9ae52bba1c3df5" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recently_viewed_products" DROP CONSTRAINT "FK_e5a3b31eb918b9ae52bba1c3df5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recently_viewed_products" DROP CONSTRAINT "FK_a7e9a9cdec9a7524d34d1d54e7a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_search_histories" DROP CONSTRAINT "FK_c425497929a47dad29ab739e4df"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_recently_viewed_user_product"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a7e9a9cdec9a7524d34d1d54e7"`,
    );
    await queryRunner.query(`DROP TABLE "recently_viewed_products"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_search_history_user_query"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c425497929a47dad29ab739e4d"`,
    );
    await queryRunner.query(`DROP TABLE "user_search_histories"`);
  }
}
