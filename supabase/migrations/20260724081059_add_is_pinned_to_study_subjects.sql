-- Add is_pinned boolean column to study_subjects.
-- Lets a user manually pin a subject onto the Dashboard's "Today's Focus"
-- list instead of relying purely on the auto-computed priority sort.
-- Defaults to false — existing subjects are unaffected.

ALTER TABLE study_subjects
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;
