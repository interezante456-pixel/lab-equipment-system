import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RejectReservationDto {
  @IsString({ message: 'El motivo de rechazo debe ser un texto' })
  @IsNotEmpty({ message: 'El motivo de rechazo es obligatorio' })
  @MinLength(5, { message: 'El motivo de rechazo debe tener al menos 5 caracteres' })
  reason: string;
}
