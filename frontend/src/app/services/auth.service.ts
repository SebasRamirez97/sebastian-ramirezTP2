import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs'; // 👈 Importamos 'of'
import { map, catchError } from 'rxjs/operators'; // 👈 Importamos operadores
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
  // Agregamos la URL base para el controlador de usuarios por si necesitamos consultar el perfil
  private USUARIOS_URL = `${environment.apiUrl}/usuarios`;

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
  // 👇 NUEVO MÉTODO: Valida si el token actual es correcto consultando el perfil protegido