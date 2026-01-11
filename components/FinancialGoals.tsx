
import React, { useState, useEffect, useMemo } from 'react';
import { Target, TrendingDown, Wallet, Save, Calendar, AlertCircle, CheckCircle2, TrendingUp, Zap, Sparkles, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Transaction, TransactionType, FinancialGoal } from '../types';
import { PersistenceService } from '../services/persistenceService';

interface FinancialGoalsProps {
  transactions: Transaction[];
  onGoalsUpdated?: () => void;
}

const FinancialGoals: React.FC<FinancialGoalsProps> = ({ transactions, onGoalsUpdated }) => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [spendingLimit, setSpendingLimit] = useState<string>('');
  const [savingsTarget, setSavingsTarget] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const fetchGoals = async () => {
    const data = await PersistenceService.getGoals();
    setGoals(data);
    const sl = data.find(g => g.type === 'SPENDING_LIMIT' && g.month === selectedMonth);
    const st = data.find(g => g.type === 'SAVINGS_TARGET' && g.month === selectedMonth);
    
    setSpendingLimit(sl ? sl.amount.toString() : '');
    setSavingsTarget(st ? st.amount.toString() : '');
  };

  useEffect(() => {
    fetchGoals();
  }, [selectedMonth]);

  const monthStats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === TransactionType.INCOME && t.date.startsWith(selectedMonth))
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions
      .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(selectedMonth))
      .reduce((acc, t) => acc + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [transactions, selectedMonth]);

  const handleSaveGoals = async () => {
    setIsSaving(true);
    try {
      const success = await Promise.all([
        PersistenceService.saveGoal({ type: 'SPENDING_LIMIT', amount: parseFloat(spendingLimit) || 0, month: selectedMonth }),
        PersistenceService.saveGoal({ type: 'SAVINGS_TARGET', amount: parseFloat(savingsTarget) || 0, month: selectedMonth })
      ]);
      
      await fetchGoals();
      if (onGoalsUpdated) onGoalsUpdated();
      setMessage({ text: 'Metas atualizadas com sucesso!', type: 'success' });
    } catch (e) {
      setMessage({ text: 'Ocorreu um erro ao salvar as metas. Tente novamente.', type: 'error' });
    }
    setIsSaving(false);
    
    // Auto-hide message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  const changeMonth = (offset: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  const formattedMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const spendingValue = parseFloat(spendingLimit) || 0;
  const savingsValue = parseFloat(savingsTarget) || 0;

  const spendingProgress = useMemo(() => {
    if (spendingValue === 0) return 0;
    return (monthStats.expenses / spendingValue) * 100;
  }, [monthStats.expenses, spendingValue]);

  const savingsProgress = useMemo(() => {
    if (savingsValue === 0) return 0;
    return (monthStats.balance / savingsValue) * 100;
  }, [monthStats.balance, savingsValue]);

  return (
    <div className="space-y-8 animate-fade-in pb-12 relative">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes glow-shine {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }
        .animate-glow-shine {
          animation: glow-shine 3s infinite ease-in-out;
        }
        .glass-reflection {
          background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.05) 100%);
        }
      `}} />

      {/* Floating Feedback Notification */}
      {message && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
          <div className={`${
            message.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          } text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 backdrop-blur-md min-w-[320px]`}>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 leading-none mb-1">
                Notificação de Sistema
              </p>
              <span className="font-bold text-sm tracking-tight">{message.text}</span>
            </div>
            <button 
              onClick={() => setMessage(null)} 
              className="ml-2 hover:bg-white/10 p-1.5 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Target className="text-white" size={24} />
            </div>
            Metas e Orçamento
          </h2>
          <p className="text-gray-500 font-medium ml-1">Configure seus objetivos financeiros mensais.</p>
        </div>

        {/* Month Selector UI */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-indigo-600 active:scale-90"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-center px-4 min-w-[140px]">
            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest leading-none mb-1">Referência</span>
            <span className="text-sm font-black text-gray-800 capitalize">{formattedMonth}</span>
          </div>
          <button 
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-indigo-600 active:scale-90"
          >
            <ChevronRight size={20} />
          </button>
          <div className="h-8 w-px bg-gray-100 mx-1"></div>
          <div className="relative group px-2">
            <input 
              type="month" 
              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
            <Calendar size={20} className="text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <Calendar size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Ajuste de Planejamento</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <TrendingDown size={16} className="text-rose-500" />
                Limite de Gastos para {formattedMonth}
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black transition-colors group-focus-within:text-indigo-600">R$</span>
                <input 
                  type="number" 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-black text-lg shadow-inner"
                  placeholder="0,00"
                  value={spendingLimit}
                  onChange={(e) => setSpendingLimit(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Wallet size={16} className="text-emerald-500" />
                Meta de Poupança para {formattedMonth}
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black transition-colors group-focus-within:text-indigo-600">R$</span>
                <input 
                  type="number" 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-black text-lg shadow-inner"
                  placeholder="0,00"
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={handleSaveGoals}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-700 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Save size={20} />
              {isSaving ? 'Gravando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 relative overflow-hidden">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1 flex items-center gap-1">
                  <TrendingDown size={10} /> Gastos Reais ({formattedMonth})
                </p>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  R$ {monthStats.expenses.toLocaleString('pt-BR')} 
                  <span className="text-slate-300 mx-2 text-base font-medium">/</span>
                  <span className="text-slate-400 text-lg font-bold">R$ {spendingValue.toLocaleString('pt-BR')}</span>
                </h3>
              </div>
              <div className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                spendingProgress > 100 ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 
                spendingProgress > 80 ? 'bg-amber-500 text-white' : 
                'bg-indigo-50 text-indigo-600'
              }`}>
                {spendingProgress.toFixed(0)}%
              </div>
            </div>

            <div className="relative w-full h-10 bg-slate-100 rounded-2xl p-1.5 overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-xl transition-all duration-1000 ease-out relative overflow-hidden ${
                  spendingProgress >= 100 ? 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 animate-pulse' : 
                  spendingProgress >= 80 ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500' : 
                  'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500'
                }`}
                style={{ width: `${Math.min(spendingProgress, 100)}%` }}
              >
                <div className="absolute inset-0 glass-reflection"></div>
                {spendingProgress >= 100 && (
                  <div className="absolute top-0 bottom-0 w-20 bg-white/20 blur-xl animate-glow-shine"></div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex items-start gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className={`mt-0.5 p-1 rounded-lg ${spendingProgress >= 100 ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {spendingProgress >= 100 ? <Zap size={14} /> : <CheckCircle2 size={14} />}
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {spendingValue === 0 ? "Defina um limite de gastos para acompanhar seu progresso." : 
                 spendingProgress >= 100 
                  ? <span className="font-bold text-rose-600 uppercase tracking-tight">Limite Excedido! Recomendamos revisar despesas imediatas.</span> 
                  : `Você ainda pode gastar R$ ${Math.max(0, spendingValue - monthStats.expenses).toLocaleString('pt-BR')} para manter-se na meta.`}
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 relative overflow-hidden">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1 flex items-center gap-1">
                  <TrendingUp size={10} /> Saldo Final Acumulado ({formattedMonth})
                </p>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  R$ {monthStats.balance.toLocaleString('pt-BR')} 
                  <span className="text-slate-300 mx-2 text-base font-medium">/</span>
                  <span className="text-slate-400 text-lg font-bold">R$ {savingsValue.toLocaleString('pt-BR')}</span>
                </h3>
              </div>
              <div className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-500 ${
                savingsProgress >= 100 ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 scale-105' : 'bg-indigo-50 text-indigo-600'
              }`}>
                {savingsProgress >= 100 ? 'META BATIDA!' : `${Math.max(0, savingsProgress).toFixed(0)}%`}
              </div>
            </div>

            <div className="relative w-full h-10 bg-slate-100 rounded-2xl p-1.5 overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-xl transition-all duration-1000 ease-out flex items-center justify-end px-4 relative overflow-hidden ${
                  savingsProgress >= 100 ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600' : 
                  savingsProgress > 0 ? 'bg-gradient-to-r from-violet-600 to-indigo-500' : 
                  'bg-slate-300'
                }`}
                style={{ width: `${Math.min(Math.max(0, savingsProgress), 100)}%` }}
              >
                <div className="absolute inset-0 glass-reflection"></div>
                {savingsProgress >= 100 && (
                  <>
                    <div className="absolute top-0 bottom-0 w-32 bg-white/30 blur-2xl animate-glow-shine"></div>
                    <Sparkles size={16} className="text-white animate-pulse relative z-10" />
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className={`mt-0.5 p-1 rounded-lg ${savingsProgress >= 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {savingsProgress >= 100 ? <Sparkles size={14} /> : <Target size={14} />}
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {savingsValue === 0 ? "Defina uma meta de poupança para este mês." : 
                 savingsProgress >= 100 
                  ? <span className="font-bold text-emerald-600 uppercase tracking-tight">Excelente! Você atingiu seu objetivo de economia este mês.</span> 
                  : monthStats.balance <= 0 
                    ? "Saldo negativo detectado. Priorize o reequilíbrio para retomar sua economia."
                    : `Faltam R$ ${Math.max(0, savingsValue - monthStats.balance).toLocaleString('pt-BR')} para consolidar sua reserva.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialGoals;
