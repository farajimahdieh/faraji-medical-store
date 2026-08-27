import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCouponRedemptions1787429141100 implements MigrationInterface {
  name = 'AddCouponRedemptions1787429141100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "coupon_redemptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "discountCodeId" uuid NOT NULL, "userId" uuid NOT NULL, "orderId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_coupon_redemptions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_coupon_redemptions_discountCodeId" ON "coupon_redemptions" ("discountCodeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_coupon_redemptions_userId" ON "coupon_redemptions" ("userId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_coupon_redemptions_order_code" ON "coupon_redemptions" ("orderId", "discountCodeId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_coupon_redemptions_discountCodeId" FOREIGN KEY ("discountCodeId") REFERENCES "discount_codes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_coupon_redemptions_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_coupon_redemptions_orderId" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_coupon_redemptions_orderId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_coupon_redemptions_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_coupon_redemptions_discountCodeId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."UQ_coupon_redemptions_order_code"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_coupon_redemptions_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_coupon_redemptions_discountCodeId"`);
    await queryRunner.query(`DROP TABLE "coupon_redemptions"`);
  }
}
