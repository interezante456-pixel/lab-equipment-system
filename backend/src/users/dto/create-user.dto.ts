import { IsNotEmpty, IsString, IsEmail, IsEnum, IsOptional, Matches, MinLength } from 'class-validator';
import { Role, StudentStatus } from '@prisma/client';

export class CreateUserDto {
  @IsString({ message: 'El código de estudiante es obligatorio' })
  @IsNotEmpty({ message: 'El código no puede estar vacío' })
  studentCode: string;

  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  email: string;

  @IsString({ message: 'El nombre completo es obligatorio' })
  @IsNotEmpty({ message: 'El nombre completo no puede estar vacío' })
  fullName: string;

  @IsOptional()
  @IsString()
  career?: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsOptional()
  @IsEnum(Role, { message: 'El rol debe ser STUDENT o ADMIN' })
  role?: Role;

  @IsOptional()
  @IsEnum(StudentStatus, { message: 'El estado debe ser ACTIVE o PENALIZED' })
  studentStatus?: StudentStatus;
}
