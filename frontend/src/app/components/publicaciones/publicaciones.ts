import { Component, OnInit, inject } from '@angular/core';
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

  publicaciones: any[] = [];
  loading: boolean = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.cargarPublicaciones();
  }

  cargarPublicaciones(): void {
    this.loading = true;
    this.publicacionService.obtenerPublicaciones().subscribe({
      next: (data) => {
        this.publicaciones = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'No se pudieron cargar las publicaciones del servidor.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  irMiPerfil(): void {
    this.router.navigate(['/mi-perfil']);
  }
}