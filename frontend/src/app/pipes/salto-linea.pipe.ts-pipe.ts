import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'saltoLinea',
  standalone: true,
})
export class SaltoLineaPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string): SafeHtml {
    if (!value) return '';

    // Reemplazamos cualquier combinación de saltos múltiples por un solo salto limpio
    const textoHtml = value
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '')
      .replace(/\n\s*\n/g, '<br><br>') // Si hay renglones vacíos intencionales
      .replace(/\n/g, '<br>');

    return this.sanitizer.bypassSecurityTrustHtml(textoHtml);
  }
}