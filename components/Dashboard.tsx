
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from 'recharts';
import { Transaction, TransactionType, FinancialForecast } from '../types';
import { 
  TrendingUp, TrendingDown, DollarSign, Sparkles, LineChart as LineChartIcon, 
  Target, Calendar, PieChart as PieIcon, BarChart3, Settings2, Eye, EyeOff, 
  ArrowUp, ArrowDown, X, GripVertical, AlertCircle, Clock, Bell, Printer, BrainCircuit
} from 'lucide-react';
import { getFinancialInsights, getFinancialForecast } from '../services/geminiService';

interface DashboardProps {
  transactions: Transaction[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9'];

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [preset, setPreset] = useState<'all' | 'week' | 'month' | 'year'>('month');
  const [aiInsights, setAiInsights] = useState<string>('');
  const [forecast, setForecast] = useState<FinancialForecast | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (preset === 'week') return (now.getTime() - tDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      if (preset === 'month') return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      if (preset === 'year') return tDate.getFullYear() === now.getFullYear();
      return true;
    });
  }, [transactions, preset]);

  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [filteredTransactions]);

  useEffect(() => {
    const fetchAiData = async () => {
      if (transactions.length > 0) {
        setIsLoadingAi(true);
        const [insights, pred] = await Promise.all([
          getFinancialInsights(filteredTransactions),
          getFinancialForecast(transactions)
        ]);
        setAiInsights(insights);
        setForecast(pred);
        setIsLoadingAi(false);
      }
    };
    fetchAiData();
  }, [filteredTransactions, transactions]);

  const chartData = useMemo(() => {
    const days: Record<string, any> = {};
    filteredTransactions.forEach(t => {
      const d = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!days[d]) days[d] = { name: d, income: 0, expense: 0 };
      if (t.type === TransactionType.INCOME) days[d].income += t.amount;
      else days[d].expense += t.amount;
    });
    return Object.values(days).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTransactions]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Estilo Streamlit */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Fluxo de Caixa Inteligente</h2>
          <p className="text-gray-500 text-sm font-medium">Insights em tempo real alimentados por IA</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          {(['week', 'month', 'year', 'all'] as const).map(p => (
            <button 
              key={p} 
              onClick={() => setPreset(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${preset === p ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
            >
              {p === 'all' ? 'Tudo' : p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center"><TrendingUp /></div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Receitas</p>
            <p className="text-2xl font-black text-gray-900">R$ {stats.income.toLocaleString('pt-BR')}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center"><TrendingDown /></div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Despesas</p>
            <p className="text-2xl font-black text-gray-900">R$ {stats.expenses.toLocaleString('pt-BR')}</p>
          </div>
        </div>
        <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-100 flex items-center gap-4 text-white">
          <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center"><DollarSign /></div>
          <div>
            <p className="text-xs font-black text-indigo-200 uppercase tracking-widest">Saldo Líquido</p>
            <p className="text-2xl font-black">R$ {stats.balance.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico Principal */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <BarChart3 className="text-indigo-600" /> Movimentação Diária
            </h3>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" strokeWidth={3} />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Sidebar Style */}
        <div className="space-y-6">
          <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><BrainCircuit size={80} /></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="text-indigo-300" size={20} />
                <h3 className="font-black text-sm uppercase tracking-widest">Análise do Gemini</h3>
              </div>
              {isLoadingAi ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-full"></div>
                  <div className="h-4 bg-white/10 rounded w-5/6"></div>
                  <div className="h-4 bg-white/10 rounded w-4/6"></div>
                </div>
              ) : (
                <p className="text-indigo-100 text-sm font-medium leading-relaxed italic">"{aiInsights}"</p>
              )}
            </div>
          </div>

          {forecast && (
            <div className={`p-8 rounded-[2.5rem] border shadow-sm ${forecast.riskLevel === 'HIGH' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
               <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-gray-900 text-sm uppercase tracking-tight">Previsão 30 Dias</h4>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${forecast.riskLevel === 'HIGH' ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}`}>
                    RISCO {forecast.riskLevel}
                  </span>
               </div>
               <p className="text-2xl font-black text-gray-900 mb-2">R$ {forecast.predictedBalance.toLocaleString('pt-BR')}</p>
               <p className="text-xs text-gray-600 leading-tight">{forecast.explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
