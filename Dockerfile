# syntax=docker/dockerfile:1
# Dockerfile ÚNICO, dois targets:
#   target: dev     → hot-reload, source por bind-mount
#   target: runner  → imagem de produção, non-root, só artefatos
#
# O compose escolhe o estágio pelo `target:` (service.yml → dev, service.prod.yml → runner) e o CI
# builda `--target runner`.
#
# Substituiu o par Dockerfile.dev/Dockerfile.prod: os dois divergiam em silêncio — uma correção
# aplicada num não chegava no outro (foi assim que um COPY de arquivo inexistente sobreviveu em
# 18 .prod).

# ═════════ dev ═════════
# DEV (fe-cep-painel · Angular) — `ng serve` com hot-reload. Source por bind-mount.
FROM node:22-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["sh", "/app/scripts/vault-entrypoint.sh"]
# --serve-path = BASE_PATH (/painel/): dev server serve sob /painel (Angular 22 tirou --base-href do serve).
CMD ["sh", "-c", "npx ng serve --host 0.0.0.0 --port $PORT --serve-path \"${BASE_PATH:-/}\""]

# ═════════ produção ═════════
# PROD (fe-cep-painel · Angular) — build estático (application builder → dist/browser),
# servido por um static server mínimo.
# Em produção real o dist/ vai p/ CDN (ver projects/fe-cep-painel/infra/aws, tfKind=spa).
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# --output-path fixa a base em dist/ → dist/browser. Sem ele o application builder escreve em
# dist/<nome-do-projeto>/browser (dist/app/browser) e o COPY abaixo não achava o diretório.
# O angular.json é o do `ng new` (o overlay não o sobrescreve), então a opção vem na linha.
RUN npx ng build --output-path dist

FROM node:22-alpine AS runner
RUN (addgroup -S app 2>/dev/null || groupadd -r app 2>/dev/null || true) \
    && (adduser -S -G app app 2>/dev/null || useradd -r -g app app 2>/dev/null || true)
WORKDIR /app
COPY --chown=app:app scripts/vault-entrypoint.sh scripts/vault-load.mjs /app/scripts/
ENV NODE_ENV=production
ENV PORT=3000
COPY --chown=app:app --from=build /app/dist/browser ./dist
EXPOSE 3000
USER app
ENTRYPOINT ["sh", "/app/scripts/vault-entrypoint.sh"]
CMD ["sh", "-c", "npx --yes serve -s dist -l $PORT"]
