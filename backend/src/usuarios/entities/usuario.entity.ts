// backend/src/usuarios/entities/usuario.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UsuarioDocument = HydratedDocument<Usuario>;

@Schema({ timestamps: true }) // Agrega automáticamente createdAt y updatedAt
export class Usuario {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, trim: true })
  apellido: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  correo: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  usuario: string; // Nombre de usuario único

  @Prop({ required: true })
  password: string; // Aquí se guardará la contraseña encriptada con bcrypt

  @Prop({ required: true })
  fechaNacimiento: Date;

  @Prop({ default: '' })
  descripcionBreve: string;

  @Prop({ default: '' })
  avatarUrl: string; // Ruta o URL de la imagen de perfil subida

  @Prop({ default: 'usuario', enum: ['usuario', 'administrador'] })
  perfil: string; // Por defecto 'usuario', pero puede ser 'administrador'
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);