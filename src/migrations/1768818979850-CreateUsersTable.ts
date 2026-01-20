import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1768818979850 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users_role_enum type if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "users_role_enum" AS ENUM('admin', 'host', 'user');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create users table if it doesn't exist
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "email" character varying(255) NOT NULL,
                "password" character varying NOT NULL,
                "role" "users_role_enum" NOT NULL DEFAULT 'user',
                "isEmailVerified" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
            );
        `);

        // Create index on email for faster lookups
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);

        // Drop users table
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

        // Drop enum type
        await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
    }

}
