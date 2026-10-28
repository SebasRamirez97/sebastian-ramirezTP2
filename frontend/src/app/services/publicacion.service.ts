import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PublicacionService {
  private http = inject(HttpClient);
  // Ajusta la URL según la ruta de tu controlador de publicaciones en el backend
  private API_URL = 'http://localhost:3000/publicaciones'; 

  obtenerPublicaciones(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }

  crearPublicacion(formData: FormData): Observable<any> {
    return this.http.post(this.API_URL, formData);
  }
}