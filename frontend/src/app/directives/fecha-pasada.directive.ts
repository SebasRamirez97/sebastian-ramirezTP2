// src/app/directives/fecha-pasada.directive.ts
import { Directive, ElementRef, Renderer2, OnInit } from '@angular/core';

@Directive({
  selector: '[appFechaPasada]',
  standalone: true
})
export class FechaPasadaDirective implements OnInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    // getMonth() devuelve de 0 a 11, por eso sumamos 1 y rellenamos con ceros
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    
    const fechaLocalMaxima = `${anio}-${mes}-${dia}`;
    
    // Seteamos el atributo 'max' nativo con la fecha local exacta
    this.renderer.setAttribute(this.el.nativeElement, 'max', fechaLocalMaxima);
  }
}