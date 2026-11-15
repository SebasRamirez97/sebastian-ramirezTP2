// src/app/app.config.ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core'; // 👈 Añadir isDevMode aquí
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker'; // 👈 Añadir esta importación
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    provideHttpClient(withInterceptors([
      authInterceptor
    ]))
  ]
};