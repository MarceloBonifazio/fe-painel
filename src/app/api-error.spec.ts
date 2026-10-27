import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from './api-error';

describe('API error messages', () => {
  it.each([
    [0, 'Verifique sua conexão'],
    [400, 'Verifique os dados'],
    [401, 'Sessão expirada'],
    [403, 'Seu perfil não permite'],
    [404, 'não encontrado'],
    [408, 'demorou para responder'],
    [409, 'conflito'],
    [422, 'Verifique os dados'],
    [429, 'Muitas solicitações'],
    [500, 'erro interno'],
    [502, 'resposta inválida'],
    [503, 'temporariamente indisponível'],
    [504, 'demorou para responder'],
    [599, 'Não foi possível concluir'],
  ])('provides a useful message for HTTP %s without a JSON body', (status, message) => {
    expect(
      apiErrorMessage(new HttpErrorResponse({ status, error: '<html>Proxy error</html>' })),
    ).toContain(message);
  });

  it('preserves validation messages and domain details', () => {
    expect(
      apiErrorMessage(
        new HttpErrorResponse({
          status: 400,
          error: { errors: { cpf: 'CPF inválido', name: ['Nome obrigatório'] } },
        }),
      ),
    ).toBe('CPF inválido · Nome obrigatório');
    expect(
      apiErrorMessage(
        new HttpErrorResponse({
          status: 404,
          error: { detail: 'Score não encontrado para este CPF.' },
        }),
        'score',
      ),
    ).toBe('Score não encontrado para este CPF.');
  });

  it('does not display internal server details', () => {
    expect(
      apiErrorMessage(
        new HttpErrorResponse({ status: 500, error: { detail: 'SQL connection password=secret' } }),
      ),
    ).not.toContain('password');
  });

  it('explains external score failures', () => {
    expect(apiErrorMessage(new HttpErrorResponse({ status: 502 }), 'score')).toContain(
      'consultar o score',
    );
  });
});
