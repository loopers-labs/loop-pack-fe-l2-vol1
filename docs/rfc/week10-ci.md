# 10주차 — CI 측정·최적화 (week10-ci)

## A. Before 측정

### Cold (캐시 없음)

| 회차 | wall-clock | Install dependencies | Run quality checks | Run E2E tests |
| ---- | ---------- | --------------------- | ------------------- | -------------- |
| 1    | 1m 41s     | 5s                     | 27s                  | 26s             |
| 2    | 1m 35s     | 5s                     | 20s                  | 25s             |
| 3    | 1m 36s     | 7s                     | 20s                  | 23s             |
| 중앙값 | 1m 36s     | 5s                     | 20s                  | 25s             |
| 범위  | 1m35s~1m41s | 5s~7s                 | 20s~27s              | 23s~26s         |

> run 1: https://github.com/zaenny/loop-pack-fe-l2-vol1/actions/runs/34551991591 (cache miss 확인: "Set up Node.js" 로그에 `pnpm cache is not found`)
> run 2: https://github.com/zaenny/loop-pack-fe-l2-vol1/actions/runs/34552438073
> run 3: https://github.com/zaenny/loop-pack-fe-l2-vol1/actions/runs/34552636785

### Warm (캐시 있음)

| 회차 | wall-clock | Install dependencies | Run quality checks | Run E2E tests |
| ---- | ---------- | --------------------- | ------------------- | -------------- |
| 1    | 1m 42s     | 1s                     | 28s                  | 29s             |
| 2    | 1m 40s     | 3s                     | 21s                  | 23s             |
| 3    | 1m 44s     | 2s                     | 26s                  | 26s             |
| 중앙값 | 1m 42s     | 2s                     | 26s                  | 26s             |
| 범위  | 1m40s~1m44s | 1s~3s                 | 21s~28s              | 23s~29s         |

> run 1: https://github.com/zaenny/loop-pack-fe-l2-vol1/actions/runs/34552809834
> run 2, 3: PR #3 Checks 탭에서 직접 확인 — API rate limit으로 run URL 미기록

### 가장 긴 구간

cold·warm 모두 전체 시간(96~104s)의 절반 가까이가 `Run quality checks`(20~28s)와 `Run E2E tests`(23~29s) 두 step에 몰려 있고, 캐시 유무는 `Install dependencies`(cold 5~7s → warm 1~3s, 약 3~5s 절감)에만 영향을 줬다. 즉 **캐시는 원래도 작았던 install 구간만 줄여줄 뿐, 실제로 큰 두 구간(quality checks/e2e)에는 아무 영향을 안 준다.**

코드를 보면 그 이유가 나온다: `package.json`의 `check` 스크립트(`test && lint && typecheck && build`)가 **build를 1번** 실행하고, 그 직후 `test:e2e`가 실행하는 Playwright의 `webServer.command`(`playwright.config.ts:32`)가 `pnpm build && pnpm start`라 **build를 또 1번** 실행한다. 즉 같은 `next build`가 `Run quality checks`와 `Run E2E tests` 두 step에 걸쳐 CI 한 번당 **총 2번** 돈다. run 34552636785(cold 3회차)에서 `Run quality checks`가 20s, `Run E2E tests`가 23s로 서로 근접한 크기인 것도 두 step 모두 build 비용을 나눠 갖고 있기 때문으로 보인다.

## B. 캐시 hit/miss 증명

- **hit 로그** (after-warm 3회차, `Set up Node.js` step):
  ```
  Cache hit for: node-cache-Linux-x64-pnpm-70674e444f367b1bbfdf84dc96f5ccef7494f46d80d41b3c53e5ff64736a6dc5
  Received 207120563 of 207120563 (100.0%), 235.7 MBs/sec
  Cache Size: ~198 MB (207120563 B)
  Cache restored successfully
  Cache restored from key: node-cache-Linux-x64-pnpm-70674e444f367b1bbfdf84dc96f5ccef7494f46d80d41b3c53e5ff64736a6dc5
  ```
- **miss 로그** (cold 1회차, `Set up Node.js` step): `pnpm cache is not found` — GitHub Actions Caches 페이지에서 `refs/pull/3/merge` 캐시를 직접 삭제해 매 cold 회차마다 의도적으로 재현함(lockfile을 바꿔 해시를 깨는 대신 캐시 자체를 지우는 방식 — 결과적으로 동일하게 "정확히 일치하는 키가 없다"는 조건을 만들어 더 직접적으로 검증함).
- **install 시간 차이**: miss(cold) 시 `Install dependencies` 5~7s, hit(warm) 시 1~4s — cache가 실제로 install 단계를 단축시키는 걸 확인.

## C. 적용한 전략과 이유

- **지목한 병목**: `next build`가 CI 1회 실행당 2번 실행됨. `pnpm check`(`Run quality checks` step)가 `test && lint && typecheck && build` 순서로 build를 1번 실행하고, 그 직후 `pnpm test:e2e`(`Run E2E tests` step)가 Playwright `webServer.command: 'pnpm build && pnpm start'`(`playwright.config.ts`)로 build를 또 실행함. 두 step이 CI 전체 시간의 절반 가까이를 차지하는데(A절 참고), 캐시(setup-node pnpm cache)는 이 두 step엔 영향을 주지 못함 — install에만 효과 있음.
- **고른 전략과 이유**: job 병렬화·concurrency·캐시 튜닝(과제 문서 1단계 표)이 아니라, 측정으로 확인된 실제 중복을 없애는 것 — `playwright.config.ts`의 `webServer.command`를 CI에서는 `pnpm start`만 실행하도록 분기(`process.env.CI ? 'pnpm start' : 'pnpm build && pnpm start'`). 같은 job 안에서 `Run quality checks`가 먼저 끝나 `.next` 빌드 산출물이 이미 디스크에 있으므로, `Run E2E tests`는 이를 재사용하면 됨. 로컬에서 `pnpm test:e2e`만 단독 실행할 때는 CI 환경이 아니므로 기존처럼 build까지 포함된 커맨드가 그대로 유지됨.
- **안 고른 전략과 그 이유**:
  - job 병렬화: `Run E2E tests`가 `Run quality checks`의 build 산출물에 의존하는 구조라, 단순 병렬화하면 E2E가 build를 다시 해야 하거나 build 산출물을 아티팩트로 전달하는 더 큰 리팩토링이 필요함. 중복 제거가 더 직접적이고 검증도 쉬워 이번엔 이것만 적용.
  - `concurrency` 그룹: 지금 병목은 "같은 PR에 연속 push가 쌓이는 문제"가 아니라 "한 번 실행 안의 중복 작업"이라 이 병목과 무관해 별도로 다루지 않음.

## D. After 측정

### Cold (캐시 없음)

| 회차 | wall-clock | Install dependencies | Run quality checks | Run E2E tests |
| ---- | ---------- | --------------------- | ------------------- | -------------- |
| 1    | 1m 41s     | 6s                     | 27s                  | 19s             |
| 2    | 1m 29s     | 5s                     | 21s                  | 15s             |
| 3    | 1m 28s     | 5s                     | 22s                  | 15s             |
| 중앙값 | 1m 29s     | 5s                     | 22s                  | 15s             |
| 범위  | 1m28s~1m41s | 5s~6s                 | 21s~27s              | 15s~19s         |

### Warm (캐시 있음)

| 회차 | wall-clock | Install dependencies | Run quality checks | Run E2E tests |
| ---- | ---------- | --------------------- | ------------------- | -------------- |
| 1    | 1m 22s     | 2s                     | 27s                  | 16s             |
| 2    | 1m 31s     | 4s                     | 19s                  | 16s             |
| 3    | 1m 27s     | 2s                     | 27s                  | 17s             |
| 중앙값 | 1m 27s     | 2s                     | 27s                  | 16s             |
| 범위  | 1m22s~1m31s | 2s~4s                 | 19s~27s              | 16s~17s         |

## E. Before/After 비교

### 요약

| | wall-clock 중앙값 | Run quality checks 중앙값 | Run E2E tests 중앙값 |
| --- | --- | --- | --- |
| Before cold | 1m 36s | 20s | 25s |
| After cold | 1m 29s | 22s | **15s** |
| Before warm | 1m 42s | 26s | 26s |
| After warm | 1m 27s | 27s | **16s** |

- **줄어든 시간이 측정 흔들림(범위)보다 큰 변화인가**: `Run E2E tests`는 명확하다. Before 범위(cold 23~26s, warm 23~29s)와 After 범위(cold 15~19s, warm 16~17s)가 전혀 겹치지 않는다 — 흔들림으로 설명 안 되는 실질적 감소. wall-clock 전체는 cold에서 1m36s→1m29s(7s), warm에서 1m42s→1m27s(15s)로 줄었지만, `Install Playwright Chromium` 등 다른 step의 러너 변동성이 섞여 있어 전체 시간 하나만으로는 흔들림 대비 확신하기 어렵다. `Run quality checks`는 Before/After 범위가 거의 겹쳐(20~28s대) 사실상 변화 없음 — 예상대로다(이 step은 안 건드렸으니까).
- **그 변화가 지목한 병목과 연결되는가**: 그렇다. 고친 지점이 정확히 `Run E2E tests`의 `webServer.command`(중복 build 제거)였고, 그 step에서만 뚜렷하고 일관된 감소가 나타났다. `Run quality checks`는 그대로 build를 포함하므로 변화가 없는 게 오히려 "이 수정이 의도한 곳에만 영향을 줬다"는 근거가 된다.

## F. 2단계 — 조건부 실행 설계

### 실행 조건

E2E(`Install Playwright Chromium`, `Run E2E tests` step)는 아래 경로가 바뀔 때만 실행한다.

- 실행: `src/**`, `e2e/**`, `playwright.config.ts`, `next.config.ts`, `package.json`, `pnpm-lock.yaml`
- 스킵: 그 외(`docs/**`, `*.md`, `LICENSE` 등 — 실제 앱 동작에 영향을 줄 수 없는 변경)

### job 분리 대신 step 조건을 고른 이유

"E2E를 별도 job으로 분리해서 조건 걸기"가 일반적으로 권장되는 방식이지만, 이 프로젝트에는 안 맞다고 판단했다.

- **job은 매번 완전히 새 러너(가상 머신)를 할당받는 단위**라, job을 분리하면 `Run E2E tests`가 도는 러너에 `Run quality checks`가 만든 `.next` build 산출물이 없다. 결국 E2E job이 checkout·install부터 build까지 전부 다시 해야 하고, 이는 1단계에서 없앤 "build 중복"을 다시 만드는 셈이다.
- job 분리(병렬 실행)가 이득이 되려면 "동시에 돌려서 버는 시간"이 "checkout·install 재실행 + artifact 업로드/다운로드 비용"보다 커야 한다. 이 프로젝트는 전체 워크플로가 1분 20초~1분 40초 수준으로 작아서, 분리에 드는 고정 비용(재설치 등)이 병렬 이득보다 클 가능성이 높다.
- 그래서 **job은 하나로 유지하고, 그 안의 두 step에만 `if:` 조건을 건다.** `Run quality checks`(lint/type/test/build)는 저비용·결정적이라 조건 없이 항상 실행한다.
- **판단 기준(프로젝트가 커지면 재검토)**: E2E 자체가 수 분 단위로 길어지고, lint/type/test/build와 병렬로 돌렸을 때 버는 시간이 build 산출물을 artifact로 넘기는 비용보다 뚜렷하게 커지면 그때 job 분리로 전환하는 게 맞다. 지금 규모에서는 아니라고 판단.

### required check와의 충돌 여부

E2E를 job 전체가 아니라 **job 안의 일부 step만** 스킵하는 구조라, 조건에 안 걸려도 `quality` job 자체는 항상 끝까지 실행되고 success/failure를 보고한다. 따라서 `quality`를 branch protection의 required로 걸어도, E2E가 스킵된다고 PR이 "체크 대기"로 멈추는 문제가 애초에 생기지 않는다(job 자체가 아예 안 도는 구조일 때만 생기는 문제).

### 자가 검증 중 발견한 실패 — 필터가 처음엔 작동하지 않았다

`docs/rfc/week10-ci.md`와 `quality.yml`만 바꾼 커밋(`cb000477`, `cc06d1c4`)을 push해서 "이번엔 E2E가 스킵돼야 한다"를 확인하려 했는데, **실제로는 `Install Playwright Chromium`이 그대로 실행됐다.**

- **원인**: `dorny/paths-filter`는 `pull_request` 이벤트에서 기본적으로 **PR 전체의 누적 diff**(head vs base 브랜치)를 기준으로 파일 변경 여부를 판단한다. 이 PR(#3)은 base(`main`)가 여러 주차만큼 뒤처져 있어 커밋이 256개나 잡히는 상태였고(PR #3 확인 과정 참고), 그 누적 diff 안에는 당연히 `src/`, `e2e/`가 잔뜩 포함돼 있다. 그래서 이번 push 하나만 보면 `docs/`·workflow 파일만 바꿨는데도, 필터는 "PR 전체 기준으로는 `src/`도 바뀌었다"고 판단해 조건이 항상 `true`가 됐다.
- **왜 위험한가**: 이건 과제 문서가 경고한 "path filter가 필요한 검증을 스킵하지 않는가"의 반대 실패 사례다 — 여기선 **스킵돼야 할 게 안 스킵된** 것이라 당장 사고로 이어지진 않지만, 반대로 좁은 필터가 필요한 검증을 놓치는 방향으로도 똑같이 틀릴 수 있다는 걸 보여준다. 자가 검증(2단계 요구사항)을 실제로 돌려보지 않았다면 "필터를 걸었다"는 것만 보고 안심했을 것이다.
- **고친 방법**: `base`를 PR 전체 base 대신 **이번 push로 추가된 커밋 구간**(`github.event.before` → 없으면 PR base로 fallback)으로 명시해서, "PR 전체가 건드린 파일"이 아니라 "이번 push가 건드린 파일"만 보도록 바꿨다. 로컬 git으로 그 구간을 비교할 수 있도록 `actions/checkout`의 `fetch-depth`도 1(기본, shallow)에서 50으로 늘렸다(0=전체 히스토리는 checkout 속도를 다시 늦출 수 있어 지양, 1단계에서 확인한 대로 checkout은 원래 1~3s로 빠른 step이었다).
- **한계로 남는 것**: 이 방식은 한 번의 push에 커밋이 아주 많이 몰리면(fetch-depth 50을 넘는 경우) 일부 오래된 커밋의 변경분을 놓칠 수 있다. 이 프로젝트의 실제 사용 패턴(측정용 커밋을 하나씩 push)에서는 문제없지만, 팀 컨벤션상 한 번에 대량 커밋을 rebase해서 올리는 경우가 있다면 재검토가 필요하다.

### 2차 실패 — `base`를 줬는데도 여전히 안 먹힘

위 수정(`base` 지정)을 push하고 다시 확인했는데도 `Run E2E tests`가 스킵되지 않고 그대로 실행됐다(`25 passed (14.5s)`).

- **원인**: `Detect changed paths` step 로그에 원인이 그대로 찍혀 있었다.
  ```
  Warning: 'base' input parameter is ignored when action is triggered by pull request event
  and 'token' is provided - set token: '' to detect changes using git diff against 'base'
  Fetching list of changed files for PR#3 from GitHub API
  Detected 133 changed files
  ```
  `dorny/paths-filter`는 `pull_request` 이벤트에서 `token`이 주어져 있으면(기본적으로 `GITHUB_TOKEN`이 암묵적으로 제공됨) **우리가 지정한 `base`를 그냥 무시**하고, GitHub API로 "이 PR이 지금까지 건드린 전체 파일 목록"(133개)을 가져와 그 기준으로 판단하도록 만들어져 있었다. 즉 1차 수정에서 넣은 `base` 값은 애초에 반영된 적이 없었다.
- **고친 방법**: `token: ''`을 명시해서 API 경로 대신 로컬 git diff 경로를 타도록 강제했다. 이제야 우리가 지정한 `base`(이번 push 구간)가 실제로 쓰인다.
- **배운 것**: 액션 하나를 설정할 때 "옵션을 넣었다"와 "그 옵션이 실제로 적용된다"는 다른 문제다. 로그를 안 열어보고 `base`만 넣고 넘어갔다면, 조건부 실행이 겉보기엔 설정된 것처럼 보이지만 실제로는 전혀 작동 안 하는 채로 계속 갔을 것이다 — 자가 검증(직접 PR을 걸어보고 로그로 확인하기)이 왜 필요한지를 그대로 보여주는 사례.

### 최종 자가 검증 — 걸리는 PR / 안 걸리는 PR

`token: ''` 수정 이후 실제로 두 케이스를 만들어 확인했다.

| 케이스 | 변경 파일 | 결과 | 근거 |
| --- | --- | --- | --- |
| **안 걸리는 PR** (스킵돼야 함) | `docs/rfc/week10-ci.md`, `.github/workflows/quality.yml` | `Install Playwright Chromium`·`Run E2E tests` 모두 **Skipped**(회색), 전체 59s로 단축 | run [34558399605](https://github.com/zaenny/loop-pack-fe-l2-vol1/actions/runs/34558399605) |
| **걸리는 PR** (실행돼야 함) | `e2e/sanity.spec.ts` (주석 한 줄) | E2E **정상 실행**, `25 passed (15.4s)` | run [34558534663](https://github.com/zaenny/loop-pack-fe-l2-vol1/actions/runs/34558534663) |

## G. 3단계 — 예산 게이트 + 결과 가시성

### 번들 예산 (`size-limit`)

- **도구 선정 기준**: (1) 목적이 정확히 일치 — "경로에 맞는 파일 크기를 재고 기준 초과 시 CI를 실패시키는" 게이트 역할 자체가 이 도구의 존재 이유이며, gzip 압축까지 기본 지원. (2) 번들러에 안 얽매임 — `@next/bundle-analyzer`류는 Webpack/Next.js 내부 구조에 맞춰야 하는데, size-limit은 glob 패턴으로 파일만 지정하면 되므로 이 프로젝트의 Turbopack 빌드에도 그대로 붙는다. (3) 외부 서비스·계정 불필요 — `bundlewatch` 등은 GitHub App 연동이 추가로 필요한데, size-limit은 npm 패키지 설치만으로 로컬·CI에서 동일하게 동작하고 `--json` 출력이 있어 PR 요약 표 생성도 직접 구현하기 쉽다.
- **측정 대상**: `.next/static/chunks/**/*.js` 전체(gzip). 이 Next.js(16, Turbopack) 빌드는 옛 Webpack처럼 route별 "First Load JS" 표를 안 찍어줘서, 클라이언트에 실제로 전달되는 JS 청크 전체를 기준으로 삼았다.
- **임계값 근거**: 7주차는 병목이 Hero 이미지(7.5MB→400KB)였어서 JS 번들 kB 수치를 남기지 않았다. 그래서 **오늘 직접 `pnpm build` 후 `size-limit`으로 실측**했다 — gzip 251.9KB(측정마다 246~252KB 사이로 약간 흔들림, Turbopack 청크 해시 차이로 추정). 여기에 **약 20% 여유폭**을 둬서 임계값을 **300KB**로 정했다("적당히 300KB"가 아니라 실측값+여유폭 계산 결과가 우연히 300 근처로 떨어진 것).
- **자가 검증(로컬)**: limit을 일부러 10KB로 낮춰 실행 → `❌`로 실패(exit 1)하고 표에 원인(크기 246.0KB > 제한 9.8KB)이 그대로 나오는 것 확인 → 다시 300KB로 원복 후 통과 확인.
- **자가 검증(실제 CI, 빨간불→초록불)**: `.size-limit.json`의 limit을 실제로 10KB로 낮춘 커밋을 PR #3에 push해 CI를 빨갛게 만들고, 로그를 안 열어봐도 PR summary만 보고 원인을 알 수 있는지 확인했다.
  - 빨간불: `Check bundle size` step 실패, summary에 `246.0 KB / 9.8 KB / ❌` 표 노출 — 스크린샷: `docs/images/week10-budget-exceeded.png`
  - 다음 커밋에서 300KB로 원복 → `Check bundle size` 다시 통과, PR 전체 초록불로 복귀 확인.
  - 실험 커밋(limit을 낮춘 커밋)은 PR #3 안에 그대로 남겨두되 머지는 하지 않고, 원복 커밋으로 실제 제출 상태를 정상화했다.

### 환경 변수 검증 (`scripts/validate-env.mjs`)

- **왜 필요한가**: 기존 코드(`src/app/api/_data/auth.ts`)에 `process.env.AUTH_SESSION_SECRET ?? "loopers-week09-secret"`처럼 **레포에 그대로 박힌 기본 시크릿**이 있었다. 환경 변수를 안 넣어도 조용히 이 기본값으로 빌드/배포되던 상태라, 실수로 실제 배포에 secret을 안 넣어도 아무 에러 없이 넘어갈 수 있었다.
- **검증 내용**: (1) `AUTH_SESSION_SECRET` 같은 필수 값이 비어있으면 실패, (2) `NEXT_PUBLIC_` 접두어가 붙은 이름에 `SECRET`/`TOKEN`/`PASSWORD`/`KEY` 같은 민감한 키워드가 들어있으면 실패(브라우저 노출 위험), (3) `_URL`로 끝나는 `NEXT_PUBLIC_` 값은 `new URL()`로 형식 검증.
- **build 전 게이트로 연결**: `package.json`에 `prebuild` 스크립트로 등록해, `pnpm build`(그리고 그걸 호출하는 `pnpm check`)를 실행할 때마다 자동으로 먼저 돈다. 따로 CI 단계를 안 추가해도 되는 구조.
- **자가 검증**: `AUTH_SESSION_SECRET` 없이 `pnpm build` → prebuild에서 즉시 실패, `next build` 자체는 시작도 안 함(빌드 낭비 방지). `NEXT_PUBLIC_API_SECRET=leaked`로 실행 → 노출 위험 메시지와 함께 실패. 정상 값만 있을 때는 통과. 세 경우 모두 로컬에서 실행해 exit code까지 확인.
- **CI 반영**: CI에는 실제 시크릿이 없으니 `quality.yml`의 job `env`에 `AUTH_SESSION_SECRET: ci-placeholder-secret-not-for-production`라는 **더미 값**을 넣어뒀다(코드의 기본값 `loopers-week09-secret`을 CI에서 그대로 쓰지 않기 위한 의도적 구분).

### 결과 가시성

`Check bundle size` step에서 `size-limit --json` 결과를 표로 만들어 `$GITHUB_STEP_SUMMARY`에 적는다 — PR의 Actions 요약 화면에서 로그를 안 열어봐도 항목별 크기·제한·통과 여부(✅/❌)를 바로 볼 수 있다.

### required 판단

- `Run quality checks`(lint/type/test/build)와 `Check bundle size`(번들 예산), env 검증(prebuild)은 **결정적**이라 required로 걸 만하다고 판단.
- `Run E2E tests`는 2단계에서 설계한 대로 조건부 실행이라 required로 걸려면 항상 완료되는 구조(이 job은 step 단위 스킵이라 문제없음, F절 참고)여야 하는데, 이 프로젝트는 지금 branch protection 자체를 설정하지 않은 개인 학습 포크라 실제로 걸지는 않았다 — 구조적으로 가능하다는 것까지만 확인.

두 케이스 모두 의도한 대로 동작함을 확인했다. required check와의 충돌 여부는 이 PR엔 branch protection이 설정돼 있지 않아 직접 재현하지는 않았고, 위 "required check와의 충돌 여부" 절의 구조적 근거(step 조건이라 job 자체는 항상 완료됨)로 갈음한다.

### flaky 대비 정책

`playwright.config.ts`에 이미 `retries: process.env.CI ? 2 : 0`이 설정돼 있다. CI 러너는 네트워크·타이밍이 로컬보다 흔들리기 쉬워 일시적 실패가 섞일 수 있는 반면, 로컬 개발 중에는 실패를 즉시 재현해서 봐야 하므로 재시도를 켜두면 오히려 진짜 실패를 숨긴다. 그래서 CI에서만 2회 재시도하도록 분리해뒀다 — 흔들림은 흡수하되, 재시도 없이 로컬에서 실패를 그대로 보고 고치는 흐름은 유지.

## H. 4단계 — AI 코드리뷰 활용

### 연동 방식

`.github/workflows/ai-review.yml`에 `anthropics/claude-code-action`(공식 액션, 커밋 SHA로 고정)을 붙였다. 인증은 별도 API 키 결제 없이 **기존 Claude 구독으로 발급한 OAuth 토큰**(`claude setup-token` → `CLAUDE_CODE_OAUTH_TOKEN` secret)을 사용한다.

### 트리거 판단

- **선택**: PR에 `@claude`를 멘션하는 코멘트를 달았을 때만 실행(`issue_comment` + `github.event.issue.pull_request != null` 조건).
- **안 고른 선택지**: 모든 PR에 자동 실행. 편하지만 비용·알림 소음이 PR마다 쌓이고, AI 리뷰는 비결정적이라 항상 돌릴 필요는 없다고 판단(과제 문서도 "모든 PR 자동은 비용·소음이 빠르게 커진다"고 명시). 사람이 필요할 때만 부르는 쪽을 택함.
- **안전장치**: `concurrency`(같은 PR 중복 호출 시 이전 실행 취소), `timeout-minutes: 10`, `permissions`를 `contents: read`/`pull-requests: write`/`issues: read`로 최소화.

### 리뷰 기준(프롬프트) — 규칙은 CLAUDE.md 자동 로드에 맡기고, 프롬프트는 "행동 지침"만

`claude-code-action`은 체크아웃된 레포 위에서 실제 Claude Code 세션으로 동작하므로, **레포의 `CLAUDE.md`를 자동으로 읽어 지시사항으로 삼는다**(지금 이 세션이 시작될 때와 같은 방식).

처음엔 CLAUDE.md의 컴포넌트 규칙·상태 분류 기준·FSD 레이어 규칙 등을 `prompt`에 통째로 옮겨 적었다가, "이미 자동으로 읽히는데 중복 아닌가?"라는 질문에 다시 판단해 **규칙 본문은 지우고 "이 PR diff를 리뷰해줘, CLAUDE.md 기준으로"라는 작업 지시 + 행동 지침만** 남겼다.

- **규칙(무엇을 볼지)**: CLAUDE.md 자동 로드에 맡긴다 — 중복·스냅샷 불일치 문제가 없어진다.
- **행동 지침(어떻게 리뷰할지, `prompt`에 남긴 것)**: CLAUDE.md엔 없는, "AI 리뷰어로서 이 결과를 어떻게 내놓을지"에 대한 지시라 여기 남겨야 함.
  - 스타일보다 로직·설계 문제 우선
  - 파일:줄 번호로 구체적으로 지적
  - **확신 낮은 지적은 "추정"이라고 표시 — 임의로 단정하지 않기**
  - 문제 없으면 없다고만 말하기(억지로 지적 만들지 않기, 헛소리 줄이는 장치)

이렇게 나누니 CLAUDE.md가 바뀌어도 이 workflow를 손댈 필요가 없다 — "무엇을 볼지"와 "어떻게 결과를 낼지"를 분리한 것.

### required 판단

AI 리뷰는 비결정적이라 **advisory(참고용)**로 둔다 — required 게이트로 걸지 않는다. 과제 문서 권장과 동일한 판단.

### 실제 연동 시도 — 4번 실패하고 로컬 리뷰로 전환

`@claude` 멘션을 실제로 달아보며 4번 반복해서 디버깅했다. 그때그때 원인을 로그로 확인하고 고쳤지만, 마지막엔 근본 원인을 못 찾은 채로 시간상 로컬 리뷰로 방향을 틀었다.

| 시도 | 결과 | 원인(로그 확인) | 조치 |
| --- | --- | --- | --- |
| 1 | 실패 | `Could not fetch an OIDC token` — `permissions`에 `id-token: write` 누락 | 추가 |
| 2 | 실패 | `Claude Code is not installed on this repository` — GitHub App 미설치 | `github.com/apps/claude` 설치 |
| 3 | 성공(success)이지만 댓글 0개, `permission_denials_count: 22`, 14턴·7분·$0.76 | Bash 도구가 보안상 기본 비활성화 — diff를 보려던 git 명령이 전부 거부당함(공식 FAQ 확인) | `claude_args`에 `--allowedTools "Bash(git diff/log/show:*)"` 추가 |
| 4 | 실패, `Reached maximum number of turns (8)` | 범위를 "최근 커밋만"으로 제한하는 프롬프트를 추가했지만 8턴으론 부족 | `--max-turns 12`로 상향 |
| 5 | 실패, `Reached maximum number of turns (12)` | 여전히 부족 | `--max-turns 20`으로 재상향 |
| 6 | 실패, 20턴도 부족(추정) | **근본 원인 미확정.** `claude-code-action`엔 리뷰 범위(diff)를 제한하는 공식 입력(`diff`/`base`/`range` 등)이 없음(`action.yml` 직접 확인함) — 2단계에서 겪은 "PR base(main)가 뒤처져 있어 누적 diff 전체를 보는 문제"가 여기서도 재현됐을 가능성이 높지만, 로그에 실제 컨텍스트 크기가 안 나와 확정할 수 없었다 | 로컬 리뷰로 전환(아래) |

**판단**: `max_turns`를 계속 올리는 건 증상 대응이지 원인 해결이 아니었다 — 이 액션이 리뷰 범위를 좁히는 공식 수단을 제공하지 않는 한, 이 레포처럼 PR base가 뒤처진 구조에선 안정적으로 돌리기 어렵다고 판단해 CI 연동을 여기서 중단했다. **AI가 만든(혹은 공식 문서대로 따라 만든) workflow를 그대로 신뢰하지 않고, 실제로 여러 번 돌려보며 검증한 과정 자체**를 이번 4단계의 자가 검증 증거로 남긴다. workflow 파일(`ai-review.yml`)은 향후 개선 과제로 레포에 남겨두되, 이번 주 리뷰 산출물(잘 잡은 것/헛소리)은 아래처럼 로컬(이 세션)에서 직접 확보한다.

### 리뷰 산출물 — 잘 잡은 것 1개 / 헛소리 1개

CI 연동이 안 돼서, 이번 주 변경사항(`git diff 2476643a..feat/week-10`) 전체를 로컬에서 직접 리뷰했다.

**✅ 잘 잡은 것 — `scripts/validate-env.mjs:11`**

```js
const SENSITIVE_NAME_PATTERN = /(SECRET|TOKEN|PASSWORD|PRIVATE_KEY|API_KEY)/i;
```

환경 변수 이름에 `API_KEY`라는 문자열이 들어있으면 무조건 "민감한 값"으로 판정해 `NEXT_PUBLIC_` 접두어와 같이 있으면 빌드를 막는다. 그런데 이름에 `API_KEY`가 들어가도 **실제로는 공개해도 되는 값**이 있다(예: 지도 서비스처럼 공개 사용을 전제로 한 API 키). 이름만 보고 판단하는 지금 방식은 이런 정당한 값까지 오탐으로 막을 수 있다 — 실제로 설계에 남아있는 한계다.

**❌ 헛소리 — `.github/workflows/quality.yml`의 `AUTH_SESSION_SECRET: ci-placeholder-secret-not-for-production`**

> "워크플로 파일에 시크릿이 하드코딩되어 노출돼 있습니다. GitHub Secrets로 옮기세요."

이렇게 지적한다면 틀린 지적이다. 값 이름 자체가 `ci-placeholder-secret-not-for-production`으로, **진짜 시크릿이 아니라는 걸 명시한 더미 값**이다(코드 주석에도 "실제 서비스 시크릿이 아니며"라고 적어뒀다). `SECRET`이라는 단어가 워크플로 파일에 보인다는 패턴만으로 판단하고, 그 값이 실제로 가짜라는 문맥을 확인하지 않은 전형적인 AI 오탐 사례다.

**프롬프트 개선 방향**: 지금 `ai-review.yml`의 `prompt`에 이미 "확신이 낮은 지적은 '추정'이라고 표시해줘 — 임의로 단정하지 마"를 넣어뒀는데, 위 헛소리 사례를 막으려면 한 줄을 더 추가하는 게 맞다고 판단했다 — **"SECRET/TOKEN 같은 이름만 보고 판단하지 말고, 그 값이 실제로 민감한 값인지(플레이스홀더·주석 문맥 포함) 확인한 뒤 지적해줘."**

## I. 5단계 — 반복 지적을 결정적 룰로 승격

### 고른 규칙: "이유 없는 eslint-disable 금지"

CLAUDE.md 코드 리뷰 기준에 이미 "설명 없는 커밋"과 나란히 **"무의미한 eslint-disable"**이 명시돼 있다 — 즉 사람 리뷰에서도, 4단계 AI 리뷰 기준에서도 반복적으로 나올 수 있는 지적이다. 실제로 코드베이스를 grep해보니 지금도 이유 없는 eslint-disable이 **2곳** 있었다(`LoginForm.tsx`, `CheckoutPage.tsx`의 `react-hooks/exhaustive-deps` 무시) — 맥락상 의도는 있었지만(둘 다 "화면 진입 시점 1회만 기록") 코드에 그 이유가 안 남아 있었다.

**"이유가 진짜 타당한가"는 기계가 못 가리지만, "이유를 아예 안 썼는가"는 결정적으로 가를 수 있다** — 그래서 이걸 골랐다.

### 승격 수단

과제 문서의 "특정 안티패턴 → ESLint custom rule 또는 no-restricted-syntax" 대신 **grep 스크립트**(`scripts/check-eslint-disable-reason.mjs`)를 택했다. 이유:
- `no-restricted-syntax`로 주석 텍스트 패턴까지 검사하려면 커스텀 프로세서가 필요해 설정이 복잡해진다.
- 오늘 이미 외부 액션 설정(`paths-filter`, `claude-code-action`)에서 여러 번 예상 밖의 동작을 겪었다(week10-ci.md F·H절) — 새 의존성 없이 순수 Node 스크립트로 처리하는 쪽이 안정적이라고 판단.

동작: `src/`, `e2e/`, `scripts/` 아래 `.ts`/`.tsx` 파일에서 `eslint-disable`(-next-line/-line)을 찾아, 같은 줄에 `-- <이유>` 형식이 없으면 실패시킨다. `pnpm check`(`lint:disable-reason`)에 연결해 CI(`Run quality checks`)에서 자동으로 돈다 — workflow 파일을 따로 안 고쳐도 됨.

### 자가 검증

- **정상 케이스**: 지금 코드베이스(모든 eslint-disable에 이유 있음) → 통과 확인.
- **위반 케이스**: `-- 이유` 없는 eslint-disable을 담은 임시 파일을 만들어 실행 → `파일:줄` 정확히 지목하며 실패(exit 1) 확인, 임시 파일 삭제.
- **부수 발견**: 검증 과정에서 `scripts/validate-env.mjs`에 **아예 불필요한** eslint-disable(`no-new` 룰이 애초에 그 코드에 안 걸림)이 있는 것도 ESLint 경고로 잡혀서 같이 정리했다.

### 판단 — 무엇을 기계에, 무엇을 AI·사람에 남기는가

- **기계(이번 룰)**: "이유를 썼는가/안 썼는가"라는 형식적 사실. 참/거짓이 명확하다.
- **AI·사람에 남는 것**: "그 이유가 실제로 타당한가"(예: `react-hooks/exhaustive-deps`를 끄는 게 정말 안전한 설계인지)는 맥락 판단이 필요해 기계로 못 내린다 — 4단계 AI 리뷰나 사람 리뷰의 몫으로 남긴다.
