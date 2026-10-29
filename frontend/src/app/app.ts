import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InactivityService } from './services/inactivity.service';
import { ModalAdvertencia } from './components/modal-advertencia/modal-advertencia'; // <--- Importa tu modal

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

  ngOnInit(): void {
    // Iniciamos el monitoreo de inactividad al arrancar la aplicación
    this.inactivityService.initInactivityMonitor();
  }
}