// src/app/pages/login/login.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InputErrorDirective } from '../../directives/input-error.directive';
import { FormErrorPipe } from '../../pipes/form-error.pipe';
import { InactivityService } from '../../services/inactivity.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, InputErrorDirective, FormErrorPipe],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private inactivityService = inject(InactivityService);

  loading = signal<boolean>(false);
  
  // 🛡️ Modales separados para cada situación
  showModalCredenciales = signal<boolean>(false);
  showModalDeshabilitado = signal<boolean>(false);
  modalMessage = signal<string>('');

  loginForm: FormGroup = this.fb.group({
    identificador: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const credentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.loading.set(false);
        localStorage.setItem('token', response.token);
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Error al iniciar sesión', err);

        const mensajeServidor = err.error?.message || 'Ocurrió un error inesperado.';

        // 🛡️ Evaluamos por código HTTP limpio
        if (err.status === 403) {
          this.modalMessage.set(mensajeServidor);
          this.showModalDeshabilitado.set(true);
        } else if (err.status === 401) {
          this.modalMessage.set('La contraseña o el usuario/correo son incorrectos. Por favor, verifícalos.');
          this.showModalCredenciales.set(true);
        } else {
          this.modalMessage.set(mensajeServidor);
          this.showModalCredenciales.set(true);
        }
      },
    });
  }

  closeModal() {
    this.showModalCredenciales.set(false);
    this.showModalDeshabilitado.set(false);
  }
}