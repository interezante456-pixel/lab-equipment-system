export type Role = 'STUDENT' | 'ADMIN';
export type StudentStatus = 'ACTIVE' | 'PENALIZED';
export type EquipmentCategory = 'COMPUTO' | 'ELECTRONICA' | 'REDES';
export type EquipmentStatus = 'DISPONIBLE' | 'RESERVADO' | 'PRESTADO' | 'MANTENIMIENTO' | 'INACTIVO';
export type ReservationStatus =
  | 'PENDIENTE'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'PRESTADA'
  | 'DEVUELTO_A_TIEMPO'
  | 'DEVUELTO_CON_RETRASO'
  | 'CANCELADA';

export interface User {
  id: string;
  studentCode: string;
  fullName: string;
  email: string;
  career?: string;
  role: Role;
  studentStatus: StudentStatus;
  failedAttempts?: number;
  lockedUntil?: string | null;
  createdAt?: string;
}

export interface Equipment {
  id: string;
  inventoryCode: string;
  name: string;
  category: EquipmentCategory;
  brand: string;
  model: string;
  serialNumber?: string;
  location: string;
  status: EquipmentStatus;
  imageUrl?: string;
  specifications?: string;
  createdAt?: string;
}

export interface Reservation {
  id: string;
  userId: string;
  equipmentId: string;
  startTime: string;
  endTime: string;
  actualReturnTime?: string | null;
  status: ReservationStatus;
  rejectionReason?: string | null;
  notes?: string | null;
  createdAt: string;
  user?: User;
  equipment?: Equipment;
  penalty?: Penalty;
}

export interface Penalty {
  id: string;
  userId: string;
  reservationId: string;
  reason: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  liftedReason?: string;
  liftedBy?: string;
  user?: User;
  reservation?: Reservation;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardMetrics {
  equipment: {
    total: number;
    available: number;
    loaned: number;
    maintenance: number;
    byCategory: {
      computo: number;
      electronica: number;
      redes: number;
    };
  };
  students: {
    total: number;
    active: number;
    penalized: number;
  };
  reservations: {
    total: number;
    pending: number;
    activeLoans: number;
    onTimeReturns: number;
    lateReturns: number;
    punctualityRate: number;
  };
  recentActivity: Array<{
    id: string;
    startTime: string;
    endTime: string;
    status: ReservationStatus;
    user: { studentCode: string; fullName: string };
    equipment: { name: string; inventoryCode: string; category: EquipmentCategory };
  }>;
}
