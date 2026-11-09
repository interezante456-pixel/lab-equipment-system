import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string) {
    const { studentCode, password } = loginDto;
    const cleanCode = studentCode.trim().toUpperCase();

    // 1. Validar formato si es estudiante (debe iniciar con N0 seguido de 8 dígitos)
    if (cleanCode.startsWith('N0')) {
      const studentCodeRegex = /^N0\d{8}$/;
      if (!studentCodeRegex.test(cleanCode)) {
        throw new BadRequestException('El código de estudiante debe tener el formato N0 seguido de 8 dígitos (ej: N01234567)');
      }
    }

    // 2. Buscar usuario por código
    const user = await this.prisma.user.findUnique({
      where: { studentCode: cleanCode },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Verificar si la cuenta está bloqueada temporalmente
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / (1000 * 60));
      throw new UnauthorizedException(
        `Alerta de seguridad: Cuenta bloqueada temporalmente tras acumular 3 intentos fallidos. Intente nuevamente en ${remainingMinutes} minuto(s) o contacte al administrador.`,
      );
    }

    // Si ya pasó el tiempo de bloqueo, restablecer intentos
    if (user.lockedUntil && user.lockedUntil <= now) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: 0, lockedUntil: null },
      });
      user.failedAttempts = 0;
      user.lockedUntil = null;
    }

    // 4. Comparar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      const newAttempts = user.failedAttempts + 1;

      if (newAttempts >= 3) {
        const lockoutTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedAttempts: newAttempts,
            lockedUntil: lockoutTime,
          },
        });

        // Registrar en auditoría
        await this.prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'BLOQUEO_CUENTA',
            details: `Cuenta bloqueada por 15 minutos tras 3 intentos fallidos desde IP: ${ipAddress || 'desconocida'}`,
            ipAddress,
          },
        });

        throw new UnauthorizedException(
          'Alerta de seguridad: Ha superado el límite de 3 intentos fallidos. La cuenta ha sido bloqueada temporalmente por 15 minutos.',
        );
      } else {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedAttempts: newAttempts },
        });

        throw new UnauthorizedException('Credenciales inválidas');
      }
    }

    // 5. Credenciales válidas: resetear intentos y emitir token
    if (user.failedAttempts > 0 || user.lockedUntil !== null) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: 0, lockedUntil: null },
      });
    }

    const payload = {
      sub: user.id,
      studentCode: user.studentCode,
      role: user.role,
      studentStatus: user.studentStatus,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        studentCode: user.studentCode,
        fullName: user.fullName,
        email: user.email,
        career: user.career,
        role: user.role,
        studentStatus: user.studentStatus,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        studentCode: true,
        email: true,
        fullName: true,
        career: true,
        role: true,
        studentStatus: true,
        createdAt: true,
        penalties: {
          where: { isActive: true },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }
}
