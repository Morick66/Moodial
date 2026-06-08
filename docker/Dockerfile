FROM node:22-alpine AS base

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/prompts/package.json packages/prompts/package.json
RUN npm --version && \
    npm ping --registry=https://registry.npmjs.org/ --fetch-timeout=15000 && \
    npm ci --no-audit --no-fund --foreground-scripts --fetch-timeout=30000 --fetch-retries=1 --loglevel=verbose

FROM deps AS builder
COPY . .
RUN npm run db:generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/node_modules ./node_modules
COPY docker/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
