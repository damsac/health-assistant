CREATE TABLE "garmin_connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"garmin_email" text NOT NULL,
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
ALTER TABLE "garmin_connection" ADD CONSTRAINT "garmin_connection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_metric" ADD CONSTRAINT "health_metric_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_garmin_connection_user_id" ON "garmin_connection" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_health_metric_user_id" ON "health_metric" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_health_metric_type_date" ON "health_metric" USING btree ("user_id","metric_type","recorded_at");