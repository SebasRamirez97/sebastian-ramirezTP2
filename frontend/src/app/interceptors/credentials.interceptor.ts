// src/app/interceptors/credentials.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Clonamos la petición y le activamos withCredentials en true de forma global
  const clonedRequest = req.clone({
    withCredentials: true,
  });
  return next(clonedRequest);
};