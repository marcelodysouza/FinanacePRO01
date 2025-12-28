
import React from 'react';
import { User, UserRole } from '../types';
import { User as UserIcon, Shield, ShieldAlert, Check, UserMinus } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onUpdateRole: (userId: string, newRole: UserRole) => void;
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateRole, currentUser }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestão de Usuários</h2>
        <p className="text-gray-500 font-medium">Controle as permissões de acesso ao sistema.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Usuário</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Cargo Atual</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                        <UserIcon size={18} />
                      </div>
                      <p className="text-sm font-bold text-gray-900">{u.name} {u.id === currentUser.id && '(Você)'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === UserRole.ADVANCED ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role === UserRole.ADVANCED ? 'Super Usuário' : 'Normal'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== currentUser.id && (
                      <div className="flex justify-end gap-2">
                        {u.role === UserRole.NORMAL ? (
                          <button
                            onClick={() => onUpdateRole(u.id, UserRole.ADVANCED)}
                            className="bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
                            title="Tornar Super Usuário"
                          >
                            <Shield size={16} />
                            Tornar Super
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateRole(u.id, UserRole.NORMAL)}
                            className="bg-orange-50 text-orange-600 p-2 rounded-lg hover:bg-orange-600 hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
                            title="Revogar Super Usuário"
                          >
                            <ShieldAlert size={16} />
                            Revogar Super
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
