import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Reservation } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CalendarCheck,
  Clock,
  Laptop,
  FileDown,
  XCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const MyReservations: React.FC = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reservations');
      setReservations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchReservations();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar esta solicitud de reserva?')) return;
    try {
      await api.patch(`/reservations/${id}/cancel`);
      setActionMessage('Reserva cancelada correctamente');
      void fetchReservations();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cancelar la reserva');
    }
  };

  // HU-15: Emisión de Acta de Préstamo Digital en PDF
  const handleDownloadActaPDF = (res: Reservation) => {
    const doc = new jsPDF();

    // Encabezado
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('LABORATORIO UNIVERSITARIO', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(165, 180, 252);
    doc.text('ACTA OFICIAL DE PRÉSTAMO Y COMPROMISO DE CUSTODIA', 14, 26);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.text(`Folio de Préstamo: #${res.id.slice(0, 8).toUpperCase()}`, 14, 46);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 52);

    // Tabla de datos del estudiante y equipo
    autoTable(doc, {
      startY: 58,
      head: [['Concepto', 'Detalle']],
      body: [
        ['Estudiante Responsable', res.user?.fullName || user?.fullName || 'N/A'],
        ['Código Institucional', res.user?.studentCode || user?.studentCode || 'N/A'],
        ['Carrera Profesional', res.user?.career || user?.career || 'Ingeniería'],
        ['Equipo Solicitado', res.equipment?.name || 'N/A'],
        ['Código de Inventario', res.equipment?.inventoryCode || 'N/A'],
        ['Número de Serie', res.equipment?.serialNumber || 'N/A'],
        ['Ubicación Asignada', res.equipment?.location || 'Laboratorio Principal'],
        ['Fecha / Hora de Inicio', new Date(res.startTime).toLocaleString()],
        ['Fecha / Hora Máxima de Entrega', new Date(res.endTime).toLocaleString()],
        ['Estado de la Solicitud', res.status],
      ],
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
    });

    // Cláusula de Responsabilidad
    const finalY = (doc as any).lastAutoTable.finalY + 14;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const disclaimer =
      'CLÁUSULA DE RESPONSABILIDAD: El estudiante se compromete a salvaguardar la integridad física y operativa del equipo recibido, dándole uso exclusivo para fines académicos. En caso de daño, pérdida o retraso en la entrega después de la hora pactada, se aplicarán las sanciones disciplinarias y económicas del reglamento de laboratorio.';
    doc.text(doc.splitTextToSize(disclaimer, 180), 14, finalY);

    // Firmas
    doc.setDrawColor(203, 213, 225);
    doc.line(20, finalY + 40, 80, finalY + 40);
    doc.line(130, finalY + 40, 190, finalY + 40);
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('Firma del Estudiante', 32, finalY + 46);
    doc.text('Encargado de Laboratorio', 138, finalY + 46);

    doc.save(`Acta_Prestamo_${res.equipment?.inventoryCode || 'LAB'}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-brand-400" />
            Mis Solicitudes y Préstamos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Revisa el estado de tus reservas, cancela turnos y descarga actas oficiales en PDF.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-900/50 rounded-2xl animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <CalendarCheck className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No tienes reservas registradas</h3>
          <p className="text-xs text-slate-500 mt-1">
            Explora el catálogo para solicitar un equipo para tu próxima práctica.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((res) => {
            const isPending = res.status === 'PENDIENTE';
            const isApproved = res.status === 'APROBADA';
            const isLoaned = res.status === 'PRESTADA';

            return (
              <div
                key={res.id}
                className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-brand-400">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-100">{res.equipment?.name}</h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-brand-300 font-semibold">
                        {res.equipment?.inventoryCode}
                      </span>
                      <StatusBadge status={res.status} />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Inicio: {new Date(res.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        Fin: {new Date(res.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      {res.notes && (
                        <span className="text-slate-400 italic">“{res.notes}”</span>
                      )}
                    </div>

                    {res.rejectionReason && (
                      <p className="text-xs text-rose-400 mt-2 font-medium bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 inline-block">
                        Motivo de rechazo: {res.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {(isApproved || isLoaned) && (
                    <button
                      onClick={() => handleDownloadActaPDF(res)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
                      title="Descargar Acta Digital en PDF"
                    >
                      <FileDown className="w-3.5 h-3.5 text-brand-400" />
                      Acta PDF
                    </button>
                  )}

                  {isPending && (
                    <button
                      onClick={() => handleCancel(res.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold transition-colors border border-rose-500/30"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
