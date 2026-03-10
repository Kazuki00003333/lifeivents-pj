# AI タスク提案機能のセットアップ

イベント詳細の「タスク」タブから「AIでタスクを提案」で、OpenAI を使ったタスク提案が利用できます。  
API Key は **Vercel の環境変数** に設定してください（クライアントには渡しません）。

---

## 1. 必要な環境変数（Vercel）

Vercel にデプロイしたうえで、Dashboard → Settings → Environment Variables に以下を設定します。

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI API キー（ユーザーが発行したキーを設定） | ✅ |
| `SUPABASE_URL` | Supabase プロジェクト URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase 匿名キー（JWT 検証用） | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー（ai_usage 更新用） | ✅ |

※ クライアント用の `EXPO_PUBLIC_*` は Expo ビルド用。上記は **サーバー側（API）専用** です。

---

## 2. アプリ側の設定

- **API のベースURL**: 未設定の場合は `EXPO_PUBLIC_INVITE_BASE_URL` が使われます。  
  Vercel のドメイン（例: `https://your-app.vercel.app`）を `EXPO_PUBLIC_INVITE_BASE_URL` または `EXPO_PUBLIC_API_URL` に設定すると、同じオリジンで `/api/ai-suggest-tasks` と `/api/ai-usage` が呼ばれます。

---

## 3. 利用制限（PMF 期）

- **1ユーザーあたり 1日 10回** まで（`docs/PMF_INFRA_AND_AI_LIMITS.md` の設計に準拠）。
- 上限に達すると「本日のAI利用上限に達しました」と表示され、翌日まで利用不可です。

---

## 4. 実装箇所

| 役割 | パス |
|------|------|
| Vercel Serverless（タスク提案） | `api/ai-suggest-tasks.ts` |
| Vercel Serverless（利用回数取得） | `api/ai-usage.ts` |
| クライアント API 呼び出し | `lib/api/ai.ts` |
| モーダル UI | `components/event/AISuggestModal.tsx` |
| イベント詳細・タスクタブ | `app/event/[id].tsx`（「AIでタスクを提案」ボタン） |
| タスク一括追加 | `lib/services/eventService.ts`（`createTasks`） |

---

## 5. ローカルで API を試す場合

Vercel CLI でローカル実行すると、`/api/*` がローカルで動きます。

```bash
npm i -g vercel
vercel dev
```

その場合、`.env` に `OPENAI_API_KEY`、`SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY` を設定し、アプリの `EXPO_PUBLIC_INVITE_BASE_URL` または `EXPO_PUBLIC_API_URL` を `http://localhost:3000` などに合わせてください。
