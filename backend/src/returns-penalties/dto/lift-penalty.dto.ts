import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LiftPenaltyDto {
  @IsString({ message: 'El motivo de levantamiento debe ser un texto' })
  @IsNotEmpty({ message: 'El motivo de levantamiento de penalización es obligatorio' })
  @MinLength(5, { message: 'El motivo debe tener al menos 5 caracteres' })
  reason: string;
}
