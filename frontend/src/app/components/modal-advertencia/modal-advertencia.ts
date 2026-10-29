import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-advertencia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-advertencia.html',
  styleUrl: './modal-advertencia.css'
})
export class ModalAdvertencia {
  // Inputs para personalizar el mensaje si lo deseas
  tiempoRestante = input<string>('5 minutos');

  // Outputs para notificar al componente padre qué botón presionó el usuario
  onContinuar = output<void>();
  onCerrarSesion = output<void>();

  continuar(): void {
    this.onContinuar.emit();
  }

  cerrarSesion(): void {
    this.onCerrarSesion.emit();
  }
}