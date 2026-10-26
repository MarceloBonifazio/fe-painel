import { TestBed } from "@angular/core/testing";
import {
  provideHttpClient,
  withInterceptors,
  HttpClient,
} from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { Auth, bearer } from "./auth";
describe("Bearer interceptor", () => {
  const token = vi.fn(async () => "access-token");
  beforeEach(() => {
    token.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([bearer])),
        provideHttpClientTesting(),
        {
          provide: Auth,
          useValue: { config: { apiUrl: "/api/be-api" }, token },
        },
      ],
    });
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it("attaches a refreshed token to the configured API", async () => {
    TestBed.inject(HttpClient).get("/api/be-api/customers").subscribe();
    await Promise.resolve();
    await Promise.resolve();
    const request = TestBed.inject(HttpTestingController).expectOne(
      "/api/be-api/customers",
    );
    expect(request.request.headers.get("Authorization")).toBe(
      "Bearer access-token",
    );
    expect(token).toHaveBeenCalledOnce();
    request.flush({});
  });
  for (const url of [
    "https://external.example/api/be-api/customers",
    "/api/be-api-evil/customers",
    "/auth/realms/nucleus",
  ]) {
    it("does not leak tokens to " + url, () => {
      TestBed.inject(HttpClient).get(url).subscribe();
      const request = TestBed.inject(HttpTestingController).expectOne(url);
      expect(request.request.headers.has("Authorization")).toBe(false);
      expect(token).not.toHaveBeenCalled();
      request.flush({});
    });
  }
});
