// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Registro } from './components/registro/registro';
import { Publicaciones } from './components/publicaciones/publicaciones';
import { MiPerfil } from './components/mi-perfil/mi-perfil';
import { DashboardUsuariosComponent } from './components/dashboard-usuarios/dashboard-usuarios';
import { DashboardEstadisticasComponent } from './components/dashboard-estadisticas/dashboard-estadisticas'; // 👈 Importamos el componente

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'publicaciones', component: Publicaciones },
  { path: 'publicaciones/:id', component: Publicaciones },
  { path: 'mi-perfil', component: MiPerfil },
  { path: 'dashboard/usuarios', component: DashboardUsuariosComponent },
  { path: 'dashboard/estadisticas', component: DashboardEstadisticasComponent }, // 👈 Añadimos la ruta de estadísticas
  { path: '**', redirectTo: 'login' }, 
];