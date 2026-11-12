import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {
  private http = inject(HttpClient);
  private API_URL = `${environment.apiUrl}/estadisticas`;

  obtenerPublicacionesPorUsuario(lapso: string): Observable<any> {
    const params = new HttpParams().set('lapso', lapso);
    return this.http.get(`${this.API_URL}/publicaciones-usuario`, { withCredentials: true, params });
  }

  obtenerComentariosEnTiempo(lapso: string): Observable<any> {
    const params = new HttpParams().set('lapso', lapso);
    return this.http.get(`${this.API_URL}/comentarios-tiempo`, { withCredentials: true, params });
  }

  obtenerComentariosPorPublicacion(lapso: string): Observable<any> {
    const params = new HttpParams().set('lapso', lapso);
    return this.http.get(`${this.API_URL}/comentarios-publicacion`, { withCredentials: true, params });
  }
}