import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReservationsService } from '../src/reservations/reservations.service';

const dto = { equipmentId: 'eq-1', startTime: '2030-06-10T10:00:00.000Z', endTime: '2030-06-10T12:00:00.000Z', notes: 'Práctica' };
const user = { id: 'u1', studentStatus: 'ACTIVE', penalties: [] };
const equipment = { id: 'eq-1', name: 'Osciloscopio', inventoryCode: 'LAB-01', status: 'DISPONIBLE' };

describe('ReservationsService', () => {
  let prisma: any;
  let service: ReservationsService;

  beforeEach(() => {
    prisma = {
      user: { findUnique: vi.fn() }, equipment: { findUnique: vi.fn(), update: vi.fn() },
      reservation: { count: vi.fn(), findFirst: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
      notification: { create: vi.fn() },
      $transaction: vi.fn(async (work: any) => work({ reservation: { update: prisma.reservation.update }, equipment: { update: prisma.equipment.update }, notification: { create: prisma.notification.create } })),
    };
    service = new ReservationsService(prisma);
  });

  it('rechaza intervalos cuyo inicio no precede al fin', async () => {
    await expect(service.create('u1', { ...dto, startTime: dto.endTime })).rejects.toThrow(BadRequestException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rechaza a un estudiante con una reserva activa', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.reservation.count.mockResolvedValue(1);
    await expect(service.create('u1', dto)).rejects.toThrow(/m[aá]s de un/i);
  });

  it('rechaza un horario que se superpone con una reserva aprobada', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.reservation.count.mockResolvedValue(0);
    prisma.equipment.findUnique.mockResolvedValue(equipment);
    prisma.reservation.findFirst.mockResolvedValue({ id: 'r-ocupada' });
    await expect(service.create('u1', dto)).rejects.toThrow(/cruza con el horario/i);
  });

  it('crea una solicitud pendiente y notifica al estudiante cuando es válida', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.reservation.count.mockResolvedValue(0);
    prisma.equipment.findUnique.mockResolvedValue(equipment);
    prisma.reservation.findFirst.mockResolvedValue(null);
    prisma.reservation.create.mockResolvedValue({ id: 'r1', status: 'PENDIENTE' });
    await expect(service.create('u1', dto)).resolves.toMatchObject({ status: 'PENDIENTE' });
    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 'u1' }) }));
  });

  it('aprueba una solicitud pendiente y reserva el equipo en una transacción', async () => {
    prisma.reservation.findUnique.mockResolvedValue({ id: 'r1', equipmentId: 'eq-1', status: 'PENDIENTE', startTime: new Date(dto.startTime), endTime: new Date(dto.endTime) });
    prisma.reservation.findFirst.mockResolvedValue(null);
    prisma.reservation.update.mockResolvedValue({ id: 'r1', userId: 'u1', equipment: { name: 'Osciloscopio' } });
    await service.approve('r1');
    expect(prisma.equipment.update).toHaveBeenCalledWith({ where: { id: 'eq-1' }, data: { status: 'RESERVADO' } });
  });
});
