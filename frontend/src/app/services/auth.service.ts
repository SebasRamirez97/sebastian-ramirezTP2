// src/app/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginCredentials {
  identificador: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService { // <--- Asegúrate de incluir 'export' aquí
  private http = inject(HttpClient);
  private API_URL = 'http://localhost:3000/autenticacion'; // Cambia si tu puerto del backend es distinto

  login(credenciales: LoginCredentials): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, credenciales);
  }

  registrar(formData: FormData): Observable<any> {
    // Usamos FormData porque el registro incluye campos de texto y un archivo (avatar)
    return this.http.post(`${this.API_URL}/registro`, formData);
  }
}