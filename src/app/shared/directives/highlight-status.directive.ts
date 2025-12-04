import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

/**
 * Directiva para resaltar elementos según su estado
 * Útil para badges de estado en listas (reservaciones, clientes, etc.)
 *
 * Uso:
 * <span appHighlightStatus [status]="reservation.status">{{ statusLabel }}</span>
 * <span appHighlightStatus [status]="client.status" type="client">{{ statusLabel }}</span>
 */
@Directive({
  selector: '[appHighlightStatus]',
  standalone: true,
})
export class HighlightStatusDirective implements OnChanges {
  @Input() status = '';
  @Input() type: 'reservation' | 'client' | 'employee' | 'general' = 'general';

  private statusColors: Record<string, Record<string, { bg: string; text: string; border: string }>> =
    {
      reservation: {
        P: { bg: '#FFF3CD', text: '#856404', border: '#FFEEBA' },
        A: { bg: '#D4EDDA', text: '#155724', border: '#C3E6CB' },
        C: { bg: '#F8D7DA', text: '#721C24', border: '#F5C6CB' },
        R: { bg: '#CCE5FF', text: '#004085', border: '#B8DAFF' },
        N: { bg: '#E2E3E5', text: '#383D41', border: '#D6D8DB' },
        F: { bg: '#D1ECF1', text: '#0C5460', border: '#BEE5EB' },
      },
      client: {
        A: { bg: '#D4EDDA', text: '#155724', border: '#C3E6CB' },
        I: { bg: '#F8D7DA', text: '#721C24', border: '#F5C6CB' },
      },
      employee: {
        A: { bg: '#D4EDDA', text: '#155724', border: '#C3E6CB' },
        I: { bg: '#F8D7DA', text: '#721C24', border: '#F5C6CB' },
      },
      general: {
        A: { bg: '#D4EDDA', text: '#155724', border: '#C3E6CB' },
        I: { bg: '#F8D7DA', text: '#721C24', border: '#F5C6CB' },
        P: { bg: '#FFF3CD', text: '#856404', border: '#FFEEBA' },
      },
    };

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['status'] || changes['type']) {
      this.applyStyles();
    }
  }

  private applyStyles(): void {
    const colors =
      this.statusColors[this.type]?.[this.status] ||
      this.statusColors['general'][this.status] ||
      { bg: '#E2E3E5', text: '#383D41', border: '#D6D8DB' };

    const element = this.el.nativeElement;
    element.style.backgroundColor = colors.bg;
    element.style.color = colors.text;
    element.style.border = `1px solid ${colors.border}`;
    element.style.padding = '4px 12px';
    element.style.borderRadius = '12px';
    element.style.fontSize = '12px';
    element.style.fontWeight = '600';
    element.style.display = 'inline-block';
  }
}
