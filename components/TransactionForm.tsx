
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction, TransactionType, UserRole, Category } from '../types.ts';
import { PAYMENT_METHODS } from '../constants.tsx';
import { X, Upload, CheckCircle2, Image as ImageIcon, FileCheck, Sparkles, Loader2, Plus, TrendingUp, TrendingDown, Wand2, AlertCircle, BrainCircuit, Camera, Files } from 'lucide-react';
import { analyzeReceipt } from '../services/geminiService.ts';
import { PersistenceService } from '../services/persistenceService.ts';

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, 'id'>, id?: string) => void;
  onClose: () => void;
  userRole: UserRole;
  categories: Category[];
  initialData?: Transaction | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSave, onClose, userRole, categories, initialData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const getLocalDateString = (d?: string | Date) => {
    const dateObj = d ? new Date(d) : new Date();
    const normalizedDate = typeof d === 'string' && d.length === 10 ? new Date(d + 'T12:00:00') : dateObj;
    const year = normalizedDate.getFullYear();
    const month = String(normalizedDate.getMonth() + 1).padStart(2, '0');
    const day = String(normalizedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [type, setType] = useState<TransactionType>(initialData?.type || TransactionType.INCOME);
  const [date, setDate] = useState(initialData?.date ? getLocalDateString(initialData.date) : getLocalDateString());
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiStatus, setAiStatus] = useState('Analisando...');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || PAYMENT_METHODS[0]);
  const [attachment, setAttachment] = useState<{ data: string, name: string, type: string } | null>(
    initialData?.attachment ? { data: initialData.attachment, name: initialData.attachmentName || 'Arquivo Anexo', type: '' } : null
  );

  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredCategories = useMemo(() => 
    categories.filter(c => c.type === type), 
  [categories, type]);

  useEffect(() => {
    if (!initialData && filteredCategories.length > 0 && !category && !isAddingNewCategory) {
      setCategory(filteredCategories[0].name);
    }
  }, [type, filteredCategories, initialData, category, isAddingNewCategory]);

  useEffect(() => {
    let interval: any;
    if (isAiAnalyzing) {
      const messages = ["Escaneando texto...", "Identificando valores...", "Extraindo data...", "Sugerindo categoria...", "Finalizando..."];
      let i = 0;
      interval = setInterval(() => {
        setAiStatus(messages[i % messages.length]);
        i++;
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAiAnalyzing]);

  const handleAiScan = async () => {
    if (!attachment?.data) return;
    setIsAiAnalyzing(true);
    setErrorMsg(null);
    try {
      const result = await analyzeReceipt(attachment.data, attachment.type || 'image/jpeg');
      if (result) {
        if (result.amount) setAmount(result.amount.toString());
        if (result.date) setDate(getLocalDateString(result.date));
        if (result.description) setDescription(result.description);
        
        const foundCat = filteredCategories.find(c => 
          c.name.toLowerCase().includes(result.category_suggestion?.toLowerCase())
        );
        
        if (foundCat) {
          setCategory(foundCat.name);
          setIsAddingNewCategory(false);
        } else if (result.category_suggestion) {
          setIsAddingNewCategory(true);
          setNewCategoryName(result.category_suggestion);
        }
      }
    } catch (e) { 
      console.error(e);
      setErrorMsg("Falha na análise. Verifique a qualidade da imagem.");
    } finally { 
      setIsAiAnalyzing(false); 
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAttachment({ 
        data: reader.result as string, 
        name: file.name, 
        type: file.type 
      });
      reader.readAsDataURL(file);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) {
      setErrorMsg("Preencha os campos obrigatórios.");
      return;
    }
    setIsSaving(true);
    try {
      let finalCategory = category;
      if (isAddingNewCategory && newCategoryName.trim()) {
        const created = await PersistenceService.addCategory(newCategoryName.trim(), type);
        if (created) finalCategory = created.name;
      }
      
      onSave({
        type,
        date,
        description,
        category: finalCategory,
        amount: parseFloat(amount),
        paymentMethod,
        attachment: attachment?.data,
        attachmentName: attachment?.name
      }, initialData?.id);
    } catch (e) {
      setErrorMsg("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl my-auto shadow-2xl animate-scale-in flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className={`p-3 rounded-2xl ${type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {type === TransactionType.INCOME ? <TrendingUp size={24}/> : <TrendingDown size={24}/>}
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{initialData ? 'Editar Registro' : 'Novo Registro'}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{type === TransactionType.INCOME ? 'Entrada de Capital' : 'Saída de Capital'}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-fade-in">
              <AlertCircle size={20} />
              <p className="text-xs font-bold">{errorMsg}</p>
            </div>
          )}

          {/* Toggle Type */}
          <div className="flex p-1.5 bg-slate-100 rounded-[2rem]">
            <button
              type="button"
              onClick={() => setType(TransactionType.INCOME)}
              className={`flex-1 py-4 rounded-[1.5rem] font-black text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${
                type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              RECEITA
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.EXPENSE)}
              className={`flex-1 py-4 rounded-[1.5rem] font-black text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${
                type === TransactionType.EXPENSE ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              DESPESA
            </button>
          </div>

          {/* Main Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor do Lançamento</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300">R$</span>
                <input
                  required
                  type="number"
                  step="0.01"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:border-indigo-500 font-black text-xl transition-all"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</label>
              <input
                required
                type="date"
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:border-indigo-500 font-bold transition-all"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</label>
            <input
              required
              type="text"
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:border-indigo-500 font-bold transition-all"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Pagamento Fornecedor X"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</label>
              <div className="flex gap-2">
                {isAddingNewCategory ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-5 py-4 bg-slate-50 border-2 border-indigo-200 rounded-[1.5rem] outline-none font-bold text-sm"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nova categoria..."
                      autoFocus
                    />
                    <button type="button" onClick={() => setIsAddingNewCategory(false)} className="p-4 bg-slate-100 rounded-2xl text-slate-400"><X size={20}/></button>
                  </div>
                ) : (
                  <>
                    <select
                      className="flex-1 px-5 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:border-indigo-500 font-bold text-sm appearance-none"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {filteredCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    {userRole === UserRole.ADVANCED && (
                      <button type="button" onClick={() => setIsAddingNewCategory(true)} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all">
                        <Plus size={20} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meio de Pagamento</label>
              <select
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:border-indigo-500 font-bold text-sm appearance-none"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {PAYMENT_METHODS.map(pm => <option key={pm} value={pm}>{pm}</option>)}
              </select>
            </div>
          </div>

          {/* ATTACHMENT SECTION - IMPROVED */}
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comprovante ou Recibo</label>
             <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] relative overflow-hidden group hover:border-indigo-300 transition-all">
                {isAiAnalyzing && (
                  <div className="absolute inset-0 bg-indigo-600/95 z-20 flex flex-col items-center justify-center p-6 text-white animate-fade-in backdrop-blur-sm">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <BrainCircuit className="absolute inset-0 m-auto text-white animate-pulse" size={24} />
                    </div>
                    <h4 className="text-lg font-black tracking-tight mb-1">Cérebro Artificial</h4>
                    <p className="text-xs font-black uppercase tracking-[0.3em] opacity-70">{aiStatus}</p>
                  </div>
                )}

                {attachment ? (
                  <div className="flex flex-col gap-6 w-full items-center">
                    <div className="relative w-full max-w-[240px] aspect-[3/4] bg-white rounded-3xl shadow-xl border-4 border-white overflow-hidden group/img">
                      {attachment.type.includes('image') ? (
                        <img src={attachment.data} className="w-full h-full object-cover" alt="Recibo" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-50 text-indigo-400">
                           <FileCheck size={64} />
                           <span className="text-[10px] font-black uppercase tracking-widest">Documento PDF</span>
                        </div>
                      )}
                      <button 
                        type="button" 
                        onClick={() => setAttachment(null)}
                        className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-xl shadow-lg opacity-0 group-hover/img:opacity-100 transition-all hover:scale-110"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                      <button
                        type="button"
                        onClick={handleAiScan}
                        disabled={isAiAnalyzing}
                        className="w-full bg-indigo-600 text-white py-4 rounded-[1.5rem] text-xs font-black flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Sparkles size={18} />
                        AUTO-PREENCHER COM IA
                      </button>
                      <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">
                         O Gemini AI extrairá automaticamente valor, data e descrição.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center py-4">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 shadow-sm mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:text-indigo-400">
                      <ImageIcon size={40} />
                    </div>
                    
                    <div className="space-y-2 mb-8">
                       <h4 className="text-sm font-black text-slate-900 tracking-tight">Capturar Documento</h4>
                       <p className="text-xs font-medium text-slate-400 px-8">Tire uma foto do recibo ou faça upload de um arquivo para automação.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                       <button 
                         type="button"
                         onClick={() => cameraInputRef.current?.click()}
                         className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                       >
                         <Camera size={18} /> USAR CÂMERA
                       </button>
                       <button 
                         type="button"
                         onClick={() => fileInputRef.current?.click()}
                         className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-xs hover:border-indigo-100 hover:bg-slate-50 transition-all active:scale-95"
                       >
                         <Files size={18} /> ARQUIVOS
                       </button>
                    </div>

                    {/* Inputs escondidos */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept="image/*,application/pdf" 
                    />
                    <input 
                      type="file" 
                      ref={cameraInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept="image/*" 
                      capture="environment" 
                    />
                  </div>
                )}
             </div>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0 rounded-b-[3rem]">
          <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-100 rounded-[1.5rem] transition-all">Cancelar</button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving || isAiAnalyzing}
            className={`flex-1 py-4 font-black rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 ${
              type === TransactionType.INCOME 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 text-white' 
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100 text-white'
            } disabled:opacity-50`}
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
            {initialData ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR LANÇAMENTO'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;
