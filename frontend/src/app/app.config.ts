// src/app/app.config.ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { credentialsInterceptor } from './interceptors/credentials.interceptor';
import { authInterceptor } from './interceptors/auth.interceptor'; // <--- 1. Importa tu nuevo interceptor

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([
      credentialsInterceptor, // 2. Primero añade las credenciales/cookies
      authInterceptor         // 3. Luego intercepta los errores 401 para redirigir al login
    ]))
  ]
};