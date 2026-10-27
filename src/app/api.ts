import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Auth } from './auth';
export interface CustomerInput {
  name: string;
  cpf: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
}
export interface Customer extends CustomerInput {
  id: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  score?: number | null;
  classification?: string | null;
  scoreQueriedAt?: string | null;
}
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size?: number;
}
export type CustomerPage = Page<Customer>;
export interface Score {
  cpf: string;
  score: number;
  classification: string;
  queriedAt?: string;
}
export interface Summary {
  total: number;
  active: number;
  inactive: number;
  averageScore: number | null;
  scoredCustomers: number;
  newThisMonth: number;
}
export interface Activity {
  id: number;
  customerId: number;
  type: string;
  description: string;
  createdAt: string;
}
@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private get url() {
    return this.auth.config.apiUrl + '/customers';
  }
  list(query: string, status: string, page: number) {
    let params = new HttpParams().set('page', page).set('size', 10);
    if (query.trim()) params = params.set('query', query.trim());
    if (status) params = params.set('status', status);
    return this.http.get<CustomerPage>(this.url, { params });
  }
  summary() {
    return this.http.get<Summary>(this.url + '/summary');
  }
  get(id: number) {
    return this.http.get<Customer>(this.url + '/' + id);
  }
  events(customerId: number | null, page = 0) {
    return this.http.get<Page<Activity>>(
      this.url + (customerId === null ? '' : '/' + customerId) + '/events',
      { params: { page, size: 10 } },
    );
  }
  save(input: CustomerInput, id: number | null) {
    return id === null
      ? this.http.post<Customer>(this.url, input)
      : this.http.put<Customer>(this.url + '/' + id, input);
  }
  delete(id: number) {
    return this.http.delete<void>(this.url + '/' + id);
  }
  score(id: number) {
    return this.http.get<Score>(this.url + '/' + id + '/score');
  }
}
