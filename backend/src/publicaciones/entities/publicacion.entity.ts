// backend/src/publicaciones/entities/publicacion.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

// Definimos el tipo HydratedDocument para exportarlo limpio
export type PublicacionDocument = HydratedDocument<Publicacion>;

@Schema({ timestamps: true })
export class Publicacion {
  @Prop({ required: true, trim: true })
  titulo: string;

  @Prop({ required: true })
  descripcion: string;

  @Prop({ type: [String], required: true })
  ingredientes: string[];

  @Prop({ type: [String], required: true })
  pasos: string[];

  @Prop({ required: true })
  tiempoPreparacion: string;

  @Prop({ default: '' })
  imagenUrl: string;

  // Relación con el usuario creador de la publicación
  @Prop({ type: Types.ObjectId, ref: Usuario.name, required: true })
  autor: Types.ObjectId;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);