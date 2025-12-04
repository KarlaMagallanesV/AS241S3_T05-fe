import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

/**
 * Directiva para prevenir múltiples clicks en botones
 * Útil para evitar envíos duplicados de formularios
 *
 * Uso:
 * <button appDebounceClick (debounceClick)="onSubmit()" [debounceTime]="500">
 *   Guardar
 * </button>
 */
@Directive({
  selector: '[appDebounceClick]',
  standalone: true,
})
export class DebounceClickDirective implements OnInit, OnDestroy {
  @Input() debounceTime = 500;
  @Output() debounceClick = new EventEmitter<MouseEvent>();

  private clicks = new Subject<MouseEvent>();
  private subscription!: Subscription;

  ngOnInit(): void {
    this.subscription = this.clicks.pipe(debounceTime(this.debounceTime)).subscribe((event) => {
      this.debounceClick.emit(event);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.clicks.next(event);
  }
}
