import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../src/auth/auth.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService (Pruebas Unitarias Vitest)', () => {
  let authService: AuthService;
  let prismaMock: any;
  let jwtMock: any;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };

    jwtMock = {
      sign: vi.fn().mockReturnValue('mock_jwt_token_12345'),
    };

    authService = new AuthService(prismaMock, jwtMock);
  });

  it('HU-01: Debe rechazar código de estudiante que no cumpla con formato N0 + 8 dígitos', async () => {
    const invalidDto = {
      studentCode: 'N0123', // Solo 3 dígitos en vez de 8
      password: 'Password123!',
    };

    await expect(authService.login(invalidDto)).rejects.toThrow(BadRequestException);
  });

  it('HU-01: Debe retornar "Credenciales inválidas" si el usuario no existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const dto = {
      studentCode: 'N001234567', // N0 + 8 dígitos
      password: 'WrongPassword!',
    };

    await expect(authService.login(dto)).rejects.toThrow('Credenciales inválidas');
  });

  it('HU-01: Debe bloquear la cuenta tras acumular 3 intentos fallidos consecutivos', async () => {
    const userWithTwoFails = {
      id: 'user-uuid-1',
      studentCode: 'N001234567',
      passwordHash: await bcrypt.hash('CorrectPass123!', 10),
      failedAttempts: 2, // Ya lleva 2 intentos fallidos
      lockedUntil: null,
    };

    prismaMock.user.findUnique.mockResolvedValue(userWithTwoFails);

    const dto = {
      studentCode: 'N001234567',
      password: 'WrongPassword3rdTime!',
    };

    await expect(authService.login(dto)).rejects.toThrow(
      /Ha superado el límite de 3 intentos fallidos/i,
    );

    // Debe haber llamado a update bloqueando la cuenta por 15 minutos
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-uuid-1' },
        data: expect.objectContaining({
          failedAttempts: 3,
        }),
      }),
    );
  });

  it('HU-01: Debe iniciar sesión exitosamente si las credenciales son correctas y restablecer intentos', async () => {
    const passwordHash = await bcrypt.hash('CorrectPass123!', 10);
    const validUser = {
      id: 'user-uuid-1',
      studentCode: 'N001234567',
      fullName: 'Juan Pérez',
      email: 'juan@universidad.edu.pe',
      career: 'Sistemas',
      role: 'STUDENT',
      studentStatus: 'ACTIVE',
      passwordHash,
      failedAttempts: 1,
      lockedUntil: null,
    };

    prismaMock.user.findUnique.mockResolvedValue(validUser);
    prismaMock.user.update.mockResolvedValue(validUser);

    const dto = {
      studentCode: 'N001234567',
      password: 'CorrectPass123!',
    };

    const result = await authService.login(dto);

    expect(result).toHaveProperty('access_token', 'mock_jwt_token_12345');
    expect(result.user).toHaveProperty('studentCode', 'N001234567');
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-uuid-1' },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  });
});
