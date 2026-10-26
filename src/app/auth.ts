import { Injectable, inject, signal } from "@angular/core";
import { HttpInterceptorFn } from "@angular/common/http";
import { CanActivateFn } from "@angular/router";
import { from, switchMap } from "rxjs";
import Keycloak from "keycloak-js";
export interface AppConfig {
  apiUrl: string;
  keycloakUrl: string;
  realm: string;
  clientId: string;
}
@Injectable({ providedIn: "root" })
export class Auth {
  private client?: Keycloak;
  config!: AppConfig;
  readonly ready = signal(false);
  readonly error = signal("");
  readonly admin = signal(false);
  readonly username = signal("");
  async init() {
    try {
      const response = await fetch(new URL("config.json", document.baseURI), {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Configuração indisponível");
      this.config = await response.json();
      this.client = new Keycloak({
        url: new URL(this.config.keycloakUrl, location.origin).href,
        realm: this.config.realm,
        clientId: this.config.clientId,
      });
      const authenticated = await this.client.init({
        onLoad: "login-required",
        pkceMethod: "S256",
        checkLoginIframe: false,
        redirectUri: new URL("./", document.baseURI).href,
      });
      this.admin.set(this.client.hasRealmRole("ADMIN"));
      this.username.set(
        String(this.client.tokenParsed?.["preferred_username"] ?? ""),
      );
      this.ready.set(authenticated);
    } catch {
      this.error.set(
        "Não foi possível iniciar a autenticação. Verifique o serviço de identidade e recarregue a página.",
      );
    }
  }
  async token(): Promise<string> {
    if (!this.client?.authenticated) throw new Error("Sessão encerrada");
    try {
      await this.client.updateToken(30);
      this.admin.set(this.client.hasRealmRole("ADMIN"));
      return this.client.token!;
    } catch {
      this.ready.set(false);
      await this.client.login();
      throw new Error("Sessão expirada");
    }
  }
  logout() {
    return this.client?.logout({
      redirectUri: new URL("./", document.baseURI).href,
    });
  }
}
export const authenticated: CanActivateFn = () => inject(Auth).ready();
export const bearer: HttpInterceptorFn = (request, next) => {
  const auth = inject(Auth);
  const target = new URL(request.url, location.origin);
  const api = new URL(auth.config.apiUrl, location.origin);
  if (
    target.origin !== api.origin ||
    !(
      target.pathname === api.pathname ||
      target.pathname.startsWith(api.pathname + "/")
    )
  )
    return next(request);
  return from(auth.token()).pipe(
    switchMap((token) =>
      next(request.clone({ setHeaders: { Authorization: "Bearer " + token } })),
    ),
  );
};
