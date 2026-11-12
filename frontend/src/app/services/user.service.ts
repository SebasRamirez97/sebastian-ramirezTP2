import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  actualizarAvatar(formData: FormData): Observable<any> {
    return this.http.patch(`${this.API_URL}/avatar`, formData, {
      withCredentials: true
    });
  }

  cerrarSesion(): Observable<any> {
    return this.http.post(`${this.API_URL}/logout`, {}, {
      withCredentials: true
    });
  }
}