-- Migration: Update garmin_connection to use OAuth tokens instead of password
-- Drop the password column and add OAuth token columns

ALTER TABLE garmin_connection DROP COLUMN IF EXISTS garmin_password;
ALTER TABLE garmin_connection ADD COLUMN IF NOT EXISTS oauth1_token TEXT;
ALTER TABLE garmin_connection ADD COLUMN IF NOT EXISTS oauth2_token TEXT;
