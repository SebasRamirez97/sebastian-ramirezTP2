// backend/src/publicaciones/dto/crear-publicacion.dto.ts
import { IsString, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';

export class CrearPublicacionDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un ingrediente' })
  @IsString({ each: true })
  ingredientes: string[];

  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un paso de preparación' })
  @IsString({ each: true })
  pasos: string[];

  @IsString()
  @IsNotEmpty()
  tiempoPreparacion: string;
}