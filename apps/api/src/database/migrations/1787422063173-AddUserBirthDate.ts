import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserBirthDate1787422063173 implements MigrationInterface {
  name = 'AddUserBirthDate1787422063173';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "birthDate" date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "birthDate"`);
  }
}
