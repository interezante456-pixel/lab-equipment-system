import { BadRequestException, ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from '../src/users/users.service';

describe('UsersService', () => {
  let prisma: any;
  let service: UsersService;
  const dto: any = { studentCode: 'N001234567', email: 'Ada@Universidad.edu', fullName: ' Ada Lovelace ', password: 'clave-segura', role: 'STUDENT' };

  beforeEach(() => {
    prisma = { user: { findUnique: vi.fn(), create: vi.fn() } };
    service = new UsersService(prisma);
  });

  it('valida el formato institucional de estudiante antes de persistir', async () => {
    await expect(service.create({ ...dto, studentCode: 'N012' })).rejects.toThrow(BadRequestException);
  });

  it('rechaza un correo ya existente', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'u1' });
    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  it('normaliza identidad y no persiste la contraseña en texto plano', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'u1', studentCode: 'N001234567', email: 'ada@universidad.edu' });
    await service.create(dto);
    const data = prisma.user.create.mock.calls[0][0].data;
    expect(data.email).toBe('ada@universidad.edu');
    expect(data.passwordHash).not.toBe(dto.password);
  });
});
