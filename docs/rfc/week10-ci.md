# RFC: Week 10 — CI 파이프라인과 AI 협업

Branch `feat/week-10` · Status: 제출 · Created 2026-09-11

**문서 구조** — 1–5절은 과제 1–5단계의 결정과 증거, 6절은 워크플로 보안 하드닝, 7절은 "함께 생각해 볼 질문" 4개다. 숫자는 전부 fork(`yo-ong/loop-pack-fe-l2-vol1`) 의 Actions run·PR·Vercel 배포에서 가져왔고 run 번호를 함께 적었다. 실험용 PR(#2·#4–#8)은 머지하지 않고 닫았다.

**빠르게 읽기** — 1.3 Before/After 표 · 1.4 캐시 실험(pnpm 캐시는 이득이 없었다) · 2.2 조건부 E2E 의 안전 논리 · 3.2 예산 근거표 · 3.5 빨간불 PR · 4.2 잘 잡은 리뷰 / 헛소리 · 5.3 기계·AI·사람 판단 · 7 질문 답변.

---

## 1. CI 파이프라인 측정·최적화

### 1.1 Before 고정

기존 `quality.yml` 은 job 하나가 `pnpm check`(`test && lint && typecheck && build && test:e2e`) 를 직렬로 돌렸다. 측정 전 바꾼 것은 `runs-on: ubuntu-latest → ubuntu-24.04`(측정 중 이미지 롤링 방지) 한 줄뿐이다(PR #2, 브랜치 `ci/before-baseline`).

측정 방법 — 같은 커밋을 `gh run rerun` 으로 반복하고, `gh api repos/{o}/{r}/actions/runs/{id}/jobs` 의 step `started_at/completed_at`(1초 해상도)과 run 의 `run_started_at → updated_at` 을 wall-clock 으로 삼았다. **cold** 는 매회 `gh cache delete --all` 후 `gh cache list` 가 비어 있음을 확인하고 실행, **warm** 은 직전 실행이 저장한 캐시를 그대로 둔 채 실행.

### 1.2 병목 지목 (타임스탬프 기준)

Before cold-1(run 34498107867 attempt 1, wall 101s) 의 step 별 소요:

| step                            |    소요 | 비고                                                                        |
| ------------------------------- | ------: | --------------------------------------------------------------------------- |
| Set up pnpm / Node.js           | 3s / 6s |                                                                             |
| Install dependencies            |      6s | 캐시 없음, `downloaded 625`                                                 |
| **Install Playwright Chromium** | **24s** | 가장 긴 단일 step. 브라우저 다운로드 + apt                                  |
| **Run quality checks**          | **46s** | 로그 타임스탬프로 쪼개면 test 10 · lint 5 · typecheck 4 · build 10 · e2e 16 |
| Post Set up Node.js (캐시 저장) |      5s |                                                                             |

병목은 둘이다. (a) Playwright 브라우저 설치 24–25초 — 매 실행 반복되는 순수 다운로드. (b) `pnpm check` 46초 중 서로 독립인 test·lint·typecheck 19초가 build·e2e 와 직렬로 묶여 있다. build 10초와 e2e 16초는 검증 자체라 줄일 대상이 아니다.

### 1.3 Before / After

| 조건        | raw (s)         |  중앙값 | 범위    | run                     |
| ----------- | --------------- | ------: | ------- | ----------------------- |
| Before cold | 101 / 107 / 106 | **106** | 101–107 | 34498107867 attempt 1–3 |
| Before warm | 93 / 104 / 135  | **104** | 93–135  | 34498107867 attempt 4–6 |
| After cold  | 104 / 83 / 82   |  **83** | 82–104  | 34499302247 attempt 5–7 |
| After warm  | 63 / 63 / 55    |  **63** | 55–63   | 34499302247 attempt 2–4 |

- warm 기준 **104 → 63초(−39%)**. Before warm 범위(93–135)와 After warm 범위(55–63)가 겹치지 않으므로 측정 흔들림보다 큰 변화다. Before warm-3 의 135초는 러너 편차(같은 step 구성에서 +30초)로, 3회 이상 재고 범위를 남기라는 지침이 왜 있는지 보여준 표본이다.
- 줄어든 자리가 지목한 병목과 일치한다. After warm 의 build job: setup 15–19 · build 10–11 · **Playwright 캐시 복원 3–5(설치 24–39 대체)** · e2e 16–18. lint 24–34 · typecheck 22–33 · unit 31–38초는 build job 과 병렬로 돌아 임계 경로에서 빠졌다.
- cold 는 106 → 83초. 브라우저 캐시가 없으면 After 도 22–39초를 다시 쓰므로 warm 만큼 줄지 않는다. 즉 개선의 절반은 캐시, 절반은 병렬화다.
- 검증 항목은 Before 와 After 가 같다(test 180 · lint · typecheck · build · e2e 12). 이후 3단계에서 validate-env·size-limit step 이 추가됐지만 1단계 After 측정은 그 전 커밋(`15918a05`)에서 했다.

**함정 확인** — job 을 4개로 나누면 install 이 4번 돈다. 각 setup(composite action) 은 12–23초이고 lint·typecheck·unit job 은 임계 경로 밖이라 wall-clock 에는 영향이 없지만 **청구 시간은 늘어난다**(Σjob ≈ 150s vs Before 100s). 공개 저장소라 무료이고 PR 체크 목록에 항목별 초록·빨강이 보이는 값이 더 크다고 판단했다. build 와 e2e 를 한 job 에 둔 이유도 같다 — artifact 로 넘기려면 job 하나가 setup 에 20초 안팎을 더 쓰고 업/다운로드까지 더해 오히려 느리다.

### 1.4 캐시 hit / miss 증명

**warm 로그** (run 34499302247 attempt 2, build job)

```
Cache restored from key: node-cache-Linux-x64-pnpm-76e7a1702a79622d9a9acbe77813191f884d7eead7ec66146b7cd16b22e6b633
Progress: resolved 625, reused 625, downloaded 0, added 625, done
Cache restored from key: playwright-Linux-1.62.1
```

**miss 재현** (PR #4, `pnpm-lock.yaml` 끝에 빈 줄 1개 — 파싱 내용은 같아 `--frozen-lockfile` 은 통과하고 `hashFiles` 만 바뀐다)

| 조건                  | pnpm 캐시 로그                                                  | 캐시 복원 | `pnpm install` |  합계 |
| --------------------- | --------------------------------------------------------------- | --------: | -------------: | ----: |
| 같은 PR rerun (hit)   | `Cache restored from key: …decb6e…`, `reused 625, downloaded 0` |     10.6s |           2.1s | 12.7s |
| lockfile 빈 줄 (miss) | `pnpm cache is not found`, `reused 0, downloaded 625`           |         — |           5.1s | 10.8s |
| 캐시 전부 삭제 (cold) | 같음                                                            |         — |           5.9s | 11.6s |

Playwright 캐시는 키가 `@playwright/test` 버전(`playwright-Linux-1.62.1`)이라 lockfile 이 바뀌어도 hit 를 유지했다(run 34501543332). 실험이 끝난 뒤 PR #4 를 닫고 브랜치를 지웠으며 `feat/week-10` 의 lockfile 은 건드리지 않았다.

**발견 1 — pnpm store 캐시는 이 레포에서 이득이 없다.** 625개 패키지를 GitHub 네트워크로 받는 데 5초, 196MB 캐시를 복원하는 데 10초가 든다. 효과가 있는 캐시는 Playwright 브라우저(269MB, 설치 22–39초 → 복원 3–8초)뿐이다. pnpm 캐시는 해롭지 않고 스타터가 준 설정이라 유지하되, "캐시를 걸었다 = 빨라졌다" 가 아님을 기록한다.

**발견 2 — Actions 캐시는 브랜치(PR ref) 단위로 격리된다.** PR #3 의 첫 run(34499302247 attempt 1) 은 PR #2 가 방금 저장한 pnpm 캐시를 보지 못했다(`pnpm cache is not found` ×4 job). 새 PR 은 자기 ref 와 base(main) 의 캐시만 읽으므로, main 이 새 워크플로로 한 번 돌아 캐시를 저장해야 이후 PR 이 warm 으로 시작한다. 이 fork 의 main 은 과제 완료 후 머지되기 전까지 옛 lockfile 캐시만 갖고 있어 모든 실험 PR 이 첫 run 에서 cold 였다.

### 1.5 고른 전략과 안 고른 전략

| 전략                                         | 채택 | 근거                                                                                                                                                                                                                           |
| -------------------------------------------- | :--: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Playwright 브라우저 캐시                     |  ✓   | 가장 긴 단일 step(24–25초) 이 순수 다운로드. 키는 lockfile 이 아니라 Playwright 버전으로 — 무관한 의존성 변경에 269MB 를 다시 받지 않게                                                                                        |
| job 병렬화 (lint·typecheck·unit ↔ build+e2e) |  ✓   | 독립 검증 19초가 직렬로 묶여 있었다. PR 체크 목록에 항목별 결과가 보이는 부수 효과                                                                                                                                             |
| `concurrency` 그룹                           |  ✓   | 측정된 병목은 아니지만 같은 PR 연속 push 의 중복 실행을 막는 비용·정확성 장치. `group: ${{ github.workflow }}-${{ github.ref }}`, `cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}` 로 main push 는 취소하지 않는다 |
| composite setup action                       |  ✓   | 4개 job 의 install 조건이 같아야 측정이 성립한다. pnpm 버전은 `packageManager` 한 곳에서만 읽는다                                                                                                                              |
| build → e2e artifact 분리                    |  ✗   | job 추가 setup ≈ 20초 + 업/다운로드 > 얻는 병렬성. 1.3 의 셈법                                                                                                                                                                 |
| `.next/cache` 캐시                           |  ✗   | Turbopack 영구 캐시가 꺼져 있어 1.2MB(폰트 캐시)뿐이고 CI build 는 이미 6–11초                                                                                                                                                 |
| e2e `workers` 증가 / `NODE_ENV=test`         |  ✗   | 2 vCPU 러너에서 workers 2 는 9주차의 의도적 상한. mock API 의 500ms 지연은 production 서버가 겪는 그대로 두어야 검증 대상이 같다                                                                                               |

---

## 2. 조건부 실행

### 2.1 설계

E2E 는 `build` job 안의 **조건부 step** 이다(별도 job 이 아니다). `dorny/paths-filter` 로 아래 경로를 `app` 그룹으로 정의하고, 결정 우선순위는 다음과 같다. 이벤트 값은 `env:` 로만 넘겨 `run:` 본문에 보간하지 않는다.

| 순위 | 조건                                                                                                                                                                            | 결정 | 이유                                       |
| ---: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------ |
|    1 | `push` to `main`                                                                                                                                                                | 실행 | merge queue 대체 — 머지된 트리 전체를 검증 |
|    2 | PR 에 `run-e2e` 라벨                                                                                                                                                            | 실행 | 사람이 명시적으로 요청                     |
|    3 | draft PR                                                                                                                                                                        | skip | 작성 중                                    |
|    4 | `src/**` `e2e/**` `public/**` `playwright.config.ts` `next.config.ts` `tsconfig.json` `package.json` `pnpm-lock.yaml` `.github/workflows/quality.yml` `.github/actions/**` 변경 | 실행 | build·start·Playwright 의 입력 전체        |
|    5 | 그 외(문서·기타 설정만)                                                                                                                                                         | skip |                                            |

`pull_request.types` 에 `labeled`·`unlabeled`·`ready_for_review` 를 추가해야 2·3번이 재평가된다. 기본 types 만 두면 라벨을 붙여도 아무 일이 없다.

### 2.2 스킵이 안전한 이유

1. lint·typecheck·unit·build 는 **모든 PR 에서 조건 없이** 돈다. 문서만 고친 PR 이 빌드를 깨더라도 잡힌다.
2. 스킵되는 것은 E2E 하나이고, 그것도 `app` 그룹 밖의 변경일 때만이다. `app` 그룹은 `next build`·`next start`·Playwright 실행의 입력을 전부 포함하므로, 그 밖의 diff 가 E2E 결과를 바꿀 경로가 없다. 워크플로 자체와 composite action 도 그룹에 넣어 "파이프라인을 고친 PR 은 파이프라인이 검증" 한다.
3. 필터가 틀렸다면 규칙 1(main push 전체 실행)이 머지 직후 잡는다. 개인 계정 저장소라 merge queue 를 쓸 수 없어 "머지 전" 이 아니라 "머지 직후" 가 최종 방어선이고, 빨간불이면 revert 우선이 정책이다. 이것은 merge queue 가 없는 비용이며 숨기지 않는다.
4. required 체크와의 충돌이 없다. E2E 가 step 이라 skip 이어도 `build` job 은 항상 결과를 보고한다. 만약 E2E 를 별도 job 으로 두었다면 `if: always()` 의 gate job(skip 이면 통과, failure·cancelled 면 실패)이 필요했을 것이다.

### 2.3 자가 검증 (PR 5개, 모두 fork 안·머지 안 함)

| PR               | 변경                           | 이벤트    | `Decide whether E2E runs` 로그                              | E2E step    | run               |
| ---------------- | ------------------------------ | --------- | ----------------------------------------------------------- | ----------- | ----------------- |
| #3 feat/week-10  | src 포함                       | push      | `run=true — 앱 경로 변경`                                   | 실행        | 34502215469       |
| #5 exp/docs-only | `docs/fixtures/events.md` 1줄  | opened    | `run=false — 문서·설정만 변경: E2E 의 입력이 바뀌지 않았다` | **skipped** | 34502539690 (51s) |
| #6 exp/src-touch | `src/shared/config/seo.ts` 1줄 | opened    | `run=true — 앱 경로 변경`                                   | 실행        | 34502548357 (58s) |
| #5               | `run-e2e` 라벨 추가            | labeled   | `run=true — run-e2e 라벨: 사람이 명시적으로 요청했다`       | 실행        | 34502712392       |
| #5               | 라벨 제거                      | unlabeled | `run=false`                                                 | skipped     | 34502867339       |

**함정을 하나 밟았다.** 처음 #5·#6 을 fork `main` 기준으로 열자 문서만 바꿨는데도 E2E 가 돌았다(run 34502277255). `paths-filter` 는 PR 의 base 와 비교하므로 base 가 main 이면 10주차 브랜치의 누적 변경 162커밋(src 포함)이 전부 "변경" 이다. base 를 `feat/week-10` 으로 바꾸자 의도대로 동작했다. 필터의 결과는 "무엇을 바꿨나" 가 아니라 "무엇과 비교하나" 에 달려 있다.

**required 와의 충돌 확인** — fork `main` 에 branch protection(required = `lint`·`typecheck`·`unit`·`build`, `strict: false`, `enforce_admins: false`)을 건 뒤 #5(E2E skipped, head `e80d8b61`) 를 base `main` 으로 두고 확인: `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`. #3 도 같다.

### 2.4 flaky 정책

`retries: 0` 을 유지한다. 9주차 8워커 × 15회 실험이 잡은 실제 경합(로그인 성공 직전 미인증 `me` 재확인의 늦은 401)은 retry 가 있었다면 묻혔을 것이다. 의심되는 flake 는 해당 job 을 수동으로 한 번 rerun 하고, 재현되지 않으면 `test.fixme` + 이슈로 격리한다. 이번 주 E2E 실행 12회(12 passed × 12 run) 중 실패 0.

---

## 3. 예산 게이트와 결과 가시성

### 3.1 무엇을 재는가

Next 16 의 Turbopack 빌드는 `.next/static/chunks/` 에 해시 이름만 남겨 `page-*.js` 같은 글롭을 쓸 수 없다. 대신 `next build` 가 남기는 `.next/diagnostics/route-bundle-stats.json` 에 route 별 `firstLoadChunkPaths` 가 있어, `.size-limit.js` 가 그 파일을 읽어 상거래 route 6개의 **First Load JS(brotli, 파일별 합)** 를 `@size-limit/file` 로 잰다. 통계 파일이 없거나 예산이 걸린 route 의 통계가 없으면 설정 자체가 throw 한다 — "빈 측정 = 통과" 를 막기 위해서다.

### 3.2 임계값과 근거

7주차는 Lighthouse LCP·CLS 와 이미지 전송량(7,545,525 B → 32,424 B)을 잰 주차라 **JS 번들 크기는 측정하지 않았다.** 그래서 JS 예산의 근거는 "7주차 값" 이 아니라 **이번 주 기준 빌드의 실측** 이고, 그 사실을 여기 적는다. 이미지는 `size-limit` 에 넣지 않았다 — `public/` 원본을 재면 사용자가 받는 `/_next/image` 응답이 아니라 7주차 Lighthouse 기록이 더 정확한 근거다.

빌드는 결정적이다(같은 커밋 두 번 빌드 → `route-bundle-stats.json` diff 없음, 로컬 157.7 vs CI 157.8 kB). 측정 노이즈가 0 이므로 여유폭은 노이즈가 아니라 **정상 작업은 통과시키고 의미 없는 라이브러리는 잡는 폭** 이다. +5%(약 7–8 kB)는 컴포넌트 몇 개(1–3 kB)를 통과시키고 유틸 라이브러리 1개(≥10 kB brotli)를 잡는다. +20%(28 kB)면 zustand + react-query 만큼이 조용히 들어온다.

| route              | 실측 (brotli, run 34503930847) | 예산 = ceil(×1.05) |   여유 |
| ------------------ | -----------------------------: | -----------------: | -----: |
| `/products`        |                       157.8 kB |             166 kB | 8.2 kB |
| `/`                |                       154.2 kB |             162 kB | 7.8 kB |
| `/checkout`        |                       153.6 kB |             162 kB | 8.4 kB |
| `/orders`          |                       153.3 kB |             161 kB | 7.7 kB |
| `/login` `/mypage` |                       147.1 kB |             155 kB | 7.9 kB |

`/select`·`/dialog`·`/performance-lab/inp` 는 2·5·7주차 데모 화면이라 예산을 걸지 않았다(측정은 된다).

### 3.3 환경 변수 검증 (`scripts/validate-env.mjs`)

`CI`·`VERCEL_ENV`·`NODE_ENV=production` 중 하나면 strict, 아니면 로컬(경고만). build job 의 `pnpm build` 직전 step 이고, Vercel 은 `vercel.json` 의 `buildCommand: "pnpm validate-env && next build"` 로 같은 게이트를 지난다.

| 규칙                                                  | 실패 조건                                                                                                                                       |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| required                                              | strict 에서 `APP_ORIGIN`·`AUTH_SESSION_SECRET` 미설정. Preview 는 `APP_ORIGIN` 을 `VERCEL_URL` 로 유도(경고 `derived`), production 은 명시 필수 |
| dev-fallback / too-short                              | 코드에 박힌 개발용 secret 리터럴, 32자 미만                                                                                                     |
| invalid-url / protocol / origin-only / https-required | `APP_ORIGIN` 이 http(s) origin 이 아님, 경로·쿼리·끝 슬래시 포함, production 인데 http                                                          |
| preview-points-to-production                          | `VERCEL_ENV ≠ production` 인데 `APP_ORIGIN` host == `VERCEL_PROJECT_PRODUCTION_URL`                                                             |
| public-secret-name                                    | `NEXT_PUBLIC_` + SECRET/TOKEN/KEY/PASSWORD/… 이름                                                                                               |
| public-secret-value                                   | 소유한 비밀값(`AUTH_SESSION_SECRET`)이 어떤 `NEXT_PUBLIC_*` 값 안에 복사됨                                                                      |
| unknown-public (경고)                                 | 허용 목록에 없는 `NEXT_PUBLIC_*` (Vercel 시스템 변수 `NEXT_PUBLIC_VERCEL_*` 는 제외)                                                            |

실패한 값은 `«redacted, N chars»` 로만 보인다. 결과는 stdout + `$GITHUB_STEP_SUMMARY` 표 + `::error::` 애노테이션으로, 성공 시에도 "0 error" 표를 남겨 "게이트가 통과했는지 안 돌았는지" 를 구분한다. 단위 테스트 13개(`scripts/validate-env.test.ts`).

CI 는 secret 을 저장하지 않는다. build job 이 `openssl rand -hex 32` 로 `AUTH_SESSION_SECRET` 을 매 실행 새로 만들고 `::add-mask::` 한 뒤, 빌드 후 `grep -rqF "$AUTH_SESSION_SECRET" .next/static .next/server` 로 산출물에 박히지 않았는지 검사한다(`auth.ts` 가 요청 시점에 읽으므로 박히지 않아야 정상). fork PR 은 secrets 에 접근할 수 없으므로 이 구조가 upstream PR 에서도 그대로 동작한다.

### 3.4 결과 가시성

`Bundle budget` step 은 `size-limit --json` 결과를 `scripts/size-limit-summary.mjs` 로 표(route / 예산 / 실측 / 차이 / ✅❌) 로 만들어 step summary 에 쓰고, 초과 항목은 `::error title=size-limit::First Load JS /products 217.1 kB > 예산 166.0 kB (+51.1 kB)` 애노테이션으로도 낸다. 실패해도 표를 남기도록 `status=$?; …; exit $status` 형태다. PR 코멘트 액션(`andresz1/size-limit-action`)을 쓰지 않은 이유: `pull-requests: write` 가 필요하고 fork PR 의 `GITHUB_TOKEN` 은 읽기 전용이라 upstream PR 에서 동작하지 않는다. 결과적으로 이 워크플로는 어느 job 에도 write 권한이 없다.

### 3.5 빨간불 자가 검증

| PR (base `feat/week-10`, 머지 안 함) | 원인                                                                                  | 빨간 run    | 실패 step                        | PR 애노테이션에 보인 것                                                                                                                                         | 되돌린 뒤      |
| ------------------------------------ | ------------------------------------------------------------------------------------- | ----------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| #7 `exp/bundle-over`                 | 헤더(모든 route 공통)에 `import moment from "moment"`                                 | 34504452516 | `Bundle budget`                  | `size-limit: First Load JS /products 217.1 kB > 예산 166.0 kB (+51.1 kB)` 외 6개 route 전부                                                                     | 34504663714 ✅ |
| #8 `exp/env-invalid`                 | 워크플로 `env:` 에 `APP_ORIGIN: not-a-url`, `NEXT_PUBLIC_AUTH_SESSION_SECRET: leaked` | 34504457737 | `Validate environment`(build 전) | `validate-env APP_ORIGIN invalid-url — https://host 형태의 절대 origin`, `NEXT_PUBLIC_AUTH_SESSION_SECRET public-secret-name — 접두사를 떼고 서버에서만 읽는다` | 34504667923 ✅ |

두 경우 모두 lint·typecheck·unit 은 초록이고 `build` 만 빨간불이라 체크 목록에서 어느 게이트인지 갈린다. 스크린샷: `docs/submissions/assets/week-10/red-bundle-run-summary.png`, `red-env-run-summary.png`(run 요약의 애노테이션), `red-*-pr-checks.png`(PR 화면).

### 3.6 배포(Vercel)에서 게이트가 실제로 한 일

Vercel 프로젝트 `loop-pack-fe-l2-vol1`(Production `https://loop-pack-fe-l2-vol1-durumis-projects-5329bd23.vercel.app`, Preview `https://loop-pack-fe-l2-vol1-d1xhgizzl-durumis-projects-5329bd23.vercel.app`). 환경 변수는 `AUTH_SESSION_SECRET`(Production·Preview 각각 다른 값, Sensitive), `APP_ORIGIN`(Production 만).

| 배포                                              | 결과 | 원인                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dpl_BQFFWvpB…` (production)                      | ❌   | `APP_ORIGIN required` — 게이트가 의도대로 막았다. 이후 등록                                                                                                                                                                                                                                        |
| `7oyY11Joo…` (preview) / `12Rm8HaW…` (production) | ❌   | **게이트 오탐**: Vercel 이 주입한 `TURBO_CI_VENDOR_ENV_KEY="VERCEL_"` 가 KEY 이름으로 비밀 취급되고, 그 값이 `NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE`(커밋 메시지에 "VERCEL_URL" 이 있었다) 안에 있어 `public-secret-value`. 값 복사 검사를 소유한 비밀값으로 한정하고 회귀 테스트 추가(`c9a555ed`) |
| `FpsSMiQ9…` (preview) / `2joHXjZT…` (production)  | ✅   | 200, og:url 이 각 환경의 자기 주소                                                                                                                                                                                                                                                                 |

8주차의 교훈이 게이트에도 적용됐다 — **게이트도 오탐을 자가 검증해야 한다.** 이 오탐은 CI 에서는 절대 나지 않고(플랫폼 변수가 없다) 배포 환경에서만 났다.

### 3.7 branch protection 판단

| status check                                             | required | 근거                                                                                                            |
| -------------------------------------------------------- | :------: | --------------------------------------------------------------------------------------------------------------- |
| `lint` `typecheck` `unit`                                |    ✓     | 결정적·저비용·항상 실행                                                                                         |
| `build` (validate-env + build + size-limit + 조건부 E2E) |    ✓     | 결정적. E2E 는 step 이라 skip 되어도 보고된다                                                                   |
| Lighthouse CI                                            |    ✗     | 미도입. 7주차 5회 측정에서 LCP 범위 2,869–3,124ms(±4%)로 흔들린다. 걸더라도 정기 실행·주요 화면 PR 의 참고 지표 |
| AI 리뷰                                                  |    ✗     | 비결정적. 4절                                                                                                   |

`enforce_admins: false`(관리자 본인의 main 동기화 push 를 막지 않음), `strict: false`. 이 보호는 **fork 의 main 에만** 걸려 있고 upstream PR 은 upstream 의 설정으로 평가된다.

---

## 4. AI 코드리뷰

### 4.1 리뷰 기준

`.claude/skills/pr-review/SKILL.md` — 1주차 CLAUDE.md(R1 `any`/`as`/`eslint-disable`, R2 설명 없는 변경), 2–3주차(R3 Props 5개, R4 파생값 useEffect 동기화 금지, R5 hook 한 관심사), 5·7주차(R6 상태 분류·서버 응답 복사 금지, R7 URL 파서 단일화, R9 서버 컴포넌트 우선, R10 로딩 UI), 6주차(R8 FSD 경계·Public API), 8–9주차(R11 테스트 인프라, R12 셀렉터·구현 상수 import 금지, R13 세션 만료 단일 처리), 10주차(R14 워크플로 보안) 14개. 출력은 `파일:라인 / 규칙 / 근거(실제 코드 인용) / 확신 / 승격 가능 여부` 5줄, 끝에 **반복 패턴** 절(5단계의 입력). 이미 ESLint·tsc 가 막는 것은 "CI 가 이미 막음" 으로 분류만 한다.

로컬 Claude Code 에서 실행했고 CI 에는 붙이지 않았다. 근거: fork PR 은 secrets 에 접근할 수 없어 API 키를 둘 자리가 없고, 비결정적 출력이라 required 로 둘 수 없으며, 모든 PR 자동 실행은 비용·소음이 빠르게 커진다. **advisory** 다.

### 4.2 결과 — 잘 잡은 것 1, 헛소리 1

대상 diff 3개(이번 주 CI 변경, 8주차 PR #171, 9주차 PR #180)를 프롬프트 v1 으로 리뷰: 2 / 11 / 12건.

**잘 잡은 리뷰 — `e2e/fixtures/auth.ts:3`.** E2E 픽스처가 `../../src/app/api/_data/auth` 에서 `accounts`·`TEST_PASSWORD` 를 직접 import 한다. 9주차 RFC C.4 에 우리가 "구현의 상수를 import 하지 않는 이유는 구현이 바뀌면 기대값도 따라 바뀌어 회귀를 못 잡기 때문" 이라고 적고서 URL 파라미터에만 지키고 계정 상수에는 어겼다. 9주차 사람 리뷰 7건 반영 때도 놓친 항목이며, `no-restricted-imports` 로 결정적으로 막을 수 있다 → 5단계로 승격.

**헛소리 — 이번 주 CI diff 의 `pull-requests: read` 지적.** "dorny/paths-filter 는 이 권한을 비공개 저장소에서만 요구한다고 문서화한다" 며 제거를 권했다. README 원문은 `Requires pull-requests: read permission` 이고 공개·비공개 구분이 없다. pull_request 이벤트에서 REST API 로 변경 파일을 읽으므로 빼면 403 으로 필터가 죽는다. 기억으로 문서를 지어낸 전형이다. 두 번째 오탐: `e2e-generated/` 를 R2 "설명 없는 변경" 으로 올리면서 리뷰어 스스로 "RFC 에 이유가 있다" 고 썼다.

### 4.3 프롬프트 v2 와 전후

v2 는 지적 전 자가 점검 3개를 추가했다. ① 규칙의 전제(예: "설명 없음")가 실제로 성립하는가 ② 외부 문서는 원문을 열어 인용하고, 못 열면 지적으로 올리지 않는다 ③ 규칙을 넓혀야 잡히는 것은 "규칙표 확장 제안" 절로 분리. 같은 diff 재리뷰:

| diff    |  v1 |    v2 | 사라진 것                                                | 유지된 것                                     |
| ------- | --: | ----: | -------------------------------------------------------- | --------------------------------------------- |
| CI 변경 |   2 | **0** | 권한 지적(README 인용과 함께 철회), 미커밋 문서 부재     | —                                             |
| PR #180 |  12 | **7** | R2 e2e-generated, R7 login searchParams(일회성 파라미터) | `e2e/fixtures/auth.ts`, `as` 단언 2건, R5 2건 |

v2 가 "지적" 이 아니라 "확장 제안·메모" 로 분류해 준 것 중 사실인 결함 3건을 반영했다(`c10a7f7a`): dependabot 의 `directory: /` 는 `.github/workflows` 와 루트 `action.yml` 만 훑어 composite action 의 SHA 핀이 갱신되지 않았다(→ `directories: [/, /.github/actions/*]`); ESLint 가 `**/*.{ts,tsx}` 만 다뤄 `scripts/*.mjs`·`.size-limit.js` 의 활성 규칙이 0개였다(`--print-config` 로 확인 → js 블록 추가, 60개 활성); summary 스크립트가 배열이 아닌 JSON 에 죽었다.

### 4.4 반복 패턴 (5단계 입력)

| 패턴                                                            | 횟수 | 결정적?                                                 |
| --------------------------------------------------------------- | ---: | ------------------------------------------------------- |
| mock 백엔드 내부(`@/app/api/_data/*`)를 앱·테스트가 직접 import |  7곳 | ✓ `no-restricted-imports`                               |
| 사유 없는 `as` 단언 (8주차 1 → 9주차 2)                         |    3 | 부분 — 단언 금지는 가능, 사유의 타당성은 사람           |
| URL 기본값을 파서 밖에서 재해석 (테스트 더블)                   |    4 | ✓ selector 로 가능, 이번엔 보류                         |
| `process.env` 직접 읽기                                         |    5 | ✓ selector — 3단계에서 `APP_ORIGIN` 만 한 곳으로 모았다 |
| hook 이 서버 상태 + 부수효과를 겸함 (R5)                        |    2 | ✗ 맥락 판단                                             |

---

## 5. AI 지적을 결정적 룰로 승격

### 5.1 룰

`eslint.config.mjs`(`469f3cc7`):

- `src/app/**`(api 제외)·`src/*.ts`: `@/app/api/_data`, `@/app/api/_data/*` import 금지. 기존 `src/app/**` 블록에 합쳤다 — `no-restricted-imports` 의 options 는 병합이 아니라 **교체** 라 같은 글롭에 두 블록을 두면 앞 블록이 사라진다.
- `e2e/**`: `../../src/*`, `../src/*`, `@/*` 는 `allowTypeImports: true` 로 타입만 허용.
- FSD 레이어(`src/{shared,entities,features,widgets,_pages}`)는 기존 하네스가 `@/app/*` 전체를 이미 막는다.

허용된 통로는 mock 백엔드의 **공개 모듈** 이다 — 응답 빌더(`@/app/api/home/home-response`, 8주차 "서버 컴포넌트가 route handler 함수를 직접 호출" 패턴)와 새로 만든 `@/app/api/auth/session-cookie`(Edge 안전 상수)·`session-token`(발급·검증). 6주차 Public API 원칙을 mock 백엔드에 적용한 셈이다.

### 5.2 자가 검증

**리팩터 전, 룰만 켠 lint** — 정확히 7건, 예상한 집합과 일치(오탐 0):

```
e2e/fixtures/auth.ts:3        '../../src/app/api/_data/auth'
src/app/_lib/session.test.ts:2,3   '@/app/api/_data/auth', '@/app/api/_data/auth-cookies'
src/app/_lib/session.ts:3,4        '@/app/api/_data/auth', '@/app/api/_data/auth-cookies'
src/proxy.test.ts:3 · src/proxy.ts:2   '@/app/api/_data/auth-cookies'
```

**리팩터 후**(`fdea1f61`) — lint 0 · tsc · vitest 190 · e2e 12 passed · CI run 34508217232 초록. `e2e/fixtures/accounts.ts` 는 계정 8개·비밀번호를 테스트 소유 값으로 복제했고, `session.test.ts` 는 mock 계정 대신 기대값을 직접 갖는다 — 구현이 바뀌면 조용히 따라가지 않고 실패한다.

**stdin 6케이스** (`eslint --stdin --stdin-filename`, 디스크 변경 없음):

| 케이스                                        | 결과  |
| --------------------------------------------- | ----- |
| 앱 코드(`src/app/_lib/x.ts`)가 `_data` import | RED   |
| 같은 코드, api 존 안(`src/app/api/auth/x.ts`) | GREEN |
| 앱 코드가 공개 모듈(`session-cookie`) import  | GREEN |
| e2e 가 src 값 import                          | RED   |
| e2e 가 src 타입만 import                      | GREEN |
| src 루트(`src/x.ts`)가 `_data` import         | RED   |

### 5.3 무엇을 기계에, 무엇을 AI·사람에 두는가

**기계(결정적, CI required)** — 참/거짓이 정적으로 갈리는 것: FSD 레이어·deep import(6주차), `any`·non-null 단언·hooks 룰(1주차 이후), 이번 주의 mock 백엔드 경계·E2E 의 앱 import 금지, 환경 변수의 형태(URL·접두사·Preview→production 호스트), 번들 예산, 스크립트도 lint 대상. 이것들은 사람이 볼 이유 자체를 지운다 — `_data` 경계가 룰이 된 뒤로 "이 import 괜찮은가" 는 리뷰 질문이 아니다.

**AI·사람(맥락 판단, advisory)** — `useEffect` 가 파생값 동기화인지 외부 스토어 구독인지(selector 로는 못 가른다 — 대신 `react-hooks/set-state-in-effect` 가 결정적인 절반을 막는다), hook 분리 지점(R5 의 `use-session` 계측 부수효과), Props 6개가 설계 냄새인지 폼의 정당한 형태인지, `as` 단언의 사유가 타당한지(단언 존재는 기계, 타당성은 사람), 서버 응답을 스토어에 복사했는지(형태가 다양해 selector 오탐이 크다), `checkout` 이 카탈로그를 클라이언트에서만 받는 것이 의도인지.

1주차 책임 모델을 이 프로젝트 기준으로 다시 쓰면 — 기계는 "경계·형태·예산", AI 는 "반복 패턴 발견과 승격 후보 제안", 사람은 "무엇을 required 로, 예산을 얼마로, 무엇을 승격할지" 다. 이번 주 AI 는 사람이 놓친 위반 1건과 파이프라인 결함 3건을 찾았고, 문서를 지어낸 오탐 1건과 규칙 전제를 무시한 오탐 1건을 냈다. 판별은 사람이 했다.

---

## 6. 워크플로 보안 하드닝

| 항목                         | 적용                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 최소 권한                    | 워크플로 `permissions: contents: read`. `build` job 만 `pull-requests: read`(paths-filter 의 PR 파일 API). write 권한은 어느 job 에도 없다                                            |
| action 핀                    | `actions/*` 포함 전부 40자 SHA + `# vX.Y.Z` 주석. 기준: 태그는 mutable 이고 핀의 비용은 dependabot PR 하나. `.github/dependabot.yml` 이 workflows 와 `.github/actions/*` 를 월간 갱신 |
| `pull_request_target`        | 사용하지 않음. AI 리뷰를 CI 에 붙이지 않은 이유의 하나                                                                                                                                |
| 스크립트 인젝션              | `github.event.*` 를 `run:` 에 보간하지 않고 `env:` 로만 전달(`Decide whether E2E runs`)                                                                                               |
| secrets 노출                 | secret 저장 없음. 임시 `AUTH_SESSION_SECRET` 은 `::add-mask::` 후 산출물 grep 검사. 실패값은 `«redacted»`                                                                             |
| `persist-credentials: false` | 모든 checkout                                                                                                                                                                         |
| `timeout-minutes`            | 모든 job(10–15분) — 폭주·탈취 시 상한                                                                                                                                                 |
| `concurrency`                | ref 포함 그룹, main 은 취소 안 함                                                                                                                                                     |
| 셸                           | `defaults.run.shell: bash`                                                                                                                                                            |

---

## 7. 함께 생각해 볼 질문

**1. E2E 를 모든 PR 에 required 로 걸면?** 이 레포에서도 E2E 는 16–18초 + 브라우저 준비이고, mock API 의 500ms 지연 위에서 돌아 러너 편차에 가장 민감한 step 이다(9주차 8워커 실험에서 15회 중 1회가 흔들렸고 그건 진짜 버그였다). 모든 PR required 면 문서 PR 도 그 비용과 거짓 빨간불을 지고, 조건부로 돌리면서 job 자체를 required 로 걸면 skip 된 PR 은 "체크 대기" 로 영영 머지되지 않는다. 그래서 E2E 는 `build` job 의 조건부 step 으로 두어 항상 보고되게 하고, 앱 경로 변경·라벨·main push 에서만 실행하며, merge queue 가 없는 개인 저장소에서는 main push 전체 실행이 최종 방어다.

**2. Lighthouse 점수 하락은 항상 merge blocker 여야 할까?** 7주차 같은 커밋 5회 측정에서 LCP 는 2,869–3,124ms(±4%)로 흔들렸다. 변동 폭 안의 하락을 required 로 막으면 코드와 무관한 빨간불이 생기고 사람들은 곧 재실행으로 넘긴다 — 그 순간 게이트는 소음이다. 가를 기준은 "같은 입력에 같은 출력이 나오는가": 번들 크기는 결정적이라 막고(같은 커밋 두 번 빌드 → 바이트 동일), Lighthouse 는 정기 실행·주요 화면 PR 의 참고 지표로 두고 추세로 본다.

**3. Preview 가 production API 를 바라보면?** 이 앱은 서버 컴포넌트가 `APP_ORIGIN` 으로 자기 API 를 HTTP 로 다시 부른다(`commerce-client.ts`). Preview 에 production 주소가 들어가면 Preview 의 주문서가 production 주문 저장소에 쓰고, 실서비스라면 결제·이메일이 나간다. 게이트는 두 겹이다 — `validate-env` 가 `VERCEL_ENV ≠ production` 인데 `APP_ORIGIN` host 가 `VERCEL_PROJECT_PRODUCTION_URL` 과 같으면 빌드를 막고, 더 근본적으로 `resolveAppOrigin` 이 Preview 에서는 `APP_ORIGIN` 을 요구하지 않고 배포 자기 주소(`VERCEL_URL`)로 유도해 잘못 넣을 자리 자체를 없앴다. 실제로 첫 production 배포는 `APP_ORIGIN` 미설정으로 막혔고(3.6), Preview 는 og:url 이 자기 주소로 나온다.

**4. AI 가 만든 workflow 를 그대로 머지하면?** 이번 주에 AI 가 실제로 낸 것들이 답이다 — `pull-requests: read` 를 "불필요" 라며 빼라고 했고(빼면 필터가 403), 이전 세대 초안에서 흔한 `${{ github.event.pull_request.title }}` 보간은 인젝션이다. 머지 전 검증은 (a) 권한: `permissions` 가 최소인지, write 가 있다면 어느 step 이 요구하는지 사유가 있는지 (b) 트리거: `pull_request_target` 이 없는지, `concurrency` 가 main 을 취소하지 않는지 (c) 캐시 키가 실제로 hit 되는지 — 로그의 `Cache restored` 와 `reused/downloaded` 를 본인이 읽는다(pnpm 캐시는 hit 여도 이득이 없었다) (d) path filter 가 필요한 검증을 스킵하지 않는지 — 걸리는 PR·안 걸리는 PR 두 개로 실제 확인(base 를 잘못 잡으면 결과가 뒤집힌다) (e) 외부 action 의 문서·SHA 를 원문으로 확인. 요약하면 AI 초안은 "돌아가는가" 가 아니라 "무엇을 막고 무엇을 열어 두는가" 로 읽어야 한다.

---

## 부록 — 커밋 목록 (`feat/week-10`)

| 커밋                    | 내용                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `5f9989ad`              | 환경 변수 검증 게이트 + 테스트                                                             |
| `15918a05`              | 4 job 병렬, Playwright 캐시, concurrency, timeout, 최소 권한, composite action, dependabot |
| `c14ff83b`              | 조건부 E2E(paths-filter·라벨·draft·main push)                                              |
| `7743ef10`              | size-limit 예산 게이트 + summary, validate-env 를 build 앞에                               |
| `66251208` / `3830e2a6` | AI 리뷰 프롬프트 v1 / v2                                                                   |
| `c10a7f7a`              | AI 리뷰가 찾은 결함 3건(dependabot 범위, 스크립트 lint, summary 가드)                      |
| `469f3cc7` / `fdea1f61` | 승격 룰 / 리팩터(공개 모듈, 테스트 소유 계정)                                              |
| `7fb10630`              | `resolveAppOrigin` 단일화, `vercel.json` buildCommand                                      |
| `6d3e5d0f` / `c9a555ed` | validate-env 오탐 수정 2건(Vercel 시스템 변수, 값 복사 범위)                               |
