import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { EstadisticasService } from '../../services/estadisticas.service';
import { UserService } from '../../services/user.service';

Chart.register(...registerables); // Registramos los componentes de Chart.js

@Component({
  selector: 'app-dashboard-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-estadisticas.html',
  styleUrls: ['./dashboard-estadisticas.css']
})
export class DashboardEstadisticasComponent implements OnInit, AfterViewInit {
  private estadisticasService = inject(EstadisticasService);
  private userService = inject(UserService);
  private router = inject(Router);

  // Filtro de lapso seleccionado por defecto ('30d' = últimos 30 días)
  lapsoSeleccionado = signal<string>('30d');
  graficoActivo = signal<string>('publicaciones');

  // Referencias a los canvas del HTML
  @ViewChild('chartPublicaciones') chartPubRef!: ElementRef;
  @ViewChild('chartComentariosTiempo') chartComTiempoRef!: ElementRef;
  @ViewChild('chartComentariosPub') chartComPubRef!: ElementRef;

  private pubChartInstance: any;
  private comTiempoChartInstance: any;
  private comPubChartInstance: any;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.cargarDatosYRenderizar();
  }

  cambiarLapso(lapso: string) {
    this.lapsoSeleccionado.set(lapso);
    this.cargarDatosYRenderizar();
  }

  cargarDatosYRenderizar() {
    const lapso = this.lapsoSeleccionado();

    // 1. Gráfico de Publicaciones por Usuario (Barras)
    this.estadisticasService.obtenerPublicacionesPorUsuario(lapso).subscribe(data => {
      this.renderizarGraficoPublicaciones(data);
    });

    // 2. Gráfico de Comentarios en el tiempo (Líneas)
    this.estadisticasService.obtenerComentariosEnTiempo(lapso).subscribe(data => {
      this.renderizarGraficoComentariosTiempo(data);
    });

    // 3. Gráfico de Comentarios por Publicación (Barras horizontales)
    this.estadisticasService.obtenerComentariosPorPublicacion(lapso).subscribe(data => {
      this.renderizarGraficoComentariosPub(data);
    });
  }

  renderizarGraficoPublicaciones(data: any) {
    if (this.pubChartInstance) this.pubChartInstance.destroy();

    const ctx = this.chartPubRef.nativeElement.getContext('2d');
    this.pubChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels, // ej: ['@chef_carlos', '@ana_cocina']
        datasets: [{
          label: 'Publicaciones realizadas',
          data: data.valores, // ej: [12, 8]
          backgroundColor: '#3182ce',
          borderRadius: 6
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  renderizarGraficoComentariosTiempo(data: any) {
    if (this.comTiempoChartInstance) this.comTiempoChartInstance.destroy();

    const ctx = this.chartComTiempoRef.nativeElement.getContext('2d');
    this.comTiempoChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels, // ej: ['Día 1', 'Día 2', ...]
        datasets: [{
          label: 'Comentarios en el lapso',
          data: data.valores,
          borderColor: '#6b46c1',
          backgroundColor: 'rgba(107, 70, 193, 0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  renderizarGraficoComentariosPub(data: any) {
    if (this.comPubChartInstance) this.comPubChartInstance.destroy();

    const ctx = this.chartComPubRef.nativeElement.getContext('2d');
    
    // Paleta de colores variada para las porciones de la torta
    const coloresTorta = [
      '#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#6b46c1', 
      '#319795', '#dd6b20', '#4a5568', '#f6ad55', '#fc8181'
    ];

    this.comPubChartInstance = new Chart(ctx, {
      type: 'pie', // 👈 Cambiado a gráfico de torta
      data: {
        labels: data.labels, // ej: ['Receta de Tarta', 'Pastel de Papa', ...]
        datasets: [{
          label: 'Cantidad de comentarios',
          data: data.valores, // ej: [15, 8, 4]
          backgroundColor: coloresTorta.slice(0, data.valores.length),
          borderWidth: 1,
          borderColor: '#ffffff'
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom', // Muestra las referencias de las recetas abajo de la torta
            labels: {
              boxWidth: 15,
              font: {
                size: 12
              }
            }
          }
        }
      }
    });
  }

  irDashboardUsuarios() { this.router.navigate(['dashboard/usuarios']); }
  irPublicaciones() { this.router.navigate(['publicaciones']); }
  irMiPerfil() { this.router.navigate(['mi-perfil']); }
  cerrarSesion() { this.userService.cerrarSesion().subscribe(() => this.router.navigate(['login'])); }

  seleccionarGrafico(tipo: string) {
    this.graficoActivo.set(tipo);
    // Forzamos un pequeño retraso para asegurar que el canvas esté renderizado en el DOM al cambiar de solapa
    setTimeout(() => {
      this.cargarDatosYRenderizar();
    }, 50);
  }
}