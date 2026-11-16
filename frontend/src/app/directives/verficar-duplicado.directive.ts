// src/app/directives/verificar-duplicado.directive.ts
import { Directive, Input, inject } from '@angular/core';
import { NG_ASYNC_VALIDATORS, AbstractControl, ValidationErrors, AsyncValidator } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError, first } from 'rxjs/operators';

@Directive({
  selector: '[appVerificarDuplicado]',
  standalone: true,
  providers: [{
    provide: NG_ASYNC_VALIDATORS,
    useExisting: VerificarDuplicadoDirective,
    multi: true
  }]
})
export class VerificarDuplicadoDirective implements AsyncValidator {
  @Input('appVerificarDuplicado') tipoCampo: 'correo' | 'usuario' = 'correo';
  private authService = inject(AuthService);

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    const valor = control.value;
    if (!valor || control.pristine) {
      return of(null);
    }

    const obs$ = this.tipoCampo === 'correo' 
      ? this.authService.verificarDisponibilidad(valor, undefined)
      : this.authService.verificarDisponibilidad(undefined, valor);

    // Usamos .pipe(first()) para asegurarnos de que el Observable complete 
    // y Angular sepa que la validación asíncrona terminó.
    return obs$.pipe(
      first(),
      map(res => (res.disponible ? null : { duplicado: true })),
      catchError(() => of(null))
    );
  }
}