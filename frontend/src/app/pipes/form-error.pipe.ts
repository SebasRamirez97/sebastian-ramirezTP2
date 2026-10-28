import { Pipe, PipeTransform } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

@Pipe({
  name: 'formError',
  standalone: true
})
export class FormErrorPipe implements PipeTransform {
  transform(errors: ValidationErrors | null | undefined): string {
    if (!errors) return '';

    if (errors['required']) {
      return 'Este campo es obligatorio.';
    }
    if (errors['minlength']) {
      return `Debe tener al menos ${errors['minlength'].requiredLength} caracteres.`;
    }
    if (errors['pattern']) {
      return 'La contraseña debe poseer al menos una letra mayúscula y un número.';
    }
    if (errors['email'] || errors['correo']) {
      return 'El formato del correo electrónico no es válido.';
    }
    if (errors['passwordMismatch']) {
      return 'Las contraseñas no coinciden.';
    }

    return 'Campo inválido.';
  }
}