import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Auth } from "./auth";
@Component({
  selector: "app-root",
  imports: [RouterOutlet],
  template: `
    @if (auth.error()) {
      <main class="auth-error" role="alert">
        <h1>Autenticação indisponível</h1>
        <p>{{ auth.error() }}</p>
        <button (click)="reload()">Tentar novamente</button>
      </main>
    } @else if (auth.ready()) {
      <router-outlet />
    }
  `,
})
export class App {
  readonly auth = inject(Auth);
  reload() {
    location.reload();
  }
}
