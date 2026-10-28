import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const matchPasswordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const repetirPassword = control.get('repetirPassword');

  if (!password || !repetirPassword) {
    return null;
  }

  return password.value === repetirPassword.value ? null : { passwordMismatch: true };
};