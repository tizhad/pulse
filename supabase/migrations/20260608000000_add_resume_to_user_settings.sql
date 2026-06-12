-- Add resume jsonb column to user_settings.
-- Stores structured resume data: skills, experience, education, certifications, rawText.
-- Nullable — users who haven't added a resume yet have NULL here.

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS resume jsonb;
