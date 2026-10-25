// backend/src/autenticacion/dto/registro.dto.ts
import { IsString, IsNotEmpty, IsEmail, MinLength, Matches, IsDateString, IsOptional } from 'class-validator';

export class RegistroDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  apellido: string;

  @IsEmail({}, { message: 'El formato del correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  correo: string;

  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  usuario: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe poseer al menos 8 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe poseer al menos una letra mayúscula y un número',
  })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Debe confirmar la contraseña' })
  repetirPassword: string;

  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida' })
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  fechaNacimiento: string;

  @IsString()
  @IsOptional()
  descripcionBreve?: string;
}