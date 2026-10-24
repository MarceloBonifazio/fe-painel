import { defineConfig } from '@playwright/test';
// E2E config-only — escreva os specs em e2e/. NÃO roda no gate de release/prod (só unit+cobertura barram).
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: process.env.E2E_BASE_URL || 'http://localhost:8088/painel/' },
});
