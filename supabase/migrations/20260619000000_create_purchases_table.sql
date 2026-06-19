-- ─────────────────────────────────────────────────────────────────────────────
-- Starter Kit purchases
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS purchases (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email             text        NOT NULL,
  stripe_session_id text        NOT NULL UNIQUE,
  download_token    text        NOT NULL UNIQUE,
  token_used        boolean     NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Only the service role key can read/write this table.
-- No user-facing policies needed — all access goes through edge functions.
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
