// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el backend responde con un 401 (Unauthorized) porque el token expiró
      if (error.status === 401) {
        console.warn('La sesión ha expirado por inactividad. Redirigiendo al login...');
        
        // Opcional: si guardas algo en localStorage o sessionStorage, puedes limpiarlo aquí
        // localStorage.removeItem('usuario');

        // Redirigimos al usuario a la vista de login (ajusta la ruta según tu app, ej: '/login')
        router.navigate(['/login']); 
      }
      return throwError(() => error);
    })
  );
};