# PMF段階：インフラコスト最小化とAIリクエスト上限

**目的**: サービスイン時点でインフラコストを抑えつつ、AI機能の濫用を防ぐリクエスト上限を設ける。

---

## 1. インフラ構成（ミニマム案）

### 1.1 現状と追加候補

| 項目 | 選定 | 月額目安 | 備考 |
|------|------|----------|------|
| **DB・Auth** | Supabase Free | **0円** | 500MB DB、50,000 MAU、2プロジェクトまで |
| **AI実行** | 外部API（OpenAI / Anthropic 等）を**自前API経由**で呼ぶ | 従量 | キーはサーバ側にのみ保持し、クライアントからは呼ばない |
| **AIのゲートウェイ** | **Vercel Serverless（推奨）** | **0円** | Hobby 無料。API Routes / Serverless Functions で AI を呼び、`ai_usage` は Supabase で集計 |
| **ホスティング（Web）** | **Vercel** | **0円** | 同一プロジェクトで API と Web をまとめてデプロイ可能 |
| **アプリ配布** | Expo EAS（無料枠） / ストア直接 | **0円** | ビルド回数に制限あり |

**合計目標**: 月 **0〜1,000円程度**（AIの従量分を除く）。AIは「ユーザーあたり上限」でキャップするため、月額が暴れないようにする。

### 1.2 使わない方がよいもの（PMF期）

- 常時起動の自前サーバ（EC2 等）
- 複数リージョンの冗長DB
- 専用の Redis / キュー（Supabase + テーブルで代替）
- 高単価のマネージドAI（自前でAPIキー管理＋従量の方がコントロールしやすい）

### 1.2a Vercel で揃える構成（採用方針）

- **Web**: Expo の `expo export --platform web` で静的出力し、Vercel にデプロイ。
- **AI**: Vercel の Serverless Function（例: `/api/ai/...`）で OpenAI / Anthropic を呼ぶ。リクエスト前に Supabase の `ai_usage` を参照・更新。
- **環境変数**: Vercel の Dashboard で `OPENAI_API_KEY` 等を設定。Supabase の URL/Key も Vercel に設定し、サーバ側から参照。

これで DB・Auth は Supabase、実行・ホスティングは Vercel に集約できる。

### 1.3 Supabase の枠内で収めるコツ

- **Storage**: 無料 1GB。PMF期は画像は外部（Cloudinary 無料枠等）か、あまり使わない。
- **Edge Functions**: 無料枠のリクエスト数・実行時間を確認し、AI呼び出しは「1ユーザーあたり日次上限」で抑える。
- **DB**: 不要なテーブル・インデックスを増やさない。`ai_usage` のような小さいテーブル1つで十分。

---

## 2. AIリクエスト上限の設計

### 2.1 方針

- **「ユーザーが発散しない」** = 1ユーザーあたりのリクエスト数に上限を設け、超過したら AI を呼ばずにメッセージを返す。
- **単位**: **1ユーザーあたり「1日○回」** または **「1ヶ月○回」**。PMF期は **日次** が運用しやすい（リセットが分かりやすい）。
- **計測**: Supabase に「誰が・いつ・何回使ったか」を記録し、リクエスト前に「今日の使用回数」を確認する。

### 2.2 推奨上限値（PMF期）

| 種類 | 上限 | 想定 |
|------|------|------|
| **無料ユーザー** | 1日 **10回** または 1ヶ月 **50回** | タスク提案・自然言語入力など、1回＝1リクエストとみなす |
| **有料ユーザー（将来）** | 1日 **50回** または 無制限 | 課金導入後にテーブルで `plan` を切り替え |

最初は **1日10回** で運用し、負荷やフィードバックを見て 5〜20 に調整する。

### 2.3 どこでチェックするか

- **必ずサーバ側（Edge Function / API Route）でチェックする。** クライアントのみのチェックは改ざんされるため信用しない。
- 流れ:
  1. クライアントが「AI使いたい」とリクエスト（認証済みユーザーIDを渡す）
  2. サーバが `ai_usage` を参照し、**今日の使用回数** が上限未満か判定
  3. 未満 → AI API を呼び、結果を返す。かつ `ai_usage` に 1件 insert（または count を +1）
  4. 以上 → 429 または 200 で「本日の上限に達しました」のようなメッセージを返し、AI は呼ばない

---

## 3. データ設計（Supabase）

### 3.1 テーブル: `ai_usage`

AIの利用回数を「日付×ユーザー」で数えるためのテーブル。

```sql
-- マイグレーション例: supabase/migrations/YYYYMMDD_ai_usage.sql

CREATE TABLE IF NOT EXISTS ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT (current_date),
  request_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- RLS: 自分の行だけ読む・増やす
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

-- 日付で絞って集計しやすいようにインデックス
CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, usage_date);
```

**増やし方**:  
- リクエストのたびに `request_count = request_count + 1` で UPDATE（`usage_date = current_date` の行）。  
- その日の行がなければ INSERT（`request_count = 1`）。

### 3.2 上限値の持ち方

- **アプリ側の定数**で持つ（例: `AI_DAILY_LIMIT_FREE = 10`）。将来は `plans` テーブルで `daily_ai_limit` を持たせてもよい。
- PMF期は「無料＝10回/日」だけでも十分。

---

## 4. 実装フロー（Vercel Serverless 例）

AI を呼ぶ Vercel の API Route / Serverless Function の疑似コード。

```
1. リクエスト受信（body: { action, payload }, header: Authorization）
2. JWT から user_id を取得。未認証なら 401
3. ai_usage で (user_id, today) の request_count を取得
4. request_count >= AI_DAILY_LIMIT_FREE なら
   → 200 + { ok: false, reason: "daily_limit_reached", limit: 10 } を返して終了
5. OpenAI / Anthropic 等を呼ぶ
6. 成功したら ai_usage を INSERT or UPDATE（request_count + 1）
7. 200 + { ok: true, result: ... } を返す
```

**注意**: Vercel のサーバ側では Supabase の **Service Role Key** を使い、`ai_usage` の UPDATE はサーバ側だけで行う。クライアントには `ai_usage` の INSERT/UPDATE 権限を与えない（RLS で INSERT 許可しても、カウント増加はサーバのみにすると安全）。

---

## 5. クライアント側の振る舞い

- AI を呼ぶ前に **「本日あと○回使えます」** を表示する場合: 別の軽い API（例: `GET /ai/usage`）で「今日の使用回数」と「上限」を返す。同じ `ai_usage` を読む。
- 上限超過時は **「本日のAI利用上限に達しました。明日また使えます」** のようなメッセージを表示し、ボタンを無効化または隠す。
- 無料ユーザー向けに「有料プランでは回数が増えます」と案内してもよい。

---

## 6. スケールと冗長化（約1万人を見込む場合）

### 6.1 結論：初期1万人規模では冗長化は必須ではない

- **想定**: ユーザー数がおおよそ **1万人程度** の段階（MAU や登録数）。
- **推奨**: この規模では **単一リージョン・冗長化なし** の構成で十分。Supabase と Vercel のマネージドサービスが可用性を担保する。

### 6.2 理由

| 観点 | 内容 |
|------|------|
| **Supabase** | Free は 50,000 MAU まで。1万ユーザーでも MAU がその範囲内なら問題なし。Pro にすると接続数・リソースが増え、SLA も付く。 |
| **Vercel** | Serverless は自動でスケールし、単一リージョンでも通常のトラフィックは吸収可能。 |
| **コスト** | マルチリージョン・DB レプリカ・冗長構成は運用とコストが増える。PMF 期はまず単一構成で検証し、障害や伸びに応じて検討するのが現実的。 |
| **可用性** | Supabase / Vercel の障害は「サービス全体」に影響するため、自前で複数リージョンを持っても効果は限定的。 |

### 6.3 いつ冗長化を検討するか

- **ユーザー数**: おおよそ **10万 MAU 以上** や、ピーク時の同時接続がかなり多くなった段階。
- **可用性要件**:  SLA を契約で約束する（例: 99.9%）必要が出た段階。
- **規制・データ所在地**: データを複数リージョンに分散する法的要件が出た段階。

その時点で、**DB の読み取りレプリカ**（Supabase のオプション等）、**Vercel のマルチリージョン**、**CDN のキャッシュ強化** などを検討すればよい。

### 6.4 まとめ（スケール）

| 規模 | 冗長化 | 備考 |
|------|--------|------|
| **〜約1万人** | 不要 | 単一リージョンで十分。Supabase + Vercel の無料〜低価格枠で運用可。 |
| **数万〜10万** | 状況に応じて | Pro プラン・接続数・監視の見直し。必要なら読み取りレプリカ。 |
| **10万以上 / SLA 必須** | 検討する | マルチリージョン・レプリカ・フェイルオーバーを設計。 |

---

## 7. まとめ

| 項目 | 内容 |
|------|------|
| **インフラ** | Supabase Free + **Vercel**（Web・AI API）。常時サーバ・Redis は持たない。 |
| **コスト目標** | 月 0〜1,000円（AI従量は上限で制御）。 |
| **AI上限** | 1ユーザー 1日 10回（PMF期）。サーバ側で `ai_usage` を更新してチェック。 |
| **実装** | `ai_usage` テーブルで (user_id, usage_date) ごとに request_count を管理し、リクエスト前に比較。 |
| **冗長化** | 初期1万人規模では不要。10万以上 or SLA 要件が出たら検討。 |

この構成で、PMF段階ではミニマムなインフラコストに抑えつつ、AIの利用を「一定リクエスト上限」でコントロールできる。
