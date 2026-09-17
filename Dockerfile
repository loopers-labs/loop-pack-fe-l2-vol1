# syntax=docker/dockerfile:1
FROM node:24.17.0-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# 기본값을 두지 않는다. appOrigin.ts가 기본값을 금지한 이유가 그대로 적용된다 —
# 조용한 localhost 기본값은 불일치를 숨긴 채 결과물에 굳는다.
# 여기에 기본값이 있으면 build 앞의 env:check가 그 값으로 통과해 게이트가 무력해진다.
# 값을 안 주면 `pnpm build`의 env:check가 막는다.
ARG APP_ORIGIN
ENV APP_ORIGIN=$APP_ORIGIN
RUN pnpm build

FROM node:24.17.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
# getAppOrigin은 요청마다 process.env를 읽으므로 runtime에도 같은 값이 필요하다.
# build에 쓴 값을 이미지에 구워두고 `docker run -e APP_ORIGIN=...`으로 덮어쓸 수 있게 한다.
# HOSTNAME과 PORT는 컨테이너 bind 설정이고 APP_ORIGIN은 사용자가 접근하는 origin이다.
ARG APP_ORIGIN
ENV APP_ORIGIN=$APP_ORIGIN
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
