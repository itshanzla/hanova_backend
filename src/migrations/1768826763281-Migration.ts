import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1768826763281 implements MigrationInterface {
    name = 'Migration1768826763281'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otps" DROP CONSTRAINT "FK_otps_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_otps_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_otps_code"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_otps_expiresAt"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isActive"`);
        await queryRunner.query(`CREATE TYPE "public"."users_authprovider_enum" AS ENUM('email', 'google', 'facebook', 'apple')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "authProvider" "public"."users_authprovider_enum" NOT NULL DEFAULT 'email'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "socialProviderId" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "profilePicture" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profilePicture"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "socialProviderId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "authProvider"`);
        await queryRunner.query(`DROP TYPE "public"."users_authprovider_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_otps_expiresAt" ON "otps" ("expiresAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_otps_code" ON "otps" ("code") `);
        await queryRunner.query(`CREATE INDEX "IDX_otps_userId" ON "otps" ("userId") `);
        await queryRunner.query(`ALTER TABLE "otps" ADD CONSTRAINT "FK_otps_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
