/**
 * アプリログ：コンソール出力 + 任意で Supabase に保存し、後から取得可能
 */

import { supabase } from '@/lib/supabase';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** 現在有効な最小レベル（これ以上のレベルをコンソール・サーバーに出す） */
const MIN_LEVEL: LogLevel = 'debug';

/** サーバーに送るか（本番では true 推奨） */
let sendToServer = true;

export function setLoggerSendToServer(value: boolean) {
  sendToServer = value;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[MIN_LEVEL];
}

async function persist(level: LogLevel, message: string, meta: Record<string, unknown>) {
  if (!sendToServer) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('app_logs').insert({
      user_id: user?.id ?? null,
      level,
      message,
      meta: Object.keys(meta).length ? meta : {},
    });
  } catch (e) {
    if (__DEV__) {
      console.warn('[logger] persist failed', e);
    }
  }
}

function formatMeta(meta: Record<string, unknown>): string {
  const entries = Object.entries(meta).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '';
  return ' ' + JSON.stringify(Object.fromEntries(entries));
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    const m = meta ?? {};
    if (shouldLog('debug')) {
      console.debug(`[debug] ${message}${formatMeta(m)}`);
    }
    persist('debug', message, m);
  },

  info(message: string, meta?: Record<string, unknown>) {
    const m = meta ?? {};
    if (shouldLog('info')) {
      console.info(`[info] ${message}${formatMeta(m)}`);
    }
    persist('info', message, m);
  },

  warn(message: string, meta?: Record<string, unknown>) {
    const m = meta ?? {};
    if (shouldLog('warn')) {
      console.warn(`[warn] ${message}${formatMeta(m)}`);
    }
    persist('warn', message, m);
  },

  error(message: string, meta?: Record<string, unknown>) {
    const m = meta ?? {};
    if (shouldLog('error')) {
      console.error(`[error] ${message}${formatMeta(m)}`);
    }
    persist('error', message, m);
  },
};

/** 直近のログを取得（設定画面などで表示用） */
export async function getRecentLogs(limit = 100): Promise<
  { id: string; level: string; message: string; meta: Record<string, unknown>; created_at: string }[]
> {
  try {
    const { data, error } = await supabase
      .from('app_logs')
      .select('id, level, message, meta, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []).map((r) => ({
      id: r.id,
      level: r.level,
      message: r.message,
      meta: (r.meta as Record<string, unknown>) ?? {},
      created_at: r.created_at,
    }));
  } catch {
    return [];
  }
}
