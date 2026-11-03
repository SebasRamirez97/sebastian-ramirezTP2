import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicacionService } from '../../services/publicacion.service';
import { UserService } from '../../services/user.service';
import { ModalCrearPublicacion } from '../modal-crear-publicacion/modal-crear-publicacion';
import { InactivityService } from '../../services/inactivity.service';
import { PublicacionCard } from '../publicacion-card/publicacion-card';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule, ModalCrearPublicacion, PublicacionCard],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
})
export class Publicaciones implements OnInit {
  private router = inject(Router);
  private publicacionService = inject(PublicacionService);
  private userService = inject(UserService);
  private inactivityService = inject(InactivityService);

  // Definición de estados con Signals
  publicaciones = signal<any[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  // Signal para controlar el modal de creación estilo Facebook
  modalCrearAbierto = signal<boolean>(false);

  // Estados para el modal global de eliminación
  publicacionAEliminar = signal<any>(null);
  cargandoEliminacion = signal<boolean>(false);

  ordenActual = signal<'fecha' | 'likes'>('fecha');
  limit = signal<number>(5);
  offset = signal<number>(0);
  paginaActual = signal<number>(1);
  totalPublicaciones = signal<number>(0);
  usuarioActualId = signal<string>('');

  ngOnInit(): void {
    this.cargarUsuarioActual();
    this.cargarPublicaciones();
  }

  cargarPublicaciones(orden: 'fecha' | 'likes' = this.ordenActual()): void {
    this.loading.set(true);
    this.ordenActual.set(orden);

    this.publicacionService.obtenerPublicaciones(this.limit(), this.offset(), orden).subscribe({
      next: (data) => {
        this.publicaciones.set(data);
        this.loading.set(false);
        console.log("Se actualizaron las publicaciones");
        console.log(data);
      },
      error: (err) => {
        this.errorMessage.set('No se pudieron cargar las publicaciones del servidor.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  // Métodos para cambiar de página
  paginaSiguiente() {
    // Solo avanzamos si hay suficientes publicaciones para llenar la página
    if (this.publicaciones().length === this.limit()) {
      const nuevoOffset = this.offset() + this.limit();
      this.offset.set(nuevoOffset);
      this.paginaActual.update((p) => p + 1);
      this.cargarPublicaciones();
    }
  }

  paginaAnterior() {
    if (this.offset() > 0) {
      const nuevoOffset = Math.max(0, this.offset() - this.limit());
      this.offset.set(nuevoOffset);
      this.paginaActual.update((p) => p - 1);
      this.cargarPublicaciones();
    }
  }

  // Métodos para manejar el modal de creación
  abrirModalCrear(): void {
    this.modalCrearAbierto.set(true);
  }

  cerrarModalCrear(): void {
    this.modalCrearAbierto.set(false);
  }

  handlePublicacionExitosa(): void {
    this.cerrarModalCrear();
    this.cargarPublicaciones();
  }

  irMiPerfil(): void {
    this.router.navigate(['/mi-perfil']);
  }

  cambiarOrden() {
    // Alternamos entre fecha y likes
    const nuevoOrden = this.ordenActual() === 'fecha' ? 'likes' : 'fecha';
    this.ordenActual.set(nuevoOrden);

    // Llamamos a tu método que recarga las publicaciones enviando el nuevo parámetro de orden
    this.cargarPublicaciones(nuevoOrden);
  }

  cargarUsuarioActual(): void {
    this.userService.obtenerPerfil().subscribe({
      next: (user: any) => {
        this.usuarioActualId.set(user._id || user.id);
      },
      error: (err) => console.error('Error al obtener usuario actual:', err),
    });
  }

  // Métodos para el Modal Global de Eliminación
  abrirConfirmacionEliminacion(pub: any): void {
    this.publicacionAEliminar.set(pub);
  }

  cerrarConfirmacionEliminacion(): void {
    this.publicacionAEliminar.set(null);
  }

  confirmarEliminacionGlobal(): void {
    const pub = this.publicacionAEliminar();
    if (!pub || this.cargandoEliminacion()) return;

    const id = pub._id || pub.id;
    this.cargandoEliminacion.set(true);

    this.publicacionService.eliminarPublicacion(id).subscribe({
      next: () => {
        this.cargandoEliminacion.set(false);
        // Filtramos la publicación eliminada de la lista local
        this.publicaciones.update((pubs) => pubs.filter((p) => (p._id || p.id) !== id));
        this.cerrarConfirmacionEliminacion();
      },
      error: (err) => {
        console.error('Error al eliminar publicación:', err);
        this.cargandoEliminacion.set(false);
        this.cerrarConfirmacionEliminacion();
      },
    });
  }

  cerrarSesion() {
    this.userService.cerrarSesion().subscribe({
      next: () => {
        this.inactivityService.detenerMonitoreo();
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        console.error('Error al cerrar sesión', err);
        this.inactivityService.detenerMonitoreo();
        this.router.navigate(['/login']);
      },
    });
  }
}
