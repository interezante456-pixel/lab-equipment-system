import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentCategory, EquipmentStatus, ReservationStatus, StudentStatus, Role } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics() {
    // 1. Métricas de Equipos
    const [
      totalEquipment,
      availableEquipment,
      loanedEquipment,
      maintenanceEquipment,
    ] = await Promise.all([
      this.prisma.equipment.count({ where: { status: { not: EquipmentStatus.INACTIVO } } }),
      this.prisma.equipment.count({ where: { status: EquipmentStatus.DISPONIBLE } }),
      this.prisma.equipment.count({ where: { status: EquipmentStatus.PRESTADO } }),
      this.prisma.equipment.count({ where: { status: EquipmentStatus.MANTENIMIENTO } }),
    ]);

    // 2. Equipos por categoría
    const [computoCount, electronicaCount, redesCount] = await Promise.all([
      this.prisma.equipment.count({ where: { category: EquipmentCategory.COMPUTO, status: { not: EquipmentStatus.INACTIVO } } }),
      this.prisma.equipment.count({ where: { category: EquipmentCategory.ELECTRONICA, status: { not: EquipmentStatus.INACTIVO } } }),
      this.prisma.equipment.count({ where: { category: EquipmentCategory.REDES, status: { not: EquipmentStatus.INACTIVO } } }),
    ]);

    // 3. Métricas de Estudiantes
    const [totalStudents, activeStudents, penalizedStudents] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.user.count({ where: { role: Role.STUDENT, studentStatus: StudentStatus.ACTIVE } }),
      this.prisma.user.count({ where: { role: Role.STUDENT, studentStatus: StudentStatus.PENALIZED } }),
    ]);

    // 4. Métricas de Reservas y Cumplimiento
    const [
      totalReservations,
      pendingReservations,
      activeLoans,
      onTimeReturns,
      lateReturns,
    ] = await Promise.all([
      this.prisma.reservation.count(),
      this.prisma.reservation.count({ where: { status: ReservationStatus.PENDIENTE } }),
      this.prisma.reservation.count({ where: { status: ReservationStatus.PRESTADA } }),
      this.prisma.reservation.count({ where: { status: ReservationStatus.DEVUELTO_A_TIEMPO } }),
      this.prisma.reservation.count({ where: { status: ReservationStatus.DEVUELTO_CON_RETRASO } }),
    ]);

    const totalCompleted = onTimeReturns + lateReturns;
    const punctualityRate = totalCompleted > 0 ? Math.round((onTimeReturns / totalCompleted) * 100) : 100;

    // 5. Actividad reciente
    const recentReservations = await this.prisma.reservation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { studentCode: true, fullName: true } },
        equipment: { select: { name: true, inventoryCode: true, category: true } },
      },
    });

    return {
      equipment: {
        total: totalEquipment,
        available: availableEquipment,
        loaned: loanedEquipment,
        maintenance: maintenanceEquipment,
        byCategory: {
          computo: computoCount,
          electronica: electronicaCount,
          redes: redesCount,
        },
      },
      students: {
        total: totalStudents,
        active: activeStudents,
        penalized: penalizedStudents,
      },
      reservations: {
        total: totalReservations,
        pending: pendingReservations,
        activeLoans,
        onTimeReturns,
        lateReturns,
        punctualityRate,
      },
      recentActivity: recentReservations,
    };
  }
}
