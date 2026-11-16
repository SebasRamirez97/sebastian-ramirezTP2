import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { UserService } from '../../services/user.service';
import { VerificarDuplicadoDirective } from '../../directives/verficar-duplicado.directive';
import { InputErrorDirective } from '../../directives/input-error.directive';
import { matchPasswordValidator } from '../../validators/match-password.validator';
import { FormErrorPipe } from '../../pipes/form-error.pipe';

@Component({
  selector: 'app-dashboard-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, VerificarDuplicadoDirective, InputErrorDirective, FormErrorPipe],
  templateUrl: './dashboard-usuarios.html',
  styleUrls: ['./dashboard-usuarios.css']
})
export class DashboardUsuariosComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private API_URL = `${environment.apiUrl}/usuarios`;
  usuarioActualId = signal<string>('');
  private router = inject(Router);
  private userService = inject(UserService);

  usuarios = signal<any[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  // Signals para manejar Modales personalizados (sin alert ni confirm)
  modalVisible = signal<boolean>(false);
  modalTitulo = signal<string>('');
  modalMensaje = signal<string>('');
  modalEsConfirmacion = signal<boolean>(false);
  private accionConfirmadaCallback: (() => void) | null = null;

  private passwordPattern = /^(?=.*[A-Z])(?=.*\d)/;
  formRegistroAdmin: FormGroup;

  constructor() {
    this.formRegistroAdmin = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      usuario: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(this.passwordPattern)]],
      repetirPassword: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      descripcionBreve: [''],
      perfil: ['usuario', Validators.required]
    }, { validators: matchPasswordValidator });
  }

  ngOnInit(): void {
    this.cargarUsuarioActual();
    this.cargarUsuarios();
  }

  // --- Helpers de Modales ---
  abrirModalInfo(titulo: string, mensaje: string) {
    this.modalTitulo.set(titulo);
    this.modalMensaje.set(mensaje);
    this.modalEsConfirmacion.set(false);
    this.accionConfirmadaCallback = null;
    this.modalVisible.set(true);
  }

  abrirModalConfirmacion(titulo: string, mensaje: string, onConfirm: () => void) {
    this.modalTitulo.set(titulo);
    this.modalMensaje.set(mensaje);
    this.modalEsConfirmacion.set(true);
    this.accionConfirmadaCallback = onConfirm;
    this.modalVisible.set(true);
  }

  confirmarAccionModal() {
    this.modalVisible.set(false);
    if (this.accionConfirmadaCallback) {
      this.accionConfirmadaCallback();
      this.accionConfirmadaCallback = null;
    }
  }

  cerrarModal() {
    this.modalVisible.set(false);
    this.accionConfirmadaCallback = null;
  }

  // --- Lógica de Usuarios ---
  cargarUsuarioActual(): void {
    this.userService.obtenerPerfil().subscribe({
      next: (user: any) => {
        this.usuarioActualId.set(user._id || user.id);
      },
      error: (err) => console.error('Error al obtener usuario actual:', err),
    });
  }

  cargarUsuarios() {
    this.loading.set(true);
    this.http.get<any[]>(this.API_URL, { withCredentials: true }).subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.errorMessage.set('No se pudo cargar el listado de usuarios.');
        this.loading.set(false);
      }
    });
  }

  crearUsuario() {
    if (this.formRegistroAdmin.invalid) {
      this.formRegistroAdmin.markAllAsTouched();
      return;
    }

    this.http.post(this.API_URL, this.formRegistroAdmin.value, { withCredentials: true }).subscribe({
      next: () => {
        this.formRegistroAdmin.reset({ perfil: 'usuario' });
        this.cargarUsuarios();
        this.abrirModalInfo('¡Usuario Creado!', 'El usuario ha sido registrado correctamente en el sistema.');
      },
      error: (err) => {
        console.error('Error al crear usuario:', err);
        this.abrirModalInfo('Error de Registro', err.error?.message || 'No se pudo registrar el usuario.');
      }
    });
  }

  hacerAdministrador(id: string) {
    this.abrirModalConfirmacion(
      'Otorgar Permisos',
      '¿Estás seguro de otorgar permisos de Administrador a este usuario?',
      () => {
        this.http.patch(`${this.API_URL}/${id}/perfil`, { perfil: 'administrador' }, { withCredentials: true }).subscribe({
          next: () => this.cargarUsuarios(),
          error: (err) => {
            console.error('Error al cambiar rol:', err);
            this.abrirModalInfo('Error', err.error?.message || 'No se pudo actualizar el rol del usuario.');
          }
        });
      }
    );
  }
  
  hacerUsuario(id: string) {
    if (id === this.usuarioActualId()) {
      this.abrirModalInfo('Acción No Permitida', 'No puedes quitarte tus propios permisos de administrador.');
      return;
    }
    
    this.abrirModalConfirmacion(
      'Quitar Permisos',
      '¿Estás seguro de quitar permisos de Administrador a este usuario?',
      () => {
        this.http.patch(`${this.API_URL}/${id}/perfil`, { perfil: 'usuario' }, { withCredentials: true }).subscribe({
          next: () => this.cargarUsuarios(),
          error: (err) => {
            console.error('Error al cambiar rol:', err);
            this.abrirModalInfo('Error', err.error?.message || 'No se pudo actualizar el rol del usuario.');
          }
        });
      }
    );
  }

  deshabilitarUsuario(id: string) {
    // Protección para evitar auto-deshabilitación
    if (id === this.usuarioActualId()) {
      this.abrirModalInfo('Acción No Permitida', 'No puedes deshabilitar tu propia cuenta mientras tienes la sesión iniciada.');
      return;
    }

    this.abrirModalConfirmacion(
      'Deshabilitar Usuario',
      '¿Estás seguro de deshabilitar a este usuario? No podrá iniciar sesión hasta que sea rehabilitado.',
      () => {
        this.http.delete(`${this.API_URL}/${id}`, { withCredentials: true }).subscribe({
          next: () => this.cargarUsuarios(),
          error: (err) => {
            console.error('Error al deshabilitar usuario:', err);
            this.abrirModalInfo('Error', err.error?.message || 'No se pudo deshabilitar al usuario.');
          }
        });
      }
    );
  }

  rehabilitarUsuario(id: string) {
    this.abrirModalConfirmacion(
      'Rehabilitar Usuario',
      '¿Deseas volver a habilitar el acceso para este usuario?',
      () => {
        this.http.patch(`${this.API_URL}/${id}/activar`, {}, { withCredentials: true }).subscribe({
          next: () => this.cargarUsuarios(),
          error: (err) => {
            console.error('Error al rehabilitar usuario:', err);
            this.abrirModalInfo('Error', err.error?.message || 'No se pudo rehabilitar al usuario.');
          }
        });
      }
    );
  }

  // Navegación
  irPublicaciones() { this.router.navigate(['/publicaciones']); }
  irMiPerfil() { this.router.navigate(['/mi-perfil']); }
  irDashboardEstadisticas() { this.router.navigate(['dashboard/estadisticas']); }

  cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.clear();

    this.userService.cerrarSesion().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
