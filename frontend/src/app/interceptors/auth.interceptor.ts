// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Si la petición es de autenticación (login/registro), no aplicamos la lógica de 401 global
  if (req.url.includes('/autenticacion/')) {
    return next(req);
  }

  const token = localStorage.getItem('token');
  let authReq = req;
  
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn(`Error 401 en [${req.url}]. Limpiando token y redirigiendo...`);
        localStorage.removeItem('token');
        router.navigate(['/login']); 
      }
      return throwError(() => error);
    })
  );
};