import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css'
})
export class MiPerfil implements OnInit {
  private router = inject(Router);
  private userService = inject(UserService);

  // Definimos las propiedades como Signals
  usuario = signal<any>(null);
  loading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarDatosPerfil();
  }

  cargarDatosPerfil(): void {
    this.loading.set(true); // Actualizamos el signal de carga
    
    this.userService.obtenerPerfil().subscribe({
      next: (data) => {
        console.log('Perfil recibido del backend:', data);
        this.usuario.set(data);   // Guardamos el objeto de usuario en el signal
        this.loading.set(false);  // Apagamos el loading
      },
      error: (err) => {
        this.errorMessage.set('No se pudo cargar la información del perfil. Es posible que la sesión haya expirado.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  irPublicaciones(): void {
    this.router.navigate(['/publicaciones']);
  }
}