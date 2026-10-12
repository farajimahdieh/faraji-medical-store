import { MigrationInterface, QueryRunner } from 'typeorm';

// Existing sessions default to non-admin, so every admin signs in once more
// through the password + OTP flow after this ships.
export class AddAdminSessionFlag1791796538526 implements MigrationInterface {
  name = 'AddAdminSessionFlag1791796538526';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD "isAdminSession" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP COLUMN "isAdminSession"`,
    );
  }
}
