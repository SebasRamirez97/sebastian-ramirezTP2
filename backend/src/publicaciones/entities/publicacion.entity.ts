// backend/src/publicaciones/entities/publicacion.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

export type PublicacionDocument = HydratedDocument<Publicacion>;

// 1. Sub-esquema para los comentarios (permite tipado robusto y métodos de Mongoose)
@Schema({ timestamps: { createdAt: 'fecha', updatedAt: false } })
export class Comentario {
  @Prop({ type: Types.ObjectId, ref: Usuario.name, required: true })
  autor: Types.ObjectId;

  @Prop({ required: true, trim: true })
  texto: string;

  @Prop({ default: false })
  modificado: boolean;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);

@Schema({
  timestamps: true,
  collection: 'publicaciones',
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

  @Prop({ type: Types.ObjectId, ref: Usuario.name, required: true })
  autor: Types.ObjectId;

  @Prop({ default: true })
  activo: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: Usuario.name }], default: [] })
  likes: Types.ObjectId[];

  // 2. Usamos el sub-esquema definido en lugar de un objeto plano
  @Prop({ type: [ComentarioSchema], default: [] })
  comentarios: Types.DocumentArray<Comentario & { _id: Types.ObjectId; fecha: Date }>;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);