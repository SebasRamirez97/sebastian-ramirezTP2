// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserService } from '../services/user.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  // Verificamos si el usuario tiene una sesión/token válido en el backend
  return userService.verificarToken().pipe(
    map(esValido => {
      if (esValido) {
        return true; // Permite el paso a la ruta
      } else {
        router.navigate(['/login']); // Redirige al login si no está autorizado
        return false;
      }
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};