import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const cleanCode = dto.studentCode.trim().toUpperCase();

    // Validar formato si es estudiante: N0 + 8 dígitos
    const isStudent = dto.role === Role.STUDENT || !dto.role || cleanCode.startsWith('N0');
    if (isStudent) {
      const studentCodeRegex = /^N0\d{8}$/;
      if (!studentCodeRegex.test(cleanCode)) {
        throw new BadRequestException('El código de estudiante debe iniciar con N0 seguido de 8 dígitos numéricos (ej: N01234567)');
      }
    }

    // Verificar unicidad de código
    const existingByCode = await this.prisma.user.findUnique({
      where: { studentCode: cleanCode },
    });
    if (existingByCode) {
      throw new ConflictException(`Ya existe un usuario con el código institucional ${cleanCode}`);
    }

    // Verificar unicidad de email
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (existingByEmail) {
      throw new ConflictException(`Ya existe un usuario registrado con el correo ${dto.email}`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        studentCode: cleanCode,
        email: dto.email.trim().toLowerCase(),
        fullName: dto.fullName.trim(),
        career: dto.career?.trim() || null,
        passwordHash: hashedPassword,
        role: dto.role || Role.STUDENT,
        studentStatus: dto.studentStatus || undefined,
      },
      select: {
        id: true,
        studentCode: true,
        email: true,
        fullName: true,
        career: true,
        role: true,
        studentStatus: true,
        createdAt: true,
      },
    });

    return user;
  }

  async findAll(search?: string, role?: Role) {
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { studentCode: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { career: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        studentCode: true,
        email: true,
        fullName: true,
        career: true,
        role: true,
        studentStatus: true,
        failedAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        studentCode: true,
        email: true,
        fullName: true,
        career: true,
        role: true,
        studentStatus: true,
        failedAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
        reservations: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { equipment: true },
        },
        penalties: {
          where: { isActive: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const data: any = {};
    if (dto.email) data.email = dto.email.trim().toLowerCase();
    if (dto.fullName) data.fullName = dto.fullName.trim();
    if (dto.career !== undefined) data.career = dto.career.trim();
    if (dto.role) data.role = dto.role;
    if (dto.studentStatus) data.studentStatus = dto.studentStatus;

    if (dto.newPassword) {
      data.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        studentCode: true,
        email: true,
        fullName: true,
        career: true,
        role: true,
        studentStatus: true,
        updatedAt: true,
      },
    });
  }

  async unlockAccount(id: string) {
    const user = await this.findOne(id);

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
      },
      select: {
        id: true,
        studentCode: true,
        fullName: true,
        failedAttempts: true,
        lockedUntil: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
