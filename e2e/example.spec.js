import { test, expect } from "@playwright/test";
async function login(page, username, password) {
  await page.goto("");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.locator("#kc-login").click();
  await expect(
    page.getByRole("heading", { name: "Clientes", exact: true }),
  ).toBeVisible();
}
test("USER authenticates, reads and sees no write actions", async ({
  page,
}) => {
  await login(page, "user", "user-dev");
  await expect(page.getByRole("button", { name: "Novo cliente" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page.locator("#username")).toBeVisible();
});
test("ADMIN creates, searches, consults score, edits and removes a customer", async ({
  page,
}) => {
  await login(page, "admin", "admin-dev");
  const name = "E2E Cliente " + Date.now();
  const digits = Date.now().toString().slice(-9).split("").map(Number);
  for (let length = 9; length < 11; length++) {
    const remainder =
      (digits.reduce((sum, n, i) => sum + n * (length + 1 - i), 0) * 10) % 11;
    digits.push(remainder === 10 ? 0 : remainder);
  }
  const cpf = digits.join("");
  await page.getByRole("button", { name: "Novo cliente" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome completo").fill(name);
  await dialog.getByLabel("CPF").fill(cpf);
  await dialog.getByLabel("E-mail").fill("e2e@example.com");
  await dialog.getByRole("button", { name: "Salvar cliente" }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByLabel("Buscar pelo nome").fill(name);
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Score" }).click();
  await expect(page.getByRole("dialog")).toContainText("750");
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await row.getByRole("button", { name: "Editar", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Status", { exact: true })
    .selectOption("INACTIVE");
  await page.getByRole("button", { name: "Salvar cliente" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(row).toContainText("Inativo");
  await row.getByRole("button", { name: "Excluir", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText("Nenhum cliente encontrado", { exact: true }),
  ).toBeVisible();
});
