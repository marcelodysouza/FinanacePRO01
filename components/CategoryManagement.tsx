
import React, { useState, useEffect } from 'react';
import { Category, TransactionType, UserRole } from '../types';
import { Plus, Trash2, Tag, ArrowUpCircle, ArrowDownCircle, Pencil, X, Check, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

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
  
  // State for inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<TransactionType>(TransactionType.INCOME);

  // State for deletion confirmation
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // State for success feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Clear success message after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== UserRole.ADVANCED) return;
    if (newName.trim()) {
      onAdd(newName.trim(), newType);
      setNewName('');
      showSuccess('Categoria criada com sucesso!');
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditType(category.type);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editName.trim()) {
      try {
        await onUpdate(editingId, editName.trim(), editType);
        setEditingId(null);
        showSuccess('Categoria atualizada com sucesso!');
      } catch (error) {
        console.error("Erro ao atualizar categoria:", error);
      }
    }
  };

  const handleDeleteConfirm = () => {
    if (idToDelete) {
      onDelete(idToDelete);
      setIdToDelete(null);
      showSuccess('Categoria removida com sucesso!');
    }
  };

  const renderCategoryItem = (category: Category) => {
    const isEditing = editingId === category.id;

    if (isEditing) {
      return (
        <form key={category.id} onSubmit={handleUpdate} className="p-4 bg-indigo-50/50 flex flex-col sm:flex-row gap-3 items-center animate-fade-in">
          <div className="flex-1 w-full relative">
            <input
              type="text"
              className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
          </div>
          <select
            className="w-full sm:w-auto px-3 py-2 bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
            value={editType}
            onChange={(e) => setEditType(e.target.value as TransactionType)}
          >
            <option value={TransactionType.INCOME}>Receita</option>
            <option value={TransactionType.EXPENSE}>Despesa</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all shadow-sm cursor-pointer"
              title="Salvar Alterações"
            >
              <Check size={18} />
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="p-2 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-all cursor-pointer"
              title="Cancelar"
            >
              <X size={18} />
            </button>
          </div>
        </form>
      );
    }

    return (
      <div key={category.id} className="p-4 flex justify-between items-center group hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-800">{category.name}</span>
        </div>
        {userRole === UserRole.ADVANCED && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={() => startEditing(category)}
              className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
              title="Editar Categoria"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => setIdToDelete(category.id)}
              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
              title="Excluir Categoria"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Success Notification Toast */}
      {successMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
          <div className="bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 backdrop-blur-md">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <span className="font-black text-sm tracking-tight">{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="ml-2 hover:bg-white/10 p-1 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {idToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl animate-scale-in">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Excluir Categoria?</h3>
            <p className="text-gray-500 mb-8 font-medium">
              Tem certeza que deseja excluir esta categoria? Ela será removida de todas as transações associadas.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setIdToDelete(null)} 
                className="flex-1 py-4 font-bold text-gray-400 hover:bg-gray-100 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className="flex-1 py-4 font-black text-white bg-red-600 hover:bg-red-700 rounded-2xl shadow-xl shadow-red-100 transition-all"
              >
                Excluir
              </button>
            </div>
          </div>
          {/* Backdrop closer */}
          <div className="absolute inset-0 -z-10" onClick={() => setIdToDelete(null)} />
        </div>
      )}

      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <Tag className="text-indigo-600" size={32} />
          Gestão de Categorias
        </h2>
        <p className="text-gray-500 font-medium">Configure as categorias de receitas e despesas do sistema.</p>
      </div>

      {userRole === UserRole.ADVANCED ? (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="mb-6 flex items-center gap-2 text-indigo-600">
            <Plus size={20} className="animate-pulse" />
            <span className="text-sm font-black uppercase tracking-widest">Nova Categoria</span>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Ex: Consultoria, Alimentação..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <select
              className="md:w-48 px-4 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-black text-sm text-gray-700"
              value={newType}
              onChange={(e) => setNewType(e.target.value as TransactionType)}
            >
              <option value={TransactionType.INCOME}>Receita</option>
              <option value={TransactionType.EXPENSE}>Despesa</option>
            </select>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 cursor-pointer"
            >
              Criar
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-orange-900 font-black">Acesso Restrito</p>
            <p className="text-orange-700 text-sm">Apenas usuários com perfil avançado podem gerenciar categorias do sistema.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Income Categories */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 bg-green-50 border-b border-green-100 flex items-center gap-3">
            <ArrowUpCircle className="text-green-600" />
            <h3 className="font-black text-green-900 uppercase tracking-tight">Categorias de Receita</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {categories.filter(c => c.type === TransactionType.INCOME).map(renderCategoryItem)}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 bg-red-50 border-b border-red-100 flex items-center gap-3">
            <ArrowDownCircle className="text-red-600" />
            <h3 className="font-black text-red-900 uppercase tracking-tight">Categorias de Despesa</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {categories.filter(c => c.type === TransactionType.EXPENSE).map(renderCategoryItem)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
