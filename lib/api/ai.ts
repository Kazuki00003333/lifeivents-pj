/**
 * AI タスク提案・利用回数 API（Vercel Serverless 呼び出し）
 * ベースURL: EXPO_PUBLIC_API_URL または EXPO_PUBLIC_INVITE_BASE_URL
 */

const getBaseUrl = () =>
  process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_INVITE_BASE_URL || '';

export type AISuggestion = {
  title: string;
  description?: string;
  phase?: string;
  due_date?: string;
};

export type SuggestTasksResponse =
  | { ok: true; suggestions: AISuggestion[]; used: number; limit: number }
  | { ok: false; reason: 'daily_limit_reached'; limit: number; used?: number }
  | { ok: false; reason: 'invalid_token' | 'missing_token' | 'ai_error'; error?: string };

export type UsageResponse = { used: number; limit: number; remaining: number };

export async function getAIUsage(accessToken: string): Promise<UsageResponse | null> {
  const base = getBaseUrl();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/ai-usage`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as UsageResponse;
  } catch {
    return null;
  }
}

export async function suggestTasks(
  accessToken: string,
  params: { eventId: string; eventName: string; eventType?: string; eventDate?: string }
): Promise<SuggestTasksResponse> {
  const base = getBaseUrl();
  if (!base) {
    return { ok: false, reason: 'ai_error', error: 'API URL not configured' };
  }
  try {
    const res = await fetch(`${base}/api/ai-suggest-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        eventId: params.eventId,
        eventName: params.eventName,
        eventType: params.eventType ?? undefined,
        eventDate: params.eventDate ?? undefined,
      }),
    });
    const data = (await res.json()) as SuggestTasksResponse;
    return data;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Request failed';
    return { ok: false, reason: 'ai_error', error: message };
  }
}
