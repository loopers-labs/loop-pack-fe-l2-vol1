# .nvmrc·package.json#engines와 같은 Node 버전 — validate-env.ts를 node가 직접 실행하므로 타입 스트리핑이 되는 버전이어야 한다.
FROM node:24.17.0-slim AS base
# packageManager(pnpm@10.15.1)와 같은 버전. corepack은 사용자별 캐시라 non-root 실행 시 런타임에 다시 내려받는다.
RUN npm install -g pnpm@10.15.1
WORKDIR /app

# build 단계: devDependencies까지 설치하고 production build를 만든다.
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# 기본값을 두지 않는다 — 누락 시 prebuild(validate-env)가 이미지 빌드를 실패시킨다.
ARG APP_ORIGIN
RUN pnpm build

# runtime 단계: 실행에 필요한 것만 담는다.
FROM base AS runtime
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# prepare 스크립트(husky)는 devDependency라 --prod 설치에서는 실행할 수 없다.
RUN pnpm install --prod --frozen-lockfile --ignore-scripts
COPY --from=build /app/next.config.ts ./
COPY --from=build /app/public ./public
# next start가 .next/cache에 이미지 최적화 결과를 쓰므로 실행 사용자 소유로 둔다.
COPY --from=build --chown=node:node /app/.next ./.next
USER node
EXPOSE 3000
# APP_ORIGIN은 getAppOrigin()이 요청 시 읽으므로 docker run -e로 주입한다.
CMD ["pnpm", "start"]
