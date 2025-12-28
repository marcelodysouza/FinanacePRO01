
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, UserRole, Category } from '../types';
import { PAYMENT_METHODS } from '../constants';
import { X, Upload, FileText, CheckCircle2, Image as ImageIcon, FileCheck, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { analyzeReceipt } from '../services/geminiService';

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, 'id'>, id?: string) => void;
  onClose: () => void;
  userRole: UserRole;
  categories: Category[];
  initialData?: Transaction | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSave, onClose, userRole, categories, initialData }) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || TransactionType.INCOME);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || PAYMENT_METHODS[0]);
  const [attachment, setAttachment] = useState<{ data: string, name: string, type: string } | null>(
    initialData?.attachment ? { data: initialData.attachment, name: initialData.attachmentName || 'Arquivo Anexo', type: '' } : null
  );

  const filteredCategories = useMemo(() => 
    categories.filter(c => c.type === type), 
  [categories, type]);

  useEffect(() => {
    if (!initialData && filteredCategories.length > 0 && !category) {
      setCategory(filteredCategories[0].name);
    }
  }, [type, filteredCategories, initialData, category]);

  const handleAiScan = async () => {
    if (!attachment?.data) return;
    setIsAiAnalyzing(true);
    const result = await analyzeReceipt(attachment.data);
    if (result) {
      if (result.amount) setAmount(result.amount.toString());
      if (result.date) setDate(result.date);
      if (result.description) setDescription(result.description);
      const foundCat = filteredCategories.find(c => 
        c.name.toLowerCase().includes(result.category_suggestion?.toLowerCase())
      );
      if (foundCat) setCategory(foundCat.name);
    }
    setIsAiAnalyzing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({ 
          data: reader.result as string, 
          name: file.name,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAttachment(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      category,
      description: description.trim(),
      amount: parseFloat(amount),
      paymentMethod,
      type,
      attachment: attachment?.data,
      attachmentName: attachment?.name
    }, initialData?.id);
  };

  const isEdit = !!initialData;
  const isImage = attachment?.type?.startsWith('image/') || attachment?.data?.startsWith('data:image');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-slide-up my-auto">
        <div className={`${isEdit ? 'bg-amber-600' : 'bg-indigo-600'} p-6 flex justify-between items-center relative overflow-hidden transition-colors`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10">
            <h2 className="text-white text-xl font-bold">{isEdit ? 'Editar Transação' : 'Nova Transação'}</h2>
            <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">Gestão de Comprovantes</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all relative z-10">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl">
            <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${type === TransactionType.INCOME ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}>Receita</button>
            <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${type === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}>Despesa</button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <FileText size={16} className="text-indigo-500" />
              Comprovante (Imagem ou PDF)
            </label>
            
            <div className={`relative border-2 border-dashed rounded-2xl transition-all ${attachment ? 'border-indigo-400 bg-indigo-50/50 p-3' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 p-6'}`}>
              {!attachment ? (
                <div className="flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <input type="file" accept="image/*,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileUpload} />
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <Upload size={20} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">Clique para anexar</p>
                    <p className="text-xs text-gray-400">Arraste arquivos aqui (Máx 5MB)</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                      {isImage ? <ImageIcon size={20}/> : <FileCheck size={20}/>}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black text-gray-900 truncate" title={attachment.name}>
                        {attachment.name}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Arquivo Selecionado</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isImage && (
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); handleAiScan(); }} 
                        disabled={isAiAnalyzing} 
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50"
                      >
                        {isAiAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        IA
                      </button>
                    )}
                    <button 
                      type="button" 
                      onClick={removeAttachment} 
                      className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                      title="Remover anexo"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Descrição</label>
            <input 
              type="text" 
              required 
              placeholder={isAiAnalyzing ? "Analisando comprovante..." : "Ex: Mercado Central"} 
              className={`w-full px-5 py-3.5 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none font-medium bg-gray-50 transition-all ${isAiAnalyzing ? 'opacity-70 animate-pulse border-indigo-200' : ''}`} 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              disabled={isAiAnalyzing}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">Data</label>
              <input type="date" required className="w-full p-3.5 rounded-2xl border border-gray-100 bg-gray-50 outline-none font-medium" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">Valor (R$)</label>
              <input type="number" step="0.01" required placeholder="0,00" className="w-full p-3.5 rounded-2xl border border-gray-100 bg-gray-50 outline-none font-black text-indigo-600" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">Categoria</label>
              <select required className="w-full p-3.5 rounded-2xl border border-gray-100 bg-gray-50 outline-none font-medium" value={category} onChange={(e) => setCategory(e.target.value)}>
                {filteredCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">Pagamento</label>
              <select className="w-full p-3.5 rounded-2xl border border-gray-100 bg-gray-50 outline-none font-medium" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map(pm => <option key={pm} value={pm}>{pm}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-all">Cancelar</button>
            <button type="submit" className={`flex-1 py-4 font-black text-white rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 ${isEdit ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              {isEdit ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
