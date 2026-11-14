import { Component, inject } from '@angular/core';
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

  errorMessage: string | null = null;
  loading: boolean = false;

  // Regex: Al menos 8 caracteres, una letra mayúscula y un número
  private passwordPattern = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  loginForm: FormGroup = this.fb.group({
    identificador: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.pattern(this.passwordPattern)]],
  });

  // En tu login.component.ts
  onSubmit() {
    if (this.loginForm.invalid) return;

    // 1. Aquí defines o extraes los datos del formulario (ej: this.loginForm.value)
    const credentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        // 2. Guardamos el token en localStorage para que el interceptor lo use
        localStorage.setItem('token', response.token);

        console.log('Inicio de sesión exitoso');
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        console.error('Error al iniciar sesión', err);
      },
    });
  }
}
