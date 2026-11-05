import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { PublicacionService } from '../../services/publicacion.service';
import { ModalCrearPublicacion } from '../modal-crear-publicacion/modal-crear-publicacion';
import { PublicacionCard } from '../publicacion-card/publicacion-card';
import { FechaArgentinaPipe } from '../../pipes/fecha-argentina-pipe';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, ModalCrearPublicacion, PublicacionCard, FormsModule, FechaArgentinaPipe],
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

  // Variables / Signals en publicaciones.component.ts
  publicacionSeleccionada = signal<any | null>(null);
  comentariosModal = signal<any[]>([]);
  offsetComentarios = signal<number>(0);
  limitComentarios = signal<number>(3); // 👈 Empezamos trayendo de a 3 como acordamos
  hasMoreComentarios = signal<boolean>(false);
  nuevoComentarioTexto = signal<string>('');
  cargandoComentarioModal = signal<boolean>(false);
  // 📝 Estados para controlar qué comentario se está editando
  comentarioEnEdicionId = signal<string | null>(null);
  textoEditado: string = '';

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
    this.loading.set(true);
    this.ordenActual.set(orden);

    // 💡 Usamos el método específico para el perfil que ya preparaste en el servicio
    this.publicacionService.obtenerMisPublicaciones(this.limit(), this.offset(), orden).subscribe({
      next: (pubs) => {
        this.misPublicaciones.set(pubs);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar mis publicaciones:', err);
        this.loading.set(false);
      },
    });
  }

  // Alternar criterio de ordenamiento (¡Reiniciamos el offset a 0 al cambiar de orden!)
  cambiarOrden() {
    const nuevoOrden = this.ordenActual() === 'fecha' ? 'likes' : 'fecha';
    this.offset.set(0);          // 👈 Volvemos a la página 1 al ordenar distinto
    this.paginaActual.set(1);
    this.cargarMisPublicaciones(nuevoOrden);
  }

  // Métodos para cambiar de página
  paginaSiguiente() {
    if (this.misPublicaciones().length === this.limit()) {
      const nuevoOffset = this.offset() + this.limit();
      this.offset.set(nuevoOffset);
      this.paginaActual.update((p) => p + 1);
      this.cargarMisPublicaciones(); // Mantiene el ordenActual automáticamente
    }
  }

  paginaAnterior() {
    if (this.offset() > 0) {
      const nuevoOffset = Math.max(0, this.offset() - this.limit());
      this.offset.set(nuevoOffset);
      this.paginaActual.update((p) => p - 1);
      this.cargarMisPublicaciones(); // Mantiene el ordenActual automáticamente
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

  // 1. Abrir modal
  async abrirModal(pub: any) {
    this.publicacionSeleccionada.set(pub);
    this.offsetComentarios.set(0);
    await this.cargarComentariosModal(pub._id || pub.id, 0);
  }

  // 2. Cerrar modal
  cerrarModal() {
    this.publicacionSeleccionada.set(null);
    this.comentariosModal.set([]);
  }

  // 3. Cargar comentarios
  async cargarComentariosModal(publicacionId: string, offset: number) {
    this.publicacionService.obtenerComentarios(publicacionId, this.limitComentarios(), offset).subscribe({
      next: (res: any) => {
        if (offset === 0) {
          this.comentariosModal.set(res.comentarios);
        } else {
          this.comentariosModal.update(actuales => [...actuales, ...res.comentarios]);
        }
        this.hasMoreComentarios.set(res.hasMore);
      },
      error: (err) => console.error('Error al cargar comentarios', err)
    });
  }

  // 4. Cargar más
  async cargarMasComentarios() {
    const nuevoOffset = this.offsetComentarios() + this.limitComentarios();
    this.offsetComentarios.set(nuevoOffset);
    const pubId = this.publicacionSeleccionada()._id || this.publicacionSeleccionada().id;
    await this.cargarComentariosModal(pubId, nuevoOffset);
  }

  // 5. Enviar comentario
  async enviarComentarioModal() {
    const texto = this.nuevoComentarioTexto().trim();
    if (!texto) return;

    const pubId = this.publicacionSeleccionada()._id || this.publicacionSeleccionada().id;
    this.cargandoComentarioModal.set(true);

    this.publicacionService.comentarPublicacion(pubId, texto).subscribe({
      next: async (res) => {
        this.nuevoComentarioTexto.set('');
        this.cargandoComentarioModal.set(false);
        this.offsetComentarios.set(0);
        await this.cargarComentariosModal(pubId, 0);

        // Actualizar contador en la lista de mis publicaciones
        this.misPublicaciones.update(pubs => 
          pubs.map(pub => {
            const idPubActual = pub._id || pub.id;
            if (idPubActual === pubId) {
              const nuevoComentario = res.comentario || res;
              return {
                ...pub,
                comentarios: [...(pub.comentarios || []), nuevoComentario]
              };
            }
            return pub;
          })
        );
      },
      error: (err) => {
        console.error('Error al comentar', err);
        this.cargandoComentarioModal.set(false);
      }
    });
  }

  // 6. Edición de comentarios
  iniciarEdicion(com: any) {
    this.comentarioEnEdicionId.set(com._id);
    this.textoEditado = com.texto;
  }

  cancelarEdicion() {
    this.comentarioEnEdicionId.set(null);
    this.textoEditado = '';
  }

  async guardarEdicionComentario(comentarioId: string) {
    if (!this.textoEditado.trim()) return;

    this.publicacionService.editarComentario(comentarioId, this.textoEditado).subscribe({
      next: async () => {
        this.cancelarEdicion();
        const pubId = this.publicacionSeleccionada()._id || this.publicacionSeleccionada().id;
        this.offsetComentarios.set(0);
        await this.cargarComentariosModal(pubId, 0);
      },
      error: (err) => console.error('Error al editar comentario', err)
    });
  }

  // 7. Eliminar comentario
  async eliminarComentarioModal(comentarioId: string) {
    const pubId = this.publicacionSeleccionada()._id || this.publicacionSeleccionada().id;

    this.publicacionService.eliminarComentario(comentarioId).subscribe({
      next: async () => {
        this.offsetComentarios.set(0);
        await this.cargarComentariosModal(pubId, 0);

        // Actualizar contador en la lista de mis publicaciones
        this.misPublicaciones.update(pubs => 
          pubs.map(pub => {
            const idPubActual = pub._id || pub.id;
            if (idPubActual === pubId) {
              return {
                ...pub,
                comentarios: pub.comentarios.filter((c: any) => c._id !== comentarioId)
              };
            }
            return pub;
          })
        );
      },
      error: (err) => console.error('Error al eliminar comentario', err)
    });
  }
}
