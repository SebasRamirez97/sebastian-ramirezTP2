import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-startup-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './startup-loading.html',
  styleUrls: ['./startup-loading.css']
})
export class StartupLoadingComponent implements OnInit {
  private router = inject(Router);
  private userService = inject(UserService);

  ngOnInit(): void {
    // ⏱️ Demora intencional de 1.4 segundos para que se aprecie el spinner y el icono
    const tiempoMinimo = new Promise(resolve => setTimeout(resolve, 1400));

    // Validamos el token contra el backend en paralelo
    const peticionToken = this.userService.verificarToken().toPromise();

    // Esperamos a que terminen ambos (la validación y el tiempo visual del spinner)
    Promise.all([peticionToken, tiempoMinimo]).then(([esValido]) => {
      if (esValido) {
        this.router.navigate(['/publicaciones']);
      } else {
        this.router.navigate(['/login']);
      }
    }).catch(() => {
      // Si ocurre cualquier error de red o token inválido, va al login
      this.router.navigate(['/login']);
    });
  }
}