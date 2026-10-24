// Cliente REST do `fe-cep-painel` (SPA) — fetch básico p/ uma API do backend (servida em /api/<rota>).
// Sem deps. baseUrl same-origin por padrão; passe '/api/<rota>' ao criar. Lança em status != 2xx.
// Uso:
//   import { makeApi } from './lib/restClient';
//   const api = makeApi('/api/<rota>');
//   const users = await api.get('/users');
//   const created = await api.post('/users', { name: 'ana' });
export function makeApi(baseUrl = '', opts = {}) {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  async function request(method, path, body, extra = {}) {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}), ...(extra.headers || {}) },
      body: body != null ? JSON.stringify(body) : undefined,
      credentials: opts.credentials || 'same-origin',
      ...extra,
    });
    if (!res.ok) throw new Error(method + ' ' + path + ' -> ' + res.status + ' ' + res.statusText);
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
  }
  return {
    get: (p, extra) => request('GET', p, undefined, extra),
    post: (p, body, extra) => request('POST', p, body, extra),
    put: (p, body, extra) => request('PUT', p, body, extra),
    patch: (p, body, extra) => request('PATCH', p, body, extra),
    del: (p, extra) => request('DELETE', p, undefined, extra),
  };
}
