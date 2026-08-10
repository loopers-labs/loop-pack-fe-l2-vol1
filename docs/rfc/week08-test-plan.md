# Week 08 테스트 계획: Stage 0

## 범위와 기준선

Stage 0은 테스트 환경을 Node 단위 테스트, jsdom DOM 테스트, 프로덕션
Playwright E2E로 분리한다. 프로덕션 동작은 바꾸지 않고, 기존 HTTP 경계 테스트는
직접 transport를 교체하는 방식에서 실제 요청을 MSW가 가로채는 방식으로 옮긴다.

작업 전 기준선은 Vitest `37 files / 260 tests`, total `2.85s`, setup `0ms`,
environment `6ms`였다. 작업 후 전체 `pnpm test`는 `39 files / 263 tests`이며,
Node 프로젝트가 기존 파일을 유지한 `37 files / 261 tests`, DOM 프로젝트가 새
`2 files / 2 tests`를 소유한다.

## Stage 0 결정

### Vitest 환경 분리

`vitest.config.ts`는 Vitest 4의 `test.projects`와 `extends: true`를 사용한다.
Node 프로젝트는 기존 `*.test.ts(x)`를 유지하고 `*.dom.test.tsx`를 제외한다.
DOM 프로젝트는 `*.dom.test.tsx`만 포함한다. 두 패턴은 겹치지 않는다.

DOM 프로젝트의 jsdom URL은 `http://localhost:3000`이다. Node와 DOM 프로젝트는
`tests/setup/msw.ts`의 MSW 수명 주기를 함께 사용하고, `tests/setup/dom.ts`는
DOM 전용 준비만 소유한다.

- suite 시작 전 빈 MSW `setupServer`를 `onUnhandledRequest: 'error'`로 시작
- 매 테스트 뒤 `resetHandlers`, suite 종료 뒤 `close`
- DOM에서만 `@testing-library/jest-dom/vitest` matcher 등록과 Testing Library
  `cleanup`

jsdom은 위치 URL을 제공하지만 Node의 `Request`가 상대 URL을 거부한다.
DOM setup은 `Request` 입력만 `window.location` 기준으로 해석해 실제 브라우저의
상대 URL 동작을 재현한다. ky, fetch, `apiClient`, `ProductRepository`는 교체하지
않는다.

Node의 `ApiClient`, `ProductRepository`, `ProductServerRepository` 테스트도 각
테스트가 등록한 MSW handler를 통과한다. 브라우저 repository에는 상대 경로를
해석할 실제 ky client의 `baseUrl`만 제공하고, 서버 repository는 기본 native
fetch를 사용한다. 테스트는 fetch나 HTTP client method를 교체하지 않는다.

기존 `ProductServerRepository` 테스트 중 주입한 가짜 fetch가 응답 이후
`TypeError`를 던지거나 native fetch 계약에 없는 `RangeError`를 거부하는 경우는
제거했다. 두 항목은 실제 HTTP 경계를 통과하지 않고 테스트 대역의 임의 동작만
검증했기 때문이다. MSW 전환 뒤에는 실제 native fetch의 성공, malformed JSON,
schema 오류, HTTP 오류, network `TypeError` 변환과 요청 횟수를 공개 계약으로
검증한다.

### DOM 검증 경계

`InlineQueryError.dom.test.tsx`는 role/name으로 `다시 시도` 버튼을 찾고
`userEvent` 클릭이 공개 `onRetry` 계약을 호출하는지 검증한다.

`ProductRepository.dom.test.tsx`는 실제 기본 ky `apiClient`를 통과한다. 테스트가
등록한 MSW v2 handler는 정확히 `http://localhost:3000/api/home`만 처리하고,
독립적인 schema-valid fixture를 반환한다. 응답은 기존 Zod schema를 거친 뒤
배너 제목과 상품의 id, 가격, 배송 여부로 검증한다. 전역 기본 handler는 없다.

### 프로덕션 E2E와 CI

`pnpm test:e2e`는 `pnpm build && playwright test`다. Playwright는 Chromium만
사용하고 `e2e/`에서 테스트를 찾는다. `webServer`는 `pnpm start`로 production
artifact를 제공하고 `http://localhost:3000` 응답 준비를 기다린다. 홈 smoke
test는 heading role/name `Loopers Commerce`를 확인한다.

E2E는 `pnpm test`와 기존 `pnpm check`에 포함하지 않는다. GitHub Actions는 기존
조건부 Chromium 설치와 `pnpm check`를 유지하고, 그 뒤 별도 `pnpm test:e2e`
단계를 실행한다. 프로덕션 빌드와 서버 시작, 브라우저 설치·실행은 빠른 로컬
Vitest 반복보다 비용이 크므로 명령을 분리하되, CI에서는 `check` 다음에 반드시
실행해 배포 형태의 smoke contract를 놓치지 않는다.

## 도구 버전

측정일은 2026-08-10이다. 환경은 macOS 27.0, Apple M2 Max, 32 GiB RAM,
`.nvmrc`의 Node.js 24.17.0, pnpm 10.15.1이다.

| 도구                       | 버전   |
| -------------------------- | ------ |
| Vitest                     | 4.1.10 |
| jsdom                      | 30.0.1 |
| MSW                        | 2.15.0 |
| Playwright Test            | 1.62.1 |
| Testing Library React      | 16.3.2 |
| Testing Library DOM        | 10.4.1 |
| Testing Library user-event | 14.6.3 |
| Testing Library jest-dom   | 7.0.1  |

## Split 대 all-jsdom 측정

### 방법

각 모드에서 warm-up 1회를 버리고 split, all-jsdom 순서로 번갈아 5회씩
기록했다. Vitest 기본 pool과 나머지 설정은 동일하게 유지했다. Vitest의
setup/environment 값은 worker별 누적 시간이고 total은 wall-clock 시간이다.
원시 로그는 작업 저장소 밖의 임시 디렉터리에 기록했다.

전체 39개 파일을 all-jsdom으로 실행하려는 첫 시도는
`src/app/page.test.tsx`와 `src/app/products/page.test.tsx`가 사용하는 Next
`server-only` marker를 jsdom의 browser resolution condition에서 찾지 못해
Node 24에서도 중단됐다. 이를 우회하는 alias는 환경을 왜곡하므로 추가하지
않았다. 공정한 비교에서는 이 두 파일을 양쪽에서 동일하게 제외하고, 나머지
동일한 `37 files / 259 tests`를 측정했다.

| 모드      | Run |  Setup | Environment | Total |
| --------- | --: | -----: | ----------: | ----: |
| split     |   1 |  7.24s |       3.40s | 2.57s |
| all-jsdom |   1 | 17.05s |      41.63s | 7.28s |
| split     |   2 |  7.41s |       3.59s | 2.47s |
| all-jsdom |   2 | 16.52s |      47.56s | 7.82s |
| split     |   3 |  5.75s |       2.55s | 2.23s |
| all-jsdom |   3 | 12.03s |      34.13s | 5.54s |
| split     |   4 |  3.73s |       2.36s | 1.67s |
| all-jsdom |   4 | 13.63s |      38.34s | 6.14s |
| split     |   5 |  4.02s |       2.56s | 1.79s |
| all-jsdom |   5 | 13.18s |      40.32s | 6.34s |

| 모드      | Setup median | Environment median | Total median |
| --------- | -----------: | -----------------: | -----------: |
| split     |        5.75s |              2.56s |        2.23s |
| all-jsdom |       13.63s |             40.32s |        6.34s |

all-jsdom의 environment median 비용은 split보다 `37.76s` 높았고, wall-clock
total median은 `4.11s` 높았다. 따라서 DOM이 필요한 두 테스트만 jsdom에 두는
분리가 현재 suite에 적합하다.

## 비목표

- 프로덕션 컴포넌트, API client, repository 동작 변경
- 기존 Node 테스트를 DOM 프로젝트로 이동
- E2E를 `pnpm test`나 `pnpm check`에 포함
- Stage 1 이후의 테스트 항목, 방법론, 확장 계획 작성
