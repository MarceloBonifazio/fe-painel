import { test, expect } from '@playwright/test';

// Exemplo desativado — remova o .skip e escreva os testes de navegação da sua app.
test.skip('home carrega', async ({ page }) => {
  await page.goto('');          // relativo ao baseURL (mantém a base /painel/)
  await expect(page).toHaveTitle(/.+/);
});
