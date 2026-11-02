import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'saltoLineaPipeTs',
})
export class SaltoLineaPipeTsPipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}
