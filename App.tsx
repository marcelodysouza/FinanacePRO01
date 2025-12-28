
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';
import CategoryManagement from './components/CategoryManagement';
import { User, UserRole, Transaction, Category, TransactionType } from './types';
import { ShieldCheck, UserPlus, ArrowLeft, CheckCircle2, PlusCircle, Loader2, AlertTriangle, Database, KeyRound, MailCheck, Info, X } from 'lucide-react';
import { PersistenceService } from './services/persistenceService';
import { NotificationService } from './services/notificationService';

type AuthView = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'REGISTER_SUCCESS';

const BACKUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos
const NOTIFICATION_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutos

const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  
  // Backup & Notifications State
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [notifiedIds, setNotifiedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('financepro_notified_today');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Refs to maintain current state for background tasks
  const transactionsRef = useRef<Transaction[]>([]);
  const categoriesRef = useRef<Category[]>([]);

  useEffect(() => {
    transactionsRef.current = transactions;
    categoriesRef.current = categories;
  }, [transactions, categories]);

  // Auth State
  const [authView, setAuthView] = useState<AuthView>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  
  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const loadData = async () => {
    const [c, t, u] = await Promise.all([
      PersistenceService.getCategories(),
      PersistenceService.getTransactions(),
      PersistenceService.getUsers()
    ]);
    setCategories(c);
    setTransactions(t);
    setUsers(u);
  };

  useEffect(() => {
    const init = async () => {
      const configStatus = PersistenceService.isConfigured();
      setIsConfigured(configStatus);

      if (configStatus) {
        const currUser = await PersistenceService.getCurrentUser();
        if (currUser) {
          setUser(currUser);
          await loadData();
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // Check for upcoming reminders and notify
  useEffect(() => {
    if (!user || transactions.length === 0) return;

    const checkReminders = () => {
      const today = new Date().toISOString().split('T')[0];
      const upcoming = transactionsRef.current.filter(t => {
        return t.type === TransactionType.EXPENSE && 
               t.date === today && 
               !notifiedIds.includes(t.id);
      });

      if (upcoming.length > 0) {
        upcoming.forEach(t => {
          NotificationService.sendNotification(
            'Lembrete de Pagamento',
            `Hoje vence: ${t.description} (R$ ${t.amount.toLocaleString('pt-BR')})`
          );
        });

        const newNotified = [...notifiedIds, ...upcoming.map(t => t.id)];
        setNotifiedIds(newNotified);
        localStorage.setItem('financepro_notified_today', JSON.stringify(newNotified));
      }
    };

    // Check once on load, then periodically
    checkReminders();
    const interval = setInterval(checkReminders, NOTIFICATION_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [user, transactions.length, notifiedIds]);

  // Periodic Backup Logic
  useEffect(() => {
    if (!user || !isConfigured) return;

    const performBackup = async () => {
      if (transactionsRef.current.length === 0) return;
      
      setIsBackingUp(true);
      const result = await PersistenceService.createBackupSnapshot(
        transactionsRef.current, 
        categoriesRef.current
      );
      
      if (result.success) {
        setLastBackupTime(new Date());
      }
      setIsBackingUp(false);
    };

    const initialDelay = setTimeout(performBackup, 30000);
    const interval = setInterval(performBackup, BACKUP_INTERVAL_MS);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [user, isConfigured]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) return;
    setIsSubmitting(true);
    setAuthError('');
    setAuthSuccess('');
    const { user: loggedUser, error } = await PersistenceService.signIn(email, password);
    if (loggedUser) {
      setUser(loggedUser);
      await loadData();
    } else {
      setAuthError(error || 'Credenciais inválidas.');
    }
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) return;
    setIsSubmitting(true);
    setAuthError('');
    setAuthSuccess('');
    const { error } = await PersistenceService.signUp(email, password, name);
    if (!error) {
      setAuthView('REGISTER_SUCCESS');
      setAuthSuccess('Verifique seu e-mail para confirmar a conta!');
    } else {
      setAuthError(error);
    }
    setIsSubmitting(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) return;
    
    setAuthError('');
    setAuthSuccess('');

    setIsSubmitting(true);
    const { error } = await PersistenceService.resetPassword(email);
    if (!error) {
      setAuthSuccess('Link de recuperação enviado para o seu e-mail!');
    } else {
      setAuthError(error);
    }
    setIsSubmitting(false);
  };

  const handleLogout = async () => {
    await PersistenceService.signOut();
    setUser(null);
    setTransactions([]);
    setLastBackupTime(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    await PersistenceService.deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsFormOpen(true);
  };

  const saveTransaction = async (txData: Omit<Transaction, 'id'>, id?: string) => {
    if (id) {
      const updated = await PersistenceService.updateTransaction(id, txData);
      if (updated) {
        setTransactions(prev => prev.map(t => t.id === id ? updated : t));
      }
    } else {
      const saved = await PersistenceService.addTransaction(txData);
      if (saved) {
        setTransactions(prev => [saved, ...prev]);
      }
    }
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-indigo-900 flex flex-col items-center justify-center text-white text-center p-4">
        <Loader2 className="animate-spin mb-4 text-indigo-300" size={56} />
        <span className="font-black tracking-widest animate-pulse uppercase text-lg">Iniciando FinancePro...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 -left-20 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 -right-20 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10 relative z-10 animate-fade-in">
          {authView !== 'REGISTER_SUCCESS' && (
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-200">
                <ShieldCheck className="text-white" size={32} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tighter">FinancePro</h1>
              <p className="text-gray-500 font-medium">Gestão Financeira Inteligente</p>
            </div>
          )}

          {!isConfigured && authView !== 'REGISTER_SUCCESS' && (
            <div className="mb-8 p-6 bg-orange-50 border border-orange-200 rounded-3xl flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                <Database size={24} />
              </div>
              <h3 className="font-bold text-orange-900">Configuração Necessária</h3>
              <p className="text-sm text-orange-800">Configure as chaves do Supabase para continuar.</p>
            </div>
          )}

          {authError && authView !== 'REGISTER_SUCCESS' && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-2 animate-shake">
            <AlertTriangle size={18} /> {authError}
          </div>}
          
          {authSuccess && authView !== 'REGISTER_SUCCESS' && authView !== 'REGISTER' && <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-2xl text-sm font-bold border border-green-100 flex items-center gap-2">
            <CheckCircle2 size={18} /> {authSuccess}
          </div>}

          {authView === 'REGISTER' ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <input type="text" required placeholder="Nome Completo" className="w-full px-5 py-4 bg-gray-50 border-gray-100 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all" value={name} onChange={(e) => setName(e.target.value)} disabled={!isConfigured} />
              <input type="email" required placeholder="E-mail" className="w-full px-5 py-4 bg-gray-50 border-gray-100 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isConfigured} />
              <input type="password" required placeholder="Senha" className="w-full px-5 py-4 bg-gray-50 border-gray-100 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!isConfigured} />
              <button disabled={isSubmitting || !isConfigured} type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Criar Conta'}
              </button>
              <button type="button" onClick={() => setAuthView('LOGIN')} className="w-full text-indigo-600 font-bold mt-2 hover:underline">Já tenho uma conta</button>
            </form>
          ) : authView === 'REGISTER_SUCCESS' ? (
            <div className="text-center animate-fade-in py-4">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MailCheck size={40} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-4">Registro Realizado!</h2>
              <button onClick={() => setAuthView('LOGIN')} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl">Ir para o Login</button>
            </div>
          ) : authView === 'FORGOT_PASSWORD' ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold"><KeyRound size={20} /><span>Recuperar Senha</span></div>
              <input type="email" required placeholder="E-mail de cadastro" className="w-full px-5 py-4 bg-gray-50 border-gray-100 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isConfigured} />
              <button disabled={isSubmitting || !isConfigured} type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95">Enviar Link</button>
              <button type="button" onClick={() => setAuthView('LOGIN')} className="w-full flex items-center justify-center gap-2 text-gray-500 font-bold hover:text-indigo-600"><ArrowLeft size={18} /> Voltar</button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="email" required placeholder="E-mail" className="w-full px-5 py-4 bg-gray-50 border-gray-100 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isConfigured} />
              <div className="space-y-2">
                <input type="password" required placeholder="Senha" className="w-full px-5 py-4 bg-gray-50 border-gray-100 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!isConfigured} />
                <div className="text-right"><button type="button" onClick={() => setAuthView('FORGOT_PASSWORD')} className="text-sm font-bold text-indigo-600 hover:underline">Esqueceu a Senha?</button></div>
              </div>
              <button disabled={isSubmitting || !isConfigured} type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95">Entrar</button>
              <button type="button" onClick={() => setAuthView('REGISTER')} className="w-full text-indigo-600 font-bold hover:underline">Cadastrar-se agora</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout 
        user={user} 
        onLogout={handleLogout} 
        transactions={transactions}
        backupStatus={{ lastTime: lastBackupTime, isBackingUp }}
      >
        <Routes>
          <Route path="/" element={<Dashboard transactions={transactions} />} />
          <Route path="/transactions" element={<Reports transactions={transactions} onEditTransaction={handleEditTransaction} onDeleteTransaction={handleDeleteTransaction} canManage={true} />} />
          <Route path="/reports" element={<Reports transactions={transactions} onEditTransaction={handleEditTransaction} onDeleteTransaction={handleDeleteTransaction} canManage={true} />} />
          <Route path="/settings" element={<CategoryManagement categories={categories} onAdd={async (n, t) => { const cat = await PersistenceService.addCategory(n, t); if (cat) setCategories(p => [...p, cat]); }} onUpdate={async (id, n, t) => { const updated = await PersistenceService.updateCategory(id, n, t); if (updated) setCategories(p => p.map(c => c.id === id ? updated : c)); }} onDelete={async (id) => { await PersistenceService.deleteCategory(id); setCategories(p => p.filter(c => c.id !== id)); }} userRole={user.role} />} />
          <Route path="/users" element={user.role === UserRole.ADVANCED ? <UserManagement users={users} onUpdateRole={() => {}} currentUser={user} /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {user.role === UserRole.ADVANCED && (
          <button onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }} className="fixed bottom-8 right-8 bg-indigo-600 text-white w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-30 group">
            <PlusCircle size={32} />
          </button>
        )}

        {isFormOpen && (
          <TransactionForm 
            onSave={saveTransaction} 
            onClose={() => { setIsFormOpen(false); setEditingTransaction(null); }} 
            userRole={user.role} 
            categories={categories}
            initialData={editingTransaction}
          />
        )}
      </Layout>
    </Router>
  );
};

export default App;
