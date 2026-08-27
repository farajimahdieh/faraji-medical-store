import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderTables1787429141099 implements MigrationInterface {
  name = 'AddOrderTables1787429141099';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_paymentstatus_enum" AS ENUM('pending', 'paid', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "orderNumber" character varying(30) NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending_payment', "paymentStatus" "public"."orders_paymentstatus_enum" NOT NULL DEFAULT 'pending', "shippingRecipientName" character varying(150) NOT NULL, "shippingRecipientPhone" character varying(20) NOT NULL, "shippingProvince" character varying(100) NOT NULL, "shippingCity" character varying(100) NOT NULL, "shippingAddressLine" character varying(500) NOT NULL, "shippingPostalCode" character varying(10) NOT NULL, "shippingBuildingNumber" character varying(20), "shippingUnit" character varying(20), "addressId" uuid, "shippingMethod" character varying(100), "notes" character varying(1000), "subtotal" integer NOT NULL, "discountAmount" integer NOT NULL DEFAULT 0, "discountCodeId" uuid, "shippingAmount" integer NOT NULL DEFAULT 0, "taxAmount" integer NOT NULL DEFAULT 0, "totalAmount" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_orders" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_orders_userId" ON "orders" ("userId")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_orders_orderNumber" ON "orders" ("orderNumber")`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_addressId" FOREIGN KEY ("addressId") REFERENCES "user_addresses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_discountCodeId" FOREIGN KEY ("discountCodeId") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "productId" uuid, "variantId" uuid, "productName" character varying(255) NOT NULL, "variantSize" character varying, "sku" character varying, "unitPrice" integer NOT NULL, "quantity" integer NOT NULL, "lineTotal" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_order_items" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_order_items_orderId" ON "order_items" ("orderId")`);
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_orderId" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_variantId" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_variantId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_productId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_orderId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_order_items_orderId"`);
    await queryRunner.query(`DROP TABLE "order_items"`);

    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_discountCodeId"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_addressId"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_orderNumber"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_userId"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_paymentstatus_enum"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
  }
}
