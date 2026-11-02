import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { PublicacionService } from '../../services/publicacion.service';
import { ModalCrearPublicacion } from '../modal-crear-publicacion/modal-crear-publicacion';
import { PublicacionCard } from '../publicacion-card/publicacion-card';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, ModalCrearPublicacion, PublicacionCard],
  templateUrl: './mi-perfil.html',
  styleUrls: ['./mi-perfil.css'],
})
export class MiPerfil implements OnInit {
  private userService = inject(UserService);
  private publicacionService = inject(PublicacionService);
  private router = inject(Router);

  usuario = signal<any>(null);
  misPublicaciones = signal<any[]>([]);
  loading = signal<boolean>(true);
  subiendoAvatar = signal<boolean>(false);

  // Estados para el modal global de eliminación
  publicacionAEliminar = signal<any>(null);
  cargandoEliminacion = signal<boolean>(false);

  // Señales y variables de paginación y ordenamiento para el perfil
  limit = signal<number>(3);
  offset = signal<number>(0);
  paginaActual = signal<number>(1);
  ordenActual = signal<'fecha' | 'likes'>('fecha');

  ngOnInit(): void {
    this.cargarDatosPerfil();
  }

  cargarDatosPerfil() {
    this.loading.set(true);
    this.userService.obtenerPerfil().subscribe({
      next: (user) => {
        this.usuario.set(user);
        this.cargarMisPublicaciones();
      },
      error: () => this.loading.set(false),
    });
  }

  // Método para cargar las publicaciones propias con soporte de paginación y ordenamiento
  cargarMisPublicaciones(orden: 'fecha' | 'likes' = this.ordenActual()): void {
    const user = this.usuario();
    if (!user) return;

    this.loading.set(true);
    this.ordenActual.set(orden);

    // Si tu servicio soporta parámetros de paginación y orden directo por usuario, úsalos:
    // this.publicacionService.obtenerPublicacionesPorUsuario(user._id || user.id, this.limit(), this.offset(), orden)
    // O filtrando desde el listado general según la estructura de tu API:
    this.publicacionService.obtenerPublicaciones(this.limit(), this.offset(), orden).subscribe({
      next: (pubs) => {
        const userId = user._id || user.id;
        const propias = pubs.filter(
          (p: any) =>
            p.autor?._id === userId || p.autor === userId || p.usuarioId === userId
        );
        this.misPublicaciones.set(propias);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar publicaciones:', err);
        this.loading.set(false);
      },
    });
  }

  // Alternar criterio de ordenamiento
  cambiarOrden() {
    const nuevoOrden = this.ordenActual() === 'fecha' ? 'likes' : 'fecha';
    this.cargarMisPublicaciones(nuevoOrden);
  }

  // Métodos para cambiar de página
  paginaSiguiente() {
    if (this.misPublicaciones().length === this.limit()) {
      const nuevoOffset = this.offset() + this.limit();
      this.offset.set(nuevoOffset);
      this.paginaActual.update((p) => p + 1);
      this.cargarMisPublicaciones();
    }
  }

  paginaAnterior() {
    if (this.offset() > 0) {
      const nuevoOffset = Math.max(0, this.offset() - this.limit());
      this.offset.set(nuevoOffset);
      this.paginaActual.update((p) => p - 1);
      this.cargarMisPublicaciones();
    }
  }

  // Método que se dispara al seleccionar un archivo de imagen para el avatar
  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    this.subiendoAvatar.set(true);

    this.userService.actualizarAvatar(formData).subscribe({
      next: (userActualizado: any) => {
        this.subiendoAvatar.set(false);
        this.usuario.set(userActualizado);
      },
      error: (err) => {
        this.subiendoAvatar.set(false);
        console.error('Error al actualizar el avatar:', err);
      },
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
        this.misPublicaciones.update((pubs) => pubs.filter((p) => (p._id || p.id) !== id));
        this.cerrarConfirmacionEliminacion();
      },
      error: (err) => {
        console.error('Error al eliminar publicación:', err);
        this.cargandoEliminacion.set(false);
        this.cerrarConfirmacionEliminacion();
      },
    });
  }

  irPublicaciones() {
    this.router.navigate(['/publicaciones']);
  }

  cerrarSesion() {
    this.userService.cerrarSesion().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}