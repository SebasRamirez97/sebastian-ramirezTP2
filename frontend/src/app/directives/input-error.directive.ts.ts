import { Directive, ElementRef, Renderer2, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appInputError]',
  standalone: true
})
export class InputErrorDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private ngControl = inject(NgControl, { optional: true });

  constructor() {
    // Escucha cambios de estado del campo de formulario
    if (this.ngControl && this.ngControl.statusChanges) {
      this.ngControl.statusChanges.subscribe(() => {
        this.checkErrorStatus();
      });
    }
  }

  private checkErrorStatus() {
    const isInvalid = this.ngControl?.invalid && (this.ngControl?.touched || this.ngControl?.dirty);
    if (isInvalid) {
      this.renderer.setStyle(this.el.nativeElement, 'border-color', '#e53e3e');
      this.renderer.setStyle(this.el.nativeElement, 'box-shadow', '0 0 0 1px #e53e3e');
    } else {
      this.renderer.removeStyle(this.el.nativeElement, 'border-color');
      this.renderer.removeStyle(this.el.nativeElement, 'box-shadow');
    }
  }
}