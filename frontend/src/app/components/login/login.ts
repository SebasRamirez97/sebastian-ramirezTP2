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

  // Convertimos el estado local a Signals
  loading = signal<boolean>(false);
  showModal = signal<boolean>(false);
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

        let mensaje = 'Ocurrió un error al intentar conectar con el servidor. Inténtalo más tarde.';
        if (err.status === 401) {
          mensaje = 'Usuario o contraseña incorrectos. Por favor, verifíqualos.';
        } else if (err.error?.message) {
          mensaje = err.error.message;
        }
        
        this.modalMessage.set(mensaje);
        this.showModal.set(true);
      },
    });
  }

  closeModal() {
    this.showModal.set(false);
  }
}