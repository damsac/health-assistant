CREATE TABLE "daily_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"category" text NOT NULL,
	"summary" text NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_log" ADD CONSTRAINT "daily_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_daily_log_user_id" ON "daily_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_daily_log_user_date" ON "daily_log" USING btree ("user_id","date");