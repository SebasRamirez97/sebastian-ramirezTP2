// src/app/directives/input-error.directive.ts
import { Directive, ElementRef, HostListener, inject, Renderer2 } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appInputError]',
  standalone: true
})
export class InputErrorDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private control = inject(NgControl, { optional: true });

  @HostListener('blur') onBlur() {
    this.verificarEstado();
  }

  @HostListener('input') onInput() {
    this.verificarEstado();
  }

  private verificarEstado() {
    if (this.control && this.control.invalid && (this.control.touched || this.control.dirty)) {
      // Agrega una clase CSS de error al input (ej. borde rojo)
      this.renderer.addClass(this.el.nativeElement, 'is-invalid');
    } else {
      this.renderer.removeClass(this.el.nativeElement, 'is-invalid');
    }
  }
}