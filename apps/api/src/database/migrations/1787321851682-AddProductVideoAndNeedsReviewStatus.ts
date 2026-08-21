import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductVideoAndNeedsReviewStatus1787321851682 implements MigrationInterface {
  name = 'AddProductVideoAndNeedsReviewStatus1787321851682';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "videoUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "videoSource" character varying`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."products_status_enum" ADD VALUE 'needs_review'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."products_status_enum_old" AS ENUM('draft', 'incomplete', 'active', 'hidden', 'archived')`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "status" TYPE "public"."products_status_enum_old" USING "status"::"text"::"public"."products_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."products_status_enum_old" RENAME TO "products_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "videoSource"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "videoUrl"`);
  }
}
