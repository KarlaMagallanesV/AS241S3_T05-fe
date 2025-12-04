import { Directive, Input, ElementRef, OnInit, OnDestroy, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';

/**
 * Directiva para mostrar mensajes de error en campos de formulario
 *
 * Uso:
 * <input formControlName="email" appFormError [errorMessages]="{
 *   required: 'El correo es obligatorio',
 *   email: 'Formato de correo inválido'
 * }">
 */
@Directive({
  selector: '[appFormError]',
  standalone: true,
})
export class FormErrorDirective implements OnInit, OnDestroy {
  @Input() errorMessages: Record<string, string> = {};

  private el = inject(ElementRef);
  private control = inject(NgControl, { optional: true });
  private errorElement: HTMLElement | null = null;
  private subscription: Subscription | null = null;

  private defaultMessages: Record<string, string> = {
    required: 'Este campo es obligatorio',
    email: 'El formato del correo no es válido',
    minlength: 'El campo es muy corto',
    maxlength: 'El campo es muy largo',
    pattern: 'El formato no es válido',
    min: 'El valor es muy bajo',
    max: 'El valor es muy alto',
  };

  ngOnInit(): void {
    if (!this.control?.control) return;

    this.createErrorElement();

    this.subscription = this.control.control.statusChanges.subscribe(() => {
      this.updateErrorMessage();
    });

    this.el.nativeElement.addEventListener('blur', () => this.updateErrorMessage());
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.errorElement?.remove();
  }

  private createErrorElement(): void {
    this.errorElement = document.createElement('div');
    this.errorElement.className = 'error directive-error';
    this.errorElement.style.cssText =
      'color: #e74c3c; font-size: 12px; margin-top: 4px; display: none;';

    this.el.nativeElement.parentNode?.insertBefore(
      this.errorElement,
      this.el.nativeElement.nextSibling
    );
  }

  private updateErrorMessage(): void {
    if (!this.control?.control || !this.errorElement) return;

    const control = this.control.control;

    if (control.invalid && (control.dirty || control.touched)) {
      const errorKey = Object.keys(control.errors || {})[0];
      const message =
        this.errorMessages[errorKey] || this.defaultMessages[errorKey] || 'Campo inválido';

      this.errorElement.textContent = message;
      this.errorElement.style.display = 'block';
      this.el.nativeElement.classList.add('input-error');
    } else {
      this.errorElement.style.display = 'none';
      this.el.nativeElement.classList.remove('input-error');
    }
  }
}
