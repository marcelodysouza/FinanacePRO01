
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { Search, Download, Trash2, Printer, Eye, X, FileText, AlertTriangle, ExternalLink, Pencil, RefreshCcw, Maximize2, FileCheck, FileSearch } from 'lucide-react';

interface ReportsProps {
  transactions: Transaction[];
  onDeleteTransaction?: (id: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  canManage: boolean;
}

const Reports: React.FC<ReportsProps> = ({ transactions, onDeleteTransaction, onEditTransaction, canManage }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [previewTx, setPreviewTx] = useState<Transaction | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesDate = (!dateStart || t.date >= dateStart) && (!dateEnd || t.date <= dateEnd);
      return matchesSearch && matchesCategory && matchesType && matchesDate;
    }).sort((a, b) => new Date(b.date + 'T12:00:00').getTime() - new Date(a.date + 'T12:00:00').getTime());
  }, [transactions, searchTerm, categoryFilter, typeFilter, dateStart, dateEnd]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) acc.income += t.amount;
      else acc.expense += t.amount;
      acc.balance = acc.income - acc.expense;
      return acc;
    }, { income: 0, expense: 0, balance: 0 });
  }, [filteredTransactions]);

  const handleOpenPreview = (t: Transaction) => {
    if (!t.attachment) return;

    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);

      const base64Parts = t.attachment.split(',');
      const contentType = base64Parts[0].split(':')[1].split(';')[0];
      const base64Data = base64Parts[1];

      const byteCharacters = atob(base64Data);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const blob = new Blob(byteArrays, { type: contentType });
      const url = URL.createObjectURL(blob);
      
      setPreviewUrl(url);
      setPreviewTx(t);
    } catch (e) {
      console.error("Erro ao processar anexo:", e);
      setPreviewUrl(t.attachment);
      setPreviewTx(t);
    }
  };

  const handleClosePreview = () => {
    setPreviewTx(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const isImage = (t: Transaction) => t.attachment?.includes('image/') || t.attachmentName?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  const isPDF = (t: Transaction) => t.attachment?.includes('pdf') || t.attachmentName?.includes('.pdf');

  return (
    <div className="relative space-y-8 animate-fade-in print:block">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <FileText className="text-white" size={24} />
            </div>
            Relatórios
          </h2>
          <p className="text-gray-500 font-medium">Gestão documental e histórico.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => window.print()} className="bg-white text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
            <Printer size={18} /> Imprimir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Entradas</p>
          <p className="text-2xl font-black text-green-600">R$ {totals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Saídas</p>
          <p className="text-2xl font-black text-red-600">R$ {totals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
          <p className="text-[10px] font-black uppercase text-indigo-200 tracking-widest mb-1">Saldo</p>
          <p className="text-2xl font-black">R$ {totals.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Filtrar por descrição..." className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm text-gray-700" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
          <option value="all">Tipos: Todos</option>
          <option value={TransactionType.INCOME}>Entradas</option>
          <option value={TransactionType.EXPENSE}>Saídas</option>
        </select>
        <select className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm text-gray-700" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">Categorias: Todas</option>
          {Array.from(new Set(transactions.map(t => t.category))).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valor</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right print:hidden">Doc</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-gray-500">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-gray-900">{t.description}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t.category} • {t.paymentMethod}</p>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-sm">
                    <span className={t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}>
                      {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right print:hidden">
                    {t.attachment && (
                      <button 
                        onClick={() => handleOpenPreview(t)} 
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        title="Abrir Documento"
                      >
                        <FileSearch size={18} />
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right print:hidden">
                    <div className="flex justify-end gap-2">
                      {canManage && (
                        <>
                          <button onClick={() => onEditTransaction?.(t)} className="p-2 text-gray-300 hover:text-amber-600 transition-all"><Pencil size={18} /></button>
                          <button onClick={() => setIdToDelete(t.id)} className="p-2 text-gray-300 hover:text-red-600 transition-all"><Trash2 size={18} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE VISUALIZAÇÃO - SUBSTITUI O IFRAME PARA EVITAR BLOQUEIO DO BRAVE */}
      <div className={`fixed inset-0 z-[100] transition-all duration-300 flex items-center justify-center p-4 md:p-8 ${previewTx ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={handleClosePreview} />
        
        <div className={`relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden transition-all duration-500 transform ${previewTx ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white z-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <FileCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight truncate max-w-xs md:max-w-md">{previewTx?.attachmentName || 'Anexo'}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Documento Verificado</p>
              </div>
            </div>
            <button onClick={handleClosePreview} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 min-h-[400px] flex flex-col">
            {previewTx && previewUrl ? (
              <div className="flex-1 flex flex-col">
                {isImage(previewTx) ? (
                  <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-center">
                    <img src={previewUrl} alt="Visualização do anexo" className="max-w-full max-h-[60vh] object-contain rounded-2xl shadow-xl" />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                    <div className="relative">
                      <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto">
                        <FileText size={64} strokeWidth={1.5} />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg">
                        <ExternalLink size={20} />
                      </div>
                    </div>
                    
                    <div className="max-w-sm">
                      <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Visualização de PDF</h4>
                      <p className="text-slate-500 font-medium text-sm leading-relaxed">
                        Para sua segurança e conformidade com as proteções do seu navegador, documentos PDF devem ser abertos em uma visualização externa isolada.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                      <a 
                        href={previewUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex-1 flex items-center justify-center gap-2 px-8 py-5 bg-indigo-600 rounded-2xl font-black text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                      >
                        <Maximize2 size={20} /> Abrir Documento
                      </a>
                      <a 
                        href={previewUrl} 
                        download={previewTx.attachmentName || 'comprovante'} 
                        className="flex-1 flex items-center justify-center gap-2 px-8 py-5 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-600 hover:bg-slate-50 transition-all"
                      >
                        <Download size={20} /> Baixar Cópia
                      </a>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Descrição do Lançamento</p>
                    <p className="font-bold text-slate-800">{previewTx.description}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Valor Total</p>
                      <p className="text-xl font-black text-slate-900">R$ {previewTx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase ${previewTx.type === TransactionType.INCOME ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {previewTx.type === TransactionType.INCOME ? 'Receita' : 'Despesa'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="m-auto text-center space-y-4">
                <RefreshCcw className="animate-spin text-indigo-400 mx-auto" size={48} />
                <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Preparando arquivo...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {idToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl animate-scale-in">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={36} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Excluir?</h3>
            <p className="text-slate-500 mb-8 font-medium">Esta ação é permanente.</p>
            <div className="flex gap-4">
              <button onClick={() => setIdToDelete(null)} className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">Cancelar</button>
              <button 
                onClick={() => { onDeleteTransaction?.(idToDelete); setIdToDelete(null); }} 
                className="flex-1 py-4 font-black text-white bg-red-600 rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
