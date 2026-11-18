import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { EstadisticasService } from '../../services/estadisticas.service';
import { UserService } from '../../services/user.service';
import { FechaArgentinaPipe } from '../../pipes/fecha-argentina-pipe';
import { FechaPasadaDirective } from '../../directives/fecha-pasada.directive';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule, FechaPasadaDirective],
  templateUrl: './dashboard-estadisticas.html',
  styleUrls: ['./dashboard-estadisticas.css'],
})
export class DashboardEstadisticasComponent implements OnInit, AfterViewInit {
  private estadisticasService = inject(EstadisticasService);
  private userService = inject(UserService);
  private router = inject(Router);

  lapsoSeleccionado = signal<string>('30d');
  graficoActivo = signal<string>('publicaciones');

  // 📅 Signals para las fechas personalizadas
  fechaInicioPersonalizada = signal<string>('');
  fechaFinPersonalizada = signal<string>('');
  errorFechas = signal<string>('');

  usandoRangoPersonalizado = signal<boolean>(false);

  @ViewChild('chartPublicaciones') chartPubRef!: ElementRef;
  @ViewChild('chartComentariosTiempo') chartComTiempoRef!: ElementRef;
  @ViewChild('chartComentariosPub') chartComPubRef!: ElementRef;

  private pubChartInstance: any;
  private comTiempoChartInstance: any;
  private comPubChartInstance: any;

  private fechaPipe = new FechaArgentinaPipe();

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.cargarDatosYRenderizar();
  }

  cambiarLapso(lapso: string) {
    this.fechaInicioPersonalizada.set('');
    this.fechaFinPersonalizada.set('');
    this.errorFechas.set('');
    this.usandoRangoPersonalizado.set(false); // Volvemos al modo lapso rápido

    this.lapsoSeleccionado.set(lapso);
    this.cargarDatosYRenderizar();
  }

  aplicarRangoPersonalizado() {
    const inicio = this.fechaInicioPersonalizada();
    const fin = this.fechaFinPersonalizada();

    if (!inicio || !fin) {
      this.errorFechas.set('Debes seleccionar ambas fechas (Desde y Hasta).');
      return;
    }

    if (new Date(inicio) > new Date(fin)) {
      this.errorFechas.set('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    this.errorFechas.set('');
    this.usandoRangoPersonalizado.set(true); // Activamos el modo personalizado
    this.cargarDatosYRenderizar();
  }

  cargarDatosYRenderizar() {
    // Si usamos rango personalizado, pasamos 'undefined' como lapso para que el backend use únicamente las fechas
    const lapso = this.usandoRangoPersonalizado() ? undefined : this.lapsoSeleccionado();
    const inicio = this.fechaInicioPersonalizada();
    const fin = this.fechaFinPersonalizada();

    this.estadisticasService.obtenerPublicacionesPorUsuario(lapso, inicio, fin).subscribe({
      next: (data) => this.renderizarGraficoPublicaciones(data),
      error: (err) => console.error('Error al cargar publicaciones:', err)
    });

    this.estadisticasService.obtenerComentariosEnTiempo(lapso, inicio, fin).subscribe({
      next: (data) => this.renderizarGraficoComentariosTiempo(data),
      error: (err) => console.error('Error al cargar comentarios en tiempo:', err)
    });

    this.estadisticasService.obtenerComentariosPorPublicacion(lapso, inicio, fin).subscribe({
      next: (data) => this.renderizarGraficoComentariosPub(data),
      error: (err) => console.error('Error al cargar comentarios por publicación:', err)
    });
  }

  renderizarGraficoPublicaciones(data: any) {
    if (this.pubChartInstance) this.pubChartInstance.destroy();

    const ctx = this.chartPubRef.nativeElement.getContext('2d');
    this.pubChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Publicaciones realizadas',
            data: data.valores,
            backgroundColor: '#dd6b20',
            borderColor: '#c05621',
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  renderizarGraficoComentariosTiempo(data: any) {
    if (this.comTiempoChartInstance) this.comTiempoChartInstance.destroy();

    const labelsTransformados = data.labels.map((fechaStr: string) => {
      const fechaFormateada = this.fechaPipe.transform(fechaStr);
      return fechaFormateada.split(',')[0];
    });

    const ctx = this.chartComTiempoRef.nativeElement.getContext('2d');
    this.comTiempoChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labelsTransformados,
        datasets: [
          {
            label: 'Comentarios en el lapso',
            data: data.valores,
            borderColor: '#dd6b20',
            backgroundColor: 'rgba(221, 107, 32, 0.1)',
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#dd6b20',
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  renderizarGraficoComentariosPub(data: any) {
    if (this.comPubChartInstance) this.comPubChartInstance.destroy();

    const ctx = this.chartComPubRef.nativeElement.getContext('2d');
    const coloresTorta = [
      '#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#6b46c1',
      '#319795', '#dd6b20', '#4a5568', '#f6ad55', '#fc8181',
    ];

    this.comPubChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Cantidad de comentarios',
            data: data.valores,
            backgroundColor: coloresTorta.slice(0, data.valores.length),
            borderWidth: 1,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 15, font: { size: 12 } },
          },
        },
      },
    });
  }

  irDashboardUsuarios() { this.router.navigate(['dashboard/usuarios']); }
  irPublicaciones() { this.router.navigate(['publicaciones']); }
  irMiPerfil() { this.router.navigate(['mi-perfil']); }

  cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.clear();
    this.userService.cerrarSesion().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  seleccionarGrafico(tipo: string) {
    this.graficoActivo.set(tipo);
    setTimeout(() => this.cargarDatosYRenderizar(), 50);
  }
}