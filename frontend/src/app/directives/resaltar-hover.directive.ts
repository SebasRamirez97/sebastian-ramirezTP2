import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appResaltarHover]',
  standalone: true
})
export class ResaltarHoverDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter') onMouseEnter() {
    // Añadimos una clase de hover en lugar de pisar el background-color con 'transparent'
    this.renderer.addClass(this.el.nativeElement, 'hovered-effect');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.removeClass(this.el.nativeElement, 'hovered-effect');
  }
}