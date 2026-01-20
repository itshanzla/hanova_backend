import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOtpsTable1768819012802 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create otps_type_enum type if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "otps_type_enum" AS ENUM('email_verification', 'password_reset');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create otps table if it doesn't exist
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "otps" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "code" character varying(6) NOT NULL,
                "type" "otps_type_enum" NOT NULL,
                "expiresAt" TIMESTAMP NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "PK_otps_id" PRIMARY KEY ("id")
            );
        `);

        // Add foreign key if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "otps" ADD CONSTRAINT "FK_otps_userId"
                FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create indexes if they don't exist
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_otps_userId" ON "otps" ("userId");
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_otps_code" ON "otps" ("code");
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_otps_expiresAt" ON "otps" ("expiresAt");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_otps_expiresAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_otps_code"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_otps_userId"`);

        // Drop foreign key constraint
        await queryRunner.query(`ALTER TABLE "otps" DROP CONSTRAINT IF EXISTS "FK_otps_userId"`);

        // Drop otps table
        await queryRunner.query(`DROP TABLE IF EXISTS "otps"`);

        // Drop enum type
        await queryRunner.query(`DROP TYPE IF EXISTS "otps_type_enum"`);
    }

}
