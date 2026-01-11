
import React, { useState, useEffect } from 'react';
import { Category, TransactionType, UserRole, AISettings } from '../types';
import { Plus, Trash2, Tag, Pencil, X, Check, CheckCircle2, BrainCircuit, Sparkles, Save, RotateCcw, Moon, Sun, ShieldAlert } from 'lucide-react';
import { PersistenceService } from '../services/persistenceService';

interface SettingsProps {
  categories: Category[];
  onAdd: (name: string, type: TransactionType) => void;
  onUpdate: (id: string, name: string, type: TransactionType) => Promise<void> | void;
  onDelete: (id: string) => void;
  userRole: UserRole;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  categories, onAdd, onUpdate, onDelete, userRole, 
  isDarkMode, onToggleDarkMode
}) => {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<TransactionType>(TransactionType.INCOME);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<TransactionType>(TransactionType.INCOME);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
  const [isSavingAI, setIsSavingAI] = useState(false);

  useEffect(() => {
    const fetchAI = async () => {
      const settings = await PersistenceService.getAISettings();
      setAiSettings(settings);
    };
    fetchAI();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSaveAISettings = async () => {
    if (!aiSettings) return;
    setIsSavingAI(true);
    await PersistenceService.saveAISettings(aiSettings);
    setIsSavingAI(false);
    setSuccessMessage('Prompts atualizados!');
  };

  const handleResetAI = async () => {
    if (window.confirm('Restaurar prompts padrões?')) {
      localStorage.removeItem('financepro_ai_settings');
      const fresh = await PersistenceService.getAISettings();
      setAiSettings(fresh);
      setSuccessMessage('Prompts restaurados.');
    }
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20 dark:text-slate-100">
      {successMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
          <div className="bg-emerald-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border border-white/20">
            <CheckCircle2 size={20} />
            <span className="font-black text-sm uppercase tracking-tight">{successMessage}</span>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Check size={24} />
          </div>
          Configurações
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">Personalize sua experiência no FinancePro AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* COLUNA ESQUERDA: VISUAL E IA */}
        <div className="space-y-8">
          {/* MODO DARK */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-indigo-900 text-indigo-400' : 'bg-amber-50 text-amber-500'}`}>
                  {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Aparência Visual</h3>
                  <p className="text-xs text-slate-400 font-medium">Alternar entre modo claro e escuro</p>
                </div>
              </div>
              <button 
                onClick={onToggleDarkMode}
                className={`w-14 h-8 rounded-full relative transition-all duration-300 shadow-inner ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${isDarkMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* IA PROMPTS */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <BrainCircuit size={160} />
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
               <Sparkles className="text-indigo-400" size={24} />
               <h3 className="font-black uppercase tracking-tight">Prompts do Gemini AI</h3>
            </div>

            {aiSettings ? (
              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Personalidade Financeira</label>
                  <textarea
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm min-h-[120px] text-slate-100"
                    value={aiSettings.insightsPrompt}
                    onChange={(e) => setAiSettings({ ...aiSettings, insightsPrompt: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Regras de OCR (Recibos)</label>
                  <textarea
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm min-h-[120px] text-slate-100"
                    value={aiSettings.receiptPrompt}
                    onChange={(e) => setAiSettings({ ...aiSettings, receiptPrompt: e.target.value })}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSaveAISettings}
                    disabled={isSavingAI}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSavingAI ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                    Salvar Prompts
                  </button>
                  <button onClick={handleResetAI} className="p-4 bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all">
                    <RotateCcw size={20} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* COLUNA DIREITA: CATEGORIAS */}
        <div className="space-y-8">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="text-indigo-600" size={20} />
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-slate-200">Categorias Financeiras</h3>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
            <form onSubmit={(e) => { e.preventDefault(); if (newName.trim()) onAdd(newName, newType); setNewName(''); }} className="space-y-4">
              <input
                type="text"
                placeholder="Nova categoria..."
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div className="flex gap-4">
                <select
                  className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-2xl font-bold text-sm appearance-none"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as TransactionType)}
                >
                  <option value={TransactionType.INCOME}>Entrada</option>
                  <option value={TransactionType.EXPENSE}>Saída</option>
                </select>
                <button type="submit" className="bg-indigo-600 text-white px-8 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all active:scale-95">Adicionar</button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden divide-y dark:divide-slate-700">
            {categories.map(c => (
              <div key={c.id} className="p-5 flex justify-between items-center group">
                {editingId === c.id ? (
                  <div className="flex-1 flex gap-2">
                    <input className="flex-1 px-4 py-2 bg-indigo-50 dark:bg-slate-900 dark:text-white rounded-xl font-bold" value={editName} onChange={e => setEditName(e.target.value)} />
                    <button onClick={async () => { await onUpdate(c.id, editName, editType); setEditingId(null); }} className="p-2 text-green-600"><Check size={20} /></button>
                    <button onClick={() => setEditingId(null)} className="p-2 text-rose-600"><X size={20} /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${c.type === TransactionType.INCOME ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="font-black text-slate-800 dark:text-white tracking-tight">{c.name}</span>
                    </div>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditingId(c.id); setEditName(c.name); setEditType(c.type); }} className="p-2 text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-xl"><Pencil size={18} /></button>
                      <button onClick={() => onDelete(c.id)} className="p-2 text-slate-300 hover:text-rose-500 rounded-xl"><Trash2 size={18} /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
