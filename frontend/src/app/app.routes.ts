// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Registro } from './components/registro/registro';
import { Publicaciones } from './components/publicaciones/publicaciones';
import { MiPerfil } from './components/mi-perfil/mi-perfil';
import { DashboardUsuariosComponent } from './components/dashboard-usuarios/dashboard-usuarios';
import { DashboardEstadisticasComponent } from './components/dashboard-estadisticas/dashboard-estadisticas';
import { StartupLoadingComponent } from './components/startup-loading/startup-loading';
import { authGuard } from './guards/auth-guard'; // 👈 Importar el guard

export const routes: Routes = [
  { path: '', component: StartupLoadingComponent },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  
  // 👇 Rutas protegidas con el Guard de Angular
  { path: 'publicaciones', component: Publicaciones, canActivate: [authGuard] },
  { path: 'publicaciones/:id', component: Publicaciones, canActivate: [authGuard] },
  { path: 'mi-perfil', component: MiPerfil, canActivate: [authGuard] },
  { path: 'dashboard/usuarios', component: DashboardUsuariosComponent, canActivate: [authGuard] },
  { path: 'dashboard/estadisticas', component: DashboardEstadisticasComponent, canActivate: [authGuard] },
  
  { path: '**', redirectTo: 'login' }, 
];