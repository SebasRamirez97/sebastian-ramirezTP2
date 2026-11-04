// src/app/components/registro/registro.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InputErrorDirective } from '../../directives/input-error.directive';
import { FormErrorPipe } from '../../pipes/form-error.pipe';
import { matchPasswordValidator } from '../../validators/match-password.validator';
import { VerificarDuplicadoDirective } from '../../directives/verficiar-duplicado.directive'; // 👈 Importar directiva

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputErrorDirective,
    FormErrorPipe,
    VerificarDuplicadoDirective // 👈 Agregar a imports
  ],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage: string | null = null;
  loading: boolean = false;
  selectedFile: File | null = null;

  private passwordPattern = /^(?=.*[A-Z])(?=.*\d)/;

  registroForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    correo: ['', [Validators.required, Validators.email]], // La directiva validará asíncronamente aquí
    usuario: ['', [Validators.required]],                   // Y aquí
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(this.passwordPattern)]],
    repetirPassword: ['', [Validators.required]],
    fechaNacimiento: ['', [Validators.required]],
    descripcionBreve: ['']
  }, { validators: matchPasswordValidator });

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    const formData = new FormData();
    const formValues = this.registroForm.value;

    Object.keys(formValues).forEach(key => {
      formData.append(key, formValues[key]);
    });

    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
    }

    this.authService.registrar(formData).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al registrar el usuario.';
      }
    });
  }
}