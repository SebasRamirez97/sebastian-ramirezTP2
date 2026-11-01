import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PublicacionService {
  private http = inject(HttpClient);
  private API_URL = 'http://localhost:3000/publicaciones'; 

  // Obtiene todas las publicaciones para el muro general
  obtenerPublicaciones(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL, {
      withCredentials: true
    });
  }

  // Obtiene únicamente las publicaciones del usuario logueado (para el perfil)
  obtenerMisPublicaciones(): Observable<any[]> {
    // Corregido: se usa `${this.API_URL}/mis-publicaciones` para evitar duplicar la ruta
    return this.http.get<any[]>(`${this.API_URL}/mis-publicaciones`, {
      withCredentials: true
    });
  }

  // Crea una nueva publicación enviando el FormData (texto + imagen)
  crearPublicacion(formData: FormData): Observable<any> {
    return this.http.post(this.API_URL, formData, {
      withCredentials: true
    });
  }
}