import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { PublicacionService } from '../../services/publicacion.service';
import { ModalCrearPublicacion } from '../modal-crear-publicacion/modal-crear-publicacion';
import { PublicacionCard } from '../publicacion-card/publicacion-card';
import { FechaArgentinaPipe } from '../../pipes/fecha-argentina-pipe';
import { FormsModule } from '@angular/forms';
import { ResaltarHoverDirective } from '../../directives/resaltar-hover.directive';
import { SombraHoverDirective } from '../../directives/sombra-hover.directive';
import { PermisoRolDirective } from '../../directives/permiso-rol.directive';
import { CapitalizarPipe } from '../../pipes/capitalizar-pipe';
import { MinutosAHorasPipe } from '../../pipes/minutos-a-horas-pipe';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ModalCrearPublicacion,
    PublicacionCard,
    FormsModule,
    FechaArgentinaPipe,
    PermisoRolDirective,
    ResaltarHoverDirective,
    SombraHoverDirective,
    CapitalizarPipe,
    MinutosAHorasPipe,
  ],
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

  // Variables / Signals para comentarios
  publicacionSeleccionada = signal<any | null>(null);
  comentariosModal = signal<any[]>([]);
  offsetComentarios = signal<number>(0);
  limitComentarios = signal<number>(3);
  hasMoreComentarios = signal<boolean>(false);
  nuevoComentarioTexto = signal<string>('');
  cargandoComentarioModal = signal<boolean>(false);

  // Estados para controlar qué comentario se está editando
  comentarioEnEdicionId = signal<string | null>(null);
  textoEditado: string = '';

  usuarioActualId = signal<string>('');
  perfilUsuario = signal<string>('');

  // --- Signals para el Modal de Usuario Deshabilitado / Error de Publicación ---
  modalErrorPublicacionVisible = signal<boolean>(false);
  modalErrorPublicacionTitulo = signal<string>('Acción No Permitida');
  modalErrorPublicacionMensaje = signal<string>('');

  // --- Signals para el Modal de Restricciones Genéricas ---
  modalRestriccionVisible = signal<boolean>(false);
  modalRestriccionTitulo = signal<string>('');
  modalRestriccionMensaje = signal<string>('');

  ngOnInit(): void {
    this.cargarUsuarioActual();
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

  cargarUsuarioActual(): void {
    this.userService.obtenerPerfil().subscribe({
      next: (user: any) => {
        this.usuarioActualId.set(user._id || user.id);
        this.perfilUsuario.set(user.perfil);
      },
      error: (err) => console.error('Error al obtener usuario actual:', err),
    });
  }

  cargarMisPublicaciones(orden: 'fecha' | 'likes' = this.ordenActual()): void {
    this.loading.set(true);
    this.ordenActual.set(orden);

    const peticionDatos = this.publicacionService
      .obtenerMisPublicaciones(this.limit(), this.offset(), orden)
      .toPromise();

    const tiempoMinimo = new Promise((resolve) => setTimeout(resolve, 3000));

    Promise.all([peticionDatos, tiempoMinimo])
      .then(([pubs]) => {
        this.misPublicaciones.set(pubs || []);
        this.loading.set(false);
      })
      .catch((err) => {
        console.error('Error al cargar mis publicaciones:', err);
        this.loading.set(false);
      });
  }

  cambiarOrden() {
    const nuevoOrden = this.ordenActual() === 'fecha' ? 'likes' : 'fecha';
    this.offset.set(0);
    this.paginaActual.set(1);
    this.cargarMisPublicaciones(nuevoOrden);
  }

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

  abrirConfirmacionEliminacion(pub: any): void {
    this.publicacionAEliminar.set(pub);
  }

  cerrarConfirmacionEliminacion(): void {
    this.publicacionAEliminar.set(null);
  }

  abrirModalRestriccion(titulo: string, mensaje: string) {
    this.modalRestriccionTitulo.set(titulo);
    this.modalRestriccionMensaje.set(mensaje);
    this.modalRestriccionVisible.set(true);
  }

  cerrarModalRestriccion() {
    this.modalRestriccionVisible.set(false);
  }

  // 🛠️ Helper centralizado para extraer el mensaje de error de Angular / NestJS
  private extraerMensajeError(err: any): string {
    if (typeof err.error === 'string') return err.error;
    if (err.error?.message) {
      if (typeof err.error.message === 'string') return err.error.message;
      if (Array.isArray(err.error.message)) return err.error.message.join(', ');
    }
    return err.message || '';
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
        this.cargandoEliminacion.set(false);
        this.cerrarConfirmacionEliminacion();
        
        const errorMsg = this.extraerMensajeError(err);
        
        if (errorMsg.includes('CUENTA_INHABILITADA') || (err.status === 403 && errorMsg.includes('deshabilitada'))) {
          this.abrirModalRestriccion('🚫 Cuenta Deshabilitada', 'Tu cuenta ha sido inhabilitada. No tienes permisos para eliminar publicaciones.');
        } else if (errorMsg.includes('ROL_INSUFICIENTE_PUBLICACION') || err.status === 403) {
          this.abrirModalRestriccion('⚠️ Permiso Denegado', 'Una cuenta con perfil de usuario no puede eliminar publicaciones ajenas.');
        } else {
          this.abrirModalRestriccion('❌ Error', errorMsg || 'No se pudo eliminar la publicación.');
        }
      },
    });
  }

  irPublicaciones() {
    this.router.navigate(['/publicaciones']);
  }

  irDashboardUsuarios() {
    this.router.navigate(['/dashboard/usuarios']);
  }

  irDashboardEstadisticas() {
    this.router.navigate(['dashboard/estadisticas']);
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
    this.publicacionSeleccionada.set(pub);
    this.offsetComentarios.set(0);
    await this.cargarComentariosModal(pub._id || pub.id, 0);
  }

  cerrarModal() {
    this.publicacionSeleccionada.set(null);
    this.comentariosModal.set([]);
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
    const pubId = this.publicacionSeleccionada()._id || this.publicacionSeleccionada().id;
    await this.cargarComentariosModal(pubId, nuevoOffset);
  }

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

        this.misPublicaciones.update((pubs) =>
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
        this.cargandoComentarioModal.set(false);
        const errorMsg = this.extraerMensajeError(err);
        
        if (errorMsg.includes('CUENTA_INHABILITADA') || err.status === 403) {
          this.abrirModalRestriccion('🚫 Cuenta Deshabilitada', 'Tu cuenta se encuentra inhabilitada. No puedes realizar comentarios.');
        } else {
          this.abrirModalRestriccion('❌ Error', errorMsg || 'No se pudo enviar el comentario.');
        }
      },
    });
  }

  // 🛡️ Validador seguro para comparar el autor del comentario con el usuario logueado
  esDuenoComentario(com: any): boolean {
    const autorId = com.autor?._id || com.autor?.id || com.autor;
    return autorId === this.usuarioActualId();
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
        const pubId = this.publicacionSeleccionada()._id || this.publicacionSeleccionada().id;
        this.offsetComentarios.set(0);
        await this.cargarComentariosModal(pubId, 0);
      },
      error: (err) => {
        const errorMsg = this.extraerMensajeError(err);
        if (errorMsg.includes('CUENTA_INHABILITADA') || err.status === 403) {
          this.abrirModalRestriccion('🚫 Cuenta Deshabilitada', 'Las cuentas inhabilitadas no pueden editar comentarios.');
        } else {
          this.abrirModalRestriccion('❌ Error', errorMsg || 'No se pudo editar el comentario.');
        }
      },
    });
  }

  async eliminarComentarioModal(comentarioId: string) {
    const pubId = this.publicacionSeleccionada()._id || this.publicacionSeleccionada().id;

    this.publicacionService.eliminarComentario(comentarioId).subscribe({
      next: async () => {
        this.offsetComentarios.set(0);
        await this.cargarComentariosModal(pubId, 0);

        this.misPublicaciones.update((pubs) =>
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
      error: (err) => {
        const errorMsg = this.extraerMensajeError(err);
        if (errorMsg.includes('CUENTA_INHABILITADA') || (err.status === 403 && errorMsg.includes('deshabilitada'))) {
          this.abrirModalRestriccion('🚫 Cuenta Deshabilitada', 'Las cuentas inhabilitadas no pueden eliminar comentarios.');
        } else if (errorMsg.includes('ROL_INSUFICIENTE_COMENTARIO') || err.status === 403) {
          this.abrirModalRestriccion('⚠️ Permiso Denegado', 'Una cuenta con perfil de usuario no puede eliminar comentarios que no son suyos.');
        } else {
          this.abrirModalRestriccion('❌ Error', errorMsg || 'No se pudo eliminar el comentario.');
        }
      },
    });
  }

  manejarIntentoPublicacion(formData: FormData) {
    this.publicacionService.crearPublicacion(formData).subscribe({
      next: () => {
        this.cargarMisPublicaciones();
      },
      error: (err) => {
        console.error('Error al crear publicación:', err);
        const errorMsg = this.extraerMensajeError(err);
        
        if (err.status === 403 || errorMsg.includes('deshabilitada') || errorMsg.includes('CUENTA_INHABILITADA')) {
          this.modalErrorPublicacionTitulo.set('Cuenta Deshabilitada');
          this.modalErrorPublicacionMensaje.set(
            errorMsg || 'Tu cuenta ha sido deshabilitada. No puedes realizar publicaciones.',
          );
        } else {
          this.modalErrorPublicacionTitulo.set('Error de Publicación');
          this.modalErrorPublicacionMensaje.set(
            errorMsg || 'No se pudo crear la publicación.',
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
