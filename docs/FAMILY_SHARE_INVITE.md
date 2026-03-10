# 家族共有・招待（リンクURL / LINE）

**目的**: イベントを家族と共有するため、**リンクURL** または **LINE** で招待を送り、相手が参加できるようにする。

---

## 1. 概要

- **共有単位**: **イベント単位**。1つのイベント（結婚式・子供の七五三など）を「オーナー」が「メンバー」と共有する。
- **招待方法**:
  1. **リンクURL**: 招待用リンクを発行し、コピーしてメール・SMS・LINE 等で送る。
  2. **LINEで招待**: 同じ招待リンクを、LINEの「共有」用URLで開き、LINEのトークに送る。

招待リンクを開いた人が「参加する」と、そのイベントが自分のイベント一覧にも表示され、タスク・ゲスト・お金を一緒に編集できる（役割は後述）。

---

## 2. データ構造

### 2.1 テーブル

| テーブル | 役割 |
|----------|------|
| **event_members** | イベントにアクセスできるユーザー一覧。オーナー＋招待で参加したメンバー。 |
| **event_invites** | 招待リンク用のトークン。有効期限・発行元を保持。 |

### 2.2 event_members

| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | PK |
| event_id | uuid | イベント（events.id） |
| user_id | uuid | 参加者（auth.users.id） |
| role | text | `owner` \| `editor` \| `viewer` |
| joined_at | timestamptz | 参加日時 |

- **owner**: イベント作成者。招待の発行・メンバーの削除が可能。
- **editor**: タスク・ゲスト・お金の編集が可能。招待は発行できない想定（必要なら後で変更）。
- **viewer**: 閲覧のみ（将来用。PMF期は editor のみでも可）。

既存の `events.user_id` は「オーナー」として維持し、`event_members` に owner として1件入れておく（または「オーナーは event_members にいなくても events.user_id で判定」でも可。ここでは「オーナーも event_members に1件入れる」方式で統一）。

### 2.3 event_invites

| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | PK |
| event_id | uuid | イベント |
| token | text | 招待トークン（UUID など。URL に含める） |
| created_by | uuid | 発行したユーザー |
| expires_at | timestamptz | 有効期限 |
| max_uses | int | 使用回数上限（0＝無制限） |
| created_at | timestamptz | 作成日時 |

- 1トークンで複数人が参加する場合は `max_uses > 1` または無制限。
- PMF期は「1トークン＝1回だけ使用可」にしてもよい（参加した時点でそのトークンを無効化）。

---

## 3. フロー

### 3.1 招待を発行する（オーナー）

1. イベント詳細画面で「家族を招待」等のボタンを表示。
2. タップで「招待リンクを発行」→ `event_invites` に 1 行 insert（`event_id`, `token`（uuid）, `created_by`, `expires_at`（例: 7日後）, `max_uses`（例: 10 または 1））。
3. 招待URLを生成: `https://あなたのドメイン/invite/{token}` または `https://あなたのドメイン/join?token={token}`。
4. 画面に「リンクをコピー」と「LINEで送る」を表示。
   - **リンクをコピー**: クリップボードに上記URLをコピー。
   - **LINEで送る**: LINE の共有用URL `https://line.me/R/msg/text/?` + `encodeURIComponent(メッセージ + '\n' + 招待URL)` を開く。すると LINE が起動し、メッセージとリンクが入力された状態で共有先を選べる。

### 3.2 招待を受け入れる（招待された側）

1. 招待リンクを開く（アプリのディープリンク or Web の `/invite/[token]` or `/join?token=xxx`）。
2. 未ログインならログイン or 新規登録を促す。
3. ログイン済みなら「○○さんのイベント「○○」に参加しますか？」と表示。
4. 「参加する」→ `event_invites` で token を検索し、有効（未期限切れ・未超過）か確認。問題なければ `event_members` に insert（`event_id`, `user_id` = 現在ユーザー, `role` = `editor`）。必要ならそのトークンを無効化（削除 or `max_uses` を減らす）。
5. イベント詳細画面へリダイレクト。

### 3.3 イベント一覧の取得

- 従来: `events.user_id = 自分のid` で取得。
- 共有対応後: `events.user_id = 自分のid` **OR** `event_members.user_id = 自分のid` で取得。  
  Supabase では `events` と `event_members` を join するか、`event_members` の `event_id` 一覧を取得してから `events` を取得する。

---

## 4. 招待URL・LINE用の生成

### 4.1 招待URL（ベース）

- アプリのユニバーサルリンク / ディープリンク: `myapp://invite/{token}`（Expo の scheme に合わせる）。
- Web: `https://your-domain.com/invite/{token}` または `https://your-domain.com/join?token={token}`。

同じトークンでアプリとWebの両方に飛ばす場合は、Web側で「アプリを持っている場合はアプリで開く」を案内してもよい。

### 4.2 LINEで送る用URL

```
https://line.me/R/msg/text/? + encodeURIComponent(メッセージ + '\n' + 招待URL)
```

例（JavaScript/TypeScript）:

```ts
const inviteMessage = '【LifePath】イベント「結婚式」の準備を一緒に管理しませんか？';
const inviteUrl = `https://your-domain.com/invite/${token}`;
const lineShareUrl = `https://line.me/R/msg/text/?${encodeURIComponent(`${inviteMessage}\n${inviteUrl}`)}`;
// この lineShareUrl を開くと LINE が起動し、メッセージ＋リンクが入力された状態になる
```

アプリ内では `Linking.openURL(lineShareUrl)` でブラウザ or LINE を開く。

---

## 5. RLS（Row Level Security）

- **event_members**:  
  - SELECT: 自分がメンバーになっているイベントのメンバー一覧のみ。  
  - INSERT: 招待受け入れ時は「トークンが有効なら」サーバ側（Supabase Edge / 自前API）で insert するか、RLS で「自分の user_id で insert 可」にし、トークン検証はアプリ or Edge で行う。
- **event_invites**:  
  - SELECT: 該当イベントのオーナー or メンバー（editor 以上）のみ。または token は「誰でも読める」にして、token を知っている人だけが参加できるようにする（token が漏れない限り問題なし）。  
  - INSERT/DELETE: イベントのオーナーのみ。

※ 招待の「受け入れ」で `event_members` に insert する処理は、トークンの検証が必要なため、**サーバ側（Vercel API または Supabase Edge）で行う**と安全。クライアントだけで行う場合は、`event_invites` を token で SELECT 可能にして、有効ならクライアントから `event_members` に INSERT（WITH CHECK で user_id = auth.uid()）でも可。

---

## 6. UI の置き場所（案）

- **イベント詳細画面**: ヘッダーまたはタブに「共有」ボタン。タップでモーダル or 別画面。
  - 「招待リンクを発行」→ 発行後は「リンクをコピー」「LINEで送る」を表示。
  - 既存の招待リンクがある場合は「現在のリンクをコピー」「LINEで送る」「リンクを無効化して新しく発行」など。

---

## 7. まとめ

| 項目 | 内容 |
|------|------|
| 共有単位 | イベント単位 |
| 招待方法 | リンクURL（コピー）、LINE（共有URLでメッセージ＋リンクを送る） |
| データ | event_members（誰がどのイベントに参加しているか）、event_invites（招待トークン・有効期限） |
| フロー | オーナーが招待発行 → リンク or LINE で送る → 相手がリンクを開いて参加 → イベント一覧に表示 |

実装時は `lib/utils/invite.ts` に `buildInviteUrl(token)`, `buildLineShareUrl(token, eventName)` を用意し、イベント詳細から「共有」→「リンクで招待」「LINEで招待」で使う。
