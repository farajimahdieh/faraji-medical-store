import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCouponMaxDiscountAmount1787429141097
  implements MigrationInterface
{
  name = 'AddCouponMaxDiscountAmount1787429141097';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "discount_codes" ADD "maxDiscountAmount" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "discount_codes" DROP COLUMN "maxDiscountAmount"`,
    );
  }
}
