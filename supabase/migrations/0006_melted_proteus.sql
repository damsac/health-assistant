DROP INDEX "idx_profile_section_user_key";--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_section" ON "profile_sections" USING btree ("user_id","section_key");