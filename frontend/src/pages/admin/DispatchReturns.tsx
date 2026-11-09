import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Reservation } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { QRScannerModal } from '../../components/QRScannerModal';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  QrCode,
  Search,
  PackageCheck,
  AlertTriangle,
  Clock,
  Laptop,
  CheckCircle2,
  Calendar,
  ArrowRight,
} from 'lucide-react';

export const DispatchReturns: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ message: string; isLate?: boolean } | null>(null);

  const fetchActiveLoans = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reservations');
      // Filtrar aprobadas (listas para despacho) y prestadas (listas para devolución)
      const filtered = res.data.filter(
        (r: Reservation) => r.status === 'APROBADA' || r.status === 'PRESTADA',
      );
      setReservations(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  // Despacho: Entrega física al alumno
  const handleDispatch = async (res: Reservation) => {
    try {
      await api.patch(`/returns-penalties/dispatch/${res.id}`);
      setActionAlert({ message: `Equipo ${res.equipment?.name} entregado a ${res.user?.fullName}. Estado: PRESTADO.` });
      fetchActiveLoans();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al despachar el equipo');
    }
  };

  // Devolución: HU-05 (Regla de Penalización Automática si hora_actual > hora_fin)
  const handleReturn = async (res: Reservation) => {
    try {
      const response = await api.patch(`/returns-penalties/return/${res.id}`);
      const { isLate, message } = response.data;

      if (isLate) {
        setActionAlert({ message, isLate: true });
      } else {
        confetti({ particleCount: 60, spread: 50 });
        setActionAlert({ message, isLate: false });
      }

      fetchActiveLoans();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar la devolución');
    }
  };

  // Manejo de resultado escaneado por QR
  const handleScanSuccess = (decoded: string) => {
    let cleanCode = decoded;
    try {
      const parsed = JSON.parse(decoded);
      if (parsed.code) cleanCode = parsed.code;
    } catch {
      // texto plano
    }
    setSearchQuery(cleanCode);
  };

  const filteredReservations = reservations.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.user?.studentCode.toLowerCase().includes(q) ||
      r.user?.fullName.toLowerCase().includes(q) ||
      r.equipment?.inventoryCode.toLowerCase().includes(q) ||
      r.equipment?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-brand-400" />
            Módulo de Despacho y Devoluciones
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Entrega física en mostrador y recepción con cálculo automático de puntualidad y penalizaciones.
          </p>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-500/25 self-start sm:self-auto"
        >
          <QrCode className="w-4 h-4" />
          Escanear QR de Carnet o Equipo
        </button>
      </div>

      {/* Alerta de Resultado */}
      {actionAlert && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start gap-3 animate-in fade-in ${
            actionAlert.isLate
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          }`}
        >
          {actionAlert.isLate ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <strong className="block mb-0.5">
              {actionAlert.isLate ? '⚠️ Penalización Automática Aplicada' : '✅ Devolución Exitosa'}
            </strong>
            {actionAlert.message}
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por código de estudiante (N0XXXXXXXX), nombre o código de equipo..."
          className="w-full px-4 py-3 pl-10 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
      </div>

      {/* Listado de Préstamos Activos y Despachos */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <PackageCheck className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No hay préstamos activos pendientes de despacho o retorno</h3>
          <p className="text-xs text-slate-500 mt-1">
            Los préstamos aprobados aparecerán aquí para entrega física, o usa el buscador para filtrar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReservations.map((res) => {
            const isApproved = res.status === 'APROBADA';
            const isLoaned = res.status === 'PRESTADA';
            const isPastEndTime = new Date().getTime() > new Date(res.endTime).getTime();

            return (
              <div
                key={res.id}
                className={`glass-card rounded-2xl p-5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isLoaned && isPastEndTime
                    ? 'border-rose-500/50 bg-rose-950/10'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-brand-400">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-brand-300 font-bold">
                        {res.user?.studentCode}
                      </span>
                      <h3 className="text-sm font-bold text-slate-100">{res.user?.fullName}</h3>
                      <StatusBadge status={res.status} />
                      {isLoaned && isPastEndTime && (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30 animate-pulse">
                          ⚠️ Tiempo Vencido
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
                      <span className="text-slate-200 font-semibold">
                        {res.equipment?.name} ({res.equipment?.inventoryCode})
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Fin programado: {new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones de Mostrador */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {isApproved && (
                    <button
                      onClick={() => handleDispatch(res)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                    >
                      <PackageCheck className="w-4 h-4" />
                      Marcar Entrega Física
                    </button>
                  )}

                  {isLoaned && (
                    <button
                      onClick={() => handleReturn(res)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Marcar Devolución
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Escáner QR (HU-14) */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};
