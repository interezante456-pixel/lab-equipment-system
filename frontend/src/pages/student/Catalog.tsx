import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Equipment, EquipmentCategory } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import confetti from 'canvas-confetti';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Laptop,
  Cpu,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Tag,
  Info,
} from 'lucide-react';

export const Catalog: React.FC = () => {
  const { user } = useAuth();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal de Reserva
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [reserveDate, setReserveDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [notes, setNotes] = useState('');
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);

  const fetchCatalog = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedCategory !== 'ALL') {
        params.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await api.get('/equipment', { params });
      setEquipments(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCatalog();
  }, [selectedCategory, searchQuery]);

  const handleOpenReserve = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setReservationError(null);
    setReservationSuccess(false);
    setIsReserveModalOpen(true);
  };

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment) return;
    setReservationError(null);

    const startIso = `${reserveDate}T${startTime}:00`;
    const endIso = `${reserveDate}T${endTime}:00`;

    setIsSubmitting(true);
    try {
      await api.post('/reservations', {
        equipmentId: selectedEquipment.id,
        startTime: startIso,
        endTime: endIso,
        notes,
      });

      setReservationSuccess(true);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setTimeout(() => {
        setIsReserveModalOpen(false);
        void fetchCatalog();
      }, 1800);
    } catch (err: any) {
      setReservationError(err.response?.data?.message || 'Error al procesar la reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPenalized = user?.studentStatus === 'PENALIZED';

  return (
    <div className="space-y-6">
      {/* Encabezado y Bienvenida */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Laptop className="w-6 h-6 text-brand-400" />
            Catálogo de Equipos de Laboratorio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Consulta la disponibilidad en tiempo real y solicita tu material para prácticas académicas.
          </p>
        </div>

        {isPenalized && (
          <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Cuenta Penalizada: Préstamos Temporalmente Suspendidos</span>
          </div>
        )}
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Filtros de Categorías Exactos (HU-02) */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedCategory('COMPUTO')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'COMPUTO'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            Cómputo
          </button>
          <button
            onClick={() => setSelectedCategory('ELECTRONICA')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'ELECTRONICA'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Electrónica
          </button>
          <button
            onClick={() => setSelectedCategory('REDES')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'REDES'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            Redes
          </button>
        </div>

        {/* Buscador de texto */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, código o marca..."
            className="w-full px-4 py-2.5 pl-10 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Grid de Equipos */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 bg-slate-900/50 rounded-2xl animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : equipments.length === 0 ? (
        /* Criterio 3 de HU-02: Mensaje exacto requerido */
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <Info className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">
            No hay equipos disponibles en esta categoría
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Intenta seleccionando otra categoría o limpiando los filtros de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipments.map((eq) => {
            const isAvailable = eq.status === 'DISPONIBLE';

            return (
              <div
                key={eq.id}
                className="glass-card rounded-2xl overflow-hidden border border-slate-800/80 hover:border-brand-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Foto de equipo o Banner genérico */}
                  <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={eq.imageUrl || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=60'}
                      alt={eq.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="font-mono text-[11px] font-bold px-2 py-1 rounded bg-slate-950/80 backdrop-blur-md text-brand-300 border border-slate-700">
                        {eq.inventoryCode}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={eq.status} />
                    </div>
                  </div>

                  {/* Detalles */}
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                      <Tag className="w-3.5 h-3.5 text-brand-400" />
                      <span>{eq.brand} • {eq.model}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-1">
                      {eq.name}
                    </h3>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {eq.specifications || 'Sin especificaciones adicionales registradas.'}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/60">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{eq.location}</span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => handleOpenReserve(eq)}
                    disabled={!isAvailable || isPenalized}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      !isAvailable
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : isPenalized
                        ? 'bg-rose-950/40 text-rose-400 border border-rose-800/40 cursor-not-allowed'
                        : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {isPenalized
                      ? 'No disponible (Penalizado)'
                      : isAvailable
                      ? 'Solicitar Reserva'
                      : `No Disponible (${eq.status})`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Reserva (HU-03) */}
      <Modal
        isOpen={isReserveModalOpen}
        onClose={() => setIsReserveModalOpen(false)}
        title={`Reservar Equipo: ${selectedEquipment?.name || ''}`}
        maxWidth="max-w-lg"
      >
        {reservationSuccess ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-3 animate-bounce" />
            <h4 className="text-lg font-bold text-slate-100">¡Solicitud Enviada con Éxito!</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tu solicitud para <span className="text-brand-300 font-semibold">{selectedEquipment?.name}</span> ha sido enviada al encargado de laboratorio para su aprobación.
            </p>
          </div>
        ) : (
          <form onSubmit={handleConfirmReservation} className="space-y-4">
            {/* Info del Equipo */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-200">{selectedEquipment?.name}</p>
                <p className="text-slate-400 font-mono">{selectedEquipment?.inventoryCode}</p>
              </div>
              <StatusBadge status={selectedEquipment?.status || 'DISPONIBLE'} />
            </div>

            {/* Error de validación / Reglas de negocio */}
            {reservationError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{reservationError}</span>
              </div>
            )}

            {/* Selector de Fecha */}
            <div>
              <label htmlFor="reservation-date" className="block text-xs font-semibold text-slate-300 mb-1">
                Fecha de la Práctica
              </label>
              <input
                id="reservation-date"
                type="date"
                required
                value={reserveDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setReserveDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Rango Horario */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reservation-start-time" className="block text-xs font-semibold text-slate-300 mb-1">
                  Hora de Inicio
                </label>
                <input
                  id="reservation-start-time"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label htmlFor="reservation-end-time" className="block text-xs font-semibold text-slate-300 mb-1">
                  Hora de Fin (Devolución)
                </label>
                <input
                  id="reservation-end-time"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Motivo o Curso */}
            <div>
              <label htmlFor="reservation-notes" className="block text-xs font-semibold text-slate-300 mb-1">
                Curso / Propósito de la Práctica (Opcional)
              </label>
              <textarea
                id="reservation-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Laboratorio de Redes Industriales - Práctica 4"
                rows={2}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-[11px] text-brand-300 leading-relaxed">
              ⚠️ <strong>Reglas del Laboratorio:</strong> Solo puedes mantener 1 reserva activa a la vez. Si devuelves el equipo después de la hora de fin indicada, el sistema aplicará automáticamente 7 días de penalización.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReserveModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-500/20"
              >
                {isSubmitting ? 'Validando horario...' : 'Confirmar Solicitud'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
