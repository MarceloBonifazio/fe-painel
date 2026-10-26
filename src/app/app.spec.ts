import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { of } from "rxjs";
import { Customers } from "./customers";
import { Auth } from "./auth";
import { Api } from "./api";
describe("Customer permissions", () => {
  const admin = signal(false);
  const api = {
    list: vi.fn(() =>
      of({ content: [], totalElements: 0, totalPages: 0, number: 0 }),
    ),
    save: vi.fn(() => of({})),
    delete: vi.fn(() => of(undefined)),
    score: vi.fn(),
  };
  beforeEach(async () => {
    admin.set(false);
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [Customers],
      providers: [
        {
          provide: Auth,
          useValue: { admin, username: signal("user"), logout: vi.fn() },
        },
        { provide: Api, useValue: api },
      ],
    }).compileComponents();
  });
  it("allows USER to query and hides write actions", () => {
    const fixture = TestBed.createComponent(Customers);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Clientes");
    expect(fixture.nativeElement.textContent).not.toContain("Novo cliente");
    expect(api.list).toHaveBeenCalledWith("", "", 0);
  });
  it("allows ADMIN to create a customer", () => {
    admin.set(true);
    const fixture = TestBed.createComponent(Customers);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Novo cliente");
    const component = fixture.componentInstance;
    component.edit();
    component.form = {
      name: "João",
      cpf: "52998224725",
      email: "joao@example.com",
      status: "ACTIVE",
    };
    component.save();
    expect(api.save).toHaveBeenCalledWith(component.form, null);
    expect(component.editing()).toBe(false);
  });
});
