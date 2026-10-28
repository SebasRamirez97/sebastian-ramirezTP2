// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Registro } from './components/registro/registro';
import { Publicaciones } from './components/publicaciones/publicaciones';
import { MiPerfil } from './components/mi-perfil/mi-perfil';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'publicaciones', component: Publicaciones },
  { path: 'mi-perfil', component: MiPerfil },
  { path: '**', redirectTo: 'login' } // Comodín por si escriben una ruta inválida
];