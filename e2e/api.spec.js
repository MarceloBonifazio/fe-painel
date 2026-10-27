import { test, expect } from '@playwright/test';
import { createHash, randomBytes } from 'node:crypto';

async function accessToken(page, request, username, password) {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const origin = new URL(process.env.E2E_BASE_URL || 'http://localhost:8088/painel/').origin;
  const redirect = origin + '/painel/';
  const params = new URLSearchParams({
    client_id: 'fe-painel',
    response_type: 'code',
    scope: 'openid',
    redirect_uri: redirect,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    response_mode: 'query',
    state: randomBytes(16).toString('hex'),
  });
  await page.goto(origin + '/auth/realms/nucleus/protocol/openid-connect/auth?' + params);
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await Promise.all([
    page.waitForURL((url) => url.searchParams.has('code')),
    page.locator('#kc-login').click(),
  ]);
  const code = new URL(page.url()).searchParams.get('code');
  const response = await request.post(
    origin + '/auth/realms/nucleus/protocol/openid-connect/token',
    {
      form: {
        grant_type: 'authorization_code',
        client_id: 'fe-painel',
        redirect_uri: redirect,
        code,
        code_verifier: verifier,
      },
    },
  );
  expect(response.status()).toBe(200);
  return { token: (await response.json()).access_token, origin };
}

test('real USER JWT reads, cannot write, and forged signatures are rejected', async ({
  page,
  request,
}) => {
  const { token, origin } = await accessToken(page, request, 'user', 'user-dev');
  const api = origin + '/api/be-api';
  expect((await request.get(api + '/customers')).status()).toBe(401);
  expect(
    (
      await request.get(api + '/customers', { headers: { Authorization: 'Bearer ' + token } })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post(api + '/customers', {
        headers: { Authorization: 'Bearer ' + token },
        data: {},
      })
    ).status(),
  ).toBe(403);
  for (const path of ['/customers/events', '/customers/1/events']) {
    expect(
      (await request.get(api + path, { headers: { Authorization: 'Bearer ' + token } })).status(),
    ).toBe(403);
  }
  const parts = token.split('.');
  parts[2] = (parts[2][0] === 'A' ? 'B' : 'A') + parts[2].slice(1);
  expect(
    (
      await request.get(api + '/customers', {
        headers: { Authorization: 'Bearer ' + parts.join('.') },
      })
    ).status(),
  ).toBe(401);
});
