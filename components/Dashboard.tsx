
import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction, TransactionType, FinancialForecast, FinancialGoal } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Sparkles, BrainCircuit, Target, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { getFinancialInsights, getFinancialForecast } from '../services/geminiService';
import { PersistenceService } from '../services/persistenceService';
import { Link } from 'react-router-dom';

const Dashboard: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const [insights, setInsights] = useState('');
  const [forecast, setForecast] = useState<FinancialForecast | null>(null);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(false);

  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const stats = useMemo(() => {
    const inc = transactions.filter(t => t.type === TransactionType.INCOME).reduce((a, b) => a + b.amount, 0);
    const exp = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((a, b) => a + b.amount, 0);
    const monthExp = transactions.filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonth)).reduce((a, b) => a + b.amount, 0);
    const monthInc = transactions.filter(t => t.type === TransactionType.INCOME && t.date.startsWith(currentMonth)).reduce((a, b) => a + b.amount, 0);
    return { inc, exp, bal: inc - exp, monthExp, monthBal: monthInc - monthExp };
  }, [transactions, currentMonth]);

  useEffect(() => {
    const fetchAI = async () => {
      const g = await PersistenceService.getGoals();
      setGoals(g);
      if (transactions.length > 0) {
        setLoading(true);
        const [text, pred] = await Promise.all([
          getFinancialInsights(transactions, g),
          getFinancialForecast(transactions)
        ]);
        setInsights(text);
        setForecast(pred);
        setLoading(false);
      }
    };
    fetchAI();
  }, [transactions]);

  const spendingGoal = goals.find(g => g.type === 'SPENDING_LIMIT' && g.month === currentMonth);
  const savingsGoal = goals.find(g => g.type === 'SAVINGS_TARGET' && g.month === currentMonth);

  const chartData = useMemo(() => {
    const map: any = {};
    [...transactions].reverse().forEach(t => {
      const dateStr = t.date.includes('T') ? t.date : t.date + 'T12:00:00';
      const key = new Date(dateStr).toLocaleDateString('pt-BR', { month: 'short' });
      if (!map[key]) map[key] = { name: key, income: 0, expense: 0 };
      if (t.type === TransactionType.INCOME) map[key].income += t.amount;
      else map[key].expense += t.amount;
    });
    return Object.values(map);
  }, [transactions]);

  return (
    <div className="space-y-8 animate-fade-in dark:text-white">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Fluxo de caixa inteligente com Gemini AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4"><TrendingUp /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Receitas Totais</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">R$ {stats.inc.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-4"><TrendingDown /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Despesas Totais</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">R$ {stats.exp.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-indigo-600 dark:bg-indigo-500 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 dark:shadow-none">
          <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-4"><DollarSign /></div>
          <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Saldo Atual</p>
          <p className="text-3xl font-black">R$ {stats.bal.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm h-[400px]">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-2">
              <TrendingUp className="text-indigo-600 dark:text-indigo-400" size={18} /> Histórico Mensal
            </h3>
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', backgroundColor: '#1e293b', color: 'white'}} />
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#colorInc)" strokeWidth={4} />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="transparent" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-black p-8 rounded-[3rem] text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-10 opacity-5"><BrainCircuit size={120} /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6 text-indigo-400 font-black text-xs uppercase tracking-widest">
              <Sparkles size={16} /> Insights da IA
            </div>
            {loading ? (
              <div className="space-y-4">
                <div className="h-4 bg-white/5 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-white/5 rounded w-4/5 animate-pulse"></div>
              </div>
            ) : (
              <p className="text-sm font-medium italic text-slate-300 leading-relaxed">"{insights}"</p>
            )}
          </div>
          
          {forecast && (
            <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black uppercase text-indigo-400">Previsão Próximo Mês</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${forecast.riskLevel === 'LOW' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  RISCO {forecast.riskLevel}
                </span>
              </div>
              <p className="text-3xl font-black text-white">R$ {forecast.predictedBalance.toLocaleString('pt-BR')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
