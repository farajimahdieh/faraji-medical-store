import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscountCodes1787422063175 implements MigrationInterface {
  name = 'AddDiscountCodes1787422063175';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."discount_codes_type_enum" AS ENUM('percentage', 'fixed_amount')`,
    );
    await queryRunner.query(
      `CREATE TABLE "discount_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "type" "public"."discount_codes_type_enum" NOT NULL, "value" integer NOT NULL, "startsAt" TIMESTAMP WITH TIME ZONE, "expiresAt" TIMESTAMP WITH TIME ZONE, "usageLimit" integer, "usagePerUser" integer, "minimumOrderAmount" integer, "isActive" boolean NOT NULL DEFAULT true, "userId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c0170a28d937472e9ce50fdce17" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b967edd0d46547d4a92b4a1c6b" ON "discount_codes"  ("code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_54e6b943ec6521f21339b42885" ON "discount_codes"  ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_codes" ADD CONSTRAINT "FK_54e6b943ec6521f21339b428854" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "discount_codes" DROP CONSTRAINT "FK_54e6b943ec6521f21339b428854"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_54e6b943ec6521f21339b42885"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b967edd0d46547d4a92b4a1c6b"`,
    );
    await queryRunner.query(`DROP TABLE "discount_codes"`);
    await queryRunner.query(`DROP TYPE "public"."discount_codes_type_enum"`);
  }
}
