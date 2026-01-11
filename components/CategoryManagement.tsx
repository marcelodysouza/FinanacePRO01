
import React, { useState, useEffect } from 'react';
import { Category, TransactionType, UserRole, AISettings } from '../types';
import { Plus, Trash2, Tag, Pencil, X, Check, CheckCircle2, AlertTriangle, BrainCircuit, Sparkles, Save, RotateCcw } from 'lucide-react';
import { PersistenceService } from '../services/persistenceService';

interface CategoryManagementProps {
  categories: Category[];
  onAdd: (name: string, type: TransactionType) => void;
  onUpdate: (id: string, name: string, type: TransactionType) => Promise<void> | void;
  onDelete: (id: string) => void;
  userRole: UserRole;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ categories, onAdd, onUpdate, onDelete, userRole }) => {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<TransactionType>(TransactionType.INCOME);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<TransactionType>(TransactionType.INCOME);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // AI Prompt Settings
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== UserRole.ADVANCED) return;
    if (newName.trim()) {
      onAdd(newName.trim(), newType);
      setNewName('');
      setSuccessMessage('Categoria criada com sucesso!');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editName.trim()) {
      await onUpdate(editingId, editName.trim(), editType);
      setEditingId(null);
      setSuccessMessage('Categoria atualizada!');
    }
  };

  const handleSaveAISettings = async () => {
    if (!aiSettings || userRole !== UserRole.ADVANCED) return;
    setIsSavingAI(true);
    await PersistenceService.saveAISettings(aiSettings);
    setIsSavingAI(false);
    setSuccessMessage('Configurações de IA aplicadas!');
  };

  const handleResetAI = async () => {
    if (window.confirm('Deseja restaurar os prompts padrões da IA? Todas as personalizações serão perdidas.')) {
      localStorage.removeItem('financepro_ai_settings');
      const fresh = await PersistenceService.getAISettings();
      setAiSettings(fresh);
      setSuccessMessage('Prompts restaurados para o padrão.');
    }
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      {successMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
          <div className="bg-green-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border border-white/20 backdrop-blur-md">
            <CheckCircle2 size={20} />
            <span className="font-black text-sm uppercase tracking-tight">{successMessage}</span>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Tag size={24} />
          </div>
          Configurações do Sistema
        </h2>
        <p className="text-gray-500 font-medium ml-1">Gerencie categorias de fluxo e o comportamento da IA.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="text-indigo-600" size={20} />
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Categorias Financeiras</h3>
          </div>

          {userRole === UserRole.ADVANCED && (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Nome da categoria (ex: Alimentação)..."
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold border border-transparent transition-all"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <div className="flex gap-4">
                  <select
                    className="flex-1 px-6 py-4 bg-gray-50 rounded-2xl font-bold text-sm border border-transparent appearance-none"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as TransactionType)}
                  >
                    <option value={TransactionType.INCOME}>Entrada (Receita)</option>
                    <option value={TransactionType.EXPENSE}>Saída (Despesa)</option>
                  </select>
                  <button type="submit" className="bg-indigo-600 text-white px-10 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Criar</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {categories.length > 0 ? categories.map(c => (
              <div key={c.id} className="p-5 flex justify-between items-center group hover:bg-gray-50/50 transition-all">
                {editingId === c.id ? (
                  <form onSubmit={handleUpdate} className="flex-1 flex gap-3">
                    <input className="flex-1 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl font-bold outline-none" value={editName} onChange={e => setEditName(e.target.value)} />
                    <button type="submit" className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"><Check size={20} /></button>
                    <button type="button" onClick={() => setEditingId(null)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"><X size={20} /></button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full shadow-sm ${c.type === TransactionType.INCOME ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="font-black text-slate-800 tracking-tight">{c.name}</span>
                      <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{c.type === TransactionType.INCOME ? 'Entrada' : 'Saída'}</span>
                    </div>
                    {userRole === UserRole.ADVANCED && (
                      <div className="flex opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        <button onClick={() => { setEditingId(c.id); setEditName(c.name); setEditType(c.type); }} className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-xl transition-all"><Pencil size={18} /></button>
                        <button onClick={() => onDelete(c.id)} className="p-2 text-slate-300 hover:text-red-500 rounded-xl transition-all"><Trash2 size={18} /></button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )) : (
              <div className="p-12 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhuma categoria cadastrada.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit className="text-indigo-600" size={20} />
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Cérebro IA (Gemini Prompts)</h3>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-100/20 text-white space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <BrainCircuit size={160} />
            </div>
            
            <div className="p-5 bg-white/5 rounded-3xl flex items-start gap-4 border border-white/10 backdrop-blur-sm relative z-10">
              <Sparkles className="text-indigo-400 shrink-0" size={24} />
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Configure como o Gemini AI interpreta seus dados financeiros. Personalize o tom de voz e os critérios de extração de recibos para se adequar ao seu negócio.
              </p>
            </div>

            {aiSettings ? (
              <div className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Instruções para Insights Financeiros</label>
                  </div>
                  <textarea
                    className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm min-h-[140px] text-slate-100 transition-all placeholder:text-slate-600"
                    placeholder="Ex: Você é um CFO pragmático..."
                    value={aiSettings.insightsPrompt}
                    onChange={(e) => setAiSettings({ ...aiSettings, insightsPrompt: e.target.value })}
                    disabled={userRole !== UserRole.ADVANCED}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Instruções para Análise de Recibos (OCR)</label>
                  </div>
                  <textarea
                    className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm min-h-[140px] text-slate-100 transition-all placeholder:text-slate-600"
                    placeholder="Ex: Identifique o CNPJ e o valor total..."
                    value={aiSettings.receiptPrompt}
                    onChange={(e) => setAiSettings({ ...aiSettings, receiptPrompt: e.target.value })}
                    disabled={userRole !== UserRole.ADVANCED}
                  />
                </div>

                {userRole === UserRole.ADVANCED && (
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleSaveAISettings}
                      disabled={isSavingAI}
                      className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-indigo-900/40 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSavingAI ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                      Atualizar Configurações de IA
                    </button>
                    <button
                      onClick={handleResetAI}
                      className="px-6 bg-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all border border-white/10"
                      title="Restaurar Padrões"
                    >
                      <RotateCcw size={20} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <BrainCircuit className="animate-pulse text-indigo-500" size={48} />
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Sincronizando Cérebro...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
