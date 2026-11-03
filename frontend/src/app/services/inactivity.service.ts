// src/app/services/inactivity.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  private router = inject(Router);

  // Configuramos los tiempos:
  private readonly INACTIVITY_LIMIT = 25* 60 * 1000; 
  private readonly WARNING_DURATION = 5* 60 * 1000;   

  private inactivityTimer: any;
  private warningTimer: any;
  private countdownInterval: any;

  // Signals para el control del modal
  showModal = signal<boolean>(false);
  tiempoRestante = signal<string>('5:00');

  // Guardamos la referencia de la función bound para poder removerla luego
  private boundHandleActivity = () => this.handleUserActivity();

  initInactivityMonitor(): void {
    this.resetTimers();

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.removeEventListener(event, this.boundHandleActivity); // Evita duplicar listeners
      window.addEventListener(event, this.boundHandleActivity);
    });
  }

  private handleUserActivity(): void {
    // Si estamos en el login o el modal ya está abierto, ignoramos la actividad común
    if (this.router.url.includes('/login') || this.showModal()) return; 
    this.resetTimers();
  }

  private resetTimers(): void {
    clearTimeout(this.inactivityTimer);
    clearTimeout(this.warningTimer);

    if (this.router.url.includes('/login')) return; // No iniciamos timers en el login

    this.inactivityTimer = setTimeout(() => {
      this.triggerWarning();
    }, this.INACTIVITY_LIMIT);
  }

  private triggerWarning(): void {
    if (this.router.url.includes('/login')) return;

    this.showModal.set(true);
    
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
    this.detenerMonitoreo(); // <--- Limpiamos listeners y temporizadores
    console.warn('Sesión cerrada por inactividad.');
    this.router.navigate(['/login']);
  }

  // 👇 NUEVO MÉTODO PÚBLICO PARA DETENER EL MONITOREO AL HACER LOGOUT MANUAL
  public detenerMonitoreo(): void {
    clearTimeout(this.inactivityTimer);
    clearTimeout(this.warningTimer);
    clearInterval(this.countdownInterval);
    this.showModal.set(false);

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.removeEventListener(event, this.boundHandleActivity);
    });
  }
}