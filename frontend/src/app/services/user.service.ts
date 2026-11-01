import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private API_URL = 'http://localhost:3000/usuarios'; 

  obtenerPerfil(): Observable<any> {
    return this.http.get(`${this.API_URL}/perfil`, {
      withCredentials: true
    });
  }

  actualizarAvatar(formData: FormData): Observable<any> {
    return this.http.patch(`${this.API_URL}/avatar`, formData, {
      withCredentials: true // Importante si manejas la sesión por cookies
    });
  }

  // <--- Asegúrate de que este método esté guardado en user.service.ts
  cerrarSesion(): Observable<any> {
    return this.http.post(`${this.API_URL}/logout`, {}, {
      withCredentials: true
    });
  }
}