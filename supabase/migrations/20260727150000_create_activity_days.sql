-- ─────────────────────────────────────────────────────────────────────────────
-- Daily activity tracking (powers the dashboard streak + heatmap)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_days (
  user_id           uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  activity_date     date NOT NULL,
  study_count       integer NOT NULL DEFAULT 0,
  application_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, activity_date)
);

ALTER TABLE activity_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_days: owner access"
  ON activity_days FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atomic upsert-increment for today's row, called from the client whenever a
-- study review or application action happens. SECURITY DEFINER + auth.uid()
-- so a caller can only ever bump their own row.
CREATE OR REPLACE FUNCTION bump_activity(p_kind text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_kind NOT IN ('study', 'application') THEN
    RAISE EXCEPTION 'invalid activity kind: %', p_kind;
  END IF;

  INSERT INTO activity_days (user_id, activity_date, study_count, application_count)
  VALUES (
    auth.uid(),
    CURRENT_DATE,
    CASE WHEN p_kind = 'study' THEN 1 ELSE 0 END,
    CASE WHEN p_kind = 'application' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, activity_date) DO UPDATE SET
    study_count       = activity_days.study_count + (CASE WHEN p_kind = 'study' THEN 1 ELSE 0 END),
    application_count = activity_days.application_count + (CASE WHEN p_kind = 'application' THEN 1 ELSE 0 END);
END;
$$;
