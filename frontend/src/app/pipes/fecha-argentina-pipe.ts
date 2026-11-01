import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fechaArgentina',
  standalone: true
})
export class FechaArgentinaPipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return '';

    const fecha = new Date(value);
    
    // Validar si es una fecha válida
    if (isNaN(fecha.getTime())) return '';

    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear().toString().slice(-2); // Toma los últimos 2 dígitos del año (ej. '26')

    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');

    return `${dia}/${mes}/${anio}, ${horas}:${minutos}`;
  }
}