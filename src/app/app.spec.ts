import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Customers } from './customers';
import { Auth } from './auth';
import { Api } from './api';
describe('Customer permissions', () => {
  const admin = signal(false);
  const api = {
    list: vi.fn(() => of({ content: [], totalElements: 0, totalPages: 0, number: 0 })),
    save: vi.fn(() => of({})),
    delete: vi.fn(() => of(undefined)),
    score: vi.fn(),
    summary: vi.fn(() =>
      of({
        total: 0,
        active: 0,
        inactive: 0,
        averageScore: null,
        scoredCustomers: 0,
        newThisMonth: 0,
      }),
    ),
    get: vi.fn(),
    events: vi.fn(() => of({ content: [], totalElements: 0, totalPages: 0, number: 0 })),
  };
  beforeEach(async () => {
    admin.set(false);
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [Customers],
      providers: [
        {
          provide: Auth,
          useValue: { admin, username: signal('user'), logout: vi.fn() },
        },
        { provide: Api, useValue: api },
      ],
    }).compileComponents();
  });
  it('allows USER to query and hides write actions', () => {
    const fixture = TestBed.createComponent(Customers);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Clientes');
    expect(fixture.nativeElement.textContent).not.toContain('Novo cliente');
    expect(api.list).toHaveBeenCalledWith('', '', 0);
  });
  it('allows ADMIN to create a customer', () => {
    admin.set(true);
    const fixture = TestBed.createComponent(Customers);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Novo cliente');
    const component = fixture.componentInstance;
    component.edit();
    component.form = {
      name: 'João',
      cpf: '52998224725',
      email: 'joao@example.com',
      status: 'ACTIVE',
    };
    component.save();
    expect(api.save).toHaveBeenCalledWith(component.form, null);
    expect(component.editing()).toBe(false);
  });
  it('shows score errors, clears old success and allows another attempt', () => {
    const fixture = TestBed.createComponent(Customers);
    const component = fixture.componentInstance;
    const customer = {
      id: 3,
      name: 'Cliente',
      cpf: '01234567890',
      email: 'a@example.com',
      status: 'ACTIVE' as const,
      version: 0,
      createdAt: '',
      updatedAt: '',
    };
    component.success.set('Cliente salvo com sucesso.');
    api.score.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 404 })));
    component.showScore(customer);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.score-failure').textContent).toContain(
      'score não encontrado',
    );
    expect(component.success()).toBe('');
    expect(component.scoreBusy()).toBe(false);
    expect(component.scoreCustomer()).toBe('Cliente');
    api.score.mockReturnValueOnce(
      of({ cpf: customer.cpf, score: 750, classification: 'LOW_RISK' }),
    );
    component.showScore(customer);
    expect(component.score()?.score).toBe(750);
    expect(component.error()).toBe('');
  });
  it('keeps status and search combined and resets pagination when filtering', () => {
    const component = TestBed.createComponent(Customers).componentInstance;
    component.name = '529.982.247-25';
    component.status = 'ACTIVE';
    component.page = 4;
    component.filter();
    expect(api.list).toHaveBeenLastCalledWith('529.982.247-25', 'ACTIVE', 0);
    component.clearFilters();
    expect(api.list).toHaveBeenLastCalledWith('', '', 0);
  });
  it('renders zero score, formatted CPF and real global indicators', () => {
    api.list.mockReturnValueOnce(
      of({
        content: [
          {
            id: 1,
            name: 'João',
            cpf: '52998224725',
            email: 'joao@example.com',
            status: 'ACTIVE',
            score: 0,
            classification: 'HIGH_RISK',
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
      }) as never,
    );
    api.summary.mockReturnValueOnce(
      of({
        total: 1248,
        active: 892,
        inactive: 356,
        averageScore: 612,
        scoredCustomers: 50,
        newThisMonth: 12,
      }) as never,
    );
    const fixture = TestBed.createComponent(Customers);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1.248');
    expect(fixture.nativeElement.textContent).toContain('612');
    expect(fixture.nativeElement.textContent).toContain('529.982.247-25');
    expect(fixture.nativeElement.querySelector('.score-cell').textContent).toBe('0');
    expect(fixture.nativeElement.querySelector('.risk-badge.high').textContent).toContain(
      'HIGH RISK',
    );
  });
  it('opens fresh customer details and loads paged activity history', () => {
    admin.set(true);
    const customer = {
      id: 3,
      name: 'João',
      cpf: '52998224725',
      email: 'joao@example.com',
      status: 'ACTIVE' as const,
      version: 0,
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-01T10:00:00Z',
    };
    api.get.mockReturnValueOnce(of(customer));
    const fixture = TestBed.createComponent(Customers);
    const component = fixture.componentInstance;
    component.showDetails(customer);
    fixture.detectChanges();
    expect(api.get).toHaveBeenCalledWith(3);
    expect(fixture.nativeElement.querySelector('[role="dialog"]').textContent).toContain(
      '529.982.247-25',
    );
    component.selectTab('history');
    expect(api.events).toHaveBeenCalledWith(3, 0);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum evento registrado');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.detail()).toBeNull();
  });
  it('normalizes formatted CPF before saving', () => {
    const component = TestBed.createComponent(Customers).componentInstance;
    component.edit();
    component.setCpf('529.982.247-25');
    component.save();
    expect(api.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ cpf: '52998224725' }),
      null,
    );
  });
  it('preserves filters and shows readable errors when the API fails', () => {
    api.list.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));
    const fixture = TestBed.createComponent(Customers);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'erro interno',
    );
    expect(fixture.componentInstance.busy()).toBe(false);
  });
  it('hides event navigation, history and environment details from USER', () => {
    const fixture = TestBed.createComponent(Customers);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Eventos (Kafka)');
    expect(fixture.nativeElement.querySelector('[aria-label="Ver eventos recentes"]')).toBeNull();
    component.navigate('events');
    component.loadEvents(0);
    expect(component.nav()).toBe('customers');
    expect(api.events).not.toHaveBeenCalled();
    component.navigate('settings');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sua conta');
    expect(fixture.nativeElement.textContent).not.toContain('Ambiente de trabalho');
    component.detail.set({
      id: 1,
      name: 'João',
      cpf: '52998224725',
      email: 'joao@example.com',
      status: 'ACTIVE',
      version: 0,
      createdAt: '',
      updatedAt: '',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#history-tab')).toBeNull();
    component.selectTab('history');
    component.loadHistory(0);
    expect(component.detailTab()).toBe('general');
    expect(api.events).not.toHaveBeenCalled();
  });
  it('allows ADMIN to access events and environment details', () => {
    admin.set(true);
    const fixture = TestBed.createComponent(Customers);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[aria-label="Ver eventos recentes"]'),
    ).not.toBeNull();
    component.navigate('events');
    fixture.detectChanges();
    expect(api.events).toHaveBeenCalledWith(null, 0);
    component.navigate('settings');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ambiente de trabalho');
  });
});
