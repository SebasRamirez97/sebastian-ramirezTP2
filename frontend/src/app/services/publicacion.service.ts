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
  obtenerPublicaciones(limit: number = 1000, offset: number = 0, orden: string = 'fecha', usuarioId?: string): Observable<any[]> {
    let params: any = {
      limit: limit.toString(),
      offset: offset.toString(),
      orden: orden
    };

    if (usuarioId) {
      params.usuarioId = usuarioId;
    }

    return this.http.get<any[]>(this.API_URL, {
      withCredentials: true,
      params: params
    });
  }

  // Obtiene únicamente las publicaciones del usuario logueado (para el perfil)
  obtenerMisPublicaciones(limit: number = 3, offset: number = 0, orden: string = 'fecha'): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/mis-publicaciones`, {
      withCredentials: true,
      params: {
        limit: limit.toString(),
        offset: offset.toString(),
        orden: orden
      }
    });
  }

  // Crea una nueva publicación enviando el FormData (texto + imagen)
  crearPublicacion(formData: FormData): Observable<any> {
    return this.http.post(this.API_URL, formData, {
      withCredentials: true
    });
  }

  // Dar Me Gusta a una publicación
  darLike(id: string): Observable<any> {
    return this.http.post(`${this.API_URL}/${id}/like`, {}, {
      withCredentials: true
    });
  }

  // Quitar Me Gusta de una publicación
  quitarLike(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}/like`, {
      withCredentials: true
    });
  }

  // Baja lógica de una publicación (Eliminar)
  eliminarPublicacion(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, {
      withCredentials: true
    });
  }

  // En publicacion.service.ts
comentarPublicacion(id: string, texto: string): Observable<any> {
  return this.http.post(`${this.API_URL}/${id}/comentarios`, { texto }, {
    withCredentials: true
  });
}
}

