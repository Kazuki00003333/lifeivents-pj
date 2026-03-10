import { supabase } from '@/lib/supabase';

export const eventService = {
  async getEvent(eventId: string) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getEventTasks(eventId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('event_id', eventId)
      .order('phase', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getEventGuests(eventId: string) {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getEventExpenses(eventId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('event_id', eventId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateTask(taskId: string, updates: { is_completed?: boolean }) {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) throw error;
  },

  /** タスクを1件追加 */
  async createTask(task: {
    event_id: string;
    title: string;
    description?: string;
    phase?: string;
    due_date?: string;
    display_order?: number;
  }) {
    const { data: existing } = await supabase
      .from('tasks')
      .select('display_order')
      .eq('event_id', task.event_id)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const display_order = task.display_order ?? (existing?.display_order ?? 0) + 1;
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        event_id: task.event_id,
        title: task.title,
        description: task.description ?? null,
        phase: task.phase ?? 'その他',
        due_date: task.due_date ?? null,
        display_order,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** 複数タスクを一括追加（AI提案など） */
  async createTasks(
    eventId: string,
    tasks: { title: string; description?: string; phase?: string; due_date?: string }[]
  ) {
    const { data: existing } = await supabase
      .from('tasks')
      .select('display_order')
      .eq('event_id', eventId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    let order = (existing?.display_order ?? 0) + 1;
    const rows = tasks.map((t) => ({
      event_id: eventId,
      title: t.title,
      description: t.description ?? null,
      phase: t.phase ?? 'その他',
      due_date: t.due_date ?? null,
      display_order: order++,
    }));

    const { data, error } = await supabase.from('tasks').insert(rows).select();
    if (error) throw error;
    return data || [];
  },

  async addGuest(guest: {
    event_id: string;
    name: string;
    relationship: string;
    attendance_status: string;
    gift_amount: number;
    notes: string;
  }) {
    const { error } = await supabase
      .from('guests')
      .insert([guest]);

    if (error) throw error;
  },

  async addExpense(expense: {
    event_id: string;
    type: string;
    amount: number;
    category: string;
    description: string;
    date: string;
  }) {
    const { error } = await supabase
      .from('expenses')
      .insert([expense]);

    if (error) throw error;
  },

  async getUserEvents(userId: string) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createEvent(event: {
    user_id: string;
    name: string;
    event_type: string;
    event_date?: string;
    description?: string;
    color?: string;
  }) {
    const { data, error } = await supabase
      .from('events')
      .insert([event])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUpcomingTasks(userId: string, limit: number = 5) {
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    const { data, error } = await supabase
      .from('tasks')
      .select('*, events!inner(*)')
      .eq('events.user_id', userId)
      .eq('is_completed', false)
      .lte('due_date', oneWeekFromNow.toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // --- 家族共有・招待 ---

  /** 自分がオーナーまたはメンバーのイベント一覧を取得（event_members 対応） */
  async getUserEventsWithShared(userId: string) {
    const { data: owned, error: e1 } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: true });
    if (e1) throw e1;

    const { data: memberRows, error: e2 } = await supabase
      .from('event_members')
      .select('event_id')
      .eq('user_id', userId);
    if (e2) throw e2;
    const memberEventIds = (memberRows || []).map((r) => r.event_id).filter(Boolean);

    if (memberEventIds.length === 0) return owned || [];
    const { data: shared, error: e3 } = await supabase
      .from('events')
      .select('*')
      .in('id', memberEventIds)
      .order('event_date', { ascending: true });
    if (e3) throw e3;

    const ownedIds = new Set((owned || []).map((e) => e.id));
    const sharedOnly = (shared || []).filter((e) => !ownedIds.has(e.id));
    return [...(owned || []), ...sharedOnly].sort(
      (a, b) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime()
    );
  },

  /** 招待を1件発行（有効期限はデフォルト7日） */
  async createInvite(
    eventId: string,
    createdBy: string,
    options?: { expiresInDays?: number; maxUses?: number }
  ) {
    const expiresInDays = options?.expiresInDays ?? 7;
    const maxUses = options?.maxUses ?? 10;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { data, error } = await supabase
      .from('event_invites')
      .insert({
        event_id: eventId,
        created_by: createdBy,
        expires_at: expiresAt.toISOString(),
        max_uses: maxUses,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** イベントの有効な招待一覧（オーナー用） */
  async getEventInvites(eventId: string) {
    const { data, error } = await supabase
      .from('event_invites')
      .select('*')
      .eq('event_id', eventId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  /** トークンで招待情報を取得（イベント名表示用。未ログインでも有効トークンなら取得可） */
  async getInviteByToken(token: string) {
    const { data, error } = await supabase.rpc('get_invite_info', { invite_token: token });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      event_id: row.event_id,
      event_name: row.event_name,
      expires_at: row.expires_at,
      use_count: row.use_count,
      max_uses: row.max_uses,
    };
  },

  /** 招待を受け入れる（RPC） */
  async acceptInvite(token: string) {
    const { data, error } = await supabase.rpc('accept_invite', { invite_token: token });
    if (error) throw error;
    return data as string; // event_id
  },

  /** イベントのメンバー一覧 */
  async getEventMembers(eventId: string) {
    const { data, error } = await supabase
      .from('event_members')
      .select('*')
      .eq('event_id', eventId)
      .order('joined_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },
};
