// src/app/app.config.ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // <--- 1. Importamos HttpClient e interceptores
import { routes } from './app.routes';
import { credentialsInterceptor } from './interceptors/credentials.interceptor'; // <--- 2. Importamos tu interceptor de cookies

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor])) // <--- 3. Añadimos esto para habilitar peticiones HTTP y el envío automático de cookies
  ]
};