import { MigrationInterface, QueryRunner } from "typeorm";

export class AdminHardeningAndCoupons1788114077604 implements MigrationInterface {
    name = 'AdminHardeningAndCoupons1788114077604'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actorAdminId" uuid NOT NULL, "action" character varying NOT NULL, "entityType" character varying NOT NULL, "entityId" character varying, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_420d3e522a8e0979f57270d635" ON "audit_logs"  ("actorAdminId") `);
        await queryRunner.query(`CREATE TABLE "site_contents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying(50) NOT NULL, "title" character varying(200) NOT NULL, "body" text NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9835e5dd7f2c8783ef79e3fab0c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_385cedfea976a85d36120272d9" ON "site_contents"  ("key") `);
        await queryRunner.query(`CREATE TABLE "coupon_audience_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "discountCodeId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_4de87b2288f4d93e4808c6aba31" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_692bed5309581abf2703276cbc" ON "coupon_audience_members"  ("discountCodeId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_coupon_audience_members_coupon_user" ON "coupon_audience_members"  ("discountCodeId", "userId") `);
        await queryRunner.query(`ALTER TABLE "admin_profiles" ADD "activatedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`CREATE TYPE "public"."discount_codes_audiencetype_enum" AS ENUM('all', 'specific_users', 'no_orders_ever', 'no_orders_in_months', 'min_orders', 'min_spend')`);
        await queryRunner.query(`ALTER TABLE "discount_codes" ADD "audienceType" "public"."discount_codes_audiencetype_enum" NOT NULL DEFAULT 'all'`);
        await queryRunner.query(`ALTER TABLE "discount_codes" ADD "audienceMonths" integer`);
        await queryRunner.query(`ALTER TABLE "discount_codes" ADD "audienceMinOrders" integer`);
        await queryRunner.query(`ALTER TABLE "discount_codes" ADD "audienceMinSpend" integer`);
        await queryRunner.query(`ALTER TABLE "discount_codes" ADD "createdByAdminId" uuid`);
        await queryRunner.query(`ALTER TABLE "discount_codes" ADD "internalReason" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "discount_codes" ADD "campaignName" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "admin_profiles" ALTER COLUMN "passwordHash" DROP NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."otp_codes_purpose_enum" ADD VALUE 'admin_activation'`);
        await queryRunner.query(`ALTER TABLE "coupon_audience_members" ADD CONSTRAINT "FK_692bed5309581abf2703276cbca" FOREIGN KEY ("discountCodeId") REFERENCES "discount_codes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "coupon_audience_members" ADD CONSTRAINT "FK_7385c3c40d4a0eb1e1064a830cd" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "coupon_audience_members" DROP CONSTRAINT "FK_7385c3c40d4a0eb1e1064a830cd"`);
        await queryRunner.query(`ALTER TABLE "coupon_audience_members" DROP CONSTRAINT "FK_692bed5309581abf2703276cbca"`);
        await queryRunner.query(`CREATE TYPE "public"."otp_codes_purpose_enum_old" AS ENUM('customer_login', 'admin_login')`);
        await queryRunner.query(`ALTER TABLE "otp_codes" ALTER COLUMN "purpose" TYPE "public"."otp_codes_purpose_enum_old" USING "purpose"::"text"::"public"."otp_codes_purpose_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."otp_codes_purpose_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."otp_codes_purpose_enum_old" RENAME TO "otp_codes_purpose_enum"`);
        await queryRunner.query(`ALTER TABLE "admin_profiles" ALTER COLUMN "passwordHash" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "discount_codes" DROP COLUMN "campaignName"`);
        await queryRunner.query(`ALTER TABLE "discount_codes" DROP COLUMN "internalReason"`);
        await queryRunner.query(`ALTER TABLE "discount_codes" DROP COLUMN "createdByAdminId"`);
        await queryRunner.query(`ALTER TABLE "discount_codes" DROP COLUMN "audienceMinSpend"`);
        await queryRunner.query(`ALTER TABLE "discount_codes" DROP COLUMN "audienceMinOrders"`);
        await queryRunner.query(`ALTER TABLE "discount_codes" DROP COLUMN "audienceMonths"`);
        await queryRunner.query(`ALTER TABLE "discount_codes" DROP COLUMN "audienceType"`);
        await queryRunner.query(`DROP TYPE "public"."discount_codes_audiencetype_enum"`);
        await queryRunner.query(`ALTER TABLE "admin_profiles" DROP COLUMN "activatedAt"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_coupon_audience_members_coupon_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_692bed5309581abf2703276cbc"`);
        await queryRunner.query(`DROP TABLE "coupon_audience_members"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_385cedfea976a85d36120272d9"`);
        await queryRunner.query(`DROP TABLE "site_contents"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_420d3e522a8e0979f57270d635"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
    }

}
