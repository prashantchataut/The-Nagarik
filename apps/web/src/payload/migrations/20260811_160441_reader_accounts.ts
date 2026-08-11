import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_readers_avatar_color" AS ENUM('teal', 'blue', 'maroon', 'violet', 'forest', 'slate');
  CREATE TYPE "public"."enum_readers_locale" AS ENUM('ne', 'en');
  CREATE TYPE "public"."enum_journalist_applications_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_journalist_applications_locale" AS ENUM('ne', 'en');
  CREATE TABLE "readers_interests" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE "readers_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "readers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"avatar_color" "enum_readers_avatar_color" DEFAULT 'teal',
  	"locale" "enum_readers_locale" DEFAULT 'ne',
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "journalist_applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"organization" varchar,
  	"portfolio_url" varchar,
  	"message" varchar,
  	"status" "enum_journalist_applications_status" DEFAULT 'pending' NOT NULL,
  	"reviewed_by_id" integer,
  	"created_user_id" integer,
  	"locale" "enum_journalist_applications_locale" DEFAULT 'ne',
  	"ip_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "readers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "journalist_applications_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "readers_id" integer;
  ALTER TABLE "readers_interests" ADD CONSTRAINT "readers_interests_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."readers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "readers_sessions" ADD CONSTRAINT "readers_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."readers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "journalist_applications" ADD CONSTRAINT "journalist_applications_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "journalist_applications" ADD CONSTRAINT "journalist_applications_created_user_id_users_id_fk" FOREIGN KEY ("created_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "readers_interests_order_idx" ON "readers_interests" USING btree ("_order");
  CREATE INDEX "readers_interests_parent_id_idx" ON "readers_interests" USING btree ("_parent_id");
  CREATE INDEX "readers_sessions_order_idx" ON "readers_sessions" USING btree ("_order");
  CREATE INDEX "readers_sessions_parent_id_idx" ON "readers_sessions" USING btree ("_parent_id");
  CREATE INDEX "readers_updated_at_idx" ON "readers" USING btree ("updated_at");
  CREATE INDEX "readers_created_at_idx" ON "readers" USING btree ("created_at");
  CREATE UNIQUE INDEX "readers_email_idx" ON "readers" USING btree ("email");
  CREATE INDEX "journalist_applications_email_idx" ON "journalist_applications" USING btree ("email");
  CREATE INDEX "journalist_applications_status_idx" ON "journalist_applications" USING btree ("status");
  CREATE INDEX "journalist_applications_reviewed_by_idx" ON "journalist_applications" USING btree ("reviewed_by_id");
  CREATE INDEX "journalist_applications_created_user_idx" ON "journalist_applications" USING btree ("created_user_id");
  CREATE INDEX "journalist_applications_updated_at_idx" ON "journalist_applications" USING btree ("updated_at");
  CREATE INDEX "journalist_applications_created_at_idx" ON "journalist_applications" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_readers_fk" FOREIGN KEY ("readers_id") REFERENCES "public"."readers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_journalist_applications_fk" FOREIGN KEY ("journalist_applications_id") REFERENCES "public"."journalist_applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_readers_fk" FOREIGN KEY ("readers_id") REFERENCES "public"."readers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_readers_id_idx" ON "payload_locked_documents_rels" USING btree ("readers_id");
  CREATE INDEX "payload_locked_documents_rels_journalist_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("journalist_applications_id");
  CREATE INDEX "payload_preferences_rels_readers_id_idx" ON "payload_preferences_rels" USING btree ("readers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "readers_interests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "readers_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "readers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "journalist_applications" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "readers_interests" CASCADE;
  DROP TABLE "readers_sessions" CASCADE;
  DROP TABLE "readers" CASCADE;
  DROP TABLE "journalist_applications" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_readers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_journalist_applications_fk";
  
  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_readers_fk";
  
  DROP INDEX "payload_locked_documents_rels_readers_id_idx";
  DROP INDEX "payload_locked_documents_rels_journalist_applications_id_idx";
  DROP INDEX "payload_preferences_rels_readers_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "readers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "journalist_applications_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN "readers_id";
  DROP TYPE "public"."enum_readers_avatar_color";
  DROP TYPE "public"."enum_readers_locale";
  DROP TYPE "public"."enum_journalist_applications_status";
  DROP TYPE "public"."enum_journalist_applications_locale";`)
}
