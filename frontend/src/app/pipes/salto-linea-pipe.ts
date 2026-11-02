import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'saltoLinea',
  standalone: true
})
export class SaltoLineaPipe implements PipeTransform {
  
  // Usamos el constructor tradicional en lugar de inject() para evitar errores de contexto
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    // Reemplaza los saltos de línea por <br> y le indica a Angular que es seguro renderizarlo
    const textoConBr = value.replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(textoConBr);
  }
}