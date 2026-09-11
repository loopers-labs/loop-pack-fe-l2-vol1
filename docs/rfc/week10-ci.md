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

- hit 로그 (warm 실행 중 "Cache restored from key: ..." 캡처):
- miss 재현 (lockfile을 일부러 깨서 "Cache not found" 확인 후 install 시간 비교, 실험 후 원복 확인):

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
| 1    |            |                        |                      |                |
| 2    |            |                        |                      |                |
| 3    |            |                        |                      |                |
| 중앙값 |            |                        |                      |                |
| 범위  |            |                        |                      |                |

### Warm (캐시 있음)

| 회차 | wall-clock | Install dependencies | Run quality checks | Run E2E tests |
| ---- | ---------- | --------------------- | ------------------- | -------------- |
| 1    |            |                        |                      |                |
| 2    |            |                        |                      |                |
| 3    |            |                        |                      |                |
| 중앙값 |            |                        |                      |                |
| 범위  |            |                        |                      |                |

## E. Before/After 비교

- 줄어든 시간이 측정 흔들림(범위)보다 큰 변화인가:
- 그 변화가 지목한 병목과 연결되는가:
