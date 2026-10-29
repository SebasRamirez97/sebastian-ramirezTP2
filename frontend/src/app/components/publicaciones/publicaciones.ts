import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicacionService } from '../../services/publicacion.service';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css'
})
export class Publicaciones implements OnInit {
  private router = inject(Router);
  private publicacionService = inject(PublicacionService);

  // Definición de estados con Signals
  publicaciones = signal<any[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarPublicaciones();
  }

  cargarPublicaciones(): void {
    this.loading.set(true);
    
    this.publicacionService.obtenerPublicaciones().subscribe({
      next: (data) => {
        console.log('Datos recibidos del backend:', data);
        this.publicaciones.set(data); // Actualizamos las publicaciones
        this.loading.set(false);      // Apagamos el indicador de carga
      },
      error: (err) => {
        this.errorMessage.set('No se pudieron cargar las publicaciones del servidor.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  irMiPerfil(): void {
    this.router.navigate(['/mi-perfil']);
  }
}