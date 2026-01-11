
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { User as UserIcon, Shield, ShieldAlert, Search, ShieldCheck, Mail, Loader2, CheckCircle2 } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onUpdateRole: (userId: string, newRole: UserRole) => Promise<void>;
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateRole, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    try {
      await onUpdateRole(userId, newRole);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 dark:text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <ShieldCheck size={24} />
            </div>
            Gestão de Equipe
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">Controle permissões e acessos administrativos.</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..." 
            className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Membro</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contato</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {filteredUsers.length > 0 ? filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                        <UserIcon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                          {u.name} 
                          {u.id === currentUser.id && (
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-400 font-black">VOCÊ</span>
                          )}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">ID: {u.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Mail size={14} className="opacity-50" />
                      <span className="text-sm font-medium">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight ${
                      u.role === UserRole.ADVANCED 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {u.role === UserRole.ADVANCED ? <Shield size={12} /> : <UserIcon size={12} />}
                      {u.role === UserRole.ADVANCED ? 'Super Usuário' : 'Operador'}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {u.id !== currentUser.id ? (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {updatingId === u.id ? (
                          <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                            <Loader2 className="animate-spin text-indigo-600" size={18} />
                          </div>
                        ) : u.role === UserRole.NORMAL ? (
                          <button
                            onClick={() => handleRoleChange(u.id, UserRole.ADVANCED)}
                            className="bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none"
                          >
                            <Shield size={14} />
                            PROMOVER
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(u.id, UserRole.NORMAL)}
                            className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-5 py-3 rounded-xl hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                          >
                            <ShieldAlert size={14} />
                            REBAIXAR
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Protegido</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-300">
                        <Search size={32} />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum membro encontrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
