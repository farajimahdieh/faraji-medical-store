import { MigrationInterface, QueryRunner } from 'typeorm';

// Offline payment methods; address fields become optional for in-store
// pickup orders. Existing orders keep paymentMethod = NULL.
export class AddOrderPaymentMethod1791815163972 implements MigrationInterface {
  name = 'AddOrderPaymentMethod1791815163972';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."orders_paymentmethod_enum" AS ENUM('cash_on_delivery', 'pay_at_store')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "paymentMethod" "public"."orders_paymentmethod_enum"`,
    );
    for (const column of [
      'shippingProvince',
      'shippingCity',
      'shippingAddressLine',
      'shippingPostalCode',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "orders" ALTER COLUMN "${column}" DROP NOT NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Fails if pickup orders (NULL address) exist -- those must be handled
    // before rolling back.
    for (const column of [
      'shippingPostalCode',
      'shippingAddressLine',
      'shippingCity',
      'shippingProvince',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "orders" ALTER COLUMN "${column}" SET NOT NULL`,
      );
    }
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "paymentMethod"`);
    await queryRunner.query(`DROP TYPE "public"."orders_paymentmethod_enum"`);
  }
}
