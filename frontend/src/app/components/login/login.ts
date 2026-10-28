import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InputErrorDirective } from '../../directives/input-error.directive.ts';
import { FormErrorPipe } from '../../pipes/form-error.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink, 
    InputErrorDirective, 
    FormErrorPipe
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage: string | null = null;
  loading: boolean = false;

  // Regex: Al menos 8 caracteres, una letra mayúscula y un número
  private passwordPattern = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  loginForm: FormGroup = this.fb.group({
    identificador: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.pattern(this.passwordPattern)]]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Credenciales incorrectas o error en el servidor.';
      }
    });
  }
}