import {
  afterNextRender,
  Component,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnDestroy,
  output,
} from '@angular/core';
import { Icon } from './icon';
let sequence = 0;
@Component({
  selector: 'app-modal',
  imports: [Icon],
  template: `<div class="overlay" (click)="backdrop($event)">
    <section
      class="dialog"
      [class.wide]="wide"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="labelId"
      tabindex="-1"
    >
      <div class="dialog-heading">
        <h2 [id]="labelId">{{ title }}</h2>
        <button
          type="button"
          class="icon-button close-button"
          aria-label="Fechar janela"
          [disabled]="locked"
          (click)="closed.emit()"
        >
          <app-icon name="close" />
        </button>
      </div>
      <ng-content />
    </section>
  </div>`,
})
export class Modal implements OnDestroy {
  @Input() title = '';
  @Input() wide = false;
  @Input() locked = false;
  readonly closed = output<void>();
  readonly labelId = 'dialog-' + sequence++;
  private host: ElementRef<HTMLElement> = inject(ElementRef);
  private previous = document.activeElement as HTMLElement | null;
  private overflow = document.body.style.overflow;
  constructor() {
    document.body.style.overflow = 'hidden';
    afterNextRender(() =>
      this.host.nativeElement.querySelector<HTMLElement>('input, select, .dialog')?.focus(),
    );
  }
  backdrop(event: MouseEvent) {
    if (event.target === event.currentTarget && !this.locked) this.closed.emit();
  }
  @HostListener('document:keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !this.locked) {
      event.preventDefault();
      this.closed.emit();
    }
    if (event.key !== 'Tab') return;
    const nodes = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]',
      ),
    ).filter((node) => node.getClientRects().length);
    const first = nodes[0],
      last = nodes.at(-1);
    if (!first) {
      event.preventDefault();
      return;
    }
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        document.activeElement?.getAttribute('role') === 'dialog')
    ) {
      event.preventDefault();
      last?.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last || !this.host.nativeElement.contains(document.activeElement))
    ) {
      event.preventDefault();
      first.focus();
    }
  }
  ngOnDestroy() {
    document.body.style.overflow = this.overflow;
    this.previous?.focus();
  }
}
