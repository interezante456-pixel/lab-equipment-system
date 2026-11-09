import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateReservationDto {
  @IsString({ message: 'El ID del equipo es obligatorio' })
  @IsNotEmpty({ message: 'El ID del equipo no puede estar vacío' })
  equipmentId: string;

  @IsDateString({}, { message: 'La fecha y hora de inicio debe ser una fecha ISO válida' })
  @IsNotEmpty({ message: 'La fecha y hora de inicio es obligatoria' })
  startTime: string;

  @IsDateString({}, { message: 'La fecha y hora de fin debe ser una fecha ISO válida' })
  @IsNotEmpty({ message: 'La fecha y hora de fin es obligatoria' })
  endTime: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
