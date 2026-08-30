import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiChatTables1787862318930 implements MigrationInterface {
  name = 'AddAiChatTables1787862318930';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ai_conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ai_conversations" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_conversations_userId" ON "ai_conversations" ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ADD CONSTRAINT "FK_ai_conversations_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."ai_messages_role_enum" AS ENUM('user', 'assistant')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversationId" uuid NOT NULL, "role" "public"."ai_messages_role_enum" NOT NULL, "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ai_messages" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_messages_conversationId" ON "ai_messages" ("conversationId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_messages" ADD CONSTRAINT "FK_ai_messages_conversationId" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_messages" DROP CONSTRAINT "FK_ai_messages_conversationId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_messages_conversationId"`,
    );
    await queryRunner.query(`DROP TABLE "ai_messages"`);
    await queryRunner.query(`DROP TYPE "public"."ai_messages_role_enum"`);

    await queryRunner.query(
      `ALTER TABLE "ai_conversations" DROP CONSTRAINT "FK_ai_conversations_userId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_conversations_userId"`,
    );
    await queryRunner.query(`DROP TABLE "ai_conversations"`);
  }
}
