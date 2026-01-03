CREATE TABLE "user_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"height_cm" integer,
	"weight_grams" integer,
	"gender" text,
	"dietary_preferences" text[],
	"date_of_birth" timestamp,
	"measurement_system" text DEFAULT 'metric',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_profile_user_id" ON "user_profile" USING btree ("user_id");