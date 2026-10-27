import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Api } from './api';
import { Auth } from './auth';
describe('Customer API contract', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        Api,
        { provide: Auth, useValue: { config: { apiUrl: '/api/be-api' } } },
      ],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('sends search and status in the same paginated request', () => {
    TestBed.inject(Api).list(' 529.982.247-25 ', 'INACTIVE', 2).subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne(
      (r) => r.url === '/api/be-api/customers',
    );
    expect(req.request.params.get('query')).toBe('529.982.247-25');
    expect(req.request.params.get('status')).toBe('INACTIVE');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('10');
    req.flush({ content: [] });
  });
  it('uses the new global summary and customer history routes', () => {
    const api = TestBed.inject(Api);
    const http = TestBed.inject(HttpTestingController);
    api.summary().subscribe();
    http.expectOne('/api/be-api/customers/summary').flush({ total: 0 });
    api.events(3, 1).subscribe();
    const req = http.expectOne((r) => r.url === '/api/be-api/customers/3/events');
    expect(req.request.params.get('page')).toBe('1');
    req.flush({ content: [] });
    api.events(null).subscribe();
    http.expectOne((r) => r.url === '/api/be-api/customers/events').flush({ content: [] });
  });
});
