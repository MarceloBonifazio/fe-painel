# score — painel de clientes

SPA Angular 22 com login OAuth2/OIDC Authorization Code + PKCE (Keycloak). USER consulta clientes e Score; ADMIN também cadastra, edita e exclui. A API aplica a autorização independentemente da interface.

## Executar

Use a stack completa documentada em `../be-api/README.md`. URL: **http://localhost:8088/painel/**.

Logins locais: `admin` / `admin-dev` e `user` / `user-dev`.

Para desenvolvimento com Node compatível com Angular 22:

```sh
npm ci
npm start -- --host 0.0.0.0 --port 3000 --serve-path /painel/
```

O gateway deve encaminhar `/painel` para este servidor. Keycloak e API precisam estar acessíveis no mesmo gateway.

## Configuração

`public/config.json` contém URLs públicas de API/Keycloak, realm e clientId. Não contém segredos. Em produção substitua esse arquivo no artefato servido. Tokens ficam em memória pelo adaptador oficial, nunca em localStorage; o interceptor os envia apenas para o caminho da API configurada e atualiza antes do vencimento.

Todas as telas de negócio têm guarda e só são renderizadas após autenticação. As rotas OAuth e os arquivos estáticos ficam públicos para permitir o login. O servidor de produção Nginx mantém o base path `/painel/` e o fallback da SPA.

## Qualidade

```sh
npm run build
npm test -- --watch=false
npx playwright install chromium
npm run test:e2e
```

Os testes E2E precisam da stack local ativa e usam os dois perfis no Keycloak. Cadastros temporários são removidos após os cenários. A suíte unitária testa permissões do painel e o escopo do interceptor Bearer.
