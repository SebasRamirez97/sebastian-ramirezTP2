import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  // Ajusta la URL según la ruta de tu controlador de usuarios/perfil en el backend
  private API_URL = 'http://localhost:3000/usuarios'; 

  obtenerPerfil(): Observable<any> {
    return this.http.get(`${this.API_URL}/perfil`);
  }
}