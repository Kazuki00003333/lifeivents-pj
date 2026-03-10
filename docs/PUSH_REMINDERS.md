# 逆算リマインド（未来へのプッシュ通知）

イベント**当日**ではなく、**本番の1〜3ヶ月前**に「七五三の3ヶ月前です。写真館の予約を検討しましょう」といった通知を送る機能です。

---

## 1. クライアント側（実装済み）

- **トークン登録**: 設定（サービス）タブの「リマインド通知をオンにする」で、Expo Push Token を取得し Supabase の `push_tokens` に保存します。
- **必要パッケージ**: `expo-notifications`, `expo-device`（`npx expo install expo-notifications expo-device` で追加済み）。
- **実機必須**: シミュレータではトークンが取得できません。

---

## 2. 通知送信側（未実装・設計）

以下のいずれかで「日次バッチ」を組み、**本番の 1〜3 ヶ月前**の日付に該当するイベントを持つユーザーに Expo Push を送ります。

### 2.1 想定フロー

1. 毎日 1 回（例: 日本時間 9:00）にバッチが起動。
2. **今日が「イベント本番の 3 ヶ月前」「1 ヶ月前」** などに当たる `events` を検索（`event_date` から逆算）。
3. 該当イベントの `user_id`（および `event_members` で共有されているユーザー）を取得。
4. そのユーザーの `push_tokens` から Expo Push Token を取得。
5. [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/) に POST して通知を送信。

### 2.2 実装候補

| 方式 | 説明 |
|------|------|
| **Vercel Cron** | `vercel.json` で `api/cron-reminders.ts` を日次実行。Supabase で該当イベント・トークンを取得し、Expo Push API を呼ぶ。 |
| **Supabase Edge Function** | pg_cron または外部トリガーで Edge Function を日次実行。同上。 |
| **外部 Cron サービス** | cron-job.org 等で日次で `https://your-api.com/api/cron-reminders` を叩く。 |

### 2.3 通知文例

- 3 ヶ月前: 「【LifePath】{イベント名} まであと3ヶ月です。写真館の予約などを検討しましょう。」
- 1 ヶ月前: 「【LifePath】{イベント名} まであと1ヶ月です。準備の最終確認をしましょう。」

### 2.4 環境変数（送信側）

- `EXPO_ACCESS_TOKEN`: Expo のアクセストークン（Push 送信用。Expo のアカウントで発行）
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: イベント・push_tokens 取得用

---

## 3. まとめ

| 項目 | 状態 |
|------|------|
| トークン登録（アプリ） | ✅ 実装済み（`lib/services/pushNotifications.ts`、設定タブから呼び出し） |
| push_tokens テーブル | ✅ マイグレーション済み |
| 日次バッチ・送信 | ⏳ 未実装（上記設計に沿って API を実装する） |
