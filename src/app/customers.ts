import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, Subscription } from 'rxjs';
import { Api, Activity, Customer, CustomerInput, CustomerPage, Page, Score, Summary } from './api';
import { Auth } from './auth';
import { apiErrorMessage } from './api-error';
import { Icon } from './icon';
import { Modal } from './modal';
@Component({
  selector: 'app-customers',
  imports: [FormsModule, DatePipe, Icon, Modal],
  templateUrl: './customers.html',
})
export class Customers {
  readonly auth = inject(Auth);
  private api = inject(Api);
  private destroyRef = inject(DestroyRef);
  private listing?: Subscription;
  readonly nav = signal<'dashboard' | 'customers' | 'events' | 'settings'>('customers');
  readonly sidebarOpen = signal(false);
  readonly title = computed(
    () =>
      ({
        dashboard: 'Dashboard',
        customers: 'Clientes',
        events: 'Eventos',
        settings: 'Configurações',
      })[this.nav()],
  );
  readonly data = signal<CustomerPage | null>(null);
  readonly summary = signal<Summary | null>(null);
  readonly summaryError = signal('');
  readonly busy = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly score = signal<Score | null>(null);
  readonly scoreCustomer = signal('');
  readonly scoreContext = signal<Customer | null>(null);
  readonly scoreError = signal('');
  readonly scoreBusy = signal(false);
  readonly editing = signal(false);
  readonly deleting = signal<Customer | null>(null);
  readonly detail = signal<Customer | null>(null);
  readonly detailTab = signal<'general' | 'score' | 'history'>('general');
  readonly detailBusy = signal(false);
  readonly detailError = signal('');
  readonly history = signal<Page<Activity> | null>(null);
  readonly historyBusy = signal(false);
  readonly historyError = signal('');
  readonly events = signal<Page<Activity> | null>(null);
  readonly eventsBusy = signal(false);
  readonly eventsError = signal('');
  id: number | null = null;
  name = '';
  status = '';
  page = 0;
  eventsPage = 0;
  historyPage = 0;
  form: CustomerInput = this.empty();
  readonly pages = computed(() => {
    const total = this.data()?.totalPages ?? 0;
    const current = this.data()?.number ?? 0;
    const start = Math.max(0, Math.min(current - 2, total - 5));
    return Array.from({ length: Math.min(5, total) }, (_, i) => start + i);
  });
  constructor() {
    this.load();
    this.loadSummary();
  }
  private empty(): CustomerInput {
    return { name: '', cpf: '', email: '', status: 'ACTIVE' };
  }
  navigate(nav: 'dashboard' | 'customers' | 'events' | 'settings') {
    if (nav === 'events' && !this.auth.admin()) return;
    this.nav.set(nav);
    this.sidebarOpen.set(false);
    this.error.set('');
    this.success.set('');
    if (nav === 'events') this.loadEvents(0);
    if (nav === 'dashboard') this.loadSummary();
  }
  load() {
    this.listing?.unsubscribe();
    this.busy.set(true);
    this.error.set('');
    this.listing = this.api
      .list(this.name, this.status, this.page)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (d) => {
          if (d.totalPages > 0 && this.page >= d.totalPages) {
            this.page = d.totalPages - 1;
            this.load();
            return;
          }
          this.data.set(d);
        },
        error: (e) => this.fail(e),
      });
  }
  loadSummary() {
    this.summaryError.set('');
    this.api
      .summary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (s) => this.summary.set(s),
        error: () => this.summaryError.set('Não foi possível atualizar os indicadores.'),
      });
  }
  filter() {
    this.page = 0;
    this.nav.set('customers');
    this.load();
  }
  clearFilters() {
    this.name = '';
    this.status = '';
    this.filter();
  }
  move(delta: number) {
    this.goTo(this.page + delta);
  }
  goTo(page: number) {
    if (this.busy() || page < 0 || page >= (this.data()?.totalPages ?? 0)) return;
    this.page = page;
    this.load();
  }
  edit(customer?: Customer) {
    this.detail.set(null);
    this.id = customer?.id ?? null;
    this.form = customer
      ? { name: customer.name, cpf: customer.cpf, email: customer.email, status: customer.status }
      : this.empty();
    this.error.set('');
    this.success.set('');
    this.editing.set(true);
  }
  setCpf(value: string) {
    this.form.cpf = value.replace(/\D/g, '').slice(0, 11);
  }
  save() {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.api
      .save(this.form, this.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.editing.set(false);
          this.success.set('Cliente salvo com sucesso.');
          this.load();
          this.loadSummary();
        },
        error: (e) => this.fail(e),
      });
  }
  confirmDelete(customer: Customer) {
    this.detail.set(null);
    this.error.set('');
    this.success.set('');
    this.deleting.set(customer);
  }
  remove() {
    const c = this.deleting();
    if (!c || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    this.api
      .delete(c.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.deleting.set(null);
          this.success.set('Cliente excluído.');
          this.load();
          this.loadSummary();
        },
        error: (e) => this.fail(e),
      });
  }
  showScore(c: Customer) {
    if (this.scoreBusy()) return;
    this.detail.set(null);
    this.success.set('');
    this.error.set('');
    this.scoreError.set('');
    this.score.set(null);
    this.scoreContext.set(c);
    this.scoreCustomer.set(c.name);
    this.scoreBusy.set(true);
    this.api
      .score(c.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.scoreBusy.set(false)),
      )
      .subscribe({
        next: (s) => {
          this.score.set(s);
          this.load();
          this.loadSummary();
        },
        error: (e) => this.scoreError.set(apiErrorMessage(e, 'score')),
      });
  }
  showDetails(c: Customer) {
    this.detail.set(c);
    this.detailTab.set('general');
    this.detailError.set('');
    this.history.set(null);
    this.historyPage = 0;
    this.detailBusy.set(true);
    this.api
      .get(c.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.detailBusy.set(false)),
      )
      .subscribe({
        next: (fresh) => {
          if (this.detail()?.id === c.id) this.detail.set(fresh);
        },
        error: (e) => this.detailError.set(apiErrorMessage(e)),
      });
  }
  selectTab(tab: 'general' | 'score' | 'history') {
    if (tab === 'history' && !this.auth.admin()) return;
    this.detailTab.set(tab);
    if (tab === 'history') this.loadHistory(0);
  }
  loadHistory(page: number) {
    const c = this.detail();
    if (!this.auth.admin() || !c || this.historyBusy()) return;
    this.historyBusy.set(true);
    this.historyError.set('');
    this.historyPage = page;
    this.api
      .events(c.id, page)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.historyBusy.set(false)),
      )
      .subscribe({
        next: (p) => this.history.set(p),
        error: (e) => this.historyError.set(apiErrorMessage(e)),
      });
  }
  loadEvents(page: number) {
    if (!this.auth.admin() || this.eventsBusy()) return;
    this.eventsPage = page;
    this.eventsBusy.set(true);
    this.eventsError.set('');
    this.api
      .events(null, page)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.eventsBusy.set(false)),
      )
      .subscribe({
        next: (p) => this.events.set(p),
        error: (e) => this.eventsError.set(apiErrorMessage(e)),
      });
  }
  formatCpf(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  number(value: number | null | undefined) {
    return value == null
      ? '—'
      : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value);
  }
  percent(value: number | undefined) {
    const total = this.summary()?.total ?? 0;
    return total
      ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(
          ((value ?? 0) / total) * 100,
        ) + '%'
      : '0%';
  }
  initials(name: string) {
    return (
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'U'
    );
  }
  riskName(classification: string | null | undefined) {
    return (
      (
        { LOW_RISK: 'LOW RISK', MEDIUM_RISK: 'MEDIUM RISK', HIGH_RISK: 'HIGH RISK' } as Record<
          string,
          string
        >
      )[classification ?? ''] ??
      classification?.replaceAll('_', ' ') ??
      'Não consultado'
    );
  }
  riskLabel(classification: string | null | undefined) {
    return (
      (
        { LOW_RISK: 'Baixo risco', MEDIUM_RISK: 'Médio risco', HIGH_RISK: 'Alto risco' } as Record<
          string,
          string
        >
      )[classification ?? ''] ?? 'Sem classificação'
    );
  }
  riskClass(classification: string | null | undefined) {
    return classification === 'LOW_RISK'
      ? 'low'
      : classification === 'MEDIUM_RISK'
        ? 'medium'
        : classification === 'HIGH_RISK'
          ? 'high'
          : 'neutral';
  }
  get firstItem() {
    return this.data()?.totalElements ? this.page * 10 + 1 : 0;
  }
  get lastItem() {
    return this.page * 10 + (this.data()?.content.length ?? 0);
  }
  private fail(e: HttpErrorResponse) {
    this.success.set('');
    this.error.set(apiErrorMessage(e));
  }
}
