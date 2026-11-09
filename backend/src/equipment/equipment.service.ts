import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentCategory, EquipmentStatus } from '@prisma/client';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEquipmentDto) {
    const cleanCode = dto.inventoryCode.trim().toUpperCase();

    const existing = await this.prisma.equipment.findUnique({
      where: { inventoryCode: cleanCode },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un equipo registrado con el código de inventario ${cleanCode}`);
    }

    if (dto.serialNumber) {
      const existingSerial = await this.prisma.equipment.findUnique({
        where: { serialNumber: dto.serialNumber.trim() },
      });
      if (existingSerial) {
        throw new ConflictException(`Ya existe un equipo registrado con el número de serie ${dto.serialNumber}`);
      }
    }

    return this.prisma.equipment.create({
      data: {
        inventoryCode: cleanCode,
        name: dto.name.trim(),
        category: dto.category,
        brand: dto.brand.trim(),
        model: dto.model.trim(),
        serialNumber: dto.serialNumber?.trim() || null,
        location: dto.location.trim(),
        status: dto.status || EquipmentStatus.DISPONIBLE,
        imageUrl: dto.imageUrl?.trim() || null,
        specifications: dto.specifications?.trim() || null,
      },
    });
  }

  async findAll(category?: EquipmentCategory, search?: string, status?: EquipmentStatus) {
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { inventoryCode: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.equipment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      total: items.length,
      items,
      message: items.length === 0 ? 'No hay equipos disponibles en esta categoría' : undefined,
    };
  }

  async findOne(id: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        reservations: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { studentCode: true, fullName: true } } },
        },
      },
    });

    if (!equipment) {
      throw new NotFoundException('Equipo no encontrado');
    }

    return equipment;
  }

  async update(id: string, dto: UpdateEquipmentDto) {
    await this.findOne(id);

    return this.prisma.equipment.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.category && { category: dto.category }),
        ...(dto.brand && { brand: dto.brand.trim() }),
        ...(dto.model && { model: dto.model.trim() }),
        ...(dto.serialNumber !== undefined && { serialNumber: dto.serialNumber?.trim() || null }),
        ...(dto.location && { location: dto.location.trim() }),
        ...(dto.status && { status: dto.status }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl?.trim() || null }),
        ...(dto.specifications !== undefined && { specifications: dto.specifications?.trim() || null }),
      },
    });
  }

  async generateQRCode(id: string) {
    const equipment = await this.findOne(id);
    const qrPayload = JSON.stringify({
      id: equipment.id,
      code: equipment.inventoryCode,
      name: equipment.name,
      category: equipment.category,
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 300,
      margin: 2,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    });

    return {
      inventoryCode: equipment.inventoryCode,
      name: equipment.name,
      qrDataUrl,
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    // Baja lógica si tiene relaciones
    return this.prisma.equipment.update({
      where: { id },
      data: { status: EquipmentStatus.INACTIVO },
    });
  }
}
