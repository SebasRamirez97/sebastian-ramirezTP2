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
import { ResaltarHoverDirective } from '../../directives/resaltar-hover.directive';
import { SombraHoverDirective } from '../../directives/sombra-hover.directive';
import { PermisoRolDirective } from '../../directives/permiso-rol.directive';
import { CapitalizarPipe } from '../../pipes/capitalizar-pipe';
import { MinutosAHorasPipe } from '../../pipes/minutos-a-horas-pipe';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [
    CommonModule,
    ModalCrearPublicacion,
    PublicacionCard,
    FechaArgentinaPipe,
    FormsModule,
    PermisoRolDirective,
    ResaltarHoverDirective,
    SombraHoverDirective,
    CapitalizarPipe,
    MinutosAHorasPipe,
  ],
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

  // Variables / Signals para comentarios
  publicacionSeleccionada = signal<any | null>(null);
  comentariosModal = signal<any[]>([]);
  offsetComentarios = signal<number>(0);
  limitComentarios = signal<number>(3);
  hasMoreComentarios = signal<boolean>(false);
  nuevoComentarioTexto = signal<string>('');
  cargandoComentarioModal = signal<boolean>(false);

  comentarioEnEdicionId = signal<string | null>(null);
  textoEditado: string = '';

  // --- Signals para el Modal de Usuario Deshabilitado / Error de Publicación ---
  modalErrorPublicacionVisible = signal<boolean>(false);
  modalErrorPublicacionTitulo = signal<string>('Acción No Permitida');
  modalErrorPublicacionMensaje = signal<string>('');

  ngOnInit(): void {
    this.cargarUsuarioActual();
    this.cargarPublicaciones();

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

    const peticionDatos = this.publicacionService
      .obtenerPublicaciones(this.limit(), this.offset(), orden)
      .toPromise();

    const tiempoMinimo = new Promise((resolve) => setTimeout(resolve, 3000));

    Promise.all([peticionDatos, tiempoMinimo])
      .then(([data]) => {
        // 👇 Añadimos '|| []' para evitar que se asigne undefined a la señal
        this.publicaciones.set(data || []);
        this.loading.set(false);
        console.log('Se actualizaron las publicaciones:', data);
      })
      .catch((err) => {
        console.error('Error al cargar publicaciones:', err);
        this.errorMessage.set('No se pudieron cargar las publicaciones del servidor.');
        this.loading.set(false);
      });
  }

  paginaSiguiente() {
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
    const nuevoOrden = this.ordenActual() === 'fecha' ? 'likes' : 'fecha';
    this.ordenActual.set(nuevoOrden);
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
    localStorage.removeItem('token');
    localStorage.clear();

    this.userService.cerrarSesion().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      },
    });
  }

  async abrirModal(pub: any) {
    const pubId = pub._id || pub.id;
    this.publicacionSeleccionada.set(pub);
    this.offsetComentarios.set(0);
    await this.cargarComentariosModal(pubId, 0);
    this.router.navigate(['/publicaciones', pubId]);
  }

  cerrarModal() {
    this.publicacionSeleccionada.set(null);
    this.comentariosModal.set([]);
    this.router.navigate(['/publicaciones']);
  }

  async cargarComentariosModal(publicacionId: string, offset: number) {
    this.publicacionService
      .obtenerComentarios(publicacionId, this.limitComentarios(), offset)
      .subscribe({
        next: (res: any) => {
          if (offset === 0) {
            this.comentariosModal.set(res.comentarios);
          } else {
            this.comentariosModal.update((actuales) => [...actuales, ...res.comentarios]);
          }
          this.hasMoreComentarios.set(res.hasMore);
        },
        error: (err) => console.error('Error al cargar comentarios', err),
      });
  }

  async cargarMasComentarios() {
    const nuevoOffset = this.offsetComentarios() + this.limitComentarios();
    this.offsetComentarios.set(nuevoOffset);
    const pubId = this.publicacionSeleccionada()._id;
    await this.cargarComentariosModal(pubId, nuevoOffset);
  }

  async enviarComentarioModal() {
    const texto = this.nuevoComentarioTexto().trim();
    if (!texto) return;

    const pubId = this.publicacionSeleccionada()._id;
    this.cargandoComentarioModal.set(true);

    this.publicacionService.comentarPublicacion(pubId, texto).subscribe({
      next: async (res) => {
        this.nuevoComentarioTexto.set('');
        this.cargandoComentarioModal.set(false);

        this.offsetComentarios.set(0);
        await this.cargarComentariosModal(pubId, 0);

        this.publicaciones.update((pubs) =>
          pubs.map((pub) => {
            const idPubActual = pub._id || pub.id;
            if (idPubActual === pubId) {
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
        const pubId = this.publicacionSeleccionada()._id;
        this.offsetComentarios.set(0);
        await this.cargarComentariosModal(pubId, 0);
      },
      error: (err) => console.error('Error al editar comentario', err),
    });
  }

  async eliminarComentarioModal(comentarioId: string) {
    const pubId = this.publicacionSeleccionada()._id;

    this.publicacionService.eliminarComentario(comentarioId).subscribe({
      next: async () => {
        this.offsetComentarios.set(0);
        await this.cargarComentariosModal(pubId, 0);

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

  // Método que se ejecuta cuando el modal hijo emite o intenta crear
  manejarIntentoPublicacion(formData: FormData) {
    this.publicacionService.crearPublicacion(formData).subscribe({
      next: () => {
        this.cargarPublicaciones();
        // Opcional: cerrar el modal de creación si lo manejas desde el padre
      },
      error: (err) => {
        console.error('Error al crear publicación:', err);
        // Si el error es 403 o el backend indica que está deshabilitado
        if (err.status === 403 || err.error?.message?.includes('deshabilitada')) {
          this.modalErrorPublicacionTitulo.set('Cuenta Deshabilitada');
          this.modalErrorPublicacionMensaje.set(
            err.error?.message ||
              'Tu cuenta ha sido deshabilitada. No puedes realizar publicaciones.',
          );
        } else {
          this.modalErrorPublicacionTitulo.set('Error de Publicación');
          this.modalErrorPublicacionMensaje.set(
            err.error?.message || 'No se pudo crear la publicación.',
          );
        }
        this.modalErrorPublicacionVisible.set(true);
      },
    });
  }

  cerrarModalErrorPublicacion() {
    this.modalErrorPublicacionVisible.set(false);
  }
}
