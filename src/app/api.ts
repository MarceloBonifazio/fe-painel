import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Auth } from "./auth";
export interface CustomerInput {
  name: string;
  cpf: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
}
export interface Customer extends CustomerInput {
  id: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface CustomerPage {
  content: Customer[];
  totalElements: number;
  totalPages: number;
  number: number;
}
export interface Score {
  cpf: string;
  score: number;
  classification: string;
}
@Injectable({ providedIn: "root" })
export class Api {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private get url() {
    return this.auth.config.apiUrl + "/customers";
  }
  list(name: string, status: string, page: number) {
    let params = new HttpParams().set("page", page).set("size", 10);
    if (name.trim()) params = params.set("name", name.trim());
    else if (status) params = params.set("status", status);
    return this.http.get<CustomerPage>(
      this.url + (name.trim() ? "/search" : ""),
      { params },
    );
  }
  save(input: CustomerInput, id: number | null) {
    return id === null
      ? this.http.post<Customer>(this.url, input)
      : this.http.put<Customer>(this.url + "/" + id, input);
  }
  delete(id: number) {
    return this.http.delete<void>(this.url + "/" + id);
  }
  score(id: number) {
    return this.http.get<Score>(this.url + "/" + id + "/score");
  }
}
