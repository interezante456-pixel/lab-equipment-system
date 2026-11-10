import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Reservation } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  ClipboardList,
  Check,
  X,
  AlertCircle,
  Clock,
  User,
  Laptop,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const ReservationsManager: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal de Rechazo (HU-04 Criterio 3: Motivo obligatorio)
  const [rejectingReservation, setRejectingReservation] = useState<Reservation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reservations/pending');
      setReservations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPending();
  }, []);

  const handleApprove = async (res: Reservation) => {
    try {
      await api.patch(`/reservations/${res.id}/approve`);
      setFeedbackMessage({ text: `Reserva para ${res.equipment?.name} aprobada exitosamente.`, type: 'success' });
      void fetchPending();
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (err: any) {
      setFeedbackMessage({ text: err.response?.data?.message || 'Error al aprobar', type: 'error' });
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReservation || !rejectionReason.trim()) return;

    setIsRejecting(true);
    try {
      await api.patch(`/reservations/${rejectingReservation.id}/reject`, {
        reason: rejectionReason.trim(),
      });
      setFeedbackMessage({ text: `Reserva rechazada y justificación enviada al estudiante.`, type: 'success' });
      setRejectingReservation(null);
      setRejectionReason('');
      void fetchPending();
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al rechazar');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brand-400" />
            Gestión de Solicitudes Pendientes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aprueba o rechaza solicitudes de reserva de estudiantes en tiempo real.
          </p>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">¡Bandeja al día!</h3>
          <p className="text-xs text-slate-500 mt-1">
            No hay solicitudes de reserva pendientes de revisión en este momento.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Estudiante</th>
                  <th className="px-5 py-3.5">Equipo Solicitado</th>
                  <th className="px-5 py-3.5">Horario Solicitado</th>
                  <th className="px-5 py-3.5">Notas / Práctica</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Estudiante */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-100">{res.user?.fullName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-brand-300 font-semibold">{res.user?.studentCode}</span>
                        <span className="text-slate-500">• {res.user?.career}</span>
                      </div>
                    </td>

                    {/* Equipo */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-200">{res.equipment?.name}</div>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 mt-1 inline-block">
                        {res.equipment?.inventoryCode}
                      </span>
                    </td>

                    {/* Horario */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-brand-400" />
                        {new Date(res.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Notas */}
                    <td className="px-5 py-4 text-slate-400 max-w-xs">
                      {res.notes ? <span className="italic">“{res.notes}”</span> : <span className="text-slate-600">Sin notas</span>}
                    </td>

                    {/* Botones Aprobar / Rechazar */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(res)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => {
                            setRejectingReservation(res);
                            setRejectionReason('');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-rose-500/30"
                        >
                          <X className="w-3.5 h-3.5" />
                          Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Rechazar con Justificación Obligatoria (HU-04 Criterio 3) */}
      <Modal
        isOpen={!!rejectingReservation}
        onClose={() => setRejectingReservation(null)}
        title="Justificación de Rechazo Obligatoria"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <p className="text-xs text-slate-300">
            Indica el motivo por el cual rechazas la solicitud de{' '}
            <strong className="text-slate-100">{rejectingReservation?.user?.fullName}</strong> para el equipo{' '}
            <strong className="text-brand-300">{rejectingReservation?.equipment?.name}</strong>:
          </p>

          <div>
            <label htmlFor="reservation-rejection-reason" className="block text-xs font-semibold text-slate-300 mb-1">
              Motivo del Rechazo (Obligatorio)
            </label>
            <textarea
              id="reservation-rejection-reason"
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ej: Equipo en mantenimiento correctivo, horario reservado para práctica de docentes..."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRejectingReservation(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isRejecting || !rejectionReason.trim()}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-950 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/25"
            >
              {isRejecting ? 'Rechazando...' : 'Confirmar Rechazo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
