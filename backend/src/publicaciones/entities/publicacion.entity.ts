// backend/src/publicaciones/entities/publicacion.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

export type PublicacionDocument = HydratedDocument<Publicacion>;

@Schema({ 
  timestamps: true,
  collection: 'publicaciones'
})
export class Publicacion {
  @Prop({ required: true, trim: true })
  titulo: string;

  @Prop({ required: true })
  descripcion: string;

  @Prop({ required: false })
  tiempoPreparacion: string;

  @Prop({ default: '' })
  imagenUrl: string;

  // Relación con el usuario creador de la publicación
  @Prop({ type: Types.ObjectId, ref: Usuario.name, required: true })
  autor: Types.ObjectId;

  // Nuevo: Para la baja lógica (true = activa, false = eliminada lógicamente)
  @Prop({ default: true })
  activo: boolean;

  // Nuevo: Arreglo de IDs de usuarios que dieron "me gusta"
  @Prop({ type: [{ type: Types.ObjectId, ref: Usuario.name }], default: [] })
  likes: Types.ObjectId[];
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);