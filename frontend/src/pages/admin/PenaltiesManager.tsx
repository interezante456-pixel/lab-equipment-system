import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Penalty } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  Laptop,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const PenaltiesManager: React.FC = () => {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [liftingPenalty, setLiftingPenalty] = useState<Penalty | null>(null);
  const [liftReason, setLiftReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchPenalties = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/returns-penalties/penalties');
      setPenalties(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPenalties();
  }, []);

  const handleConfirmLift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liftingPenalty || !liftReason.trim()) return;

    setIsSubmitting(true);
    try {
      await api.patch(`/returns-penalties/penalties/${liftingPenalty.id}/lift`, {
        reason: liftReason.trim(),
      });
      setActionSuccess(`Penalización levantada para ${liftingPenalty.user?.fullName}. El estudiante vuelve a estar habilitado.`);
      setLiftingPenalty(null);
      setLiftReason('');
      void fetchPenalties();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al levantar penalización');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPenalties = penalties.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.user?.studentCode.toLowerCase().includes(q) ||
      p.user?.fullName.toLowerCase().includes(q) ||
      p.reason.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-brand-400" />
            Control y Gestión de Penalizaciones (HU-08)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro de sanciones por entrega tardía y levantamiento de penalizaciones con descargo oficial.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código de estudiante (N0XXXXXXXX), nombre o motivo..."
          className="w-full px-4 py-2.5 pl-10 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      {/* Tabla de Penalizaciones */}
      <div className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Estudiante Infractor</th>
                <th className="px-5 py-3.5">Equipo Involucrado</th>
                <th className="px-5 py-3.5">Motivo de Sanción</th>
                <th className="px-5 py-3.5">Vigencia de Sanción</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Cargando penalizaciones...
                  </td>
                </tr>
              ) : filteredPenalties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No hay penalizaciones registradas.
                  </td>
                </tr>
              ) : (
                filteredPenalties.map((pen) => (
                  <tr key={pen.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-100">{pen.user?.fullName}</div>
                      <span className="font-mono text-brand-300 font-semibold">{pen.user?.studentCode}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-200">
                        {pen.reservation?.equipment?.name || 'Equipo de Lab'}
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
                        {pen.reservation?.equipment?.inventoryCode}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xs text-rose-300 font-medium">
                      {pen.reason}
                      {pen.liftedReason && (
                        <div className="text-[11px] text-slate-400 mt-1 italic">
                          Descargo: {pen.liftedReason} (por {pen.liftedBy || 'Admin'})
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-400">
                      <div>Desde: {new Date(pen.startDate).toLocaleDateString()}</div>
                      <div>Hasta: {new Date(pen.endDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-5 py-4">
                      {pen.isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          Sanción Activa
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Levantada
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      {pen.isActive && (
                        <button
                          onClick={() => {
                            setLiftingPenalty(pen);
                            setLiftReason('');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Levantar Sanción
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Levantar Penalización (HU-08) */}
      <Modal
        isOpen={!!liftingPenalty}
        onClose={() => setLiftingPenalty(null)}
        title="Levantar Sanción y Rehabilitar Estudiante"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmLift} className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Estás a punto de levantar la penalización a{' '}
            <strong className="text-slate-100">{liftingPenalty?.user?.fullName}</strong> ({liftingPenalty?.user?.studentCode}).
            El estudiante podrá volver a solicitar reservas de inmediato.
          </p>

          <div>
            <label htmlFor="penalty-lift-reason" className="block text-xs font-semibold text-slate-300 mb-1">
              Justificación / Sustento Oficial (Obligatorio)
            </label>
            <textarea
              id="penalty-lift-reason"
              required
              rows={3}
              value={liftReason}
              onChange={(e) => setLiftReason(e.target.value)}
              placeholder="Ej: Presentó justificación médica aprobada por bienestar universitario..."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setLiftingPenalty(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !liftReason.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar y Habilitar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

