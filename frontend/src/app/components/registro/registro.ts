import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InputErrorDirective } from '../../directives/input-error.directive.ts';
import { FormErrorPipe } from '../../pipes/form-error.pipe';
import { matchPasswordValidator } from '../../validators/match-password.validator';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputErrorDirective,
    FormErrorPipe
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

  // Patrón: Al menos una mayúscula y un número
  private passwordPattern = /^(?=.*[A-Z])(?=.*\d)/;

  registroForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    correo: ['', [Validators.required, Validators.email]],
    usuario: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(this.passwordPattern)]],
    repetirPassword: ['', [Validators.required]],
    fechaNacimiento: ['', [Validators.required]],
    descripcionBreve: [''],
    perfil: ['usuario', [Validators.required]] // Por defecto 'usuario', opcional 'administrador'
  }, { validators: matchPasswordValidator });

  // Manejar la selección del archivo de imagen (avatar)
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

    // Como necesitamos enviar un archivo (avatar) junto con texto, usamos FormData
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