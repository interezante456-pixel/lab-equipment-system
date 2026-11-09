import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Box,
  ClipboardList,
  RotateCcw,
  Users,
  AlertTriangle,
  QrCode,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25 font-bold'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
    }`;

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm flex flex-col justify-between p-4 shrink-0 hidden lg:flex min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        {/* Banner de Penalización si aplica */}
        {user?.role === 'STUDENT' && user.studentStatus === 'PENALIZED' && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs mb-1">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Cuenta Penalizada</span>
            </div>
            <p className="text-[11px] text-rose-300/80 leading-snug">
              Tienes una sanción activa por entrega tardía. No puedes reservar equipos.
            </p>
          </div>
        )}

        <div>
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            {isAdmin ? 'Gestión y Control' : 'Mis Servicios'}
          </p>
          <nav className="space-y-1.5">
            {isAdmin ? (
              <>
                <NavLink to="/admin/dashboard" className={linkClasses}>
                  <LayoutDashboard className="w-4 h-4" />
                  Métricas y Resumen
                </NavLink>
                <NavLink to="/admin/reservations" className={linkClasses}>
                  <ClipboardList className="w-4 h-4" />
                  Solicitudes Pendientes
                </NavLink>
                <NavLink to="/admin/dispatch" className={linkClasses}>
                  <RotateCcw className="w-4 h-4" />
                  Despacho y Devolución
                </NavLink>
                <NavLink to="/admin/equipment" className={linkClasses}>
                  <Box className="w-4 h-4" />
                  Inventario de Equipos (CRUD)
                </NavLink>
                <NavLink to="/admin/users" className={linkClasses}>
                  <Users className="w-4 h-4" />
                  Gestión de Usuarios (CRUD)
                </NavLink>
                <NavLink to="/admin/penalties" className={linkClasses}>
                  <AlertTriangle className="w-4 h-4" />
                  Control de Penalizaciones
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/catalog" className={linkClasses}>
                  <Box className="w-4 h-4" />
                  Catálogo de Equipos
                </NavLink>
                <NavLink to="/my-reservations" className={linkClasses}>
                  <CalendarCheck className="w-4 h-4" />
                  Mis Reservas y Préstamos
                </NavLink>
                <NavLink to="/id-card" className={linkClasses}>
                  <QrCode className="w-4 h-4" />
                  Mi Carnet Digital QR
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          LabHub v2.4 Enterprise
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Servidor en línea" />
      </div>
    </aside>
  );
};
