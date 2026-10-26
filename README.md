# score — painel de clientes

SPA Angular 22 com login OAuth2/OIDC Authorization Code + PKCE (Keycloak). USER consulta clientes e Score; ADMIN também cadastra, edita e exclui. A API aplica a autorização independentemente da interface.

## Arquitetura e requisitos

O frontend é uma SPA Angular 22 servida pelo container Node e publicada pelo gateway em `/painel/`. Usa Keycloak via Authorization Code + PKCE S256 e chama o `be-api` com Bearer Token. Não há Nginx no projeto. Requer Docker/Compose para a stack completa ou Node compatível com Angular 22.

## Executar

Use a stack completa documentada em `../be-api/README.md`. URL: **http://localhost:8088/painel/**.

Logins locais: `admin` / `admin-dev` e `user` / `user-dev`.

Para iniciar as dependências (API, PostgreSQL, Kafka, Keycloak e WireMock), siga o README do `be-api` ou, na raiz, execute `make up-staged`.

Para desenvolvimento com Node compatível com Angular 22:

```sh
npm ci
npm start -- --host 0.0.0.0 --port 3000 --serve-path /painel/
```

O gateway deve encaminhar `/painel` para este servidor. Keycloak e API precisam estar acessíveis no mesmo gateway.

## Configuração

`public/config.json` contém URLs públicas de API/Keycloak, realm e clientId. Não contém segredos. Em produção substitua esse arquivo no artefato servido. Tokens ficam em memória pelo adaptador oficial, nunca em localStorage; o interceptor os envia apenas para o caminho da API configurada e atualiza antes do vencimento.

## Access Token, Scalar e endpoints

Ao abrir http://localhost:8088/painel/, o login redireciona para Keycloak. Use `admin/admin-dev` (ADMIN) ou `user/user-dev` (USER). O frontend obtém o Access Token automaticamente e o envia para `/api/be-api/customers/**`. Para chamadas manuais, use `Authorization: Bearer <token>`; não utilize o ID Token.

O contrato completo e exemplos interativos estão no Scalar: http://localhost:8088/api/be-api/docs. O OpenAPI bruto está em http://localhost:8088/api/be-api/openapi.json. As operações usadas são `GET /customers`, `GET /customers/search`, `GET /customers/{id}/score` e, para ADMIN, `POST`, `PUT` e `DELETE /customers`.

Todas as telas de negócio têm guarda e só são renderizadas após autenticação. As rotas OAuth e os arquivos estáticos ficam públicos para permitir o login. O servidor de produção Nginx mantém o base path `/painel/` e o fallback da SPA.

## Qualidade

```sh
npm run build
npm test -- --watch=false
npx playwright install chromium
npm run test:e2e
```

Os testes E2E precisam da stack local ativa e usam os dois perfis no Keycloak. Cadastros temporários são removidos após os cenários. A suíte unitária testa permissões do painel e o escopo do interceptor Bearer. A cobertura mínima configurada é 80%.

## Integração Kafka

O frontend não acessa Kafka diretamente. Alterações são processadas pelo `be-api`, que publica e consome os eventos nos tópicos Kafka documentados no README do backend; a tela consulta a API para refletir o estado atualizado.
