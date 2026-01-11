
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Transaction, Category, User, UserRole, TransactionType, FinancialGoal, AISettings } from '../types';

const SUPABASE_URL = 'https://naujnnypepexlyalfeta.supabase.co';
const PROVIDED_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hdWpubnlwZXBleGx5YWxmZXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjE1MTcsImV4cCI6MjA4MjIzNzUxN30.w56CYeN2i-S7F9Pn3cljX9L23mYfOYWWqa6__ai-MAU';

const SUPABASE_ANON_KEY = 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
  process.env.SUPABASE_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  PROVIDED_ANON_KEY;

export const supabase: SupabaseClient | null = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

const DEFAULT_AI_SETTINGS: AISettings = {
  insightsPrompt: "Você é um mentor financeiro estratégico e encorajador. Analise a performance financeira e dê um feedback curto e uma ação prática em português brasileiro.",
  receiptPrompt: "Analise este documento e extraia os dados financeiros. Se for um recibo, cupom ou nota, identifique: o valor total (number), a data no formato YYYY-MM-DD, uma descrição curta (nome do estabelecimento/serviço) e sugira uma categoria financeira lógica."
};

export const PersistenceService = {
  isConfigured(): boolean {
    return !!supabase;
  },

  async getCurrentUser(): Promise<User | null> {
    if (!supabase) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { user } = session;
      
      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
      
      return {
        id: user.id,
        name: profile?.full_name || user.user_metadata.full_name || user.email?.split('@')[0] || 'Usuário',
        email: user.email || '',
        role: (profile?.role as UserRole) || UserRole.NORMAL
      };
    } catch (e) { return null; }
  },

  async signIn(email: string, pass: string) {
    if (!supabase) return { user: null, error: 'Configuração ausente.' };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return { user: null, error: error.message };
    const user = await this.getCurrentUser();
    return { user, error: null };
  },

  async signOut() {
    if (supabase) await supabase.auth.signOut();
  },

  async getTransactions(): Promise<Transaction[]> {
    if (!supabase) return [];
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false });
      if (error) throw error;
      return data.map(t => ({
        id: t.id,
        date: t.date,
        category: t.category,
        description: t.description,
        amount: parseFloat(t.amount),
        paymentMethod: t.payment_method,
        type: t.type as TransactionType,
        attachment: t.attachment,
        attachmentName: t.attachment_name
      }));
    } catch (e) { return []; }
  },

  async addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction | null> {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('transactions').insert([{
      user_id: user.id, date: tx.date, category: tx.category, description: tx.description,
      amount: tx.amount, payment_method: tx.paymentMethod, type: tx.type,
      attachment: tx.attachment, attachment_name: tx.attachmentName
    }]).select().single();
    if (error) return null;
    return { ...tx, id: data.id };
  },

  async updateTransaction(id: string, tx: Omit<Transaction, 'id'>): Promise<Transaction | null> {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('transactions').update({
      date: tx.date, category: tx.category, description: tx.description,
      amount: tx.amount, payment_method: tx.paymentMethod, type: tx.type,
      attachment: tx.attachment, attachment_name: tx.attachmentName
    }).eq('id', id).eq('user_id', user.id).select().single();
    if (error) return null;
    return { ...tx, id: data.id };
  },

  async deleteTransaction(id: string) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
  },

  async getCategories(): Promise<Category[]> {
    if (!supabase) return this.getDefaultCategories();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return this.getDefaultCategories();
      const { data, error } = await supabase.from('categories').select('*').eq('user_id', user.id).order('name');
      if (error || !data || data.length === 0) return this.getDefaultCategories();
      return data.map(c => ({ id: c.id, name: c.name, type: c.type as TransactionType }));
    } catch { return this.getDefaultCategories(); }
  },

  async addCategory(name: string, type: TransactionType): Promise<Category | null> {
    if (!supabase) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from('categories').insert([{
        user_id: user.id, name, type
      }]).select().single();
      if (error) return null;
      return { id: data.id, name: data.name, type: data.type as TransactionType };
    } catch { return null; }
  },

  async updateCategory(id: string, name: string, type: TransactionType): Promise<Category | null> {
    if (!supabase) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from('categories').update({ name, type }).eq('id', id).eq('user_id', user.id).select().single();
      if (error) return null;
      return { id: data.id, name: data.name, type: data.type as TransactionType };
    } catch { return null; }
  },

  async deleteCategory(id: string) {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id);
    } catch {}
  },

  async getGoals(): Promise<FinancialGoal[]> {
    if (!supabase) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase.from('goals').select('*').eq('user_id', user.id);
    if (error) return [];
    return data.map(g => ({ id: g.id, userId: g.user_id, type: g.type as any, amount: parseFloat(g.amount), month: g.month }));
  },

  async saveGoal(goal: Omit<FinancialGoal, 'id' | 'userId'>): Promise<boolean> {
    if (!supabase) return false;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    await supabase.from('goals').delete().eq('user_id', user.id).eq('type', goal.type).eq('month', goal.month);
    const { error } = await supabase.from('goals').insert([{ user_id: user.id, type: goal.type, amount: goal.amount, month: goal.month }]);
    return !error;
  },

  async getAISettings(): Promise<AISettings> {
    const saved = localStorage.getItem('financepro_ai_settings');
    if (saved) return JSON.parse(saved);
    return DEFAULT_AI_SETTINGS;
  },

  async saveAISettings(settings: AISettings) {
    localStorage.setItem('financepro_ai_settings', JSON.stringify(settings));
  },

  getDefaultCategories(): Category[] {
    return [
      { id: '1', name: 'Vendas', type: TransactionType.INCOME },
      { id: '2', name: 'Serviços', type: TransactionType.INCOME },
      { id: '3', name: 'Salários', type: TransactionType.EXPENSE },
      { id: '4', name: 'Aluguel', type: TransactionType.EXPENSE }
    ];
  }
};
