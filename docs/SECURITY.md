# セキュリティ要件と運用

**対象**: SQLインジェクション対策、秘密鍵・API Key の扱い、.env の管理、その他一定のセキュリティ要件。

---

## 1. 秘密鍵・API Key・DB Key の管理

### 1.1 基本方針

- **すべての API Key および DB Key はローカルの `.env` に記載し、Git にコミットしない。**
- リポジトリには **`.env.example`** のみをコミットし、項目名と説明だけを記載する（値は空またはプレースホルダー）。
- `.gitignore` に `.env` および `.env*.local` が含まれていることを確認すること。

### 1.2 クライアントに露出してよいもの / してはいけないもの

| 種類 | 変数名の例 | 置き場所 | 備考 |
|------|------------|----------|------|
| **Supabase URL** | `EXPO_PUBLIC_SUPABASE_URL` | .env（クライアントにバンドルされる） | 公開してよい |
| **Supabase Anon Key** | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | .env | RLS で権限制御するため、クライアントで使用可 |
| **招待リンクのベースURL** | `EXPO_PUBLIC_INVITE_BASE_URL` | .env | 公開してよい |
| **Supabase Service Role Key** | `SUPABASE_SERVICE_ROLE_KEY` | **サーバー側の .env のみ**（Vercel の Environment Variables） | **絶対にクライアントに渡さない** |
| **OpenAI / Anthropic API Key** | `OPENAI_API_KEY` 等 | **サーバー側の .env のみ**（Vercel） | **絶対にクライアントに渡さない** |

- **EXPO_PUBLIC_** が付いた変数だけが Expo のクライアントバンドルに含まれる。秘密鍵には **EXPO_PUBLIC_** を付けない。
- Vercel にデプロイする場合、Service Role Key や AI の API Key は **Vercel Dashboard → Settings → Environment Variables** で設定し、**API Routes / Serverless Functions 内でのみ** `process.env.XXX` で参照する。

### 1.3 ローカル開発時の手順

1. リポジトリをクローンしたら、`.env.example` をコピーして `.env` を作成する。
2. `.env` に実際の Supabase URL / Anon Key 等を記載する。
3. Service Role Key や AI API Key は、ローカルで API を動かす場合のみ `.env` に記載する（その .env は Git に含めない）。

---

## 2. SQL インジェクション対策

### 2.1 方針

- **アプリケーションからは生の SQL 文字列を組み立てず、必ずパラメータ化されたクエリまたは RPC を使う。**

### 2.2 現状の実装

- **Supabase Client（`@supabase/supabase-js`）**: `.from('table').select().eq('id', id)` のようにメソッドチェーンで条件を指定しているため、**すべてパラメータバインドされ、SQL インジェクションの心配は不要**。
- **RPC（Postgres 関数）**: `accept_invite(invite_token text)` および `get_invite_info(invite_token text)` は、引数を **パラメータとして** 渡しており、関数内でも `WHERE token = invite_token` のように変数を使用しているため、**SQL インジェクションにならない**。
- **マイグレーション内の SQL**: DDL および既知の固定値のみ。ユーザー入力を文字列連結していない。

### 2.3 今後の開発で守ること

- 新しく Raw SQL を書く場合（Supabase の `rpc()` で呼ぶ関数など）は、**ユーザー入力は必ず引数で渡し、文字列連結で SQL に埋め込まない**。
- 例: `EXECUTE 'SELECT ... WHERE id = $1' USING user_input;` のように `$1` と `USING` でバインドする。

---

## 3. その他のセキュリティ要件

### 3.1 認証・認可

- 認証は Supabase Auth に委譲。パスワードは Supabase 側でハッシュ化・保存される。
- 認可は **RLS（Row Level Security）** で実施。`auth.uid()` と `event_members` / `events.user_id` に基づき、他人のデータは参照・更新できないようにしている。

### 3.2 招待トークン

- 招待トークンは `gen_random_uuid()::text` で生成し、推測困難にする。
- 有効期限（`expires_at`）と使用回数（`max_uses`）で無制限な利用を防ぐ。

### 3.3 HTTPS

- 本番の Supabase および Vercel は HTTPS で提供される。ローカル開発でも可能な範囲で HTTPS を利用すること。

### 3.4 環境変数の漏洩防止

- `.env` をコミットしないこと。CI や Vercel では、環境変数を「Secret」として設定し、ログに出力しないこと。
- 万一キーが漏れた場合は、Supabase Dashboard でキーをローテーションし、Vercel の環境変数を更新すること。

---

## 4. チェックリスト（開発・デプロイ時）

- [ ] `.env` が `.gitignore` に含まれている
- [ ] 秘密鍵（Service Role Key、AI API Key）に `EXPO_PUBLIC_` を付けていない
- [ ] クライアントコードで `process.env.SUPABASE_SERVICE_ROLE_KEY` や `process.env.OPENAI_API_KEY` を参照していない
- [ ] 新規 SQL / RPC でユーザー入力を文字列連結していない
- [ ] Vercel にデプロイする場合、必要なキーを Vercel の Environment Variables に設定している

---

関連:
- [.env.example](../.env.example)（リポジトリルート。ローカルではコピーして .env を作成し、実キーを記載）
- [PMF_INFRA_AND_AI_LIMITS.md](./PMF_INFRA_AND_AI_LIMITS.md)（Vercel でのキー利用・冗長化の要否）
