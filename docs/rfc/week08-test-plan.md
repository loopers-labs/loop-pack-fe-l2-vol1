# Week 08 Test Plan

이 문서는 8주차 테스트 과제의 판단 기록이다. 테스트 환경을 어떻게 나눴는지, 어떤 동작을 어떤 레벨에서 검증하기로 했는지, 실제 테스트가 회귀를 잡는지까지 단계별로 남긴다.

## 0단계: 테스트 환경과 모킹 경계

8주차 테스트 작업은 실행 환경을 나누는 것부터 시작했다. 기존에는 모든 Vitest 테스트가 `jsdom`에서 돌았다. 이 방식도 통과는 하지만, DOM이 필요 없는 API, model, query 테스트까지 매번 브라우저 흉내 환경을 세우게 된다. 그래서 테스트 성격에 따라 `node`와 `jsdom` 프로젝트를 분리했다.

### 실행 환경

- Node.js: `.nvmrc` 기준 `24.17.0`
- pnpm: `package.json#packageManager` 기준 `pnpm@10.15.1`
- 단위/통합 테스트: Vitest
- DOM 테스트 환경: `jsdom`
- 네트워크 모킹: MSW
- E2E: Playwright Chromium

### Vitest 환경 분리

Vitest는 `projects`로 `node`와 `jsdom`을 나눴다.

- `node`: API route, API 함수, query factory, metadata builder, 순수 model 테스트
- `jsdom`: React 컴포넌트 테스트, Testing Library `renderHook` 테스트, `localStorage` 기반 persist 테스트

`cartStore.test.ts`, `wishlistStore.test.ts`는 파일 확장자가 `.test.ts`지만 `localStorage`를 전제로 하는 Zustand persist 테스트라 `jsdom`으로 보냈다. 반대로 API와 query 테스트는 DOM이 필요 없어서 `node`에서 돌린다.

`jsdom`에는 base URL을 명시했다.

```ts
environmentOptions: {
  jsdom: {
    url: "http://localhost:3000",
  },
}
```

컴포넌트 테스트에서 `fetch("/api/products")` 같은 상대 경로 요청이 발생한다. base URL이 분명하지 않으면 MSW handler가 기대한 origin과 달라질 수 있어서, 테스트의 브라우저 기준 주소를 `http://localhost:3000`으로 고정했다.

CSS import는 별도 mock을 추가하지 않았다. CSS module을 import하는 `HeroSection` 계열 컴포넌트 테스트가 현재 `jsdom` 프로젝트에서 통과하므로, 지금 단계에서는 Vitest/Vite 기본 처리를 유지한다.

### 환경 셋업 시간 비교

같은 테스트 묶음을 기준으로 `vitest run` 출력의 environment 시간을 비교했다.

| 기준                          | Test files | Tests | Duration | Environment |
| ----------------------------- | ---------: | ----: | -------: | ----------: |
| 전부 `jsdom`                  |         25 |   114 |    3.07s |      14.69s |
| `node`/`jsdom` 분리 직후      |         25 |   114 |    3.06s |       8.36s |
| MSW와 초기 E2E 설정 반영 시점 |         25 |   114 |    3.05s |       8.28s |

전체 실행 시간은 크게 달라지지 않았지만, 환경 셋업 시간은 줄었다. 테스트 수가 더 늘어나면 DOM이 필요 없는 테스트를 `node`에 두는 효과가 더 커질 수 있다.

### MSW 모킹 경계

MSW 서버는 공통 setup에서 켜고 끈다.

```ts
beforeAll(() => {
  server.listen({
    onUnhandledRequest: "error",
  });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
```

`onUnhandledRequest: "error"`를 사용해 모킹하지 않은 요청이 조용히 실제 네트워크로 나가지 않게 했다. 각 테스트에서 필요한 응답은 `server.use(...)`로 덮어쓴다. 테스트가 끝나면 `resetHandlers()`로 되돌려, 한 테스트의 실패/지연/빈 응답이 다음 테스트에 새지 않게 했다.

앱 코드의 HTTP 클라이언트는 직접 바꿔치기하지 않는다. 기존에 있던 `vi.mock("../api/...")`와 `vi.spyOn(globalThis, "fetch")` 기반 테스트는 MSW로 옮겼다. 이제 컴포넌트 테스트는 실제 흐름을 탄다.

```text
컴포넌트
-> React Query
-> API 함수
-> fetch
-> MSW handler
```

API 함수와 query factory 테스트도 `fetch` spy 대신 실제 `fetch`를 호출하고, MSW handler에서 `request.url`을 관찰한다. AbortSignal은 원본 객체 참조를 직접 비교하지 않았다. MSW handler에서 보이는 `request.signal`은 fetch option으로 넘긴 signal과 같은 참조라고 보장하기 어렵기 때문이다. 대신 이미 abort된 signal을 넘겼을 때 요청이 handler까지 도달하지 않고 `AbortError`로 실패하는 동작을 검증했다.

현재 기준으로 아래 검색 결과는 없다.

```bash
rg 'vi\.mock\(.*api|spyOn\(globalThis, "fetch"' src
```

### Playwright E2E

Playwright는 production build 위에서만 돌게 했다. `pnpm check`는 다음 순서로 실행된다.

```bash
pnpm test && pnpm lint && pnpm typecheck && pnpm build && pnpm test:e2e
```

`pnpm test:e2e`는 Playwright가 mock API 서버와 Next production 서버를 함께 띄운 뒤 Chromium에서 테스트를 실행한다. 브라우저 요청과 서버 컴포넌트의 prefetch 요청이 같은 mock API를 보도록, E2E 실행에서는 두 API base URL을 모두 mock API origin으로 맞춘다.

```ts
webServer: [
  {
    command: `MOCK_API_PORT=${mockApiPort} node e2e/mock-api/server.mjs`,
    url: `${mockApiBaseURL}/__test__/health`,
  },
  {
    command: `INTERNAL_API_BASE_URL=${mockApiBaseURL} NEXT_PUBLIC_API_BASE_URL=${mockApiBaseURL} pnpm build && INTERNAL_API_BASE_URL=${mockApiBaseURL} NEXT_PUBLIC_API_BASE_URL=${mockApiBaseURL} pnpm start --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
  },
];
```

`INTERNAL_API_BASE_URL`은 서버 런타임 fetch를 mock API로 보내고, `NEXT_PUBLIC_API_BASE_URL`은 브라우저 번들 안의 클라이언트 fetch를 mock API로 보낸다. `NEXT_PUBLIC_*` 값은 build 시점에 번들에 들어가므로, E2E에서는 start 전에 같은 값으로 production build를 다시 만든다.

별도 mock API 서버를 둔 이유는 E2E에서 확인하려는 범위가 브라우저 fetch만이 아니기 때문이다. Playwright의 `page.route()`는 브라우저에서 나가는 요청은 가로챌 수 있지만, Next 서버 프로세스 안에서 실행되는 서버 컴포넌트 prefetch 요청은 잡지 못한다. 그래서 fetch를 바꿔치기하지 않고, 앱이 평소처럼 HTTP 요청을 보내되 목적지만 mock API로 바꿨다. 이 방식이면 서버 prefetch와 클라이언트 fetch가 같은 응답 계약을 보고, 테스트 전용 분기는 앱 코드가 아니라 E2E 인프라에 머문다.

slow, empty, error 같은 테스트 상태는 `/products?scenario=...`처럼 사용자 URL에 섞지 않았다. 대신 Playwright 테스트가 mock API의 제어 endpoint를 호출해 다음 응답 상태를 바꾼다.

```ts
await fetch(`${mockApiBaseURL}/__test__/scenario`, {
  method: "POST",
  body: JSON.stringify({ products: "slow" }),
});

await page.goto("/products");
```

이렇게 하면 앱의 URL schema와 `nuqs` 파싱에는 테스트 전용 query가 들어가지 않는다. mock API 서버는 실제 HTTP 서버라서 Playwright의 `page.route()`가 잡지 못하는 서버 컴포넌트 prefetch와 브라우저 fetch를 같은 방식으로 다룰 수 있다.

mock API는 전역 scenario state를 쓰므로 Playwright worker는 1개로 제한했다. 테스트마다 `POST /__test__/reset`으로 상태를 되돌려 테스트 간 응답 조건이 새지 않게 했다.

E2E는 `pnpm test`에는 넣지 않았다. 브라우저 실행과 production 서버 기동 비용이 있어 빠른 피드백용 명령과 분리하는 편이 낫다고 봤다. 대신 제출과 CI 기준인 `pnpm check`에는 포함했다.

- `pnpm test`: Vitest 단위/통합 테스트
- `pnpm test:mock-api`: E2E mock API 서버 단위 테스트
- `pnpm test:e2e`: Playwright E2E
- `pnpm test:e2e:headed`: 브라우저 창을 띄워 E2E 확인
- `pnpm test:e2e:ui`: Playwright UI 모드
- `pnpm dev:e2e`: mock API와 Next production 서버를 함께 띄워 수동 확인
- `pnpm check`: Vitest, lint, typecheck, production build, E2E 전체 검증

### 최종 검증

2단계 E2E 보강 이후 `pnpm check`로 전체 검증을 실행해 통과를 확인했다.

```text
pnpm check
- Vitest: 29 files, 138 tests passed
- lint: passed
- typecheck: passed
- next build: passed
- Playwright Chromium: 8 passed
```

Playwright 첫 실행 때는 두 가지를 확인했다.

- sandbox 안에서는 `next/font`가 Google Fonts를 가져오지 못해 production build가 실패했다. 네트워크 권한으로 다시 실행하자 build는 통과했다.
- Playwright 설치 직후 Chromium 바이너리가 없어 실패했다. `pnpm exec playwright install chromium`으로 브라우저를 설치한 뒤 E2E가 통과했다.

이 두 실패는 테스트 코드 문제가 아니라 실행 환경 준비 문제였다. CI에서는 과제 안내대로 Playwright가 설치되어 있으면 Chromium을 자동으로 받을 수 있다.

## 1단계: 테스트 대상을 먼저 고르기

1단계에서는 테스트를 바로 늘리기보다, 어떤 동작을 어떤 레벨에서 검증할지 먼저 나눴다. 기준은 단순하게 잡았다. 입력과 출력이 분명한 순수 로직은 단위 테스트로 두고, 사용자 조작이 URL, React Query, MSW 응답, 화면 렌더링까지 이어지는 흐름은 통합 테스트로 둔다. 실제 브라우저 history, 새로고침, production hydration처럼 jsdom에서 흉내 내기 어려운 부분만 E2E로 올린다. 이 구분이 2단계의 구현 범위와 3단계의 회귀 실험 범위가 된다.

### 테스트 대상 요약

| 항목                                | 방법론      | 핵심 검증                                                          |
| ----------------------------------- | ----------- | ------------------------------------------------------------------ |
| 장바구니·위시리스트 개수 파생       | 단위 테스트 | id map에서 Header 개수가 올바르게 파생된다.                        |
| URL 조건 → query key                | 단위 + 통합 | URL 조건이 query key와 실제 GET 요청 조건에 함께 반영된다.         |
| 순수 로직                           | 단위 테스트 | 깨진 persist 값과 id set 입력이 안전한 상태로 정규화된다.          |
| 목록 로딩 → 성공                    | 통합 + E2E  | 서버 fallback과 클라이언트 pending UI 이후 성공 목록이 렌더링된다. |
| 목록 빈 결과                        | 통합 테스트 | 성공 + 0건이 에러와 구분된다.                                      |
| 목록 에러                           | 통합 + E2E  | 최초 실패가 페이지를 깨지 않고 실패 화면과 retry로 드러난다.       |
| 에러에서 재시도로 복구              | 통합 테스트 | retry 후 같은 화면에서 목록으로 복구된다.                          |
| 카테고리 변경 → 목록 변경           | 통합 테스트 | `category` query와 목록이 함께 바뀐다.                             |
| 정렬 변경 → 순서 변경               | 통합 테스트 | `sort` query와 목록 순서가 함께 바뀐다.                            |
| 페이지 이동 → 목록 변경             | 통합 테스트 | `page` query, 새 요청 결과, 목록 시작점 스크롤이 함께 맞물린다.    |
| 조작이 URL에 반영 · URL로 재진입    | 통합 + E2E  | 조작은 URL query와 요청 조건에 반영되고, 직접 진입도 복원된다.     |
| 담기 → 헤더 개수 · 다시 누르면 빠짐 | 통합 테스트 | store 변경이 Header 개수에 반영되고 toggle 제거도 된다.            |
| 뒤로·앞으로 가기로 필터 복원        | E2E 테스트  | history 이동 후 URL, 필터, 목록이 복원된다.                        |
| 새로고침해도 필터 상태 유지         | E2E 테스트  | document 재요청 후에도 URL 조건이 유지된다.                        |
| 목록 진입 → 담기 → 헤더 확인        | E2E 테스트  | production 페이지에서 담기 후 Header 개수가 바뀐다.                |

### 장바구니·위시리스트 개수 파생

- 검증 대상: `selectCartCount`, `selectWishlistCount`
- 관련 코드:
  - [`src/entities/cart/model/selectors.ts`](../../src/entities/cart/model/selectors.ts)
  - [`src/entities/wishlist/model/selectors.ts`](../../src/entities/wishlist/model/selectors.ts)
- 방법론: 단위 테스트

장바구니와 위시리스트 개수는 id map에서 파생되는 값이다. UI 렌더링이나 네트워크 없이 state 입력과 count 출력만 고정하면 충분하다.

이 테스트가 빨간불이 되면 store 필드명이나 상태 구조가 바뀌었을 때 Header 개수의 기반 selector가 잘못된 값을 내고 있다는 뜻이다.

### URL 조건 → query key

- 검증 대상: 상품 목록 URL 조건이 React Query query key와 실제 GET 요청 조건에 함께 반영되는 계약
- 관련 코드:
  - [`src/_pages/products/model/searchParams.ts`](../../src/_pages/products/model/searchParams.ts)
  - [`src/_pages/products/model/useProductListSearchParams.ts`](../../src/_pages/products/model/useProductListSearchParams.ts)
  - [`src/_pages/products/queries/productQueries.ts`](../../src/_pages/products/queries/productQueries.ts)
  - [`src/app/(commerce)/products/page.tsx`][products-page]
  - [`src/_pages/products/ui/ProductListResults.tsx`](../../src/_pages/products/ui/ProductListResults.tsx)
- 방법론: 단위 테스트 + 통합 테스트

서버 응답을 바꾸는 `q`, `category`, `sort`, `page`, `pageSize`는 query key와 실제 GET 요청에 함께 들어가야 한다. 서버 진입에서는 `page.tsx`가 URL `searchParams`를 정규화해 같은 query factory로 prefetch하고, 클라이언트 조작에서는 `useProductListSearchParams`가 URL query를 갱신한 뒤 `ProductListResults`가 같은 query factory로 목록을 조회한다.

단위 테스트로는 같은 URL 조건이면 같은 query key가 만들어지는지, `q`, `category`, `sort`, `page`, `pageSize` 중 하나라도 바뀌면 query key도 달라지는지, 기본값과 잘못된 URL 값이 정규화된 params로 변환되는지 확인한다.

통합 테스트로는 필터 조작이 URL query를 바꾸는지, 바뀐 URL 조건으로 React Query가 다시 조회하는지, MSW handler에서 실제 GET 요청의 query string이 기대값과 일치하는지, 응답받은 상품 목록이 현재 URL 조건과 일치하게 렌더링되는지 확인한다.

이 테스트가 빨간불이 되면 서로 다른 URL 조건이 같은 cache를 공유하거나, URL은 바뀌었지만 실제 요청 조건은 바뀌지 않는다는 뜻이다. 반대로 같은 조건인데 매번 다른 key가 만들어지면 불필요한 요청이 생길 수 있다.

### 순수 로직

순수 로직은 세 개를 후보로 둔다. 셋 다 DOM, React Query, 네트워크 없이 입력과 출력만으로 의미 있는 회귀를 잡을 수 있다.

| 검증 대상                      | 관련 코드                                                                                                        | 방법론      | 빨간불이 되면 알게 되는 것                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| id set 정규화                  | [`src/shared/lib/id-set/idSet.ts`](../../src/shared/lib/id-set/idSet.ts)                                         | 단위 테스트 | 저장소에 남은 이상한 값이나 `false` 값이 안전하게 `{ [id]: true }`로 정리되지 않는다. |
| 장바구니 persist 상태 정규화   | [`src/entities/cart/model/cartPersistence.ts`](../../src/entities/cart/model/cartPersistence.ts)                 | 단위 테스트 | 깨진 localStorage 값이 장바구니 store로 들어올 수 있다.                               |
| 위시리스트 persist 상태 정규화 | [`src/entities/wishlist/model/wishlistPersistence.ts`](../../src/entities/wishlist/model/wishlistPersistence.ts) | 단위 테스트 | 깨진 localStorage 값이 위시리스트 store로 들어올 수 있다.                             |

`selectPersistedCartState`처럼 persist에 저장할 필드만 고르는 함수도 순수 로직이지만, 이번 단계에서는 복구와 안전성에 더 직접적으로 닿는 정규화 함수를 우선순위로 둔다.

### 목록 로딩 → 성공

- 검증 대상: 상품 목록 최초 진입에서 서버 Suspense fallback과 클라이언트 pending UI를 거쳐 성공 목록으로 전환되는 흐름
- 관련 코드:
  - [`src/app/(commerce)/products/page.tsx`][products-page]
  - [`src/_pages/products/ui/ProductListPageSkeleton.tsx`](../../src/_pages/products/ui/ProductListPageSkeleton.tsx)
  - [`src/_pages/products/ui/ProductListPage.tsx`](../../src/_pages/products/ui/ProductListPage.tsx)
  - [`src/_pages/products/ui/ProductListResults.tsx`](../../src/_pages/products/ui/ProductListResults.tsx)
  - [`src/_pages/products/ui/ProductListContent.tsx`](../../src/_pages/products/ui/ProductListContent.tsx)
  - [`src/widgets/product-card/ui/ProductGrid.tsx`](../../src/widgets/product-card/ui/ProductGrid.tsx)
- 방법론: 통합 테스트 + E2E 테스트

이 흐름은 서버 진입과 클라이언트 렌더링을 나눠 본다. 서버 진입에서는 `page.tsx`의 `Suspense fallback`이 slow 목록 데이터를 기다리는 동안 먼저 보이는지 확인해야 한다. 클라이언트에서는 React Query 요청, MSW 응답, pending UI, 상품 grid 렌더링이 함께 맞아야 한다.

통합 테스트로는 클라이언트 React Query가 데이터 없는 최초 상태에서 pending UI를 보여주고, MSW 성공 응답 뒤 실제 상품 목록을 렌더링하는지 확인한다.

서버 Suspense fallback이 document 진입 시 먼저 보이는지는 App Router streaming과 production build 동작이 포함되므로 E2E에서 확인한다. 이때 사용자 URL에는 테스트용 query를 붙이지 않고, mock API 제어 endpoint로 products 응답만 `slow`로 바꾼 뒤 `/products`에 진입한다. 테스트는 `page.goto("/products", { waitUntil: "commit" })`로 document 응답이 시작된 직후를 먼저 보고, fallback이 보인 다음 실제 목록으로 교체되는지 확인한다.

이 테스트가 빨간불이 되면 최초 진입에서 목록 크기를 예상할 수 있는 pending UI가 빠졌거나, 서버 Suspense fallback이 slow 목록 데이터에 막혀 먼저 보이지 않는다는 뜻이다. 또는 성공 응답을 받은 뒤 현재 URL 조건에 맞는 상품 id와 개수가 grid에 반영되지 않는다는 뜻이다.

### 목록 빈 결과

- 검증 대상: 성공 응답이지만 상품이 0건인 상태
- 관련 코드:
  - [`src/_pages/products/ui/ProductListResults.tsx`](../../src/_pages/products/ui/ProductListResults.tsx)
  - [`src/_pages/products/ui/ProductListContent.tsx`](../../src/_pages/products/ui/ProductListContent.tsx)
  - [`src/app/api/products/route.ts`](../../src/app/api/products/route.ts)
- 방법론: 통합 테스트

빈 결과는 실패가 아니라 성공 상태다. 그래서 로딩이나 에러와 다른 화면으로 분리되어야 하고, 현재 URL 조건에 맞는 결과가 0건임을 사용자가 알 수 있어야 한다.

이 테스트가 빨간불이 되면 0건 응답을 에러처럼 보여주거나, 빈 결과 안내 없이 빈 영역만 남기는 문제가 생겼다는 뜻이다.

### 목록 에러

- 검증 대상: 최초 상품 목록 요청 실패가 서버 렌더링을 깨지 않고, 클라이언트에서 실패 화면과 재시도 방법으로 드러나는 흐름
- 관련 코드:
  - [`src/app/(commerce)/products/page.tsx`][products-page]
  - [`src/_pages/products/api/productApi.ts`](../../src/_pages/products/api/productApi.ts)
  - [`src/_pages/products/queries/productQueries.ts`](../../src/_pages/products/queries/productQueries.ts)
  - [`src/_pages/products/ui/ProductListResults.tsx`](../../src/_pages/products/ui/ProductListResults.tsx)
  - [`src/_pages/products/ui/ProductListContent.tsx`](../../src/_pages/products/ui/ProductListContent.tsx)
  - [`src/app/api/products/route.ts`](../../src/app/api/products/route.ts)
- 방법론: 통합 테스트 + E2E 테스트

최초 실패는 이전에 보여줄 목록이 없기 때문에 목록 대신 실패 이유와 다시 시도할 방법을 보여줘야 한다. 클라이언트 통합 테스트에서는 MSW로 500 응답을 만들고, `productApi`가 `response.ok` 실패를 에러로 바꾸는지, `ProductListResults`가 그 에러를 `ProductListContent`에 넘겨 실패 UI를 보여주는지 확인한다.

서버 진입에서는 `page.tsx`가 `prefetchQuery`를 `void`로 시작하기 때문에 실패 응답이 document render 자체를 막으면 안 된다. E2E에서는 mock API 제어 endpoint로 products 응답만 `error`로 바꾼 뒤 `/products`에 진입한다. 이때 페이지 shell이 깨지지 않고, 이후 상품 목록 영역에 실패 화면과 retry가 보이는지 확인한다.

이 테스트가 빨간불이 되면 최초 실패가 빈 결과나 로딩 상태처럼 보이거나, 사용자가 다시 시도할 방법을 찾을 수 없다는 뜻이다. 또는 서버 prefetch 실패가 document 렌더링을 막아 상품 목록 페이지 자체가 깨지고 있다는 뜻이다.

### 에러에서 재시도로 복구

- 검증 대상: 실패 화면에서 다시 시도 버튼을 눌러 성공 목록으로 복구되는 흐름
- 관련 코드:
  - [`src/_pages/products/api/productApi.ts`](../../src/_pages/products/api/productApi.ts)
  - [`src/_pages/products/ui/ProductListResults.tsx`](../../src/_pages/products/ui/ProductListResults.tsx)
  - [`src/_pages/products/ui/ProductListContent.tsx`](../../src/_pages/products/ui/ProductListContent.tsx)
- 방법론: 통합 테스트

이 항목은 이미 `ProductListPage.test.tsx`의 “상품 목록 요청이 실패하면 새로고침 없이 다시 시도할 수 있다” 테스트에서 다루고 있다. 첫 요청은 실패시키고, 다시 시도 요청은 성공시키는 MSW handler로 같은 화면 안에서 복구되는지 확인한다.

이 테스트가 빨간불이 되면 retry 버튼이 같은 query를 다시 요청하지 못하거나, 성공 응답 이후에도 에러 화면에 머무른다는 뜻이다.

### 카테고리 변경 → 목록 변경

- 검증 대상: 카테고리 선택이 URL 조건과 상품 목록 갱신으로 이어지는 흐름
- 관련 코드:
  - [`src/_pages/products/ui/ProductListPage.tsx`](../../src/_pages/products/ui/ProductListPage.tsx)
  - [`src/_pages/products/ui/ProductFilters.tsx`](../../src/_pages/products/ui/ProductFilters.tsx)
  - [`src/_pages/products/ui/ProductListResults.tsx`](../../src/_pages/products/ui/ProductListResults.tsx)
  - [`src/_pages/products/model/useProductListSearchParams.ts`](../../src/_pages/products/model/useProductListSearchParams.ts)
- 방법론: 통합 테스트

카테고리 변경은 필터 셀렉트 조작, URL query 변경, React Query 재조회, MSW 성공 응답, 목록 렌더링이 이어지는 흐름이다. 개별 함수의 반환값만으로는 사용자가 선택한 카테고리가 실제 요청 조건과 화면 결과까지 이어졌는지 확인하기 어렵다.

이 테스트가 빨간불이 되면 카테고리 선택이 `category` query에 반영되지 않았거나, 변경 후 `page`가 1로 초기화되지 않았거나, 새 조건으로 받은 상품 목록이 화면에 표시되지 않는다는 뜻이다.

### 정렬 변경 → 순서 변경

- 검증 대상: 정렬 선택이 URL 조건과 상품 목록 순서에 반영되는 흐름
- 관련 코드:
  - [`src/_pages/products/ui/ProductListPage.tsx`](../../src/_pages/products/ui/ProductListPage.tsx)
  - [`src/_pages/products/ui/ProductFilters.tsx`](../../src/_pages/products/ui/ProductFilters.tsx)
  - [`src/_pages/products/ui/ProductListResults.tsx`](../../src/_pages/products/ui/ProductListResults.tsx)
  - [`src/_pages/products/model/useProductListSearchParams.ts`](../../src/_pages/products/model/useProductListSearchParams.ts)
- 방법론: 통합 테스트

정렬 변경은 필터 셀렉트 조작, URL query 변경, React Query 재조회, MSW 성공 응답, 목록 렌더링이 이어지는 흐름이다. 개별 함수의 반환값만으로는 사용자가 선택한 정렬이 실제 요청 조건과 화면 결과까지 이어졌는지 확인하기 어렵다.

이 테스트가 빨간불이 되면 정렬 선택이 `sort` query에 반영되지 않았거나, 변경 후 `page`가 1로 초기화되지 않았거나, 새 조건으로 받은 상품 목록의 순서가 화면에 반영되지 않는다는 뜻이다.

### 페이지 이동 → 목록 변경

- 검증 대상: 페이지네이션 조작이 URL 조건, 목록 갱신, 스크롤 이동으로 이어지는 흐름
- 관련 코드:
  - [`src/_pages/products/ui/ProductListPage.tsx`](../../src/_pages/products/ui/ProductListPage.tsx)
  - [`src/_pages/products/ui/Pagination.tsx`](../../src/_pages/products/ui/Pagination.tsx)
  - [`src/_pages/products/ui/ProductListResults.tsx`](../../src/_pages/products/ui/ProductListResults.tsx)
  - [`src/_pages/products/model/useProductListSearchParams.ts`](../../src/_pages/products/model/useProductListSearchParams.ts)
- 방법론: 통합 테스트

페이지 변경은 `Pagination` 컴포넌트 조작, URL query 변경, React Query 재조회, MSW 성공 응답, 목록 렌더링이 이어지는 흐름이다. 또한 페이지가 바뀌면 사용자가 새 목록의 시작 지점으로 돌아올 수 있도록 상품 목록 필터 영역으로 스크롤해야 한다. 개별 함수의 반환값만으로는 사용자가 선택한 페이지가 실제 요청 조건, 화면의 상품 목록, 스크롤 동작까지 이어졌는지 확인하기 어렵다.

이 테스트가 빨간불이 되면 페이지 변경이 `page` query에 반영되지 않았거나, 새 `page` 조건으로 요청하지 않았거나, 응답받은 상품 목록이 화면에 갱신되지 않았다는 뜻이다. 또는 페이지 변경 후 목록 필터 영역으로 스크롤되지 않아 사용자가 새 목록의 시작 위치를 놓칠 수 있다.

### 조작이 URL에 반영 · URL로 재진입

- 검증 대상: 상품 목록 필터 상태가 URL query와 동기화되는 계약
- 관련 코드:
  - [`src/_pages/products/model/searchParams.ts`](../../src/_pages/products/model/searchParams.ts)
  - [`src/_pages/products/model/useProductListSearchParams.ts`](../../src/_pages/products/model/useProductListSearchParams.ts)
  - [`src/_pages/products/ui/ProductListPage.tsx`](../../src/_pages/products/ui/ProductListPage.tsx)
  - [`src/_pages/products/ui/ProductFilters.tsx`](../../src/_pages/products/ui/ProductFilters.tsx)
  - [`src/_pages/products/ui/ProductListResults.tsx`](../../src/_pages/products/ui/ProductListResults.tsx)
- 방법론: 통합 테스트 + E2E 테스트

상품 목록의 검색, 카테고리, 정렬, 페이지 상태는 `nuqs`로 URL query에 둔다. 이 항목의 핵심은 사용자 조작이 URL query에 반영되는지, URL query로 진입했을 때 같은 조건이 필터 UI와 목록 요청에 쓰이는지 확인하는 것이다.

일반적인 검색·카테고리·정렬·페이지 조작이 URL query와 React Query 요청 조건으로 이어지는 계약은 `NuqsTestingAdapter`와 MSW를 쓰는 통합 테스트에서 확인한다. 반면 URL query로 직접 진입하는 흐름은 실제 document 요청, 서버 `searchParams` 파싱, hydration 이후 필터 UI 복원이 함께 맞아야 하므로 E2E에서도 확인한다.

이 테스트가 빨간불이 되면 필터 조작이 URL에 남지 않거나, URL로 다시 진입했을 때 검색·카테고리·정렬·페이지 조건이 필터 UI와 요청 조건으로 복원되지 않는다는 뜻이다.

### 담기 → 헤더 개수 · 다시 누르면 빠짐

- 검증 대상: 상품 카드 action 버튼에서 cart/wishlist store를 거쳐 Header 개수 표시로 이어지는 흐름
- 관련 코드:
  - [`src/widgets/product-card/ui/ProductCardActionButton.tsx`](../../src/widgets/product-card/ui/ProductCardActionButton.tsx)
  - [`src/features/add-to-cart/model/useAddToCart.ts`](../../src/features/add-to-cart/model/useAddToCart.ts)
  - [`src/features/toggle-wishlist/model/useToggleWishlist.ts`](../../src/features/toggle-wishlist/model/useToggleWishlist.ts)
  - [`src/entities/cart/model/cartStore.ts`](../../src/entities/cart/model/cartStore.ts)
  - [`src/entities/wishlist/model/wishlistStore.ts`](../../src/entities/wishlist/model/wishlistStore.ts)
  - [`src/widgets/header/ui/CommerceHeader.tsx`](../../src/widgets/header/ui/CommerceHeader.tsx)
- 테스트 위치: `src/_pages/products/ui/ProductListCommerceState.test.tsx`
- 방법론: 통합 테스트

상품 카드의 담기/찜 버튼은 버튼 하나의 동작처럼 보이지만, 실제로는 여러 레이어가 함께 동작한다. `ProductCardActionButton`에서 클릭이 발생하고, feature hook을 거쳐 Zustand store가 갱신된다. `CommerceHeader`는 그 store에서 파생된 개수를 읽어 화면에 표시한다.

따라서 이 항목은 버튼 컴포넌트만 단위 테스트하기보다, 상품 카드 action, store 갱신, Header 개수 변경까지 이어지는 흐름을 통합 테스트로 확인하는 것이 적절하다. 실제 브라우저 navigation이 핵심은 아니므로 E2E까지 올리지는 않는다.

이 테스트가 빨간불이 되면 상품 카드의 담기/찜 버튼이 cart/wishlist id map에 상품 id를 추가하지 못하거나, store 상태가 바뀌어도 Header 개수가 따라 바뀌지 않는다는 뜻이다. 또한 다시 클릭했을 때 개수가 `0`으로 돌아오지 않으면 id map에서 상품 id를 제거하는 toggle 해제 동작이 깨졌다는 것을 알 수 있다.

2단계 구현 때는 기존 테스트에 “한 번 클릭하면 Header 개수가 1이 된다”뿐 아니라, “다시 클릭하면 Header 개수가 0으로 돌아온다”는 단언을 추가한다.

### 뒤로·앞으로 가기로 필터 복원

- 검증 대상: 상품 목록 필터 조건이 URL history와 동기화되고, 브라우저 뒤로·앞으로 가기에서 복원되는 흐름
- 관련 코드:
  - [`src/_pages/products/model/useProductListSearchParams.ts`](../../src/_pages/products/model/useProductListSearchParams.ts)
  - [`src/_pages/products/model/searchParams.ts`](../../src/_pages/products/model/searchParams.ts)
  - [`src/_pages/products/ui/ProductListPage.tsx`](../../src/_pages/products/ui/ProductListPage.tsx)
  - [`src/_pages/products/ui/ProductFilters.tsx`](../../src/_pages/products/ui/ProductFilters.tsx)
  - [`src/_pages/products/ui/ProductListResults.tsx`](../../src/_pages/products/ui/ProductListResults.tsx)
- 방법론: E2E 테스트

이 항목의 핵심은 단순히 query string이 바뀌는지가 아니라, 실제 브라우저의 history stack에서 `back()`과 `forward()`가 동작했을 때 URL, 필터 UI, 목록 요청 조건, 화면 결과가 함께 복원되는지 확인하는 것이다.

`useProductListSearchParams.ts`에서 `nuqs`를 `history: "push"`로 사용하고 있으므로, 필터 변경마다 브라우저 history가 쌓여야 한다. 이 동작은 jsdom 통합 테스트에서도 일부 흉내 낼 수 있지만, 실제 브라우저의 주소창과 history 이동까지 확인하는 편이 더 정확하다.

이 테스트가 빨간불이 되면 필터 변경이 history entry로 남지 않거나, 뒤로·앞으로 가기 후 URL은 바뀌었는데 필터 UI나 상품 목록이 이전 조건으로 복원되지 않는다는 뜻이다. 또는 복원된 URL 조건과 실제 화면 결과가 어긋난다는 것을 알 수 있다.

### 새로고침해도 필터 상태가 유지

- 검증 대상: URL query로 진입하거나 새로고침했을 때 상품 목록 필터 조건이 복원되는 흐름
- 관련 코드:
  - [`src/app/(commerce)/products/page.tsx`][products-page]
  - [`src/_pages/products/model/searchParams.ts`](../../src/_pages/products/model/searchParams.ts)
  - [`src/_pages/products/model/useProductListSearchParams.ts`](../../src/_pages/products/model/useProductListSearchParams.ts)
  - [`src/_pages/products/ui/ProductListPage.tsx`](../../src/_pages/products/ui/ProductListPage.tsx)
  - [`src/_pages/products/ui/ProductFilters.tsx`](../../src/_pages/products/ui/ProductFilters.tsx)
  - [`src/_pages/products/ui/ProductListResults.tsx`](../../src/_pages/products/ui/ProductListResults.tsx)
- 방법론: E2E 테스트

이 항목은 URL query가 상품 목록 상태의 기준점인지 확인하는 테스트다. 사용자가 검색어, 카테고리, 정렬, 페이지 조건이 들어간 URL에서 새로고침했을 때도 같은 필터 UI와 같은 상품 목록이 보여야 한다.

새로고침은 실제 document 요청이 다시 발생하고, 서버 컴포넌트의 `searchParams` 파싱과 클라이언트의 `nuqs` 상태 복원이 함께 맞아야 한다. 그래서 컴포넌트 통합 테스트보다 production build 위에서 실제 브라우저로 확인하는 E2E가 더 적절하다.

이 테스트가 빨간불이 되면 URL query가 상태의 source of truth로 동작하지 않는다는 뜻이다. 새로고침 후 검색어, 카테고리, 정렬, 페이지가 기본값으로 돌아가거나, URL 조건과 다른 상품 목록을 요청하고 있을 수 있다.

### 목록 진입 → 담기 → 헤더 확인

- 검증 대상: 실제 `/products` 페이지에 진입한 뒤 상품을 담았을 때 Header 장바구니 개수가 갱신되는 흐름
- 관련 코드:
  - [`src/app/(commerce)/products/page.tsx`][products-page]
  - [`src/_pages/products/ui/ProductListPage.tsx`](../../src/_pages/products/ui/ProductListPage.tsx)
  - [`src/widgets/product-card/ui/ProductCardActionButton.tsx`](../../src/widgets/product-card/ui/ProductCardActionButton.tsx)
  - [`src/features/add-to-cart/model/useAddToCart.ts`](../../src/features/add-to-cart/model/useAddToCart.ts)
  - [`src/entities/cart/model/cartStore.ts`](../../src/entities/cart/model/cartStore.ts)
  - [`src/widgets/header/ui/CommerceHeader.tsx`](../../src/widgets/header/ui/CommerceHeader.tsx)
- 방법론: E2E 테스트

이 항목은 컴포넌트 내부 동작보다 실제 사용자가 `/products` 페이지에 들어와 상품 목록을 보고, 상품을 장바구니에 담은 뒤 Header 개수가 바뀌는지를 확인하는 흐름이다.

통합 테스트에서도 버튼 클릭과 Header 개수 변경은 확인할 수 있다. 다만 여기서는 실제 라우트, production build, 상품 API 응답, 브라우저에서의 hydration, Zustand store 연결까지 한 번에 확인하는 것이 목적이다. 그래서 E2E가 더 적절하다.

이 테스트가 빨간불이 되면 production 환경에서 `/products` document와 상품 API 응답이 사용자 화면까지 이어지지 않거나, 상품 카드 action 버튼이 hydration 이후 click handler를 잃었거나, store 갱신이 Header 개수 표시까지 전달되지 않는다는 뜻이다. 즉 테스트 환경의 컴포넌트 조합에서는 됐지만 실제 페이지에서는 안 되는 문제를 잡을 수 있다.

### 애매했던 판단

#### 조작이 URL에 반영 · URL로 재진입

이 항목은 어떤 부분을 통합 테스트로 두고, 어떤 부분을 E2E로 올릴지 고민했다. URL은 브라우저 주소창과 history에 걸쳐 있는 상태라 전부 E2E로 보는 것도 자연스럽다. 다만 일반 조작에서 확인하려는 핵심은 실제 브라우저 navigation이 아니라, `nuqs`가 만든 query 상태가 필터 UI와 React Query 요청 조건으로 이어지는 계약이다. 이 계약은 `NuqsTestingAdapter`와 MSW를 쓰는 통합 테스트에서 더 빠르고 세밀하게 확인할 수 있다.

만약 전부 E2E로 골랐다면 실제 주소창까지 확인할 수 있다는 장점은 있지만, 테스트가 느려지고 실패 원인이 브라우저 navigation인지 query 상태 연결인지 좁히기 어려워진다. 그래서 일반 조작과 URL 반영은 통합 테스트로 보고, URL 직접 진입·뒤로/앞으로 가기·새로고침처럼 실제 브라우저 경계가 중요한 흐름은 E2E로 남겼다.

#### 목록 로딩 → 성공

이 항목은 통합 테스트만으로 볼지, E2E까지 포함할지 고민했다. 클라이언트의 `isPending` 상태와 MSW 성공 응답 후 목록 렌더링은 통합 테스트로 충분히 확인할 수 있다. 하지만 Products 페이지에는 서버 `Suspense fallback`도 있고, slow 데이터가 document 진입을 막지 않는지가 중요하다. 이 부분은 App Router streaming과 production build 동작이 포함되므로 컴포넌트 통합 테스트만으로는 확인하기 어렵다.

통합 테스트만 선택했다면 클라이언트 pending UI는 검증할 수 있지만, 서버 fallback이 실제 페이지 진입에서 먼저 보이는지는 놓칠 수 있다. 그래서 클라이언트 pending에서 성공 목록으로 이어지는 흐름은 통합 테스트로 보고, 서버 fallback 선노출은 E2E로 나눠 확인하기로 했다.

### 이번 목록 밖의 테스트 판단

#### 다음에는 하면 좋겠다: 홈 페이지 주요 상품 액션 E2E

- 관련 코드:
  - [`src/app/(commerce)/page.tsx`][home-page]
  - [`src/_pages/home/ui/HomePageClient.tsx`](../../src/_pages/home/ui/HomePageClient.tsx)
  - [`src/widgets/product-card/ui/ProductCardActionButton.tsx`](../../src/widgets/product-card/ui/ProductCardActionButton.tsx)
  - [`src/widgets/header/ui/CommerceHeader.tsx`](../../src/widgets/header/ui/CommerceHeader.tsx)

핵심 구매 흐름과 URL-query 계약은 이번 15개 안에 넣었다. 갱신 실패 시 기존 목록을 유지하는 흐름도 `ProductListPage.test.tsx`에서 통합 테스트로 확인했다. 그래서 목록 밖에 남은 항목 중에서는 홈 페이지의 주요 상품 action을 production E2E로 확인하는 것이 다음 후보로 적절하다고 봤다.

홈 페이지는 이번 15개에서 Products 페이지보다 우선순위를 낮췄지만, 실제 사용자는 홈에서 상품을 보고 바로 장바구니나 위시리스트를 누를 수 있다. 이 흐름이 깨지면 진입 첫 화면에서 구매 의도가 끊긴다. 변경 빈도는 높지 않지만, 실패 비용은 사용자 경로 기준으로 작지 않다.

다만 이번 15개에서는 상품 목록의 URL 상태, 목록 요청, pending/error/empty, Header count를 우선 검증했다. 홈 action E2E까지 바로 넣으면 브라우저 테스트 시간이 늘고, Products에서 이미 같은 store 연결을 확인한 부분과 일부 겹친다. 그래서 다음 후보로 남긴다.

#### 앞으로도 안 하겠다: 상품 카드의 시각 스타일 세부값

상품 카드의 border, spacing, hover transition, skeleton 색상 같은 시각 스타일 세부값은 테스트하지 않는다. 이 값들은 디자인 조정에 따라 자주 바뀔 수 있고, 바뀌어도 기능 실패로 이어지는 비용은 낮다.

이 영역까지 테스트하면 작은 스타일 변경마다 테스트가 깨져 유지 비용이 더 커진다. 대신 상품명, 가격, 이미지 대체 텍스트, 담기/찜 action처럼 사용자가 실제로 의미를 얻거나 조작하는 부분만 테스트 대상으로 둔다.

## 2단계: 정한 대로 테스트 구현

1단계에서 고른 15개 항목은 실제 테스트로 옮겼다. 단위 테스트는 DOM 없이 model과 query 계약을 확인하고, 통합 테스트는 Testing Library와 MSW로 사용자 조작부터 요청 조건과 화면 결과까지 본다. E2E는 production build 위에서 실제 document 진입, 새로고침, history, hydration 이후 store 연결을 확인한다.

| 1단계 항목                          | 구현 위치                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 장바구니·위시리스트 개수 파생       | [`src/entities/cart/model/selectors.test.ts`](../../src/entities/cart/model/selectors.test.ts), [`src/entities/wishlist/model/selectors.test.ts`](../../src/entities/wishlist/model/selectors.test.ts)                                                                                                                                 |
| URL 조건 → query key                | [`src/_pages/products/model/searchParams.test.ts`](../../src/_pages/products/model/searchParams.test.ts), [`src/_pages/products/queries/productQueries.test.ts`](../../src/_pages/products/queries/productQueries.test.ts), [`src/_pages/products/ui/ProductListPage.test.tsx`](../../src/_pages/products/ui/ProductListPage.test.tsx) |
| 순수 로직                           | [`src/shared/lib/id-set/idSet.test.ts`](../../src/shared/lib/id-set/idSet.test.ts), [`src/entities/cart/model/cartPersistence.test.ts`](../../src/entities/cart/model/cartPersistence.test.ts), [`src/entities/wishlist/model/wishlistPersistence.test.ts`](../../src/entities/wishlist/model/wishlistPersistence.test.ts)             |
| 목록 로딩 → 성공                    | [`src/_pages/products/ui/ProductListPage.test.tsx`](../../src/_pages/products/ui/ProductListPage.test.tsx), [`e2e/products.spec.ts`](../../e2e/products.spec.ts)                                                                                                                                                                       |
| 목록 빈 결과                        | [`src/_pages/products/ui/ProductListPage.test.tsx`](../../src/_pages/products/ui/ProductListPage.test.tsx), [`e2e/products.spec.ts`](../../e2e/products.spec.ts)                                                                                                                                                                       |
| 목록 에러                           | [`src/_pages/products/ui/ProductListPage.test.tsx`](../../src/_pages/products/ui/ProductListPage.test.tsx), [`e2e/products.spec.ts`](../../e2e/products.spec.ts)                                                                                                                                                                       |
| 에러에서 재시도로 복구              | [`src/_pages/products/ui/ProductListPage.test.tsx`](../../src/_pages/products/ui/ProductListPage.test.tsx)                                                                                                                                                                                                                             |
| 카테고리 변경 → 목록 변경           | [`src/_pages/products/ui/ProductListPage.test.tsx`](../../src/_pages/products/ui/ProductListPage.test.tsx)                                                                                                                                                                                                                             |
| 정렬 변경 → 순서 변경               | [`src/_pages/products/ui/ProductListPage.test.tsx`](../../src/_pages/products/ui/ProductListPage.test.tsx)                                                                                                                                                                                                                             |
| 페이지 이동 → 목록 변경             | [`src/_pages/products/ui/ProductListPage.test.tsx`](../../src/_pages/products/ui/ProductListPage.test.tsx)                                                                                                                                                                                                                             |
| 조작이 URL에 반영 · URL로 재진입    | [`src/_pages/products/ui/ProductListPage.test.tsx`](../../src/_pages/products/ui/ProductListPage.test.tsx), [`e2e/products.spec.ts`](../../e2e/products.spec.ts)                                                                                                                                                                       |
| 담기 → 헤더 개수 · 다시 누르면 빠짐 | [`src/_pages/products/ui/ProductListCommerceState.test.tsx`](../../src/_pages/products/ui/ProductListCommerceState.test.tsx)                                                                                                                                                                                                           |
| 뒤로·앞으로 가기로 필터 복원        | [`e2e/products.spec.ts`](../../e2e/products.spec.ts)                                                                                                                                                                                                                                                                                   |
| 새로고침해도 필터 상태 유지         | [`e2e/products.spec.ts`](../../e2e/products.spec.ts)                                                                                                                                                                                                                                                                                   |
| 목록 진입 → 담기 → 헤더 확인        | [`e2e/products.spec.ts`](../../e2e/products.spec.ts)                                                                                                                                                                                                                                                                                   |

통합 테스트의 네트워크는 MSW로 가로챘고, 실패·지연·빈 결과는 각 테스트 안에서 handler를 덮어써 기본 성공 handler가 다른 테스트에 영향을 주지 않게 했다. E2E는 별도 mock API 서버의 `POST /__test__/scenario`와 `POST /__test__/reset`으로 응답 상태를 제어한다. 테스트용 상태를 사용자 URL에 넣지 않아, 실제 앱의 URL query 계약과 테스트 제어 채널을 분리했다.

각 항목에는 정상 케이스와 경계 케이스를 함께 넣었다. 여기서 경계 케이스는 가능한 모든 예외가 아니라, 이번 과제 범위에서 실제로 깨지기 쉬운 입력·상태 전환·복구 흐름을 가리킨다.

| 1단계 항목                          | 정상 케이스                                                   | 경계 케이스                                                                        |
| ----------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 장바구니·위시리스트 개수 파생       | id map에 담긴 상품 수를 Header count로 계산한다.              | 빈 map이면 count가 0이고, 다시 누르면 1에서 0으로 돌아간다.                        |
| URL 조건 → query key                | `q`, `category`, `sort`, `page`, `pageSize`가 key에 들어간다. | 조건 일부가 바뀌면 다른 key가 만들어지고, 잘못된 URL 값은 정규화된다.              |
| 순수 로직                           | 유효한 id set과 persist 저장값을 안전한 상태로 바꾼다.        | `null`, 배열, 문자열 `"true"`, 공백 id, 깨진 저장값을 걸러낸다.                    |
| 목록 로딩 → 성공                    | pending UI 이후 현재 조건의 상품 목록으로 전환된다.           | slow 응답 중에도 서버 fallback이나 목록 skeleton이 먼저 보인다.                    |
| 목록 빈 결과                        | 성공 응답이 0건이면 빈 결과 문구와 `총 0개`가 보인다.         | 0건 상태에서는 상품 grid 영역이 남아 있는 것처럼 보이지 않는다.                    |
| 목록 에러                           | 최초 실패 시 목록 대신 실패 이유와 다시 시도 버튼이 보인다.   | 서버 fallback은 깨지지 않고, 실패 화면이 빈 결과처럼 보이지 않는다.                |
| 에러에서 재시도로 복구              | 첫 요청 실패 후 retry 성공 시 목록으로 복구된다.              | retry 이후 에러 화면에 머물지 않는다.                                              |
| 카테고리 변경 → 목록 변경           | 카테고리 선택이 URL과 요청 조건, 목록 결과에 반영된다.        | 3페이지에서 바꾸면 `page`가 1로 초기화된다.                                        |
| 정렬 변경 → 순서 변경               | 정렬 선택이 URL과 요청 조건, 목록 순서에 반영된다.            | 3페이지에서 바꾸면 `page`가 1로 초기화된다.                                        |
| 페이지 이동 → 목록 변경             | 페이지 버튼이 `page` query와 새 목록 결과로 이어진다.         | 끝 페이지를 넘는 URL은 유효한 마지막 페이지로 보정되고 목록 시작점으로 스크롤된다. |
| 조작이 URL에 반영 · URL로 재진입    | 검색·필터·정렬 조작이 URL query와 요청 조건에 반영된다.       | URL로 직접 진입해도 필터 UI와 목록 요청 조건이 복원된다.                           |
| 담기 → 헤더 개수 · 다시 누르면 빠짐 | 상품 담기 후 Header 장바구니 count가 1이 된다.                | 같은 버튼을 다시 누르면 count가 0으로 돌아간다.                                    |
| 뒤로·앞으로 가기로 필터 복원        | 브라우저 history 이동으로 이전/다음 필터 상태가 복원된다.     | 여러 조건을 연속으로 바꾼 뒤에도 history 순서대로 필터가 복원된다.                 |
| 새로고침해도 필터 상태 유지         | URL query로 새로고침해도 필터 UI와 목록 결과가 유지된다.      | document reload 이후에도 hydration된 UI가 URL 조건과 어긋나지 않는다.              |
| 목록 진입 → 담기 → 헤더 확인        | production route 진입 후 상품을 담으면 Header count가 바뀐다. | SSR로 받은 목록이 hydration된 뒤에도 담기 동작과 Header count가 이어진다.          |

요소는 사용자가 인식하는 이름과 역할을 기준으로 찾았다. 이번 구현에서는 `getByTestId`를 쓰지 않았다. E2E도 `sleep`으로 시간을 맞추지 않고, `expect`, `goto`, `reload`, `goBack`, `goForward` 같은 조건 기반 대기로 확인했다.

## 3단계: 테스트가 실제 회귀를 잡는지 확인

2단계에서 만든 테스트가 실제로 의미 있는 회귀를 잡는지 확인하기 위해 구현 코드만 잠시 망가뜨렸다. 실험 후에는 변경을 되돌리고, 원래 테스트가 다시 통과하는지 확인했다.

|   # | 방법론      | 망가뜨린 곳                                                                                                                | 테스트 파일                                                                                                      | 어떻게 바꿨나                                                         | 결과 | 실패한 테스트                                                                                                                 |
| --: | ----------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------- |
|   1 | 단위 테스트 | [`src/shared/lib/id-set/idSet.ts`](../../src/shared/lib/id-set/idSet.ts)                                                   | [`src/shared/lib/id-set/idSet.test.ts`](../../src/shared/lib/id-set/idSet.test.ts)                               | `included === true` 조건을 `included`로 느슨하게 바꿨다.              | 잡힘 | `normalizeIdSet > true 값으로 표시된 상품 id만 유지한다`                                                                      |
|   2 | 단위 테스트 | [`src/_pages/products/queries/productQueries.ts`](../../src/_pages/products/queries/productQueries.ts)                     | [`src/_pages/products/queries/productQueries.test.ts`](../../src/_pages/products/queries/productQueries.test.ts) | 상품 목록 query key에서 `sort`를 제외했다.                            | 잡힘 | `productQueries > 상품 목록 query key는 조회 조건 전체를 포함한다`                                                            |
|   3 | 통합 테스트 | [`src/_pages/products/model/useProductListSearchParams.ts`](../../src/_pages/products/model/useProductListSearchParams.ts) | [`src/_pages/products/ui/ProductListPage.test.tsx`](../../src/_pages/products/ui/ProductListPage.test.tsx)       | 카테고리 변경 시 `page: 1` 초기화를 제거했다.                         | 잡힘 | `ProductListPageClient > 필터 조건 변경 > 카테고리를 변경하면 URL 상태와 조회 조건을 page 1 기준으로 갱신한다`                |
|   4 | 통합 테스트 | [`src/_pages/products/ui/ProductListResults.tsx`](../../src/_pages/products/ui/ProductListResults.tsx)                     | [`src/_pages/products/ui/ProductListPage.test.tsx`](../../src/_pages/products/ui/ProductListPage.test.tsx)       | retry callback에서 `productsQuery.refetch()` 호출을 제거했다.         | 잡힘 | `ProductListPageClient > 에러 상태 > 최초 상품 목록 요청이 실패하면 실패 화면을 보여주고 다시 시도 성공 후 목록으로 복구한다` |
|   5 | E2E 테스트  | [`src/_pages/products/model/useProductListSearchParams.ts`](../../src/_pages/products/model/useProductListSearchParams.ts) | [`e2e/products.spec.ts`](../../e2e/products.spec.ts)                                                             | `useQueryStates`의 기본 history 옵션을 `push`에서 `replace`로 바꿨다. | 잡힘 | `상품 목록 E2E > 뒤로 가기와 앞으로 가기로 URL query 기반 필터 상태를 복원한다`                                               |

첫 번째 실험에서는 persist 저장값에 문자열 `"true"`가 섞여 들어왔을 때도 id set에 남는 회귀를 만들었다. 테스트는 `{ p1: true, p3: true, p4: true }`가 실제 결과로 나왔고, 기대값에는 `p3`가 없어야 한다고 실패했다. 실패 메시지에서 잘못 남은 id가 바로 보였기 때문에 원인을 추측하기 쉬웠다.

```text
AssertionError: expected { p1: true, p3: true, p4: true } to deeply equal { p1: true, p4: true }
```

```ts
// 변경 전
if (key.trim().length > 0 && included === true) {
  idSet[key] = true;
}

// 실험
if (key.trim().length > 0 && included) {
  idSet[key] = true;
}
```

두 번째 실험에서는 정렬 조건이 React Query cache key에서 빠지는 회귀를 만들었다. 테스트는 기대 query key에는 `sort: "popular"`가 있어야 하는데 실제 query key에는 `sort`가 없다고 실패했다. 실패 메시지의 diff에 빠진 필드가 직접 표시되어, URL 조건별 cache 분리 계약이 깨졌다는 원인을 바로 추측할 수 있었다.

```text
-     "sort": "popular",
```

```ts
// 변경 전
const productListQueryKey = (params: ProductListQuery) =>
  [...productQueriesAll(), "list", params] as const;

// 실험
const productListQueryKey = ({ sort: _sort, ...params }: ProductListQuery) =>
  [...productQueriesAll(), "list", params] as const;
```

세 번째 실험에서는 사용자가 3페이지에서 카테고리를 바꿔도 `page`가 1로 초기화되지 않는 회귀를 만들었다. 통합 테스트는 URL update call이 `?category=goods&sort=latest&page=3`으로 남았고, 기대한 `{ category: "goods", page: 1 }`을 포함하지 않는다고 실패했다. 실패 메시지에서 이전 page가 유지된 사실이 드러나므로, 필터 변경 시 page 초기화가 빠졌다는 원인을 추측할 수 있었다.

```text
AssertionError: expected URL update calls ["?category=goods&sort=latest&page=3"] to include {"category":"goods","page":1}: expected false to be true
```

```ts
// 변경 전
void setParams({ category, page: 1 });

// 실험
void setParams({ category });
```

네 번째 실험에서는 실패 화면의 retry 버튼은 그대로 보이지만 실제 재요청은 하지 않는 회귀를 만들었다. 테스트는 다시 시도 버튼을 누른 뒤 성공 목록의 `"첫 번째 상품"`을 찾지 못해 실패했다. 실패 출력에 실패 화면 DOM이 길게 함께 나와 원인이 아주 직접적으로 보이지는 않았지만, 테스트 이름과 `findByText("첫 번째 상품")` 실패 위치를 보면 retry가 성공 목록으로 복구하지 못했다는 사실은 추적할 수 있었다.

```text
TestingLibraryElementError: Unable to find an element with the text: 첫 번째 상품.
```

```tsx
// 변경 전
onRetry={() => void productsQuery.refetch()}

// 실험
onRetry={() => undefined}
```

다섯 번째 실험에서는 필터 조작이 브라우저 history entry를 쌓지 않고 현재 entry를 교체하도록 바꿨다. E2E는 `page.goBack()` 이후 정렬 버튼이 `"최신순"`으로 돌아오는지 확인하다가 실패했다. 실패 메시지는 정렬 버튼 자체를 찾지 못했다고 나왔다. `replace`로 인해 기대한 필터 이전 상태가 history에 남지 않아, 뒤로 가기가 상품 목록의 이전 필터 상태가 아닌 다른 document 상태로 이동한 회귀라고 판단했다.

```text
Error: expect(locator).toContainText(expected) failed
Locator: getByRole('button', { name: '정렬' })
Expected substring: "최신순"
Error: element(s) not found
```

```ts
// 변경 전
const [params, setParams] = useQueryStates(productListSearchParams, {
  history: "push",
});

// 실험
const [params, setParams] = useQueryStates(productListSearchParams, {
  history: "replace",
});
```

## 체크리스트 대응 요약

| 단계  | 확인한 내용                                                                                                                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0단계 | `node`/`jsdom` 환경을 분리했고, 환경 셋업 시간을 비교했다. MSW는 unhandled request를 에러로 막고, HTTP 클라이언트를 직접 mock하지 않는다. Playwright는 production build 위에서 돌며, E2E는 `pnpm test`와 분리하고 `pnpm check`에 포함했다. |
| 1단계 | 15개 항목마다 방법론, 관련 코드, 선택 이유, 빨간불이 되면 알 수 있는 내용을 적었다. 애매했던 판단 2개와 목록 밖 테스트 판단도 별도로 남겼다.                                                                                               |
| 2단계 | 15개 항목을 테스트 파일에 매핑했고, 정상 케이스와 경계 케이스를 함께 정리했다. 통합 테스트는 MSW, E2E는 mock API 서버로 네트워크 경계를 세웠다.                                                                                            |
| 3단계 | 단위·통합·E2E 방법론별로 실제 구현을 망가뜨려 테스트 실패를 확인했다. 실패 메시지와 원인을 기록했고, 실험 코드는 최종 상태에 남기지 않았다.                                                                                                |
| 공통  | `it.skip`, 의미 없는 `toBeTruthy()`, 스냅샷 대체 검증은 쓰지 않았다. 최종 기준 `pnpm check`는 Vitest 29 files, 138 tests와 Playwright 8 tests까지 통과했다.                                                                                |

[products-page]: ../../src/app/(commerce)/products/page.tsx
[home-page]: ../../src/app/(commerce)/page.tsx
