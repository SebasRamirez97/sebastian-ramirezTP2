import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-dashboard-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard-usuarios.html',
  styleUrls: ['./dashboard-usuarios.css']
})
export class DashboardUsuariosComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private API_URL = `${environment.apiUrl}/usuarios`; // 👈 Correcto: apunta a /usuarios
  usuarioActualId = signal<string>('');
  private router = inject(Router);
  private userService = inject(UserService);

  usuarios = signal<any[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  
  formRegistroAdmin: FormGroup;

  constructor() {
    this.formRegistroAdmin = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      usuario: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      perfil: ['usuario', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarUsuarioActual();
    this.cargarUsuarios();
  }

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
    if (this.formRegistroAdmin.invalid) return;

    this.http.post(this.API_URL, this.formRegistroAdmin.value, { withCredentials: true }).subscribe({
      next: () => {
        this.formRegistroAdmin.reset({ perfil: 'usuario' });
        this.cargarUsuarios();
      },
      error: (err) => {
        console.error('Error al crear usuario:', err);
        alert(err.error?.message || 'Error al registrar el usuario.');
      }
    });
  }
  hacerAdministrador(id: string) {
    if (!confirm('¿Estás seguro de otorgar permisos de Administrador a este usuario?')) return;

    this.http.patch(`${this.API_URL}/${id}/perfil`, { perfil: 'administrador' }, { withCredentials: true }).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err) => {
        console.error('Error al cambiar rol:', err);
        alert(err.error?.message || 'No se pudo actualizar el rol del usuario.');
      }
    });
  }
  
  hacerUsuario(id: string) {
    if (id === this.usuarioActualId()) {
      alert('Acción no permitida: No puedes quitarte tus propios permisos de administrador.');
      return;
    }
    
    if (!confirm('¿Estás seguro de quitar permisos de Administrador a este usuario?')) return;

    this.http.patch(`${this.API_URL}/${id}/perfil`, { perfil: 'usuario' }, { withCredentials: true }).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err) => {
        console.error('Error al cambiar rol:', err);
        alert(err.error?.message || 'No se pudo actualizar el rol del usuario.');
      }
    });
  }
  deshabilitarUsuario(id: string) {
    if (!confirm('¿Estás seguro de deshabilitar a este usuario? No podrá iniciar sesión.')) return;

    this.http.delete(`${this.API_URL}/${id}`, { withCredentials: true }).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err) => console.error('Error al deshabilitar usuario:', err)
    });
  }

  rehabilitarUsuario(id: string) {
    this.http.patch(`${this.API_URL}/${id}/activar`, {}, { withCredentials: true }).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err) => console.error('Error al rehabilitar usuario:', err)
    });
  }

  // Métodos de navegación de la barra superior
  irPublicaciones() {
    this.router.navigate(['/publicaciones']);
  }

  irMiPerfil() {
    this.router.navigate(['/mi-perfil']); // Ajusta la ruta de tu perfil si es distinta
  }

  irDashboardEstadisticas() {
    this.router.navigate(['dashboard/estadisticas']);
  }

  cerrarSesion() {
    this.userService.cerrarSesion().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error al cerrar sesión:', err);
        this.router.navigate(['/login']);
      }
    });
  }
}