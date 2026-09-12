# Docker 이미지 빌드·실행 실측 기록

- 대상: `docs/assignments/week-10-quests.md` 6번(193~~203번 줄), 체크리스트 250~~255번 줄
- 성격: **사실 기록만.** 비교 결론·판단은 `docs/rfc/week10-deployment-options.md`에 사용자가 작성한다.
- 실측일: 2026-09-12 / HEAD `cb226706` (Dockerfile·`.dockerignore`는 미커밋 상태로 빌드)
- 재실측: 같은 날, 두 파일 커밋 `2b8bcf96` 후 `git archive HEAD`를 빌드 컨텍스트로 다시 빌드 (2절 끝). 제출 문서 `docs/rfc/week10-deployment-options.md` 5절은 이 재실측값을 쓴다
- 환경: macOS, Docker Desktop 29.7.2 (arm64). 호스트 3000 포트는 로컬 `next-server`가 사용 중이라 3100으로 매핑

## 1. 이미지 구성

| 단계      | 하는 일                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base`    | `node:24.17.0-slim`(= `.nvmrc`) + `npm install -g pnpm@10.15.1`(= `packageManager`)                                                                           |
| `build`   | `pnpm install --frozen-lockfile` → 소스 복사 → `ARG APP_ORIGIN` → `pnpm build` (= `prebuild`의 `validate-env` → `next build`)                                 |
| `runtime` | `pnpm install --prod --frozen-lockfile --ignore-scripts` → `build`에서 `next.config.ts`·`public`·`.next`만 복사 → `USER node` → `pnpm start` (= `next start`) |

`.dockerignore`로 `.env*`·`.mcp.json`·`.vercel`을 빌드 컨텍스트에서 제외했다.

## 2. 실행 명령과 결과

```bash
docker build --build-arg APP_ORIGIN=http://localhost:3000 -t loop-pack-fe:cb226706 .
docker run -d --name loop-pack-fe -p 3100:3000 -e APP_ORIGIN=http://localhost:3000 loop-pack-fe:cb226706
DEPLOYMENT_URL=http://localhost:3100 pnpm test:smoke
```

| 항목            | 결과                                                                              |
| --------------- | --------------------------------------------------------------------------------- |
| 이미지 빌드     | 성공, 87.7초 (캐시 없음)                                                          |
| `validate-env`  | `APP_ORIGIN 검증 통과: http://localhost:3000`, `NEXT_PUBLIC_ 허용 목록 검증 통과` |
| `next build`    | `✓ Compiled successfully in 3.6s`, 전 라우트 `ƒ (Dynamic)`                        |
| Google Fonts    | 빌드 중 실패 없음 (04 문서 7절 보류 항목: Docker 환경 **성공**)                   |
| husky `prepare` | `.git can't be found` 출력 후 설치 계속 (실패 아님)                               |
| 이미지 크기     | 1.1GB (`docker images` 기준). 컨테이너 내 `node_modules` 496M, `.next` 14M        |
| 기동            | `▲ Next.js 16.2.10`, `✓ Ready in 66ms`                                            |
| 실행 프로세스   | 사용자 `node`, `node /usr/local/bin/pnpm start`, Node v24.17.0                    |
| 접속 URL        | `http://localhost:3100/` → 200                                                    |
| smoke test      | 3 passed (home·products·orders-new), 2.8초                                        |

커밋 후 재실측 — 미추적 파일이 빌드 컨텍스트에 섞이지 않아 태그와 커밋 내용이 일치한다.

```bash
git archive --format=tar HEAD | docker build --build-arg APP_ORIGIN=http://localhost:3000 -t loop-pack-fe:2b8bcf96 -
docker run -d --name loop-pack-fe -p 3100:3000 -e APP_ORIGIN=http://localhost:3000 loop-pack-fe:2b8bcf96
DEPLOYMENT_URL=http://localhost:3100 pnpm test:smoke
```

| 항목        | 결과                                                                                                                                |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 이미지 빌드 | 성공, 70초 (`base` 단계만 캐시, 의존성 설치부터 다시 실행). `validate-env` 두 검증 통과, `✓ Compiled successfully in 1611ms`, 1.1GB |
| 기동        | `▲ Next.js 16.2.10`, `✓ Ready in 56ms`, `GET /` 200                                                                                 |
| smoke test  | 3 passed, 3.0초                                                                                                                     |

## 3. 실패 경로 실측

| 조건                               | 결과                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `--build-arg APP_ORIGIN` 없이 빌드 | `[validate-env] APP_ORIGIN이 설정되지 않았습니다.` → `pnpm build` exit 1, 이미지 생성 안 됨          |
| `-e APP_ORIGIN` 없이 실행          | 컨테이너는 정상 기동, `GET /` **500**, 로그 `⨯ Error: APP_ORIGIN이 설정되지 않았습니다.`             |
| `docker stop`                      | 0.17초 종료, ExitCode=1                                                                              |
| 빌드 인자가 최종 이미지에 남는지   | `docker history --no-trunc loop-pack-fe:2b8bcf96`에서 `APP_ORIGIN` 0건 (`ARG`는 build 단계에만 선언) |
