import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private API_URL = `${environment.apiUrl}/usuarios`; 

  obtenerPerfil(): Observable<any> {
    return this.http.get(`${this.API_URL}/perfil`, {
      withCredentials: true
    });
  }

  // 👇 Nuevo método para verificar si el token actual sigue siendo válido
  verificarToken(): Observable<boolean> {
    return this.obtenerPerfil().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  actualizarAvatar(formData: FormData): Observable<any> {
    return this.http.patch(`${this.API_URL}/avatar`, formData, {
      withCredentials: true
    });
  }

  // En src/app/services/user.service.ts
// src/app/services/user.service.ts
cerrarSesion(): Observable<any> {
  // 🧹 1. Borramos inmediatamente el token del almacenamiento local del navegador
  localStorage.removeItem('token');
  localStorage.clear(); // Limpia cualquier otro dato residual si lo hubiera

  // 2. Opcional: Llamamos al backend para limpiar la cookie HttpOnly
  return this.http.post(`${environment.apiUrl}/autenticacion/logout`, {}, {
    withCredentials: true
  });
}
}