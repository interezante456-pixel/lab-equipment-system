import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LiftPenaltyDto } from './dto/lift-penalty.dto';
import { ReservationStatus, EquipmentStatus, StudentStatus } from '@prisma/client';

@Injectable()
export class ReturnsPenaltiesService {
  constructor(private prisma: PrismaService) {}

  // Despacho / Entrega física al estudiante
  async dispatch(reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { equipment: true, user: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reservation.status !== ReservationStatus.APROBADA) {
      throw new BadRequestException(`Solo se pueden despachar reservas en estado APROBADA. Estado actual: ${reservation.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const res = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.PRESTADA },
        include: { equipment: true, user: true },
      });

      await tx.equipment.update({
        where: { id: reservation.equipmentId },
        data: { status: EquipmentStatus.PRESTADO },
      });

      await tx.notification.create({
        data: {
          userId: res.userId,
          title: 'Equipo Entregado en Préstamo',
          message: `Has retirado el equipo ${res.equipment.name}. Recuerda devolverlo antes de las ${res.endTime.toLocaleTimeString()} para evitar penalizaciones.`,
        },
      });

      return res;
    });
  }

  // HU-05: Devolución y Penalización Automática
  async processReturn(reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { equipment: true, user: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reservation.status !== ReservationStatus.PRESTADA && reservation.status !== ReservationStatus.APROBADA) {
      throw new BadRequestException(`Solo se pueden devolver reservas en estado PRESTADA o APROBADA. Estado actual: ${reservation.status}`);
    }

    const now = new Date();
    const isLate = now.getTime() > new Date(reservation.endTime).getTime();

    return this.prisma.$transaction(async (tx) => {
      // 1. Criterio 2: El equipo cambia inmediatamente su estado a "Disponible"
      await tx.equipment.update({
        where: { id: reservation.equipmentId },
        data: { status: EquipmentStatus.DISPONIBLE },
      });

      let penaltyRecord = null;
      let finalStatus: ReservationStatus = ReservationStatus.DEVUELTO_A_TIEMPO;

      // 2. Criterio 3: Regla de negocio: Si fecha/hora actual > hora fin acordada -> Estudiante pasa a "Penalizado"
      if (isLate) {
        finalStatus = ReservationStatus.DEVUELTO_CON_RETRASO;
        const diffMinutes = Math.ceil((now.getTime() - new Date(reservation.endTime).getTime()) / (1000 * 60));
        const penaltyEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 días de sanción

        // Cambiar estado del estudiante a Penalizado
        await tx.user.update({
          where: { id: reservation.userId },
          data: { studentStatus: StudentStatus.PENALIZED },
        });

        // Registrar la penalización
        penaltyRecord = await tx.penalty.create({
          data: {
            userId: reservation.userId,
            reservationId: reservation.id,
            reason: `Devolución tardía del equipo ${reservation.equipment.name} (${diffMinutes} minuto(s) de retraso)`,
            startDate: now,
            endDate: penaltyEnd,
            isActive: true,
          },
        });

        // Notificación al estudiante con alerta de sanción
        await tx.notification.create({
          data: {
            userId: reservation.userId,
            title: '⚠️ Penalización Aplicada por Entrega Tardía',
            message: `El equipo ${reservation.equipment.name} fue devuelto con ${diffMinutes} minuto(s) de tardanza. Tu cuenta ha sido penalizada por 7 días.`,
          },
        });
      } else {
        await tx.notification.create({
          data: {
            userId: reservation.userId,
            title: '✅ Devolución Exitosa',
            message: `El equipo ${reservation.equipment.name} ha sido devuelto a tiempo en óptimas condiciones.`,
          },
        });
      }

      // Actualizar reserva
      const updatedReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: finalStatus,
          actualReturnTime: now,
        },
        include: { equipment: true, user: true, penalty: true },
      });

      return {
        reservation: updatedReservation,
        isLate,
        penalty: penaltyRecord,
        message: isLate
          ? 'Equipo devuelto con retraso. Se ha aplicado penalización automática al estudiante.'
          : 'Equipo devuelto a tiempo correctamente. El equipo vuelve a estar Disponible.',
      };
    });
  }

  // HU-08: Gestión de Penalizaciones (Listado)
  async findAllPenalties() {
    return this.prisma.penalty.findMany({
      include: {
        user: {
          select: {
            id: true,
            studentCode: true,
            fullName: true,
            email: true,
            career: true,
            studentStatus: true,
          },
        },
        reservation: {
          include: { equipment: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // HU-08: Levantamiento de Penalización
  async liftPenalty(penaltyId: string, adminFullName: string, dto: LiftPenaltyDto) {
    const penalty = await this.prisma.penalty.findUnique({
      where: { id: penaltyId },
      include: { user: true },
    });

    if (!penalty) {
      throw new NotFoundException('Registro de penalización no encontrado');
    }

    if (!penalty.isActive) {
      throw new BadRequestException('Esta penalización ya se encuentra inactiva o levantada previamente');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Inactivar la penalización
      const updatedPenalty = await tx.penalty.update({
        where: { id: penaltyId },
        data: {
          isActive: false,
          liftedReason: dto.reason.trim(),
          liftedBy: adminFullName,
        },
      });

      // 2. Verificar si el usuario tiene otras penalizaciones activas
      const otherActivePenalties = await tx.penalty.count({
        where: {
          userId: penalty.userId,
          id: { not: penaltyId },
          isActive: true,
        },
      });

      // Si no tiene más penalizaciones activas, reactivar al estudiante
      if (otherActivePenalties === 0) {
        await tx.user.update({
          where: { id: penalty.userId },
          data: { studentStatus: StudentStatus.ACTIVE },
        });
      }

      // Notificar al estudiante
      await tx.notification.create({
        data: {
          userId: penalty.userId,
          title: '🎉 Penalización Levantada',
          message: `Tu penalización ha sido levantada por el administrador. Motivo: ${dto.reason.trim()}`,
        },
      });

      return updatedPenalty;
    });
  }
}
