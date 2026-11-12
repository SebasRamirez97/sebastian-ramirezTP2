import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PublicacionService } from '../../services/publicacion.service';
import { UserService } from '../../services/user.service';
import { ModalCrearPublicacion } from '../modal-crear-publicacion/modal-crear-publicacion';
import { InactivityService } from '../../services/inactivity.service';
import { PublicacionCard } from '../publicacion-card/publicacion-card';
import { FechaArgentinaPipe } from '../../pipes/fecha-argentina-pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule, ModalCrearPublicacion, PublicacionCard, FechaArgentinaPipe, FormsModule],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
})
export class Publicaciones implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
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
  perfilUsuario = signal<string>('');

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
    this.cargarUsuarioActual();
    this.cargarPublicaciones();

    // 👈 3. ESCUCHAR LA URL: Si la ruta tiene un ID, abrimos el modal automáticamente
    this.route.paramMap.subscribe((params) => {
      const pubId = params.get('id');
      if (pubId) {
        this.publicacionService.obtenerPublicacionPorId(pubId).subscribe({
          next: (pub) => {
            this.publicacionSeleccionada.set(pub);
            this.offsetComentarios.set(0);
            this.cargarComentariosModal(pub._id || pub.id, 0);
          },
          error: (err) => {
            console.error('No se pudo encontrar la publicación de la URL', err);
            this.router.navigate(['/publicaciones']);
          },
        });
      }
    });
  }

  cargarPublicaciones(orden: 'fecha' | 'likes' = this.ordenActual()): void {
    this.loading.set(true);
    this.ordenActual.set(orden);

    this.publicacionService.obtenerPublicaciones(this.limit(), this.offset(), orden).subscribe({
      next: (data) => {
        this.publicaciones.set(data);
        this.loading.set(false);
        console.log('Se actualizaron las publicaciones');
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

  irDashboardEstadisticas() {
    this.router.navigate(['dashboard/estadisticas']);
  }

  irDashboardUsuarios() {
    this.router.navigate(['/dashboard/usuarios']);
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
        this.perfilUsuario.set(user.perfil);
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

  // 1. Abrir el modal y hacer la carga inicial de comentarios
  async abrirModal(pub: any) {
    const pubId = pub._id || pub.id;
    this.publicacionSeleccionada.set(pub);
    this.offsetComentarios.set(0);
    await this.cargarComentariosModal(pubId, 0);

    // Cambia la URL en el navegador a /publicaciones/ID
    this.router.navigate(['/publicaciones', pubId]);
  }

  // 2. Cerrar el modal
  cerrarModal() {
    this.publicacionSeleccionada.set(null);
    this.comentariosModal.set([]);

    // Limpia la URL volviendo a /publicaciones
    this.router.navigate(['/publicaciones']);
  }

  // 3. Obtener comentarios desde el servicio con paginación
  async cargarComentariosModal(publicacionId: string, offset: number) {
    // Llamas a tu servicio que conecta con el GET /publicaciones/:id/comentarios
    this.publicacionService
      .obtenerComentarios(publicacionId, this.limitComentarios(), offset)
      .subscribe({
        next: (res: any) => {
          if (offset === 0) {
            this.comentariosModal.set(res.comentarios);
          } else {
            // Si es "cargar más", acumulamos los nuevos comentarios sin perder los anteriores
            this.comentariosModal.update((actuales) => [...actuales, ...res.comentarios]);
          }
          this.hasMoreComentarios.set(res.hasMore);
        },
        error: (err) => console.error('Error al cargar comentarios', err),
      });
  }

  // 4. Botón "Cargar más"
  async cargarMasComentarios() {
    const nuevoOffset = this.offsetComentarios() + this.limitComentarios();
    this.offsetComentarios.set(nuevoOffset);
    const pubId = this.publicacionSeleccionada()._id;
    await this.cargarComentariosModal(pubId, nuevoOffset);
  }

  // 5. Enviar un nuevo comentario desde la caja fija inferior
  // 5. Enviar un nuevo comentario desde la caja fija inferior
  async enviarComentarioModal() {
    const texto = this.nuevoComentarioTexto().trim();
    if (!texto) return;

    const pubId = this.publicacionSeleccionada()._id;
    this.cargandoComentarioModal.set(true);

    this.publicacionService.comentarPublicacion(pubId, texto).subscribe({
      next: async (res) => {
        this.nuevoComentarioTexto.set('');
        this.cargandoComentarioModal.set(false);

        // 1. Recargamos los comentarios del modal para ver el nuevo reflejado arriba
        this.offsetComentarios.set(0);
        await this.cargarComentariosModal(pubId, 0);

        // 2. Actualizamos la lista principal de publicaciones para que el contador de la tarjeta suba al instante
        this.publicaciones.update((pubs) =>
          pubs.map((pub) => {
            const idPubActual = pub._id || pub.id;
            if (idPubActual === pubId) {
              // Dependiendo de cómo devuelva tu backend el comentario creado (res o res.comentario),
              // lo agregamos al array local de comentarios de la publicación
              const nuevoComentario = res.comentario || res;
              return {
                ...pub,
                comentarios: [...(pub.comentarios || []), nuevoComentario],
              };
            }
            return pub;
          }),
        );
      },
      error: (err) => {
        console.error('Error al comentar', err);
        this.cargandoComentarioModal.set(false);
      },
    });
  }

  // Activar la edición cargando el texto actual en la variable temporal
  iniciarEdicion(com: any) {
    this.comentarioEnEdicionId.set(com._id);
    this.textoEditado = com.texto;
  }

  // Cancelar el modo edición
  cancelarEdicion() {
    this.comentarioEnEdicionId.set(null);
    this.textoEditado = '';
  }
  // 6. Editar un comentario propio
  // Guardar llamando al servicio y refrescar el modal
  async guardarEdicionComentario(comentarioId: string) {
    if (!this.textoEditado.trim()) return;

    this.publicacionService.editarComentario(comentarioId, this.textoEditado).subscribe({
      next: async () => {
        this.cancelarEdicion();
        const pubId = this.publicacionSeleccionada()._id;
        this.offsetComentarios.set(0);
        await this.cargarComentariosModal(pubId, 0);
      },
      error: (err) => console.error('Error al editar comentario', err),
    });
  }

  // 7. Eliminar un comentario propio
  async eliminarComentarioModal(comentarioId: string) {
    const pubId = this.publicacionSeleccionada()._id;

    this.publicacionService.eliminarComentario(comentarioId).subscribe({
      next: async () => {
        // 1. Recargamos los comentarios del modal (como ya lo hacías)
        this.offsetComentarios.set(0);
        await this.cargarComentariosModal(pubId, 0);

        // 2. Actualizamos la lista principal de publicaciones para que el contador de la tarjeta baje al instante
        this.publicaciones.update((pubs) =>
          pubs.map((pub) => {
            const idPubActual = pub._id || pub.id;
            if (idPubActual === pubId) {
              return {
                ...pub,
                comentarios: pub.comentarios.filter((c: any) => c._id !== comentarioId),
              };
            }
            return pub;
          }),
        );
      },
      error: (err) => console.error('Error al eliminar comentario', err),
    });
  }
  puedeEliminar(pub: any): boolean {
    const esDueno = (pub.usuario?._id || pub.usuario) === this.usuarioActualId();
    const esAdmin = this.perfilUsuario() === 'administrador';
    return esDueno || esAdmin;
  }
}
