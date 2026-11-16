import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'capitalizar',
  standalone: true
})
export class CapitalizarPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value || typeof value !== 'string') return '';
    
    // Pone únicamente la primera letra en mayúscula y deja el resto del texto intacto
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}