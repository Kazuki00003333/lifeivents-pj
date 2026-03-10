/**
 * Vercel Serverless: AI タスク提案
 * POST /api/ai-suggest-tasks
 * Body: { eventId, eventName, eventType?, eventDate? }
 * Header: Authorization: Bearer <Supabase access_token>
 * 環境変数: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const AI_DAILY_LIMIT = 10;

type RequestBody = {
  eventId: string;
  eventName: string;
  eventType?: string;
  eventDate?: string;
};

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getUserIdFromToken(accessToken: string): Promise<string | null> {
  const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;
  return user.id;
}

async function getTodayUsageCount(admin: SupabaseClient, userId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await admin
    .from('ai_usage')
    .select('request_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle();
  if (error || !data) return 0;
  return data.request_count ?? 0;
}

async function incrementUsage(admin: SupabaseClient, userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: row } = await admin
    .from('ai_usage')
    .select('id, request_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle();

  if (row) {
    await admin
      .from('ai_usage')
      .update({ request_count: row.request_count + 1, updated_at: new Date().toISOString() })
      .eq('id', row.id);
  } else {
    await admin.from('ai_usage').insert({
      user_id: userId,
      usage_date: today,
      request_count: 1,
    });
  }
}

async function callOpenAI(eventName: string, eventType?: string, eventDate?: string): Promise<{ title: string; description?: string; phase?: string; due_date?: string }[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');

  const eventDesc = [
    `イベント名: ${eventName}`,
    eventType ? `種類: ${eventType}` : '',
    eventDate ? `本番日: ${eventDate}` : '',
  ].filter(Boolean).join('\n');

  const systemPrompt = `あなたはライフイベントの準備をサポートするアシスタントです。
ユーザーが入力したイベントについて、やるべきタスクを5〜10個、日本語で提案してください。
各タスクは phase（例: 準備（3ヶ月前）、直前（1ヶ月前）、その他）と、必要なら due_date（YYYY-MM-DD）を含めてください。
返答は必ず次のJSONオブジェクトのみを返してください。キーは "tasks" とし、値はタスクの配列にしてください。説明文は不要です。
例: {"tasks":[{"title":"タスク名","description":"補足","phase":"準備（3ヶ月前）","due_date":"2025-01-15"}, ...]}`;

  const userPrompt = `以下のイベントに対するタスクを提案してください。\n\n${eventDesc}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${err}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty OpenAI response');

  let parsed: { tasks?: unknown[]; [k: string]: unknown } = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON from OpenAI');
  }

  const list = Array.isArray(parsed.tasks) ? parsed.tasks : Array.isArray(parsed) ? parsed : [];
  if (!Array.isArray(list) || list.length === 0) return [];
  return list.map((t: { title?: string; description?: string; phase?: string; due_date?: string }) => ({
    title: t.title ?? '',
    description: t.description,
    phase: t.phase,
    due_date: t.due_date,
  })).filter((t: { title: string }) => t.title);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const auth = req.headers.get('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized', reason: 'missing_token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const userId = await getUserIdFromToken(token);
  if (!userId) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid token', reason: 'invalid_token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { eventId, eventName, eventType, eventDate } = body;
  if (!eventId || !eventName) {
    return new Response(JSON.stringify({ ok: false, error: 'eventId and eventName are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const admin = getSupabaseAdmin();
  const used = await getTodayUsageCount(admin, userId);
  if (used >= AI_DAILY_LIMIT) {
    return new Response(
      JSON.stringify({ ok: false, reason: 'daily_limit_reached', limit: AI_DAILY_LIMIT, used }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const suggestions = await callOpenAI(eventName, eventType, eventDate);
    await incrementUsage(admin, userId);
    return new Response(
      JSON.stringify({ ok: true, suggestions, used: used + 1, limit: AI_DAILY_LIMIT }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return new Response(
      JSON.stringify({ ok: false, error: message, reason: 'ai_error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
