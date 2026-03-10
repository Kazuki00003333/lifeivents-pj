/*
  # AI Usage Tracking (PMF: rate limit per user per day)

  1. Table: ai_usage
    - Tracks daily AI request count per user for rate limiting
    - Used by Edge Function / API before calling AI provider

  2. RLS: users can only read/insert/update their own row(s)
  3. Unique on (user_id, usage_date) so one row per user per day
*/

CREATE TABLE IF NOT EXISTS ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT (current_date),
  request_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ai_usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_usage"
  ON ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_usage"
  ON ai_usage FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, usage_date);

COMMENT ON TABLE ai_usage IS 'Daily AI request count per user for PMF rate limiting';
