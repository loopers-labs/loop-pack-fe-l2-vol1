# week-10 배포 옵션 비교 — Vercel vs Docker

<!-- 완료조건(week-10-quests.md 203번 줄): 어떤 운영 조건에서 Docker 이미지가 필요한지 설명 가능해야 하고, 로컬 Node 프로세스가 아니라 Docker 컨테이너 안에서 production build가 떠야 한다 -->

## 1. Vercel 배포와 Docker 기반 배포에 각각 필요한 것

<!-- 197번 줄 -->

| 항목                 | Vercel (현재 배포)                                                              | Docker (로컬 실행까지 준비)                            |
| -------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 저장소에 필요한 파일 | 없음 (Git 저장소 연결)                                                          | `Dockerfile`, `.dockerignore`                          |
| 배포 산출물          | Vercel이 빌드한 배포                                                            | 컨테이너 이미지                                        |
| 빌드 실행            | Vercel 빌드 환경에서 `pnpm run build`                                           | `docker build` 실행 환경에서 `pnpm build`              |
| 런타임 Node 버전     | `package.json#engines` (`24.x`)                                                 | 베이스 이미지 `node:24.17.0-slim` (`.nvmrc`와 같은 값) |
| 환경 변수            | 대시보드의 Development / Preview / Production 스코프                            | `docker build --build-arg`, `docker run -e` (3절)      |
| 접속 URL             | Preview는 배포별 고유 URL, Production은 `loop-pack-fe-l2-vol1-gamma.vercel.app` | 컨테이너 포트를 호스트에 연결 (`-p 3100:3000`)         |
| 이미지 보관          | 필요 없음                                                                       | 레지스트리 (2절)                                       |
| rollback             | Instant Rollback (release-flow 문서 4절)                                        | 이전 태그 이미지로 컨테이너 재실행                     |

## 2. 이미지 안에서 `pnpm build`와 `pnpm start`가 실행되는 순서

<!-- 198번 줄 -->

`Dockerfile`은 `build` 단계와 `runtime` 단계로 나뉜다. `pnpm build`는 `docker build` 때 한 번, `pnpm start`는 `docker run` 때마다 실행된다.

| 순서 | 시점           | 단계    | 실행                                                          | 결과                                               |
| ---- | -------------- | ------- | ------------------------------------------------------------- | -------------------------------------------------- |
| 1    | `docker build` | build   | `pnpm install --frozen-lockfile`                              | devDependencies 포함 설치                          |
| 2    | `docker build` | build   | `pnpm build` → `prebuild`(`pnpm validate-env`) → `next build` | `.next` 생성. 검증 실패 시 여기서 이미지 빌드 중단 |
| 3    | `docker build` | runtime | `pnpm install --prod --frozen-lockfile --ignore-scripts`      | 실행용 dependencies만 설치                         |
| 4    | `docker build` | runtime | build 단계에서 `.next`, `public`, `next.config.ts` 복사       | 소스 코드와 devDependencies는 최종 이미지에 없음   |
| 5    | `docker run`   | runtime | `pnpm start` → `next start` (사용자 `node`)                   | `.next`를 읽어 3000 포트로 서비스                  |

## 3. 이미지가 CI/CD 파이프라인에서 만들어지는 위치, 태그, 레지스트리

<!-- 199번 줄 -->

### 3.1 파이프라인 위치

이번 과제에서는 CI에 이미지 빌드를 넣지 않았고, 로컬에서 빌드·실행했다. 파이프라인에 넣는다면 이미지는 품질 게이트를 통과한 뒤 만들어진다.

```
pnpm check 통과 → docker build → docker run으로 smoke test → 레지스트리에 push → 배포 플랫폼이 이미지 실행
```

### 3.2 이미지 태그 기준

| 태그 방식  | 의미                            | 주의할 점                     |
| ---------- | ------------------------------- | ----------------------------- |
| commit SHA | 어떤 코드에서 만들어졌는지 명확 | 사람이 읽기 어렵다            |
| semver tag | 릴리즈 버전과 연결하기 좋음     | 버전 정책이 필요하다          |
| `latest`   | 가장 최신처럼 보임              | 어떤 코드인지 추적하기 어렵다 |

로컬 실행 기록(5절)은 commit SHA 태그 `loop-pack-fe:2b8bcf96`을 썼다. 커밋되지 않은 파일이 섞이지 않도록 `git archive HEAD`를 빌드 컨텍스트로 넘겼다.

### 3.3 레지스트리가 필요한 이유

`docker build`로 만든 이미지는 빌드한 머신에만 있다. 배포 서버가 같은 이미지를 태그로 받아 실행하려면, 빌드한 머신과 배포 서버가 함께 접근하는 저장소가 필요하다. 이전 태그가 레지스트리에 남아 있어야 그 이미지로 되돌릴 수 있다.

## 4. Docker 컨테이너에 주입하는 환경 변수와 Vercel 환경 변수 비교

<!-- 200번 줄 -->

| 항목              | Vercel                                                        | Docker                                                                                                    |
| ----------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 주입 위치         | 대시보드 스코프별 등록                                        | 빌드는 `--build-arg`, 실행은 `-e`                                                                         |
| 빌드 값과 실행 값 | 한 배포에 같은 스코프 값이 들어간다                           | 따로 넣는다. `ARG`는 build 단계에만 있고 최종 이미지에 남지 않는다(`docker history`에서 `APP_ORIGIN` 0건) |
| 플랫폼 주입 값    | `VERCEL_ENV`, `VERCEL_URL`, `NEXT_PUBLIC_VERCEL_*`            | 없음                                                                                                      |
| `APP_ORIGIN` 출처 | Production은 스코프 등록값, Preview는 `VERCEL_URL`에서 만든다 | `-e APP_ORIGIN`. `VERCEL_ENV`가 없어 `getAppOrigin()`이 이 값을 쓴다                                      |
| 값 변경 반영      | 새 배포                                                       | 서버 전용 값은 컨테이너 재생성, `NEXT_PUBLIC_` 값은 빌드 때 번들에 들어가므로 이미지 재빌드               |
| 누락 시           | 빌드의 `validate-env`에서 실패                                | 빌드 인자 누락은 빌드 실패. 실행 값 누락은 컨테이너가 뜬 뒤 요청이 500 (5.2)                              |

- `.dockerignore`에서 `.env*`, `.mcp.json`, `.vercel`을 빌드 컨텍스트에서 뺐다.
- `-p 3100:3000`으로 실행했을 때 `og:image`가 `http://localhost:3000/...`로 나왔다. `APP_ORIGIN` 하나가 서버 self-fetch 주소(컨테이너 내부)와 `metadataBase`(외부 공개 주소)로 함께 쓰인다.

## 5. 로컬 이미지 빌드·컨테이너 실행 기록

<!-- 201번 줄 -->

- 일시: 2026-09-12 / 커밋: `2b8bcf96` / 환경: macOS, Docker Desktop 29.7.2 (arm64)
- 호스트 3000 포트를 로컬 개발 서버가 쓰고 있어 3100에 연결했다.

### 5.1 실행 명령과 결과

```bash
git archive --format=tar HEAD | docker build --build-arg APP_ORIGIN=http://localhost:3000 -t loop-pack-fe:2b8bcf96 -
docker run -d --name loop-pack-fe -p 3100:3000 -e APP_ORIGIN=http://localhost:3000 loop-pack-fe:2b8bcf96
DEPLOYMENT_URL=http://localhost:3100 pnpm test:smoke
```

| 항목          | 결과                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------ |
| 이미지 빌드   | 성공. `[validate-env] APP_ORIGIN 검증 통과`, `✓ Compiled successfully`, 이미지 1.1GB       |
| 컨테이너 기동 | `▲ Next.js 16.2.10`, `✓ Ready in 56ms`, 프로세스 `pnpm start`(사용자 `node`)               |
| 접속 URL      | `http://localhost:3100/` → 200                                                             |
| smoke test    | 3 passed (3.0s) — 홈 추천 상품 데이터, 상품 목록 항목, 미로그인 주문서 접근 시 로그인 이동 |

### 5.2 실패 경로

| 조건                               | 결과                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `--build-arg APP_ORIGIN` 없이 빌드 | `[validate-env] APP_ORIGIN이 설정되지 않았습니다.` → `pnpm build` exit 1, 이미지 생성 안 됨 |
| `-e APP_ORIGIN` 없이 실행          | 컨테이너는 기동, `GET /` 500, 로그 `⨯ Error: APP_ORIGIN이 설정되지 않았습니다.`             |

## 6. 결론

<!-- 195·201번 줄: 본인 결론 / 203번 줄: 어떤 운영 조건에서 Docker 이미지가 필요한가 — "무엇이 더 좋다"가 아니라 조건으로 설명 -->

| 운영 조건                                                                                         | 결정       | 근거                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 배포 대상이 Vercel이고, 리뷰용 Preview와 Production 두 환경만 필요하다 (현재)                     | **Vercel** | Preview 배포와 Instant Rollback을 플랫폼이 제공하고, 저장소에 추가할 파일이 없다. Docker는 이미지를 보관할 레지스트리와 컨테이너를 띄울 호스트를 따로 마련해야 한다. |
| 배포 대상이 Vercel이 아니다 — 사내 인프라, 컨테이너 플랫폼, 백엔드와 같은 배포 표준을 따라야 한다 | **Docker** | 산출물이 이미지라 실행할 플랫폼을 가리지 않는다. Vercel의 산출물은 그 플랫폼 안의 배포라 밖으로 옮길 수 없다.                                                        |
| 런타임을 정확히 고정해야 한다 — Node 패치 버전, OS 패키지, 실행 사용자                            | **Docker** | 베이스 이미지 `node:24.17.0-slim`이 패치 버전까지 고정하고, 실행 사용자도 `Dockerfile`에 적힌다. Vercel은 `engines`로 메이저 버전만 지정한다.                        |
