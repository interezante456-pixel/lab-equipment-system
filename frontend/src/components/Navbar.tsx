import React from 'react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';
import { NotificationDropdown } from './NotificationDropdown';
import { LogOut, User as UserIcon, Shield, Laptop } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Logo & Marca */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/25">
            <Laptop className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                LabHub
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 uppercase tracking-wider">
                {user?.role === 'ADMIN' ? 'Administrador' : 'Estudiante'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Gestión Inteligente de Laboratorios
            </p>
          </div>
        </div>

        {/* Right Section: Notificaciones, Perfil y Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          <NotificationDropdown />

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* User profile snippet */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              {user?.role === 'ADMIN' ? <Shield className="w-4 h-4 text-brand-400" /> : <UserIcon className="w-4 h-4 text-brand-400" />}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-200 leading-tight">{user?.fullName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-mono text-slate-400">{user?.studentCode}</span>
                {user?.role === 'STUDENT' && (
                  <StatusBadge status={user.studentStatus} />
                )}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Cerrar Sesión"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
