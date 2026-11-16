import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'minutosAHoras',
  standalone: true
})
export class MinutosAHorasPipe implements PipeTransform {
  transform(minutos: number | string): string {
    const mins = Number(minutos);
    if (isNaN(mins) || mins <= 0) return 'Tiempo no especificado';
    
    const horas = Math.floor(mins / 60);
    const restoMins = mins % 60;

    if (horas === 0 && restoMins === 1) return `${restoMins} minuto`;
    if (horas === 0 ) return `${restoMins} minutos`;
    if (restoMins === 0 && horas > 1) return `${horas} horas`;
    if (restoMins === 0) return `${horas} hora`;
    
    return `${horas}h ${restoMins}m`;
  }
}