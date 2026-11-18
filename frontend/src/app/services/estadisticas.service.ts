// src/app/services/estadisticas.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // O tu ruta de entorno

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl || 'http://localhost:3000'}/estadisticas`; // Ajusta tu URL base

  obtenerPublicacionesPorUsuario(lapso?: string, inicio?: string, fin?: string): Observable<any> {
    let params = new HttpParams();
    if (lapso) params = params.set('lapso', lapso);
    if (inicio) params = params.set('fechaInicio', inicio);
    if (fin) params = params.set('fechaFin', fin);

    return this.http.get(`${this.apiUrl}/publicaciones-usuario`, { params });
  }

  obtenerComentariosEnTiempo(lapso?: string, inicio?: string, fin?: string): Observable<any> {
    let params = new HttpParams();
    if (lapso) params = params.set('lapso', lapso);
    if (inicio) params = params.set('fechaInicio', inicio);
    if (fin) params = params.set('fechaFin', fin);

    return this.http.get(`${this.apiUrl}/comentarios-tiempo`, { params });
  }

  obtenerComentariosPorPublicacion(lapso?: string, inicio?: string, fin?: string): Observable<any> {
    let params = new HttpParams();
    if (lapso) params = params.set('lapso', lapso);
    if (inicio) params = params.set('fechaInicio', inicio);
    if (fin) params = params.set('fechaFin', fin);

    return this.http.get(`${this.apiUrl}/comentarios-publicacion`, { params });
  }
}