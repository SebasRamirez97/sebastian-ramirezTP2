import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appSombraHover]',
  standalone: true
})
export class SombraHoverDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter') onMouseEnter() {
    this.renderer.setStyle(this.el.nativeElement, 'box-shadow', '0 10px 20px rgba(0,0,0,0.08)');
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(-2px)');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'all 0.25s ease');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.setStyle(this.el.nativeElement, 'box-shadow', '0 1px 3px rgba(0,0,0,0.05)');
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(0)');
  }
}