import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { PublicacionService } from '../../services/publicacion.service';
import { ModalCrearPublicacion } from '../modal-crear-publicacion/modal-crear-publicacion'; // <--- Importa la ruta correcta de tu modal

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, ModalCrearPublicacion],
  templateUrl: './mi-perfil.html',
  styleUrls: ['./mi-perfil.css']
})
export class MiPerfil implements OnInit {
  private userService = inject(UserService);
  private publicacionService = inject(PublicacionService);
  private router = inject(Router);

  usuario = signal<any>(null);
  misPublicaciones = signal<any[]>([]);
  loading = signal<boolean>(true);
  subiendoAvatar = signal<boolean>(false);

  ngOnInit(): void {
    this.cargarDatosPerfil();
  }

  cargarDatosPerfil() {
    this.loading.set(true);
    this.userService.obtenerPerfil().subscribe({
      next: (user) => {
        this.usuario.set(user);
        this.publicacionService.obtenerPublicaciones().subscribe({
          next: (pubs) => {
            const propias = pubs.filter((p: any) => p.autor?._id === user._id || p.autor === user._id);
            this.misPublicaciones.set(propias);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => this.loading.set(false)
    });
  }

  // Método que se dispara al seleccionar un archivo de imagen para el avatar
  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    // Asegúrate de que el nombre 'avatar' o 'imagen' coincida con lo que espera tu backend (Multer)
    formData.append('avatar', file); 

    this.subiendoAvatar.set(true);

    // Asume que tienes un método en tu userService para actualizar el perfil o avatar
    this.userService.actualizarAvatar(formData).subscribe({
      next: (userActualizado: any) => {
        this.subiendoAvatar.set(false);
        // Actualizamos la señal del usuario para que se refresque la foto de inmediato
        this.usuario.set(userActualizado);
      },
      error: (err) => {
        this.subiendoAvatar.set(false);
        console.error('Error al actualizar el avatar:', err);
      }
    });
  }

  irPublicaciones() {
    this.router.navigate(['/publicaciones']);
  }

  cerrarSesion() {
    this.userService.cerrarSesion().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}