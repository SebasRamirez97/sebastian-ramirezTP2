import { Component, Input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicacionService } from '../../services/publicacion.service';
import { FechaArgentinaPipe } from '../../pipes/fecha-argentina-pipe';

@Component({
  selector: 'app-publicacion-card',
  standalone: true,
  imports: [CommonModule, FechaArgentinaPipe],
  templateUrl: './publicacion-card.html',
  styleUrls: ['./publicacion-card.css'],
})
export class PublicacionCard {
  private publicacionService = inject(PublicacionService);

  @Input({ required: true }) publicacion: any;
  @Input({ required: true }) usuarioActualId!: string;
  @Input() perfilUsuario: string = ''; // 👈 1. Recibimos el perfil del usuario logueado

  // Eventos para el padre
  publicacionEliminada = output<string>();
  solicitarEliminacion = output<any>(); 
  likeActualizado = output<any>();
  comentarioAgregado = output<any>();
  abrirModalComentarios = output<any>();

  cargandoLike = signal<boolean>(false);
  expandida = signal<boolean>(false);
  
  // Estados locales para los comentarios usando Signals
  nuevoComentario = signal<string>('');
  cargandoComentario = signal<boolean>(false);
  mostrarCajaComentario = signal<boolean>(false);

  get publicacionId(): string {
    return this.publicacion?._id || this.publicacion?.id;
  }

  get usuarioDioLike(): boolean {
    const likes = this.publicacion.likes || [];
    return likes.includes(this.usuarioActualId);
  }

  get esMia(): boolean {
    const autorId =
      this.publicacion.usuarioId ||
      this.publicacion.usuario?._id ||
      this.publicacion.usuario ||
      this.publicacion.autor?._id ||
      this.publicacion.autor;
    return autorId === this.usuarioActualId;
  }

  // 👇 2. Getter actualizado para verificar si es dueño O administrador
  get puedeEliminar(): boolean {
    const autorId =
      this.publicacion.usuarioId ||
      this.publicacion.usuario?._id ||
      this.publicacion.usuario ||
      this.publicacion.autor?._id ||
      this.publicacion.autor;
      
    const esDueno = autorId === this.usuarioActualId;
    const esAdmin = this.perfilUsuario === 'administrador';
    
    return esDueno || esAdmin; 
  }

  toggleLike() {
    if (this.cargandoLike() || !this.publicacionId) return;
    this.cargandoLike.set(true);

    const accion = this.usuarioDioLike
      ? this.publicacionService.quitarLike(this.publicacionId)
      : this.publicacionService.darLike(this.publicacionId);

    accion.subscribe({
      next: () => {
        let likesActuales = [...(this.publicacion.likes || [])];

        if (this.usuarioDioLike) {
          likesActuales = likesActuales.filter((id: string) => id !== this.usuarioActualId);
        } else {
          likesActuales.push(this.usuarioActualId);
        }

        this.publicacion = {
          ...this.publicacion,
          likes: likesActuales,
        };

        this.likeActualizado.emit(this.publicacion);
        this.cargandoLike.set(false);
      },
      error: (err) => {
        console.error('Error al actualizar like:', err);
        this.cargandoLike.set(false);
      },
    });
  }

  toggleExpandir() {
    this.expandida.update((v) => !v);
  }

  enviarComentario() {
    const texto = this.nuevoComentario().trim();
    if (!texto || this.cargandoComentario() || !this.publicacionId) return;

    this.cargandoComentario.set(true);

    this.publicacionService.comentarPublicacion(this.publicacionId, texto).subscribe({
      next: (pubActualizada) => {
        this.publicacion = pubActualizada; 
        this.comentarioAgregado.emit(this.publicacion);
        this.nuevoComentario.set('');
        this.cargandoComentario.set(false);
      },
      error: (err) => {
        console.error('Error al enviar el comentario:', err);
        this.cargandoComentario.set(false);
      },
    });
  }

  toggleCajaComentario() {
    this.mostrarCajaComentario.update((v) => !v);
  }
}