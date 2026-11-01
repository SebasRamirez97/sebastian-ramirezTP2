import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicacionService } from '../../services/publicacion.service';
import { UserService } from '../../services/user.service';
import { ModalCrearPublicacion } from '../modal-crear-publicacion/modal-crear-publicacion'; 
import { InactivityService } from '../../services/inactivity.service';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule, ModalCrearPublicacion], 
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css'
})
export class Publicaciones implements OnInit {
  private router = inject(Router);
  private publicacionService = inject(PublicacionService);
  private userService = inject(UserService);
  private inactivityService = inject(InactivityService);


  // Definición de estados con Signals
  publicaciones = signal<any[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  // Signal para controlar el modal de creación estilo Facebook
  modalCrearAbierto = signal<boolean>(false);

  ngOnInit(): void {
    this.cargarPublicaciones();
  }

  cargarPublicaciones(): void {
    this.loading.set(true);
    
    this.publicacionService.obtenerPublicaciones().subscribe({
      next: (data) => {
        this.publicaciones.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('No se pudieron cargar las publicaciones del servidor.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  // Métodos para manejar el modal
  abrirModalCrear(): void {
    this.modalCrearAbierto.set(true);
  }

  cerrarModalCrear(): void {
    this.modalCrearAbierto.set(false);
  }

  handlePublicacionExitosa(): void {
    this.cerrarModalCrear();
    this.cargarPublicaciones(); // Recarga el muro automáticamente para ver la nueva receta
  }

  irMiPerfil(): void {
    this.router.navigate(['/mi-perfil']);
  }

 

cerrarSesion() {
  this.userService.cerrarSesion().subscribe({
    next: () => {
      this.inactivityService.detenerMonitoreo(); // <--- Apagamos el servicio aquí
      this.router.navigate(['/login']);
    },
    error: (err: any) => {
      console.error('Error al cerrar sesión', err);
      this.inactivityService.detenerMonitoreo(); // <--- También por seguridad si falla la API
      this.router.navigate(['/login']);
    }
  });
}
  



  
}