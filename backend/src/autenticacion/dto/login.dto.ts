// backend/src/autenticacion/dto/login.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'El identificador (correo o usuario) debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'Debe ingresar su correo o nombre de usuario' })
  identificador: string; // Puede recibir tanto el correo como el nombre de usuario

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;
}