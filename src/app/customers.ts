import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { Api, Customer, CustomerInput, CustomerPage, Score } from './api';
import { Auth } from './auth';
import { apiErrorMessage } from './api-error';
@Component({
  selector: 'app-customers',
  imports: [FormsModule, DatePipe],
  templateUrl: './customers.html',
})
export class Customers {
  readonly auth = inject(Auth);
  private api = inject(Api);
  readonly data = signal<CustomerPage | null>(null);
  readonly busy = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly score = signal<Score | null>(null);
  readonly scoreCustomer = signal('');
  readonly scoreBusy = signal(false);
  readonly editing = signal(false);
  readonly deleting = signal<Customer | null>(null);
  id: number | null = null;
  name = '';
  status = '';
  page = 0;
  form: CustomerInput = this.empty();
  constructor() {
    this.load();
  }
  private empty(): CustomerInput {
    return { name: '', cpf: '', email: '', status: 'ACTIVE' };
  }
  load() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.api
      .list(this.name, this.status, this.page)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({ next: (d) => this.data.set(d), error: (e) => this.fail(e) });
  }
  filter() {
    this.page = 0;
    this.load();
  }
  move(delta: number) {
    this.page += delta;
    this.load();
  }
  edit(customer?: Customer) {
    this.id = customer?.id ?? null;
    this.form = customer
      ? {
          name: customer.name,
          cpf: customer.cpf,
          email: customer.email,
          status: customer.status,
        }
      : this.empty();
    this.error.set('');
    this.success.set('');
    this.editing.set(true);
  }
  save() {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.api
      .save(this.form, this.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.editing.set(false);
          this.success.set('Cliente salvo com sucesso.');
          this.load();
        },
        error: (e) => this.fail(e),
      });
  }
  remove() {
    const c = this.deleting();
    if (!c || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    this.api
      .delete(c.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.deleting.set(null);
          this.success.set('Cliente excluído.');
          this.page = 0;
          this.load();
        },
        error: (e) => this.fail(e),
      });
  }
  showScore(c: Customer) {
    if (this.scoreBusy()) return;
    this.success.set('');
    this.score.set(null);
    this.scoreCustomer.set(c.name);
    this.scoreBusy.set(true);
    this.error.set('');
    this.api
      .score(c.id)
      .pipe(finalize(() => this.scoreBusy.set(false)))
      .subscribe({
        next: (s) => this.score.set(s),
        error: (e) => {
          this.scoreCustomer.set('');
          this.fail(e, 'score');
        },
      });
  }
  private fail(e: HttpErrorResponse, context: 'customer' | 'score' = 'customer') {
    this.success.set('');
    this.error.set(apiErrorMessage(e, context));
  }
}
