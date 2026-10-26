// Teste-exemplo de fe-painel — substitua pelos testes da sua lógica.
// O gate de cobertura (testing.minCoverage no project.yaml) só bloqueia release/prod quando > 0.
import { describe, it, expect } from '@jest/globals';

describe('smoke', () => {
  it('exemplo', () => {
    expect(1 + 1).toBe(2);
  });
});
