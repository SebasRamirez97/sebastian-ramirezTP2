// src/app/services/inactivity.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  private router = inject(Router);

  // Configuramos los tiempos:
  // 25 minutos de inactividad antes de mostrar el aviso (dejando 5 min antes de los 30 del token)
  private readonly INACTIVITY_LIMIT = 50* 1000; 
  private readonly WARNING_DURATION = 10 * 1000;   

  private inactivityTimer: any;
  private warningTimer: any;
  private countdownInterval: any;

  // Signals para el control del modal
  showModal = signal<boolean>(false);
  tiempoRestante = signal<string>('5:00');

  // Método público que faltaba por declarar
  initInactivityMonitor(): void {
    this.resetTimers();

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, () => this.handleUserActivity());
    });
  }

  private handleUserActivity(): void {
    if (this.showModal()) return; // Si el modal ya está abierto, no reiniciamos con movimientos comunes
    this.resetTimers();
  }

  private resetTimers(): void {
    clearTimeout(this.inactivityTimer);
    clearTimeout(this.warningTimer);

    this.inactivityTimer = setTimeout(() => {
      this.triggerWarning();
    }, this.INACTIVITY_LIMIT);
  }

  private triggerWarning(): void {
    this.showModal.set(true);
    
    // Usamos la constante WARNING_DURATION para calcular los segundos totales de forma dinámica
    let secondsLeft = Math.floor(this.WARNING_DURATION / 1000); 

    this.countdownInterval = setInterval(() => {
      secondsLeft--;
      const mins = Math.floor(secondsLeft / 60);
      const secs = secondsLeft % 60;
      this.tiempoRestante.set(`${mins}:${secs < 10 ? '0' : ''}${secs}`);

      if (secondsLeft <= 0) {
        clearInterval(this.countdownInterval);
        this.cerrarSesionPorInactividad();
      }
    }, 1000);
  }

  public continuarSesion(): void {
    this.showModal.set(false);
    clearInterval(this.countdownInterval);
    this.resetTimers();
  }

  public cerrarSesionPorInactividad(): void {
    this.showModal.set(false);
    clearInterval(this.countdownInterval);
    console.warn('Sesión cerrada por inactividad.');
    this.router.navigate(['/login']);
  }
}