-- Create garmin_connection table
CREATE TABLE IF NOT EXISTS "garmin_connection" (
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
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create health_metric table
CREATE TABLE IF NOT EXISTS "health_metric" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"metric_type" text NOT NULL,
	"value" text NOT NULL,
	"unit" text,
	"recorded_at" timestamp NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "garmin_connection" ADD CONSTRAINT "garmin_connection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "health_metric" ADD CONSTRAINT "health_metric_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "garmin_connection_user_id_idx" ON "garmin_connection" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "health_metric_user_id_idx" ON "health_metric" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "health_metric_type_idx" ON "health_metric" USING btree ("metric_type");
CREATE INDEX IF NOT EXISTS "health_metric_recorded_at_idx" ON "health_metric" USING btree ("recorded_at");
