import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InactivityService } from './services/inactivity.service';
import { ModalAdvertencia } from './components/modal-advertencia/modal-advertencia'; // <--- Importa tu modal
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ModalAdvertencia], // <--- Agrégalo aquí en los imports
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  
  // Inyectamos el servicio de inactividad para usarlo en la app
  readonly inactivityService = inject(InactivityService);
  private swUpdate = inject(SwUpdate);
  ngOnInit(): void {
    // Iniciamos el monitoreo de inactividad al arrancar la aplicación
    this.inactivityService.initInactivityMonitor();
    // Lógica opcional para avisar si hay una nueva versión de la PWA disponible
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.forEach(evt => {
        if (evt.type === 'VERSION_READY') {
          if (confirm('Hay una nueva versión de la aplicación disponible. ¿Deseas actualizarla?')) {
            window.location.reload();
          }
        }
      });
    }

  }
}