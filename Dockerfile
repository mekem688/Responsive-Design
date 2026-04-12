
# Installer toutes les dépendances
RUN pnpm install --frozen-lockfile

# Builder dans le bon ordre (libs d'abord, puis api-server)
RUN pnpm run build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN npm install -g pnpm@10

WORKDIR /app

# Copier uniquement ce qui est nécessaire pour la prod
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/artifacts/ ./artifacts/
COPY --from=builder /app/lib/ ./lib/

# Installer uniquement les dépendances de production
RUN pnpm install --frozen-lockfile --prod

EXPOSE 3000

CMD ["node", "artifacts/api-server/dist/index.mjs"]
