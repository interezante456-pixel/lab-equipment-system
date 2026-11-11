import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EquipmentService } from '../src/equipment/equipment.service';

describe('EquipmentService', () => {
  let prisma: any;
  let service: EquipmentService;
  const dto: any = { inventoryCode: ' lab-01 ', name: ' Equipo ', category: 'COMPUTO', brand: ' Marca ', model: ' Modelo ', location: ' Lab A ' };

  beforeEach(() => {
    prisma = { equipment: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn(), update: vi.fn() } };
    service = new EquipmentService(prisma);
  });

  it('rechaza un código de inventario ya registrado', async () => {
    prisma.equipment.findUnique.mockResolvedValue({ id: 'eq1' });
    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  it('normaliza los campos y crea un equipo disponible', async () => {
    prisma.equipment.findUnique.mockResolvedValue(null);
    prisma.equipment.create.mockResolvedValue({ id: 'eq1', inventoryCode: 'LAB-01' });
    await service.create(dto);
    expect(prisma.equipment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ inventoryCode: 'LAB-01', name: 'Equipo', status: 'DISPONIBLE' }) }));
  });

  it('devuelve el mensaje de catálogo vacío cuando no hay resultados', async () => {
    prisma.equipment.findMany.mockResolvedValue([]);
    await expect(service.findAll('COMPUTO' as any, 'router')).resolves.toEqual({ total: 0, items: [], message: 'No hay equipos disponibles en esta categoría' });
  });
});
