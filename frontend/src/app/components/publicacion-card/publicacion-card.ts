import { Component, Input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicacionService } from '../../services/publicacion.service';
import { FechaArgentinaPipe } from '../../pipes/fecha-argentina-pipe';
import { SaltoLineaPipe } from '../../pipes/salto-linea-pipe';

@Component({
  selector: 'app-publicacion-card',
  standalone: true,
  imports: [CommonModule, FechaArgentinaPipe, SaltoLineaPipe],
  templateUrl: './publicacion-card.html',
  styleUrls: ['./publicacion-card.css'],
})
export class PublicacionCard {
  private publicacionService = inject(PublicacionService);

  @Input({ required: true }) publicacion: any;
  @Input({ required: true }) usuarioActualId!: string;

  // Eventos para el padre
  publicacionEliminada = output<string>();
  solicitarEliminacion = output<any>(); // 👈 Nuevo evento para invocar el modal global
  likeActualizado = output<any>();

  cargandoLike = signal<boolean>(false);
  expandida = signal<boolean>(false);

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
  this.expandida.update(v => !v);
}
}