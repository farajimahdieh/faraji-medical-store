import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAddresses1787422063174 implements MigrationInterface {
  name = 'AddUserAddresses1787422063174';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "title" character varying(100) NOT NULL, "recipientName" character varying(150) NOT NULL, "recipientPhone" character varying(20) NOT NULL, "province" character varying(100) NOT NULL, "city" character varying(100) NOT NULL, "addressLine" character varying(500) NOT NULL, "postalCode" character varying(10) NOT NULL, "buildingNumber" character varying(20), "unit" character varying(20), "isDefault" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8abbeb5e3239ff7877088ffc25b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_781afdedafe920f331f6229cb6" ON "user_addresses"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_addresses_user_default" ON "user_addresses"  ("userId") WHERE "isDefault" = true`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ADD CONSTRAINT "FK_781afdedafe920f331f6229cb62" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_addresses" DROP CONSTRAINT "FK_781afdedafe920f331f6229cb62"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_user_addresses_user_default"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_781afdedafe920f331f6229cb6"`,
    );
    await queryRunner.query(`DROP TABLE "user_addresses"`);
  }
}
