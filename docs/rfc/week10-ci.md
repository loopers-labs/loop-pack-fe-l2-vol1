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
