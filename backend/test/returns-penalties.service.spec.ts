import { BadRequestException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReturnsPenaltiesService } from '../src/returns-penalties/returns-penalties.service';

describe('ReturnsPenaltiesService', () => {
  let prisma: any;
  let service: ReturnsPenaltiesService;
  const reservation: any = { id: 'r1', userId: 'u1', equipmentId: 'e1', status: 'APROBADA', endTime: new Date('2030-01-01T10:00:00Z'), equipment: { name: 'Router' }, user: { fullName: 'Ada' } };

  beforeEach(() => {
    prisma = {
      reservation: { findUnique: vi.fn(), update: vi.fn() }, equipment: { update: vi.fn() }, user: { update: vi.fn() }, penalty: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), count: vi.fn() }, notification: { create: vi.fn() },
      $transaction: vi.fn(async (work: any) => work({ reservation: { update: prisma.reservation.update }, equipment: { update: prisma.equipment.update }, user: { update: prisma.user.update }, penalty: { create: prisma.penalty.create, update: prisma.penalty.update, count: prisma.penalty.count }, notification: { create: prisma.notification.create } })),
    };
    service = new ReturnsPenaltiesService(prisma);
  });
  afterEach(() => { vi.useRealTimers(); });

  it('despacha solo una reserva aprobada y cambia el equipo a PRESTADO', async () => {
    prisma.reservation.findUnique.mockResolvedValue(reservation);
    prisma.reservation.update.mockResolvedValue({ ...reservation, status: 'PRESTADA', equipment: reservation.equipment });
    await service.dispatch('r1');
    expect(prisma.equipment.update).toHaveBeenCalledWith({ where: { id: 'e1' }, data: { status: 'PRESTADO' } });
  });

  it('rechaza despacho de una reserva que no está aprobada', async () => {
    prisma.reservation.findUnique.mockResolvedValue({ ...reservation, status: 'PENDIENTE' });
    await expect(service.dispatch('r1')).rejects.toThrow(BadRequestException);
  });

  it('aplica penalización y libera el equipo al devolver tarde', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2030-01-01T10:30:00Z'));
    prisma.reservation.findUnique.mockResolvedValue({ ...reservation, status: 'PRESTADA' });
    prisma.penalty.create.mockResolvedValue({ id: 'p1', isActive: true });
    prisma.reservation.update.mockResolvedValue({ ...reservation, status: 'DEVUELTO_CON_RETRASO' });
    const result = await service.processReturn('r1');
    expect(result.isLate).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { studentStatus: 'PENALIZED' } });
    expect(prisma.equipment.update).toHaveBeenCalledWith({ where: { id: 'e1' }, data: { status: 'DISPONIBLE' } });
  });

  it('levanta una penalización activa y rehabilita al estudiante sin otras sanciones', async () => {
    prisma.penalty.findUnique.mockResolvedValue({ id: 'p1', isActive: true, userId: 'u1', user: {} });
    prisma.penalty.update.mockResolvedValue({ id: 'p1', isActive: false });
    prisma.penalty.count.mockResolvedValue(0);
    await service.liftPenalty('p1', 'Admin', { reason: 'Sustento válido' });
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { studentStatus: 'ACTIVE' } });
  });
});
