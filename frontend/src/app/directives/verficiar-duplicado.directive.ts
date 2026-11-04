// src/app/directives/verificar-duplicado.directive.ts
import { Directive, Input, inject } from '@angular/core';
import { NG_ASYNC_VALIDATORS, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, catchError } from 'rxjs/operators';

@Directive({
  selector: '[appVerificarDuplicado]',
  standalone: true,
  providers: [{
    provide: NG_ASYNC_VALIDATORS,
    useExisting: VerificarDuplicadoDirective,
    multi: true
  }]
})
export class VerificarDuplicadoDirective {
  @Input('appVerificarDuplicado') tipoCampo: 'correo' | 'usuario' = 'correo';
  private authService = inject(AuthService);

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    const valor = control.value;
    if (!valor || control.pristine) {
      return of(null);
    }

    // Usamos valueChanges implícitamente o validamos el valor actual con debounce
    return of(valor).pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(val => {
        const obs$ = this.tipoCampo === 'correo' 
          ? this.authService.verificarDisponibilidad(val, undefined)
          : this.authService.verificarDisponibilidad(undefined, val);
        
        return obs$.pipe(
          map(res => res.disponible ? null : { duplicado: true }),
          catchError(() => of(null))
        );
      })
    );
  }
}