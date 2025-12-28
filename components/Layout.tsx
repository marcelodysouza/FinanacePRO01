
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, User as UserIcon, ShieldCheck, ChevronRight, Users, Settings, Bell, Cloud, CloudOff, RefreshCw, BellOff, BellRing } from 'lucide-react';
import { User, UserRole, Transaction, TransactionType } from '../types';
import { NAV_ITEMS } from '../constants';
import { NotificationService } from '../services/notificationService';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  transactions?: Transaction[];
  backupStatus?: {
    lastTime: Date | null;
    isBackingUp: boolean;
  };
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, transactions = [], backupStatus }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState(NotificationService.getPermissionStatus());
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleRequestNotifications = async () => {
    const granted = await NotificationService.requestPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
  };

  const upcomingRemindersCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      if (t.type !== TransactionType.EXPENSE) return false;
      const tDate = new Date(t.date);
      return tDate >= today && tDate <= threeDaysFromNow;
    }).length;
  }, [transactions]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 print:block print:bg-white">
      {/* Mobile Header */}
      <div className="md:hidden bg-indigo-700 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md print:hidden">
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
        fixed inset-y-0 left-0 z-40 w-64 bg-indigo-900 text-indigo-100 transition-transform duration-300 ease-in-out print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 flex flex-col shadow-2xl
      `}>
        <div className="p-6 flex items-center gap-3 border-b border-indigo-800">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight text-white">FinancePro</h1>
            <p className="text-xs text-indigo-400 font-medium">Fluxo Inteligente</p>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative
                ${location.pathname === item.path 
                  ? 'bg-indigo-700 text-white shadow-lg' 
                  : 'hover:bg-indigo-800 text-indigo-300 hover:text-white'}
              `}
            >
              <span className={`${location.pathname === item.path ? 'text-white' : 'text-indigo-400 group-hover:text-indigo-200'}`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
              
              {item.path === '/transactions' && upcomingRemindersCount > 0 && (
                <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-lg animate-pulse">
                  {upcomingRemindersCount}
                </span>
              )}

              {location.pathname === item.path && <ChevronRight size={16} className="ml-auto opacity-50" />}
            </Link>
          ))}

          <Link
            to="/settings"
            onClick={() => setIsSidebarOpen(false)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
              ${location.pathname === '/settings' 
                ? 'bg-indigo-700 text-white shadow-lg' 
                : 'hover:bg-indigo-800 text-indigo-300 hover:text-white'}
            `}
          >
            <Settings size={20} className={location.pathname === '/settings' ? 'text-white' : 'text-indigo-400 group-hover:text-indigo-200'} />
            <span className="font-medium">Categorias</span>
          </Link>

          {user.role === UserRole.ADVANCED && (
            <Link
              to="/users"
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                ${location.pathname === '/users' 
                  ? 'bg-indigo-700 text-white shadow-lg' 
                  : 'hover:bg-indigo-800 text-indigo-300 hover:text-white'}
              `}
            >
              <Users size={20} className={location.pathname === '/users' ? 'text-white' : 'text-indigo-400 group-hover:text-indigo-200'} />
              <span className="font-medium">Usuários</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-indigo-800 bg-indigo-950/30 space-y-3">
          {/* Notification Button */}
          {notifPermission !== 'granted' && (
            <button 
              onClick={handleRequestNotifications}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 transition-all group"
            >
              <BellRing size={16} className="group-hover:animate-ring" />
              <div className="flex flex-col items-start min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Alertas</span>
                <span className="text-[9px] font-bold text-white">Ativar Notificações</span>
              </div>
            </button>
          )}

          {/* Backup Cloud Indicator */}
          <div className="px-2 py-3 bg-indigo-800/40 rounded-xl border border-indigo-700/50 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${backupStatus?.isBackingUp ? 'text-indigo-300' : 'text-green-400'}`}>
              {backupStatus?.isBackingUp ? <RefreshCw size={16} className="animate-spin" /> : <Cloud size={16} />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] uppercase font-black tracking-widest text-indigo-400 leading-none mb-1">Backup na Nuvem</span>
              <span className="text-[10px] font-bold text-white truncate">
                {backupStatus?.isBackingUp ? 'Salvando...' : backupStatus?.lastTime ? `Sinc. ${backupStatus.lastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Conectando...'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 px-2">
            <div className="w-10 h-10 bg-indigo-700 rounded-full flex items-center justify-center text-white ring-2 ring-indigo-500 ring-offset-2 ring-offset-indigo-900 flex-shrink-0">
              <UserIcon size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-white">{user.name}</p>
              <p className="text-xs text-indigo-400 uppercase tracking-widest font-semibold">{user.role === UserRole.ADVANCED ? 'Super' : 'Normal'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-300 hover:text-white hover:bg-red-500/20 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 bg-gray-50 overflow-x-hidden overflow-y-auto print:overflow-visible print:h-auto print:static print:p-0 print:bg-white print:block">
        <div className="max-w-7xl mx-auto animate-fade-in print:max-w-none print:m-0 print:p-0 print:animate-none">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm print:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default Layout;
