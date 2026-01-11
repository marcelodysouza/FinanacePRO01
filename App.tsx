
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Dashboard from './components/Dashboard.tsx';
import Reports from './components/Reports.tsx';
import TransactionForm from './components/TransactionForm.tsx';
import FinancialGoals from './components/FinancialGoals.tsx';
import Settings from './components/Settings.tsx';
import { PersistenceService } from './services/persistenceService.ts';
import { NotificationService } from './services/notificationService.ts';
import { User, Transaction, Category, TransactionType, FinancialGoal, UserRole } from './types.ts';
import { Loader2, ShieldCheck, Database, WifiOff, RefreshCcw } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Sync theme with document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const fetchAllData = async () => {
    try {
      setFetchError(null);
      const [t, c, g] = await Promise.all([
        PersistenceService.getTransactions(),
        PersistenceService.getCategories(),
        PersistenceService.getGoals()
      ]);
      setTransactions(t);
      setCategories(c);
      setGoals(g);
    } catch (e: any) {
      console.error("Erro ao buscar dados:", e);
      if (e.message?.includes('fetch')) {
        setFetchError("Falha na conexão com o servidor. Verifique bloqueadores no navegador.");
      } else {
        setFetchError("Ocorreu um erro inesperado ao carregar seus dados.");
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const currUser = await PersistenceService.getCurrentUser();
        if (currUser) {
          setUser(currUser);
          await fetchAllData();
        }
      } catch (e) {
        setFetchError("Erro na autenticação. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (transactions.length === 0 || goals.length === 0) return;
    const monthExpenses = transactions
      .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonth))
      .reduce((acc, t) => acc + t.amount, 0);

    const spendingGoal = goals.find(g => g.type === 'SPENDING_LIMIT' && g.month === currentMonth);

    if (spendingGoal && spendingGoal.amount > 0) {
      const spendingRatio = monthExpenses / spendingGoal.amount;
      if (spendingRatio >= 1.0) {
        const key = `spending_limit_reached_${currentMonth}`;
        if (NotificationService.shouldNotify(key)) {
          NotificationService.sendNotification(
            "⚠️ Limite Atingido!",
            `Você ultrapassou seu limite de R$ ${spendingGoal.amount.toLocaleString('pt-BR')}.`
          );
          NotificationService.markAsNotified(key);
        }
      }
    }
  }, [transactions, goals, currentMonth]);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    const email = e.target.email.value;
    const pass = e.target.password.value;
    try {
      const { user: logged, error } = await PersistenceService.signIn(email, pass);
      if (logged) {
        setUser(logged);
        await fetchAllData();
      } else {
        alert(error);
      }
    } catch (err: any) {
      alert("Erro ao conectar: " + err.message);
    }
  };

  const refreshData = async () => {
    await fetchAllData();
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  const handleLogout = () => {
    PersistenceService.signOut();
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-indigo-950 flex flex-col items-center justify-center text-white p-8 text-center">
        <Loader2 className="animate-spin mb-6 text-indigo-400" size={64} />
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">FinancePro AI</h2>
        <p className="font-bold text-indigo-300/60 uppercase tracking-widest text-xs">Sincronizando seus dados financeiros...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-200">
              <ShieldCheck className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">FinancePro AI</h1>
            <p className="text-slate-500 font-medium">Gestão Financeira com Inteligência</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input name="email" type="email" placeholder="E-mail" required className="w-full px-5 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
            <input name="password" type="password" placeholder="Senha" required className="w-full px-5 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Entrar no Sistema</button>
          </form>
          <div className="mt-8 p-4 bg-indigo-50 rounded-2xl flex items-center gap-3">
             <Database className="text-indigo-600" size={20} />
             <p className="text-[10px] text-indigo-900 font-bold leading-tight">Dados seguros e sincronizados.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout} transactions={transactions}>
        {fetchError && (
          <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-4 text-rose-600 animate-fade-in">
            <WifiOff size={24} className="shrink-0" />
            <div className="flex-1">
               <p className="text-sm font-black uppercase tracking-tight">Erro de Sincronização</p>
               <p className="text-xs font-medium opacity-80">{fetchError}</p>
            </div>
            <button onClick={refreshData} className="p-3 bg-white rounded-xl shadow-sm hover:bg-rose-100 transition-colors">
              <RefreshCcw size={18} />
            </button>
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<Dashboard transactions={transactions} />} />
          <Route 
            path="/transactions" 
            element={
              <Reports 
                transactions={transactions} 
                onDeleteTransaction={(id) => PersistenceService.deleteTransaction(id).then(refreshData)} 
                onEditTransaction={handleEditTransaction}
                canManage={true} 
              />
            } 
          />
          <Route path="/goals" element={<FinancialGoals transactions={transactions} onGoalsUpdated={refreshData} />} />
          <Route 
            path="/settings" 
            element={
              <Settings 
                categories={categories} 
                onAdd={(n, t) => PersistenceService.addCategory(n, t).then(refreshData)} 
                onUpdate={(id, n, t) => PersistenceService.updateCategory(id, n, t).then(refreshData)} 
                onDelete={(id) => PersistenceService.deleteCategory(id).then(refreshData)} 
                userRole={user.role}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                onLogout={handleLogout}
              />
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        
        <button 
          onClick={() => setIsFormOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
        >
          <span className="text-3xl font-light group-hover:rotate-90 transition-transform">+</span>
        </button>

        {isFormOpen && (
          <TransactionForm 
            categories={categories}
            onClose={handleCloseForm}
            userRole={user.role}
            initialData={editingTransaction}
            onSave={async (tx, id) => {
              if (id) await PersistenceService.updateTransaction(id, tx);
              else await PersistenceService.addTransaction(tx);
              await refreshData();
              handleCloseForm();
            }}
          />
        )}
      </Layout>
    </Router>
  );
};

export default App;
