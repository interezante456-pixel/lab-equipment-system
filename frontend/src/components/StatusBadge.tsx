import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'DISPONIBLE':
      case 'ACTIVE':
      case 'DEVUELTO_A_TIEMPO':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'RESERVADO':
      case 'APROBADA':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'PRESTADO':
      case 'PRESTADA':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'PENDIENTE':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'DEVUELTO_CON_RETRASO':
      case 'PENALIZED':
      case 'RECHAZADA':
      case 'INACTIVO':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'MANTENIMIENTO':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'CANCELADA':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'DISPONIBLE': return 'Disponible';
      case 'RESERVADO': return 'Reservado';
      case 'PRESTADO': return 'Prestado';
      case 'MANTENIMIENTO': return 'Mantenimiento';
      case 'INACTIVO': return 'Inactivo';
      case 'ACTIVE': return 'Habilitado';
      case 'PENALIZED': return 'Penalizado';
      case 'PENDIENTE': return 'Pendiente';
      case 'APROBADA': return 'Aprobada';
      case 'RECHAZADA': return 'Rechazada';
      case 'PRESTADA': return 'En Préstamo';
      case 'DEVUELTO_A_TIEMPO': return 'A Tiempo';
      case 'DEVUELTO_CON_RETRASO': return 'Con Retraso';
      case 'CANCELADA': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse"></span>
      {getLabel()}
    </span>
  );
};
