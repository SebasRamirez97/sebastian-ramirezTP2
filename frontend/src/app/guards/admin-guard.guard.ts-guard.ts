// src/app/guards/admin-guard.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.obtenerPerfil().pipe(
    map((user: any) => {
      // Verificamos si el usuario está activo y si su perfil es de administrador
      const estaActivo = user && user.activo !== false;
      const esAdmin = user && user.perfil === 'administrador';

      if (estaActivo && esAdmin) {
        return true; // Permitir el acceso
      } else {
        // Redirigir inmediatamente a publicaciones si no cumple
        router.navigate(['/publicaciones']);
        return false;
      }
    }),
    catchError(() => {
      // Si ocurre un error al obtener el perfil, redirigir por seguridad
      router.navigate(['/publicaciones']);
      return of(false);
    })
  );
};