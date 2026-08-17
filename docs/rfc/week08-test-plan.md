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
- Stage 0을 진행하는 동안 Stage 1 이후의 테스트 코드 작성

## Stage 1 테스트 설계

단위는 DOM 없는 순수 변환·상태 정책, 통합은 jsdom에서 사용자 조작부터 MSW
응답과 화면까지, E2E는 production 브라우저의 URL·history·reload·페이지 간 흐름을
검증한다. 통합 테스트는 nuqs testing adapter를 사용하며 Next router를 모킹하지
않는다.

| #   | 검증 대상                           | 방법 | 이유                                        | 빨간불이 되면 알게 되는 것                          |
| --- | ----------------------------------- | ---- | ------------------------------------------- | --------------------------------------------------- |
| 1   | 장바구니·위시리스트 개수 파생       | 단위 | selector는 입력만으로 개수를 만든다         | item 집합과 헤더 개수가 어긋난다                    |
| 2   | URL 조건 → query key                | 단위 | URL→request→key가 순수 변환이다             | 다른 조건이 같은 캐시를 쓰거나 기존 캐시를 잃는다   |
| 3   | 이전 성공 목록 유지 정책            | 단위 | `ProductListStatePolicy.resolve`는 순수하다 | 전환 중 다른 조건의 목록을 표시하거나 비운다        |
| 4   | 목록 로딩 → 성공                    | 통합 | Query·repository·MSW·화면의 연결이다        | 성공 응답 뒤 로딩이 끝나지 않거나 목록이 안 나온다  |
| 5   | 목록 빈 결과                        | 통합 | 빈 응답에 따른 공개 상태를 확인한다         | 0건과 빈 페이지 안내가 잘못 구분된다                |
| 6   | 목록 에러                           | 통합 | HTTP 실패와 공개 오류 UI의 연결이다         | 오류가 숨겨지거나 잘못된 메시지가 나온다            |
| 7   | 에러에서 재시도로 복구              | 통합 | 클릭·재요청·성공 전환을 함께 확인한다       | 재시도가 요청하지 않거나 성공 목록으로 못 돌아온다  |
| 8   | 카테고리 변경 → 목록 변경           | 통합 | 조작·URL·요청·렌더가 한 화면에서 연결된다   | 카테고리와 요청 또는 표시 상품이 어긋난다           |
| 9   | 정렬 변경 → 순서 변경               | 통합 | 정렬 요청 결과를 사용자 순서로 확인한다     | 선택한 정렬과 표시 순서가 어긋난다                  |
| 10  | 페이지 이동 → 목록 변경             | 통합 | 페이지 경계·요청·렌더가 함께 동작한다       | 잘못된 페이지를 요청하거나 경계를 넘는다            |
| 11  | 조작이 URL에 반영 · URL로 재진입    | E2E  | 공유 URL 재진입은 실제 router 계약이다      | URL이 조건을 잃거나 같은 목록을 복원하지 못한다     |
| 12  | 담기 → 헤더 개수 · 다시 누르면 빠짐 | 통합 | 버튼과 공유 Zustand·Header를 연결한다       | 담기 상태와 버튼·헤더 개수가 어긋난다               |
| 13  | 뒤로·앞으로 가기로 필터 복원        | E2E  | browser history 자체가 검증 대상이다        | history 이동 뒤 필터와 목록이 복원되지 않는다       |
| 14  | 새로고침해도 필터 상태가 유지       | E2E  | 새 document의 URL hydration을 확인한다      | 새로고침 뒤 필터와 목록 조건을 잃는다               |
| 15  | 목록 진입 → 담기 → 헤더 확인        | E2E  | production 페이지 진입부터의 핵심 흐름이다  | 실제 앱에서 담기 결과가 전역 헤더에 전달되지 않는다 |

3번의 직접 선택 대상은 `ProductListStatePolicy.resolve`다. 목록 조건 전환 중 마지막
성공 데이터를 유지하되 현재 요청의 성공 데이터만 새 기준으로 채택하는 정책은 분기가
많고 잘못되면 다른 조건의 상품을 보여준다. 반면 DOM이나 네트워크 없이 모든 입력
조합을 빠르게 검증할 수 있어 단위 테스트 가치가 높다.

### 애매했던 판단

**URL 조건 → query key는 단위로 정했다.** `URLSearchParams`를
`ProductListRouteParams.toRequest`와 `ProductQueryKeyFactory.productList`에 차례로
통과시키면 실제 공개 변환을 DOM 없이 검증할 수 있다. 통합으로 두면 router와 렌더
비용은 늘지만 이 결정적 변환에 대한 신뢰는 크게 늘지 않는다.

**카테고리·정렬·페이지 변경은 통합으로 정했다.** nuqs testing adapter로 실제
control 조작, `history: 'push'` URL 갱신, MSW 요청과 표시 결과를 한 경계에서
확인한다. E2E로 두면 실제 Next router 신뢰는 늘지만 같은 화면의 세 흐름이 느린
브라우저 테스트로 중복된다. E2E는 재진입·history·reload에 한정한다.

### 정상·경계와 Stage 3 후보

| 방법 | 정상 사례                       | 경계 사례                                 | Stage 3에서 망가뜨릴 한 곳                  |
| ---- | ------------------------------- | ----------------------------------------- | ------------------------------------------- |
| 단위 | 조건별 key와 마지막 성공값 갱신 | 잘못된 URL 기본값·이전 key 데이터 유지    | `isPlaceholderData` 조건을 제거             |
| 통합 | 성공·필터·정렬·페이지·담기 전환 | 0건/빈 페이지·오류 복구·첫/끝 페이지·빼기 | 빈 결과 분기 또는 재시도 호출을 반대로 변경 |
| E2E  | 공유 URL·history·담기 여정      | 기본 URL 재진입·reload 후 동일 조건       | nuqs의 `history: 'push'`를 `replace`로 변경 |

각 항목의 Stage 2 테스트에는 위 표에 대응하는 정상과 경계를 모두 둔다. 통합의 기본
MSW handler에는 성공만 두고 빈 결과·오류는 해당 테스트에서 덮어쓴다.

## Stage 3 — 자가 검증 기록

세 방법론마다 한 곳씩 구현을 망가뜨렸다. 테스트 코드는 건드리지 않았고, 최종 커밋에
망가뜨린 코드는 남기지 않았다.

| #   | 방법 | 망가뜨린 곳                                              | 어떻게 바꿨나                                                   | 결과 | 실패한 테스트                                                                                                                                                                                                                                                                  | 실패 메시지로 원인 짐작                                                                                               |
| --- | ---- | -------------------------------------------------------- | --------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 1   | 단위 | `src/views/product-list/model/ProductListStatePolicy.ts` | `!query.isPlaceholderData`를 `query.isPlaceholderData`로 뒤집음 | 잡힘 | `ProductListStatePolicy resolve with placeholder data retains the previous data and key`, `ProductListStatePolicy resolve with a successful empty result returns the current empty data`                                                                                       | `displayedDataKey`가 page=2/null이 되어, 정상 성공 데이터를 최신 성공 key로 기록하지 못한다는 의도가 명확히 드러남    |
| 2   | 통합 | `src/shared/ui/useInlineQueryRetry.ts`                   | `retry` 내부의 `refetch()` 호출 제거                            | 잡힘 | `Product list retry - when a retry fails - keeps the alert visible`, `Product list retry - when a retry succeeds after an initial failure - removes the alert and shows products`                                                                                              | requestCount=1이고 상품 heading이 없어, 재시도가 실제 요청을 보내지 않았음을 즉시 알 수 있음                          |
| 3   | E2E  | `src/features/product-filter/model/useProductFilters.ts` | `history: 'push'`를 `history: 'replace'`로 변경                 | 잡힘 | `Product list browser history - when the browser moves back after two filter changes - restores the previous filter and result`, `Product list browser history - when the browser moves forward after returning to the previous filter - restores the later filter and result` | 뒤로 가기/앞으로 가기 복원 실패. 첫 번째는 셀렉터 값이 `home`이 아니었고, 두 번째는 `category=home` URL 대기 타임아웃 |

세 실험이 전부 한 번에 잡혔기 때문에 쉬운 곳만 고른 것이 아닌지 다시 점검했다. 단위는
placeholder 분기라는 눈에 잘 띄지 않는 조건, 통합은 retry의 실제 네트워크 호출, E2E는
history 동작이라는 각 방법론의 핵심 계약을 노린 곳이어서 의미가 있다.

### 목록 밖 결정

| 판단             | 대상                                                        | 변경 빈도와 실패 비용                                                       |
| ---------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| 다음에 한다      | reload 뒤 cart·wishlist persist hydration과 손상값 복구 E2E | middleware·hydration은 바뀔 가능성이 있고 재방문 상태 유실 비용이 크다      |
| 앞으로도 안 한다 | ProductCard class·DOM 구조·middleware 조합 snapshot         | 자주 바뀌는 구현 세부사항이고 공개 동작 테스트가 같은 실패를 더 잘 설명한다 |

## Advanced — Stryker 변형 테스트

### 범위 한정

Stryker 대상은 1단계에서 **단위**로 분류한 세 파일로 한정했다. 통합·E2E가 걸리는
파일까지 넣으면 끝나지 않기 때문이다.

| 파일                                                     | 이유                                |
| -------------------------------------------------------- | ----------------------------------- |
| `src/views/product-list/model/ProductListStatePolicy.ts` | 1단계 직접 선택한 순수 정책         |
| `src/entities/product/model/ProductListRouteParams.ts`   | URL → request → query key 순수 변환 |
| `src/entities/product/model/ProductQueryKeyFactory.ts`   | query key 생성, 부수효과 없음       |

### 도구 버전과 설정

- `@stryker-mutator/core` 10.0.0
- `@stryker-mutator/vitest-runner` 10.0.0
- 설정: `stryker.config.mjs`, Stryker 전용 `vitest.stryker.config.ts`
- Vitest projects(`test.projects`)는 Stryker가 직접 읽지 못하므로 Node 단위 테스트만
  실행하는 별도 config를 두었다.

### 실행 결과

측정일 2026-08-18, Apple M2 Max, 32 GiB RAM, Node.js 24.9.0.

| 실행    | 변형 수 | killed | survived | no cov | errors | mutation score | wall-clock |
| ------- | ------: | -----: | -------: | -----: | -----: | -------------: | ---------: |
| 최초    |      46 |     41 |        5 |      0 |      0 |          89.13 |       9.0s |
| 보강 후 |      46 |     45 |        1 |      0 |      0 |          97.83 |       9.0s |

### 살아남은 변형 분석

최초 살아남은 5개 중 **의미 있는 변형**은 3개였다.

| 위치                                                        | 변형                           | 의미 있는 변형? | 대응                                                             |
| ----------------------------------------------------------- | ------------------------------ | --------------- | ---------------------------------------------------------------- |
| `ProductListRouteParams.ts:45` `request.q !== ''`           | `true`로 강제                  | 예              | `omits default q and category from canonical search` 테스트 추가 |
| `ProductListRouteParams.ts:48` `request.category !== 'all'` | `true`로 강제                  | 예              | 위 테스트에서 함께 검증                                          |
| `ProductListStatePolicy.ts:38` `lastSuccessfulKey === null` | `false`로 강제                 | 예              | pending + 다른 key 캐시 데이터가 없음을 확인하는 테스트 추가     |
| `ProductListRouteParams.ts:45` 비교 문자열                  | `'')` → `"Stryker was here!")` | 아니오          | 의미가 동일해 죽일 수 없음                                       |
| `ProductListRouteParams.ts:48` 비교 문자열                  | `'all'` → `""`                 | 아니오          | 의미가 동일해 죽일 수 없음                                       |

보강 후 살아남은 1개는 `ProductListStatePolicy.ts:38`의 `lastSuccessfulKey === null` →
`false` 변형이다. 이 변형은 `queryClient.getQueryData(null)`이 내부적으로 `undefined`를
반환하기 때문에, 변형 전후 모두 `retainedData`가 `undefined`가 되어 동작이 달라지지
않는다. 공개 계약상으로는 동등한 변형이므로 **죽일 수 없는 변형**으로 기록한다.

### 도구가 추가로 찾아준 것

손으로 한 Stage 3 실험은 의도적으로 망가뜨린 3곳을 모두 잡았다. Stryker는 그보다
세밀한 경계에서 부족했던 것을 찾아줬다.

- **기본값 q/category 생략**: canonical search params가 URL에서 기본값을 빼는
  계약을 테스트로 보호하지 않았다면, `if (true)` 변형이 살아남았을 것이다. 이는
  실제로는 URL에 불필요한 `q=`/`category=all`을 남기게 만드는 버그다.
- **cold pending 상태의 캐시 격리**: 다른 key의 데이터가 있을 때 pending 상태가 그
  데이터를 보여주지 않는지 테스트하지 않으면, `lastSuccessfulKey === null` 체크가
  제거되어도 발견되지 않는다. 실제 버그는 아니지만 정책 의도를 명확히 고정한다.

### 상시 사용 판단

Stryker는 단위 로직 범위에서 **9초**면 돌아간다. 실행 비용이 낮고, 테스트가 의도를
제대로 고정하고 있는지 기계적으로 확인해주는 가치가 있다. 다만 통합·E2E 파일까지
범위를 넓히면 실행 시간이 급격히 늘어날 것이고, 실패 비용이 크지 않은 UI 세부사항
mutation은 소음이 될 수 있다.

판단: **단위 로직 파일 한정 범위에서 CI나 로컬 사전 검증에 상시 사용한다.**
통합·E2E 범위까지 확장하지는 않는다. `pnpm check`에는 포함하지 않고 별도
`pnpm test:mutate` 명령으로 둔다.
