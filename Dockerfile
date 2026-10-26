FROM node:22-alpine AS dev
WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=512
COPY package*.json ./
RUN npm ci
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "npx ng serve --host 0.0.0.0 --port $PORT --serve-path /painel/"]
FROM node:22-alpine AS build
WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=512
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --output-path dist
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/dist/browser ./dist
RUN addgroup -S app && adduser -S -G app app \
    && chown -R app:app /app
EXPOSE 3000
USER app
CMD ["sh", "-c", "npx --yes serve -s dist -l $PORT"]
