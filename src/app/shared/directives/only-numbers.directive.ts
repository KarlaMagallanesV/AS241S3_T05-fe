import { Directive, ElementRef, HostListener, Input } from '@angular/core';

/**
 * Directiva para permitir solo números en inputs
 * Reemplaza los métodos onlyNumbers() que tienes en cada componente
 *
 * Uso:
 * <input appOnlyNumbers>
 * <input appOnlyNumbers [allowDecimal]="true">
 * <input appOnlyNumbers [maxLength]="8">
 */
@Directive({
  selector: '[appOnlyNumbers]',
  standalone: true,
})
export class OnlyNumbersDirective {
  @Input() allowDecimal = false;
  @Input() maxLength: number | null = null;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace',
      'Tab',
      'End',
      'Home',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
      'Enter',
      'Escape',
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    if (this.allowDecimal && event.key === '.') {
      const currentValue = this.el.nativeElement.value;
      if (!currentValue.includes('.')) {
        return;
      }
    }

    if (this.maxLength !== null) {
      const currentValue = this.el.nativeElement.value;
      if (currentValue.length >= this.maxLength && !event.ctrlKey) {
        event.preventDefault();
        return;
      }
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    const pattern = this.allowDecimal ? /^[\d.]+$/ : /^\d+$/;

    if (!pattern.test(pastedText)) {
      event.preventDefault();
    }
  }
}
