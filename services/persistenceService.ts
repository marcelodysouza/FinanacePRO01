
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Transaction, Category, User, UserRole, TransactionType } from '../types';

/**
 * IMPORTANTE: Para o funcionamento pleno, execute este SQL no editor do seu projeto Supabase:
 * 
 * -- 1. Tabela de Transações
 * create table public.transactions (
 *   id uuid not null default gen_random_uuid(),
 *   user_id uuid not null references auth.users(id),
 *   date date not null,
 *   category text not null,
 *   description text not null,
 *   amount numeric not null,
 *   payment_method text not null,
 *   type text not null,
 *   attachment text,
 *   attachment_name text,
 *   created_at timestamptz not null default now(),
 *   constraint transactions_pkey primary key (id)
 * );
 * alter table public.transactions enable row level security;
 * create policy "Users can manage own transactions" on public.transactions for all using (auth.uid() = user_id);
 * 
 * -- 2. Tabela de Categorias
 * create table public.categories (
 *   id uuid not null default gen_random_uuid(),
 *   user_id uuid not null references auth.users(id),
 *   name text not null,
 *   type text not null,
 *   created_at timestamptz not null default now(),
 *   constraint categories_pkey primary key (id)
 * );
 * alter table public.categories enable row level security;
 * create policy "Users can manage own categories" on public.categories for all using (auth.uid() = user_id);
 * 
 * -- 3. Tabela de Backups
 * create table public.backups (
 *   id uuid not null default gen_random_uuid(),
 *   user_id uuid not null references auth.users(id),
 *   payload jsonb not null,
 *   type text not null,
 *   created_at timestamptz not null default now(),
 *   constraint backups_pkey primary key (id)
 * );
 * alter table public.backups enable row level security;
 * create policy "Users can manage own backups" on public.backups for all using (auth.uid() = user_id);
 */

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
      
      const role = UserRole.ADVANCED;

      return {
        id: user.id,
        name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Usuário',
        email: user.email || '',
        role: role
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

  async signUp(email: string, pass: string, name: string) {
    if (!supabase) return { error: 'Configuração ausente.' };
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { full_name: name } }
    });
    return { error: error?.message || null };
  },

  async signOut() {
    if (supabase) await supabase.auth.signOut();
  },

  async resetPassword(email: string) {
    if (!supabase) return { error: 'Configuração ausente.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return { error: error?.message || null };
  },

  async getUsers(): Promise<User[]> {
    const current = await this.getCurrentUser();
    return current ? [current] : [];
  },

  async getTransactions(): Promise<Transaction[]> {
    if (!supabase) return [];
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

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

    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: user.id,
        date: tx.date,
        category: tx.category,
        description: tx.description,
        amount: tx.amount,
        payment_method: tx.paymentMethod,
        type: tx.type,
        attachment: tx.attachment,
        attachment_name: tx.attachmentName
      }])
      .select().single();

    if (error) return null;
    return { ...tx, id: data.id };
  },

  async updateTransaction(id: string, tx: Omit<Transaction, 'id'>): Promise<Transaction | null> {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('transactions')
      .update({
        date: tx.date,
        category: tx.category,
        description: tx.description,
        amount: tx.amount,
        payment_method: tx.paymentMethod,
        type: tx.type,
        attachment: tx.attachment,
        attachment_name: tx.attachmentName
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select().single();

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

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error || !data || data.length === 0) return this.getDefaultCategories();
      return data.map(c => ({ id: c.id, name: c.name, type: c.type as TransactionType }));
    } catch { return this.getDefaultCategories(); }
  },

  async addCategory(name: string, type: TransactionType): Promise<Category | null> {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, type, user_id: user.id }])
      .select().single();
    if (error) return null;
    return { id: data.id, name: data.name, type: data.type as TransactionType };
  },

  async updateCategory(id: string, name: string, type: TransactionType): Promise<Category | null> {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('categories')
      .update({ name, type })
      .eq('id', id)
      .eq('user_id', user.id)
      .select().single();
    if (error) return null;
    return { id: data.id, name: data.name, type: data.type as TransactionType };
  },

  async deleteCategory(id: string) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id);
  },

  async createBackupSnapshot(transactions: Transaction[], categories: Category[]): Promise<{ success: boolean, tableMissing?: boolean }> {
    if (!supabase) return { success: false };
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false };

      const snapshot = {
        timestamp: new Date().toISOString(),
        transactions_count: transactions.length,
        categories_count: categories.length,
        data: { transactions, categories }
      };

      const { error } = await supabase
        .from('backups')
        .insert([{
          user_id: user.id,
          payload: snapshot,
          type: 'AUTO_BACKUP'
        }]);

      if (error) {
        // Silencia avisos técnicos de schema cache ou tabela ausente para evitar poluição do console
        const isTableMissing = error.code === '42P01' || 
                              error.message.includes('Could not find the table') || 
                              error.message.includes('schema cache');
        
        if (isTableMissing) {
          // Apenas retorna informando que a tabela falta, sem disparar erro no console
          return { success: false, tableMissing: true };
        }
        return { success: false };
      }
      return { success: true };
    } catch (e) {
      return { success: false };
    }
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
