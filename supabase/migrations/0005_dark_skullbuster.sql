CREATE TABLE "garmin_connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"garmin_email" text NOT NULL,
	"oauth1_token" text,
	"oauth2_token" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp,
	"last_sync_status" text,
	"last_sync_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "garmin_connection_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "health_metric" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"metric_type" text NOT NULL,
	"value" text NOT NULL,
	"unit" text,
	"recorded_at" timestamp NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"section_key" text NOT NULL,
	"completed" boolean DEFAULT false,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "sleep_hours_average" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "sleep_quality" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "typical_wake_time" time;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "typical_bed_time" time;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "meals_per_day" integer;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "typical_meal_times" text[];--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "snacking_habits" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "supplements_medications" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "health_conditions" text[];--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "stress_level" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "exercise_frequency" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "exercise_types" text[];--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "water_intake_liters" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "garmin_connected" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "garmin_user_id" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "profile_completion_percentage" integer DEFAULT 40;--> statement-breakpoint
ALTER TABLE "garmin_connection" ADD CONSTRAINT "garmin_connection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_metric" ADD CONSTRAINT "health_metric_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_sections" ADD CONSTRAINT "profile_sections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_garmin_connection_user_id" ON "garmin_connection" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_health_metric_user_id" ON "health_metric" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_health_metric_type_date" ON "health_metric" USING btree ("user_id","metric_type","recorded_at");--> statement-breakpoint
CREATE INDEX "idx_profile_section_user_id" ON "profile_sections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_profile_section_user_key" ON "profile_sections" USING btree ("user_id","section_key");