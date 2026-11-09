import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { EquipmentCategory, EquipmentStatus } from '@prisma/client';

export class CreateEquipmentDto {
  @IsString({ message: 'El código de inventario es obligatorio' })
  @IsNotEmpty({ message: 'El código de inventario no puede estar vacío' })
  inventoryCode: string;

  @IsString({ message: 'El nombre del equipo es obligatorio' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  name: string;

  @IsEnum(EquipmentCategory, { message: 'La categoría debe ser COMPUTO, ELECTRONICA o REDES' })
  category: EquipmentCategory;

  @IsString({ message: 'La marca es obligatoria' })
  brand: string;

  @IsString({ message: 'El modelo es obligatorio' })
  model: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsString({ message: 'La ubicación en el laboratorio es obligatoria' })
  location: string;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  specifications?: string;
}
