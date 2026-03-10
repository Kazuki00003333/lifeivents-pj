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
};
