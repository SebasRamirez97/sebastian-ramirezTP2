import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginCredentials {
  identificador: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private API_URL = `${environment.apiUrl}/autenticacion`;

  login(credenciales: LoginCredentials): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, credenciales, { withCredentials: true });
  }

  registrar(formData: FormData): Observable<any> {
    return this.http.post(`${this.API_URL}/registro`, formData);
  }

  verificarDisponibilidad(correo?: string, usuario?: string): Observable<{ disponible: boolean }> {
    let params = new HttpParams();
    if (correo) params = params.set('correo', correo);
    if (usuario) params = params.set('usuario', usuario);
    return this.http.get<{ disponible: boolean }>(`${this.API_URL}/verificar`, { params });
  }
}