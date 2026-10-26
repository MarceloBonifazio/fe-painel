import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideRouter } from "@angular/router";
import { Auth, authenticated, bearer } from "./auth";
import { Customers } from "./customers";
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([bearer])),
    provideAppInitializer(() => inject(Auth).init()),
    provideRouter([
      {
        path: "",
        pathMatch: "full",
        component: Customers,
        canActivate: [authenticated],
      },
      { path: "**", redirectTo: "" },
    ]),
  ],
};
