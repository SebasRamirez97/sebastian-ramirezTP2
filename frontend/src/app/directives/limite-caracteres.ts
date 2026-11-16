import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';

@Directive({
  selector: '[appLimiteCaracteres]',
  standalone: true
})
export class LimiteCaracteresDirective {
  @Input('appLimiteCaracteres') max: number = 100;
  private el = inject(ElementRef);

  @HostListener('input', ['$event']) onInput(event: Event) {
    const input = this.el.nativeElement as HTMLInputElement;
    if (input.value.length > this.max) {
      input.value = input.value.substring(0, this.max);
      // Disparamos un evento para que Angular actualice el ngModel correctamente
      input.dispatchEvent(new Event('input'));
    }
  }
}