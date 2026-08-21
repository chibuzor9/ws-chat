CREATE TYPE "group_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TYPE "message_kind" AS ENUM('dm', 'gc');--> statement-breakpoint
CREATE TABLE "group_members" (
	"group_id" uuid,
	"user_id" uuid,
	"role" "group_role" DEFAULT 'member'::"group_role" NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_members_pkey" PRIMARY KEY("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"label" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY,
	"kind" "message_kind" NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_user_id" uuid,
	"receiver_group_id" uuid,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "receiver_matches_kind" CHECK ((
        ("kind" = 'dm' AND "receiver_user_id" IS NOT NULL AND "receiver_group_id" IS NULL)
        OR ("kind" = 'gc' AND "receiver_group_id" IS NOT NULL AND "receiver_user_id" IS NULL)
      )),
	CONSTRAINT "message_content_not_empty" CHECK (length(trim("content")) > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"username" text NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "group_members_user_id_idx" ON "group_members" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "one_admin_per_group" ON "group_members" ("group_id") WHERE "role" = 'admin';--> statement-breakpoint
CREATE INDEX "messages_dm_idx" ON "messages" ("sender_id","receiver_user_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST) WHERE "kind" = 'dm';--> statement-breakpoint
CREATE INDEX "messages_dm_reverse_idx" ON "messages" ("receiver_user_id","sender_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST) WHERE "kind" = 'dm';--> statement-breakpoint
CREATE INDEX "messages_group_idx" ON "messages" ("receiver_group_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST) WHERE "kind" = 'gc';--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_user_id_users_id_fkey" FOREIGN KEY ("receiver_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_group_id_groups_id_fkey" FOREIGN KEY ("receiver_group_id") REFERENCES "groups"("id") ON DELETE CASCADE;