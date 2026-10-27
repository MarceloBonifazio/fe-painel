# CrediScore — painel de clientes

SPA Angular 22 com login OAuth2/OIDC Authorization Code + PKCE (Keycloak). USER consulta clientes e Score; ADMIN também cadastra, edita e exclui. A API aplica a autorização independentemente da interface.

## Interface e dados

O painel inclui navegação lateral, indicadores globais, busca por nome/CPF/e-mail combinada com status, tabela com score e classificação, paginação e janelas de cadastro, consulta de score e detalhes. Os detalhes incluem dados gerais, última consulta e histórico paginado. A tela Eventos exibe atividades registradas pela aplicação, incluindo comandos de status recebidos via Kafka. Configurações mostra o perfil para todos; informações do ambiente, Eventos e histórico do cliente são exclusivos de ADMIN. A API retorna 403 para USER nas rotas de eventos.

Os totais vêm de `GET /customers/summary` e não são calculados apenas com a página visível. A média usa o último score bem-sucedido de cada cliente. A listagem utiliza os scores persistidos; uma consulta externa só ocorre ao acionar **Score**. Alterar o CPF invalida o resultado anterior. A API precisa da migração V2 para atender a esta versão do painel.

O layout é responsivo, com tabela rolável em telas menores e navegação mobile. As janelas permitem fechar com Escape, mantêm o foco dentro do diálogo e restauram o foco ao fechar. Erros HTTP mantêm mensagens específicas e permitem repetir a consulta de score.

## Arquitetura e requisitos

O frontend é uma SPA Angular 22 servida pelo container Node e publicada pelo gateway em `/painel/`. Usa Keycloak via Authorization Code + PKCE S256 e chama o `be-api` com Bearer Token. Não há Nginx no projeto. Requer Docker/Compose para a stack completa ou Node compatível com Angular 22.

## Executar

Use a stack completa documentada em `../be-api/README.md`. URL: **http://localhost:8088/painel/**.

Logins locais: `admin` / `admin-dev` e `user` / `user-dev`.

Para iniciar as dependências (API, PostgreSQL, Kafka, Keycloak e WireMock), execute `docker compose up --build -d` no diretório do `be-api`.

Para desenvolvimento com Node compatível com Angular 22:

```sh
npm ci
npm start -- --host 0.0.0.0 --port 3000 --serve-path /painel/
```

Para usar esse servidor de desenvolvimento atrás do gateway, remova o middleware `strip-frontend` da rota `frontend` em `../be-api/dev/routes.yml`: o `ng serve` já atende em `/painel/`. Na stack Docker com target `runner`, mantenha esse middleware para remover `/painel` antes de buscar os arquivos estáticos na raiz do servidor. Keycloak e API precisam estar acessíveis no mesmo gateway.

## Configuração

`public/config.json` contém URLs públicas de API/Keycloak, realm e clientId. Não contém segredos. Em produção substitua esse arquivo no artefato servido. Tokens ficam em memória pelo adaptador oficial, nunca em localStorage; o interceptor os envia apenas para o caminho da API configurada e atualiza antes do vencimento.

## Access Token, Scalar e endpoints

Ao abrir http://localhost:8088/painel/, o login redireciona para Keycloak. Use `admin/admin-dev` (ADMIN) ou `user/user-dev` (USER). O frontend obtém o Access Token automaticamente e o envia para `/api/be-api/customers/**`. Para chamadas manuais, use `Authorization: Bearer <token>`; não utilize o ID Token.

O contrato completo e exemplos interativos estão no Scalar: http://localhost:8088/api/be-api/docs. O OpenAPI bruto está em http://localhost:8088/api/be-api/openapi.json. As operações usadas são `GET /customers?query=...&status=...`, `GET /customers/summary`, `GET /customers/{id}`, `GET /customers/events`, `GET /customers/{id}/events`, `GET /customers/{id}/score` e, para ADMIN, `POST`, `PUT` e `DELETE /customers`.

Todas as telas de negócio têm guarda e só são renderizadas após autenticação. As rotas OAuth e os arquivos estáticos ficam públicos para permitir o login. O servidor Node usa fallback da SPA; o gateway remove o prefixo `/painel` e o Angular mantém o base path `/painel/`.

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
