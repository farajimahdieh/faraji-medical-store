import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductVideoTitle1787325559687 implements MigrationInterface {
  name = 'AddProductVideoTitle1787325559687';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "videoTitle" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "videoTitle"`);
  }
}
