ALTER TABLE "todos" ADD COLUMN "target_date" timestamp;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "completed_by" text;