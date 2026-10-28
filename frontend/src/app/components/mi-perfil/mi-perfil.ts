import { Component, OnInit, inject } from '@angular/core';
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

  usuario: any = null;
  loading: boolean = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.cargarDatosPerfil();
  }

  cargarDatosPerfil(): void {
    this.loading = true;
    this.userService.obtenerPerfil().subscribe({
      next: (data) => {
        this.usuario = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'No se pudo cargar la información del perfil. Es posible que la sesión haya expirado.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  irPublicaciones(): void {
    this.router.navigate(['/publicaciones']);
  }
}