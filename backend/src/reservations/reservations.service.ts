import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { RejectReservationDto } from './dto/reject-reservation.dto';
import { ReservationStatus, EquipmentStatus, StudentStatus, Role } from '@prisma/client';

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReservationDto) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    const now = new Date();

    if (start >= end) {
      throw new BadRequestException('La hora de inicio debe ser anterior a la hora de fin');
    }

    if (start < new Date(now.getTime() - 5 * 60 * 1000)) {
      throw new BadRequestException('No se pueden programar reservas en horarios pasados');
    }

    // 1. Validar que el estudiante no esté penalizado
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        penalties: {
          where: { isActive: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.studentStatus === StudentStatus.PENALIZED || user.penalties.length > 0) {
      throw new BadRequestException('El estudiante se encuentra actualmente penalizado y no puede realizar nuevas reservas.');
    }

    // 2. Regla de negocio: Un estudiante no puede tener más de un (1) equipo reservado o prestado de forma simultánea
    const activeStudentReservations = await this.prisma.reservation.count({
      where: {
        userId,
        status: {
          in: [ReservationStatus.PENDIENTE, ReservationStatus.APROBADA, ReservationStatus.PRESTADA],
        },
      },
    });

    if (activeStudentReservations >= 1) {
      throw new BadRequestException('El estudiante no puede tener más de un (1) equipo reservado o en préstamo de forma simultánea.');
    }

    // 3. Validar existencia y estado del equipo
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: dto.equipmentId },
    });

    if (!equipment) {
      throw new NotFoundException('Equipo no encontrado');
    }

    if (equipment.status === EquipmentStatus.MANTENIMIENTO || equipment.status === EquipmentStatus.INACTIVO) {
      throw new BadRequestException(`El equipo seleccionado se encuentra actualmente en estado: ${equipment.status}`);
    }

    // 4. Regla de negocio: El sistema debe bloquear la transacción y mostrar un error si se intenta reservar
    // un equipo que ya tiene una reserva aprobada que se cruce con ese horario.
    const overlappingReservation = await this.prisma.reservation.findFirst({
      where: {
        equipmentId: dto.equipmentId,
        status: {
          in: [ReservationStatus.APROBADA, ReservationStatus.PRESTADA],
        },
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } },
        ],
      },
    });

    if (overlappingReservation) {
      throw new BadRequestException('El equipo ya cuenta con una reserva aprobada o en uso que se cruza con el horario solicitado.');
    }

    // 5. Crear la reserva
    const reservation = await this.prisma.reservation.create({
      data: {
        userId,
        equipmentId: dto.equipmentId,
        startTime: start,
        endTime: end,
        notes: dto.notes?.trim() || null,
        status: ReservationStatus.PENDIENTE,
      },
      include: {
        equipment: true,
      },
    });

    // Notificación informativa al estudiante
    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Solicitud de Reserva Registrada',
        message: `Tu solicitud para el equipo ${equipment.name} (${equipment.inventoryCode}) está pendiente de aprobación por el encargado de laboratorio.`,
      },
    });

    return reservation;
  }

  async findAll(status?: ReservationStatus, userId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    return this.prisma.reservation.findMany({
      where,
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
        equipment: true,
        penalty: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPending() {
    return this.prisma.reservation.findMany({
      where: { status: ReservationStatus.PENDIENTE },
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
        equipment: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const res = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        user: true,
        equipment: true,
        penalty: true,
      },
    });

    if (!res) throw new NotFoundException('Reserva no encontrada');
    return res;
  }

  async approve(id: string) {
    const reservation = await this.findOne(id);

    if (reservation.status !== ReservationStatus.PENDIENTE) {
      throw new BadRequestException(`Solo se pueden aprobar reservas en estado PENDIENTE. Estado actual: ${reservation.status}`);
    }

    // Verificar colisión final antes de aprobar
    const overlapping = await this.prisma.reservation.findFirst({
      where: {
        id: { not: id },
        equipmentId: reservation.equipmentId,
        status: { in: [ReservationStatus.APROBADA, ReservationStatus.PRESTADA] },
        AND: [
          { startTime: { lt: reservation.endTime } },
          { endTime: { gt: reservation.startTime } },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException('Conflicto detectado: Otro estudiante ya tiene una reserva aprobada en este horario.');
    }

    // Actualizar estado a Aprobada y el equipo pasa a Reservado
    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.APROBADA },
        include: { equipment: true, user: true },
      });

      await tx.equipment.update({
        where: { id: reservation.equipmentId },
        data: { status: EquipmentStatus.RESERVADO },
      });

      await tx.notification.create({
        data: {
          userId: res.userId,
          title: '¡Reserva Aprobada!',
          message: `Tu solicitud para el equipo ${res.equipment.name} ha sido aprobada. Preséntate en el laboratorio a la hora programada.`,
        },
      });

      return res;
    });

    return updated;
  }

  async reject(id: string, dto: RejectReservationDto) {
    const reservation = await this.findOne(id);

    if (reservation.status !== ReservationStatus.PENDIENTE) {
      throw new BadRequestException(`Solo se pueden rechazar reservas en estado PENDIENTE. Estado actual: ${reservation.status}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.RECHAZADA,
          rejectionReason: dto.reason.trim(),
        },
        include: { equipment: true, user: true },
      });

      await tx.equipment.update({
        where: { id: reservation.equipmentId },
        data: { status: EquipmentStatus.DISPONIBLE },
      });

      await tx.notification.create({
        data: {
          userId: res.userId,
          title: 'Reserva Rechazada',
          message: `Tu solicitud para ${res.equipment.name} fue rechazada. Motivo: ${dto.reason.trim()}`,
        },
      });

      return res;
    });

    return updated;
  }

  async cancelByStudent(id: string, userId: string) {
    const reservation = await this.findOne(id);

    if (reservation.userId !== userId) {
      throw new ForbiddenException('No tiene permisos para cancelar esta reserva');
    }

    if (reservation.status !== ReservationStatus.PENDIENTE && reservation.status !== ReservationStatus.APROBADA) {
      throw new BadRequestException(`No se puede cancelar una reserva con estado: ${reservation.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const res = await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.CANCELADA },
      });

      await tx.equipment.update({
        where: { id: reservation.equipmentId },
        data: { status: EquipmentStatus.DISPONIBLE },
      });

      return res;
    });
  }
}
