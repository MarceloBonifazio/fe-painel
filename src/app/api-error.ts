import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(
  error: HttpErrorResponse,
  context: 'customer' | 'score' = 'customer',
): string {
  const body = error.error;
  const detail = typeof body?.detail === 'string' ? body.detail.trim() : '';
  switch (error.status) {
    case 0:
      return 'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.';
    case 400:
    case 422: {
      const fields = body?.errors;
      const messages =
        fields && typeof fields === 'object'
          ? Object.values(fields)
              .flat()
              .filter((value): value is string => typeof value === 'string' && !!value.trim())
          : [];
      return messages.join(' · ') || detail || 'Verifique os dados informados e tente novamente.';
    }
    case 401:
      return 'Sessão expirada. Entre novamente.';
    case 403:
      return 'Seu perfil não permite esta operação.';
    case 404:
      return (
        detail ||
        (context === 'score'
          ? 'Cliente ou score não encontrado. Atualize a lista e tente novamente.'
          : 'Cliente ou recurso não encontrado. Atualize a lista e tente novamente.')
      );
    case 409:
      return (
        detail ||
        'Os dados estão em conflito. Verifique o CPF e atualize a lista antes de tentar novamente.'
      );
    case 429:
      return 'Muitas solicitações em pouco tempo. Aguarde alguns instantes e tente novamente.';
    case 500:
      return 'Ocorreu um erro interno no servidor. Tente novamente em instantes.';
    case 502:
      return context === 'score'
        ? 'Não foi possível consultar o score no serviço externo. Tente novamente em instantes.'
        : 'O serviço recebeu uma resposta inválida. Tente novamente em instantes.';
    case 503:
      return 'Serviço temporariamente indisponível. Tente novamente em instantes.';
    case 408:
    case 504:
      return 'O serviço demorou para responder. Tente novamente em instantes.';
    default:
      return error.status >= 400 && error.status < 500 && detail
        ? detail
        : 'Não foi possível concluir a operação. Tente novamente.';
  }
}
