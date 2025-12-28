
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { Search, Download, Trash2, Printer, Eye, X, Calendar, Pencil, FileText, Table, AlertTriangle, FileCheck } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PAYMENT_METHODS } from '../constants';

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
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<Transaction | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedAttachment(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category))).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesPayment = paymentMethodFilter === 'all' || t.paymentMethod === paymentMethodFilter;
      const matchesDate = (!dateStart || t.date >= dateStart) && (!dateEnd || t.date <= dateEnd);
      return matchesSearch && matchesCategory && matchesType && matchesPayment && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, categoryFilter, typeFilter, paymentMethodFilter, dateStart, dateEnd]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) acc.income += t.amount;
      else acc.expense += t.amount;
      acc.balance = acc.income - acc.expense;
      return acc;
    }, { income: 0, expense: 0, balance: 0 });
  }, [filteredTransactions]);

  const handlePrint = () => {
    window.focus();
    // Pequeno delay para garantir que qualquer animação de UI tenha terminado antes da captura
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Método'];
    const rows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.type === TransactionType.INCOME ? 'Receita' : 'Despesa',
      t.category,
      t.description,
      t.amount.toString().replace('.', ','),
      t.paymentMethod
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `financepro-export-${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text('FinancePro - Relatório de Transações', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
      autoTable(doc, {
        startY: 40,
        head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']],
        body: filteredTransactions.map(t => [
          new Date(t.date).toLocaleDateString('pt-BR'),
          t.type === TransactionType.INCOME ? 'Receita' : 'Despesa',
          t.category,
          t.description,
          `R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]),
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 }
      });
      doc.save(`financepro-relatorio-${new Date().getTime()}.pdf`);
    } catch (e) { alert("Erro ao gerar PDF."); }
  };

  const handleDeleteConfirm = () => {
    if (idToDelete) {
      onDeleteTransaction?.(idToDelete);
      setIdToDelete(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in print:animate-none print:opacity-100 print:block">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* RESET GLOBAL PARA IMPRESSÃO */
          html, body, #root {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* ESCONDER INTERFACE */
          .print-hidden, .no-print, aside, nav, header, button, .filters-area, select, input, .fixed, .no-print-total, [role="dialog"] { 
            display: none !important; 
          }

          /* LAYOUT DO CONTEÚDO */
          main { 
            display: block !important;
            position: static !important;
            padding: 20mm 15mm !important;
            width: 100% !important;
            overflow: visible !important;
            background: white !important;
          }

          .max-w-7xl {
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
          }

          .animate-fade-in {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }

          .bg-white { background-color: white !important; }
          .shadow-sm, .shadow-xl, .shadow-2xl, .shadow-lg { box-shadow: none !important; }
          .border { border: 0.5pt solid #eee !important; }
          
          /* TABELAS */
          table { 
            width: 100% !important; 
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }
          
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }

          th, td {
            border-bottom: 0.5pt solid #eee !important;
            padding: 8pt 6pt !important;
            background: transparent !important;
            color: black !important;
          }

          /* HEADER DE IMPRESSÃO */
          .print-header {
            display: block !important;
            margin-bottom: 30pt;
            border-bottom: 2pt solid #4f46e5;
            padding-bottom: 15pt;
          }

          /* CORES */
          .text-green-600 { color: #059669 !important; }
          .text-red-600 { color: #dc2626 !important; }
          .text-indigo-600 { color: #4f46e5 !important; }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        .print-header { display: none; }
      `}} />

      {/* Print Header */}
      <div className="print-header">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-indigo-700">FinancePro - Relatório</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Controle de Fluxo de Caixa</p>
          </div>
          <p className="text-[10px] text-gray-400 font-bold">
            Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
        
        <div className="mt-8 grid grid-cols-3 gap-6">
           <div className="border-l-4 border-green-500 pl-4">
              <p className="text-[9px] uppercase font-black text-gray-400">Receitas</p>
              <p className="text-lg font-black text-green-600">R$ {totals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
           </div>
           <div className="border-l-4 border-red-500 pl-4">
              <p className="text-[9px] uppercase font-black text-gray-400">Despesas</p>
              <p className="text-lg font-black text-red-600">R$ {totals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
           </div>
           <div className="border-l-4 border-indigo-500 pl-4">
              <p className="text-[9px] uppercase font-black text-gray-400">Saldo Líquido</p>
              <p className="text-lg font-black text-indigo-600">R$ {totals.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
           </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <FileText className="text-indigo-600" size={32} />
            Relatórios
          </h2>
          <p className="text-gray-500 font-medium">Extraia dados e analise sua saúde financeira.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handlePrint} 
            className="bg-white text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Printer size={18} /> Imprimir Relatório
          </button>
          <button onClick={exportCSV} className="bg-white text-indigo-600 px-4 py-2.5 rounded-xl border border-indigo-100 font-bold text-sm flex items-center gap-2 hover:bg-indigo-50 transition-all cursor-pointer">
            <Table size={18} /> Excel (CSV)
          </button>
          <button onClick={exportPDF} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 cursor-pointer">
            <Download size={18} /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Total Receitas</p>
          <p className="text-xl font-black text-green-600">R$ {totals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Total Despesas</p>
          <p className="text-xl font-black text-red-600">R$ {totals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-xl text-white">
          <p className="text-[10px] uppercase font-black text-indigo-200 tracking-widest mb-1">Saldo Final</p>
          <p className="text-xl font-black">R$ {totals.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 print:hidden">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Filtrar..." className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm text-gray-700" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
          <option value="all">Todos Tipos</option>
          <option value={TransactionType.INCOME}>Receitas</option>
          <option value={TransactionType.EXPENSE}>Despesas</option>
        </select>
        <select className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm text-gray-700" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">Todas Categorias</option>
          {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm text-gray-700" value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)}>
          <option value="all">Todos Pagamentos</option>
          {PAYMENT_METHODS.map(pm => <option key={pm} value={pm}>{pm}</option>)}
        </select>
        <input type="date" className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm text-gray-700" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
        <input type="date" className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm text-gray-700" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden print:border-none print:shadow-none print:overflow-visible">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 print:bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest print:text-black">Data</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest print:text-black">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest print:text-black">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest print:text-black">Valor</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest print:hidden text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-gray-500 print:text-black">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-gray-900 print:text-black">{t.description}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase print:text-gray-600">{t.paymentMethod}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-tight print:bg-white print:border print:text-black">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative group cursor-help inline-block">
                      <p className={`text-sm font-black ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'} print:text-black`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      
                      {/* Interactive Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max px-4 py-3 bg-gray-900 text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none no-print border border-white/10 backdrop-blur-md">
                        <div className="flex flex-col gap-2 min-w-[140px]">
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Efetivado em</span>
                            <span className="text-[11px] font-bold">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="h-px bg-white/10 w-full"></div>
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Via</span>
                            <span className="text-[11px] font-bold">{t.paymentMethod}</span>
                          </div>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-[6px] border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right print:hidden">
                    <div className="flex justify-end gap-2">
                      {t.attachment && (
                        <button 
                          onClick={() => setSelectedAttachment(t)} 
                          className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Visualizar Comprovante"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      {canManage && (
                        <>
                          <button onClick={() => onEditTransaction?.(t)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Editar">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => setIdToDelete(t.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Excluir">
                            <Trash2 size={18} />
                          </button>
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

      {/* Attachment Modal */}
      {selectedAttachment && (
        <div 
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md no-print animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-black text-gray-900">{selectedAttachment.description}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{selectedAttachment.attachmentName || 'Comprovante'}</p>
              </div>
              <button 
                onClick={() => setSelectedAttachment(null)} 
                className="p-2 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-gray-200/30 flex items-center justify-center">
              {selectedAttachment.attachment?.startsWith('data:image') ? (
                <img src={selectedAttachment.attachment} alt="Anexo" className="max-w-full max-h-full object-contain rounded-xl shadow-lg ring-4 ring-white" />
              ) : (
                <iframe src={selectedAttachment.attachment} className="w-full h-full min-h-[500px] border-none bg-white rounded-xl shadow-lg" title="PDF" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {idToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm no-print">
          <div className="bg-white rounded-[2.5rem] p-8 max-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Excluir Registro?</h3>
            <p className="text-gray-500 mb-8 font-medium">Esta ação removerá permanentemente o registro do banco de dados.</p>
            <div className="flex gap-4">
              <button onClick={() => setIdToDelete(null)} className="flex-1 py-4 font-bold text-gray-400 hover:bg-gray-100 rounded-2xl transition-all">Cancelar</button>
              <button onClick={handleDeleteConfirm} className="flex-1 py-4 font-black text-white bg-red-600 hover:bg-red-700 rounded-2xl shadow-xl shadow-red-100 transition-all">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
