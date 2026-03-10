/**
 * 招待リンク・LINE招待用URLの生成
 * ベースURLは環境変数 EXPO_PUBLIC_INVITE_BASE_URL または定数で指定
 */

const INVITE_BASE_URL =
  typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_INVITE_BASE_URL
    ? process.env.EXPO_PUBLIC_INVITE_BASE_URL.replace(/\/$/, '')
    : 'https://your-domain.com';

const INVITE_APP_SCHEME = 'myapp';

/**
 * 招待リンクURLを生成（Web用）
 * 本番では EXPO_PUBLIC_INVITE_BASE_URL を Vercel のドメイン等に設定
 */
export function buildInviteUrl(token: string): string {
  return `${INVITE_BASE_URL}/invite/${token}`;
}

/**
 * アプリのディープリンク用（Expo scheme）
 */
export function buildInviteDeepLink(token: string): string {
  return `${INVITE_APP_SCHEME}://invite/${token}`;
}

const LINE_SHARE_BASE = 'https://line.me/R/msg/text/?';
const DEFAULT_INVITE_MESSAGE = '【LifePath】イベントの準備を一緒に管理しませんか？';

/**
 * LINEで送る用URL
 * タップするとLINEが起動し、メッセージ＋招待URLが入力された状態で共有先を選べる
 */
export function buildLineShareUrl(
  token: string,
  eventName?: string,
  customMessage?: string
): string {
  const inviteUrl = buildInviteUrl(token);
  const message =
    customMessage ??
    (eventName
      ? `【LifePath】「${eventName}」の準備を一緒に管理しませんか？`
      : DEFAULT_INVITE_MESSAGE);
  const text = `${message}\n\n${inviteUrl}`;
  return `${LINE_SHARE_BASE}${encodeURIComponent(text)}`;
}
