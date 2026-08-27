import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdminRbacAndImageKeys1787851113493 implements MigrationInterface {
    name = 'AddAdminRbacAndImageKeys1787851113493'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "admin_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "passwordHash" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "failedLoginAttempts" integer NOT NULL DEFAULT '0', "lockedUntil" TIMESTAMP WITH TIME ZONE, "lastLoginAt" TIMESTAMP WITH TIME ZONE, "createdByUserId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_d1b5f61ecc9c83a766503b9eb7" UNIQUE ("userId"), CONSTRAINT "PK_89c52edc2b9c2178f1acd127f3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d1b5f61ecc9c83a766503b9eb7" ON "admin_profiles"  ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."otp_codes_purpose_enum" AS ENUM('customer_login', 'admin_login')`);
        await queryRunner.query(`ALTER TABLE "otp_codes" ADD "purpose" "public"."otp_codes_purpose_enum" NOT NULL DEFAULT 'customer_login'`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD "objectKey" character varying`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD "thumbnailKey" character varying`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" ADD VALUE 'super_admin'`);
        await queryRunner.query(`ALTER TABLE "admin_profiles" ADD CONSTRAINT "FK_d1b5f61ecc9c83a766503b9eb77" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin_profiles" DROP CONSTRAINT "FK_d1b5f61ecc9c83a766503b9eb77"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum_old" AS ENUM('customer', 'admin')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "thumbnailKey"`);
        await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "objectKey"`);
        await queryRunner.query(`ALTER TABLE "otp_codes" DROP COLUMN "purpose"`);
        await queryRunner.query(`DROP TYPE "public"."otp_codes_purpose_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d1b5f61ecc9c83a766503b9eb7"`);
        await queryRunner.query(`DROP TABLE "admin_profiles"`);
    }

}
