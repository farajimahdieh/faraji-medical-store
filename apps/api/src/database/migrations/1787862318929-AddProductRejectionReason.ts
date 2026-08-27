import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductRejectionReason1787862318929 implements MigrationInterface {
    name = 'AddProductRejectionReason1787862318929'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "rejectionReason" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "rejectionReason"`);
    }

}
