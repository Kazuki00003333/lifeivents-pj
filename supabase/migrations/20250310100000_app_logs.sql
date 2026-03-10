/*
  # アプリログ（取得・分析用）
  - クライアント/サーバーからのログを保存し、取得できるようにする
*/

CREATE TABLE IF NOT EXISTS app_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  level text NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message text NOT NULL,
  meta jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_logs_created_at ON app_logs(created_at DESC);
CREATE INDEX idx_app_logs_user_created ON app_logs(user_id, created_at DESC);
CREATE INDEX idx_app_logs_level ON app_logs(level);

ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;

-- 自分のログのみ読める（user_id が自分の場合、または user_id が null の場合は認証済みなら読める）
CREATE POLICY "Users can read own or anonymous logs"
  ON app_logs FOR SELECT
  USING (
    user_id = auth.uid()
    OR (user_id IS NULL AND auth.uid() IS NOT NULL)
  );

-- 挿入は認証済みユーザーが自分の user_id で行う、または未ログイン時は user_id null
CREATE POLICY "Users can insert logs"
  ON app_logs FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

COMMENT ON TABLE app_logs IS 'App logs for debugging and support; retrievable by user';
