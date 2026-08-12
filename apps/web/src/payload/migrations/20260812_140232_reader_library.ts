import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "readers" ADD COLUMN "saved_stories" jsonb;
  ALTER TABLE "readers" ADD COLUMN "reading_history" jsonb;
  ALTER TABLE "readers" ADD COLUMN "library_tombstones" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "readers" DROP COLUMN "saved_stories";
  ALTER TABLE "readers" DROP COLUMN "reading_history";
  ALTER TABLE "readers" DROP COLUMN "library_tombstones";`)
}
