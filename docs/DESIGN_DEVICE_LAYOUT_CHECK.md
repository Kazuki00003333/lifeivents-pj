# デバイスレイアウト・デザインチェック表（iPhone 14 Pro Max 等）

デザイナー視点でのレイアウト・タップ領域・見切れ対策のチェックリストと修正状況です。  
実機（iPhone 14 Pro Max）での確認を推奨します。

---

## 1. タブバー・下部ナビ

| 項目 | 基準 | 対応 | 備考 |
|------|------|------|------|
| 下セーフエリア | ノッチ端末でタブが隠れない | ✅ 済 | `useSafeAreaInsets()` で `paddingBottom` に `insets.bottom` を加算 |
| タブ高さ | 固定高で見切れない | ✅ 済 | `minHeight: 56 + tabBarPaddingBottom`、`height: undefined` |
| アイコンサイズ | 一貫して読みやすい | ✅ 済 | 24px 固定 |
| ラベル | 見切れ・重ならない | ✅ 済 | 「外部サービス」→「サービス」に短縮、fontSize: 10 |

---

## 2. ヘッダー・ナビゲーションボタン

| 画面 | 項目 | 基準 | 対応 | 備考 |
|------|------|------|------|------|
| イベント詳細 `event/[id]` | 戻るボタン | 最小タップ領域 44×44pt | ✅ 済 | `minWidth/minHeight: MIN_TOUCH_TARGET`、中央寄せ |
| イベント詳細 | 共有ボタン | 同上 | ✅ 済 | 同上 |
| 共有画面 `event/[id]/share` | 戻るボタン | 同上 | ✅ 済 | 同上 |

---

## 3. スクロール下部余白（タブバーに隠れない）

| 画面 | 対応 | 備考 |
|------|------|------|
| ホーム `(tabs)/home` | ✅ 済 | `contentContainerStyle.paddingBottom: TAB_BAR_AREA_HEIGHT` |
| イベント一覧 `(tabs)/events` | ✅ 済 | 同上 |
| 年表 `(tabs)/timeline` | ✅ 済 | 縦／横／1人用の各 `content` に適用 |
| 設定 `(tabs)/settings` | ✅ 済 | 同上 |

---

## 4. 定数・共通

- **`lib/constants/layout.ts`**
  - `MIN_TOUCH_TARGET = 44`（Apple HIG 推奨）
  - `TAB_BAR_AREA_HEIGHT = 100`（スクロール下部余白用）

---

## 5. 今後の確認推奨（実機で要チェック）

- 年表の「年バッジ」「カード」「ドット」が端で見切れていないか
- 設定画面のスイッチ・リスト項目が 44pt 以上あるか
- カレンダー系 UI のセル・ボタンサイズ
- オンボーディング・モーダルの閉じるボタンのタップ領域
- フォーム入力（キーボード表示時）で送信ボタンが隠れないか

---

## 6. 修正済みファイル一覧

- `app/(tabs)/_layout.tsx` — タブバー・セーフエリア
- `app/(tabs)/home.tsx` — 下部余白・レイアウト定数
- `app/(tabs)/events.tsx` — 下部余白
- `app/(tabs)/timeline.tsx` — 下部余白（3箇所）
- `app/(tabs)/settings.tsx` — 下部余白
- `app/event/[id].tsx` — 戻る・共有ボタンのタップ領域
- `app/event/[id]/share.tsx` — 戻るボタンのタップ領域
- `lib/constants/layout.ts` — 新規（定数定義）

---

**最終更新**: 上記タブ・ヘッダー・スクロール余白の修正を反映。実機で再度確認し、見切れがあれば本表に「未対応」として追記してください。
