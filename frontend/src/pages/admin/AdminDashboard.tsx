import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DashboardMetrics } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  LayoutDashboard,
  Box,
  Users,
  AlertTriangle,
  Clock,
  Laptop,
  Cpu,
  Wifi,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/dashboard/metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchMetrics();
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900 rounded-2xl border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-brand-400" />
            Panel General y Métricas de Laboratorio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Resumen en tiempo real del inventario, ocupación por categorías y cumplimiento de horarios.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-brand-400" />
          Actualizar Datos
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Equipos */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Equipos</span>
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-100">{metrics.equipment.total}</span>
            <span className="text-xs text-emerald-400 ml-2 font-semibold">
              {metrics.equipment.available} disponibles
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.equipment.loaned} actualmente en préstamo
          </p>
        </div>

        {/* Solicitudes Pendientes */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pendientes de Aprobación</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-100">{metrics.reservations.pending}</span>
            <span className="text-xs text-purple-400 ml-2 font-semibold">por atender</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.reservations.activeLoans} equipos en uso ahora
          </p>
        </div>

        {/* Estudiantes Penalizados */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Estudiantes Penalizados</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-100">{metrics.students.penalized}</span>
            <span className="text-xs text-rose-400 ml-2 font-semibold">infracciones</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            de {metrics.students.total} estudiantes registrados
          </p>
        </div>

        {/* Tasa de Puntualidad */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tasa de Puntualidad</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-100">{metrics.reservations.punctualityRate}%</span>
            <span className="text-xs text-emerald-400 ml-2 font-semibold">a tiempo</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.reservations.onTimeReturns} entregas puntuales vs {metrics.reservations.lateReturns} tardías
          </p>
        </div>
      </div>

      {/* Gráficos de Distribución por Categorías */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80 lg:col-span-1">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Box className="w-4 h-4 text-brand-400" />
            Distribución por Categorías
          </h3>

          <div className="space-y-4">
            {/* Cómputo */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Laptop className="w-3.5 h-3.5 text-blue-400" /> Cómputo
                </span>
                <span className="text-slate-400">{metrics.equipment.byCategory.computo} equipos</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(metrics.equipment.byCategory.computo / (metrics.equipment.total || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Electrónica */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" /> Electrónica
                </span>
                <span className="text-slate-400">{metrics.equipment.byCategory.electronica} equipos</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(metrics.equipment.byCategory.electronica / (metrics.equipment.total || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Redes */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Wifi className="w-3.5 h-3.5 text-purple-400" /> Redes y Telecomunicaciones
                </span>
                <span className="text-slate-400">{metrics.equipment.byCategory.redes} equipos</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${(metrics.equipment.byCategory.redes / (metrics.equipment.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" />
            Últimos Movimientos de Préstamos
          </h3>

          <div className="divide-y divide-slate-800">
            {metrics.recentActivity.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No hay actividad reciente registrada.</p>
            ) : (
              metrics.recentActivity.map((act) => (
                <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200">{act.user.fullName}</span>
                    <span className="text-slate-500 font-mono ml-2">({act.user.studentCode})</span>
                    <p className="text-slate-400 mt-0.5">
                      {act.equipment.name} • <span className="font-mono text-brand-300">{act.equipment.inventoryCode}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={act.status} />
                    <p className="text-[11px] text-slate-500 mt-1">
                      {new Date(act.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
