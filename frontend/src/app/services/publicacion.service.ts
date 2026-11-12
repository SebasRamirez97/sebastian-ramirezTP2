import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PublicacionService {
  private http = inject(HttpClient);
  private API_URL = `${environment.apiUrl}/publicaciones`; 

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

  obtenerPublicacionPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}`, {
      withCredentials: true
    });
  }

  crearPublicacion(formData: FormData): Observable<any> {
    return this.http.post(this.API_URL, formData, {
      withCredentials: true
    });
  }

  darLike(id: string): Observable<any> {
    return this.http.post(`${this.API_URL}/${id}/like`, {}, {
      withCredentials: true
    });
  }

  quitarLike(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}/like`, {
      withCredentials: true
    });
  }

  eliminarPublicacion(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, {
      withCredentials: true
    });
  }

  comentarPublicacion(id: string, texto: string): Observable<any> {
    return this.http.post(`${this.API_URL}/${id}/comentarios`, { texto }, {
      withCredentials: true
    });
  }

  obtenerComentarios(id: string, limit: number = 3, offset: number = 0): Observable<any> {
    return this.http.get(`${this.API_URL}/${id}/comentarios`, {
      withCredentials: true,
      params: {
        limit: limit.toString(),
        offset: offset.toString()
      }
    });
  }

  editarComentario(comentarioId: string, texto: string): Observable<any> {
    return this.http.put(`${this.API_URL}/comentarios/${comentarioId}`, { texto }, {
      withCredentials: true
    });
  }

  eliminarComentario(comentarioId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/comentarios/${comentarioId}`, {
      withCredentials: true
    });
  }
}