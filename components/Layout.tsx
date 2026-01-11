
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, User as UserIcon, ShieldCheck, ChevronRight, Users, Settings, Bell, Cloud, CloudOff, RefreshCw, BellOff, BellRing } from 'lucide-react';
import { User, UserRole, Transaction, TransactionType } from '../types.ts';
import { NAV_ITEMS } from '../constants.tsx';
import { NotificationService } from '../services/notificationService.ts';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  transactions?: Transaction[];
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, transactions = [] }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 transition-colors duration-300 print:block print:bg-white">
      {/* Mobile Header */}
      <div className="md:hidden bg-indigo-700 dark:bg-indigo-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md print:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-indigo-200" />
          <span className="font-bold text-lg tracking-tight">FinancePro</span>
        </div>
        <button onClick={toggleSidebar} className="p-1 hover:bg-indigo-600 rounded">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-indigo-900 dark:bg-slate-950 text-indigo-100 transition-transform duration-300 ease-in-out print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 flex flex-col shadow-2xl
      `}>
        <div className="p-8 flex items-center gap-3 border-b border-indigo-800 dark:border-slate-800">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight text-white">FinancePro</h1>
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Inteligência Financeira</p>
          </div>
        </div>

        <nav className="flex-1 py-8 px-5 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 group relative
                ${location.pathname === item.path 
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-xl shadow-indigo-950/20' 
                  : 'hover:bg-indigo-800 dark:hover:bg-slate-900 text-indigo-300 hover:text-white'}
              `}
            >
              <span className={`${location.pathname === item.path ? 'text-white' : 'text-indigo-400 group-hover:text-indigo-200'}`}>
                {item.icon}
              </span>
              <span className="font-black text-sm uppercase tracking-tight">{item.label}</span>
              {location.pathname === item.path && <ChevronRight size={16} className="ml-auto opacity-50" />}
            </Link>
          ))}

          <Link
            to="/settings"
            onClick={() => setIsSidebarOpen(false)}
            className={`
              flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 group
              ${location.pathname === '/settings' 
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-xl shadow-indigo-950/20' 
                : 'hover:bg-indigo-800 dark:hover:bg-slate-900 text-indigo-300 hover:text-white'}
            `}
          >
            <Settings size={20} className={location.pathname === '/settings' ? 'text-white' : 'text-indigo-400 group-hover:text-indigo-200'} />
            <span className="font-black text-sm uppercase tracking-tight">Configurações</span>
          </Link>

          {/* Opção SAIR abaixo da Configuração */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 group hover:bg-rose-600/20 text-indigo-300 hover:text-rose-400"
          >
            <LogOut size={20} className="text-indigo-400 group-hover:text-rose-400" />
            <span className="font-black text-sm uppercase tracking-tight text-left">Sair do App</span>
          </button>
        </nav>

        <div className="p-6 border-t border-indigo-800 dark:border-slate-800 bg-indigo-950/40 dark:bg-black/20">
          <div className="flex items-center gap-4 p-2">
            <div className="w-12 h-12 bg-indigo-700 dark:bg-indigo-600 rounded-full flex items-center justify-center text-white ring-2 ring-indigo-500 ring-offset-2 ring-offset-indigo-900 shrink-0">
              <UserIcon size={24} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black truncate text-white uppercase tracking-tight">{user.name}</p>
              <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">{user.role === UserRole.ADVANCED ? 'Super Usuário' : 'Operador'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 bg-slate-50 dark:bg-slate-900 overflow-x-hidden overflow-y-auto print:p-0 print:bg-white transition-colors duration-300">
        <div className="max-w-7xl mx-auto animate-fade-in print:max-w-none print:m-0">
          {children}
        </div>
      </main>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm" onClick={toggleSidebar} />
      )}
    </div>
  );
};

export default Layout;
