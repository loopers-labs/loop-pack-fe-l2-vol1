# RFC — 8주차 테스트 계획: 무엇을 지킬지 먼저 정한다

| 항목      | 내용                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------ |
| 상태      | 초안 (테스트 코드 작성 전)                                                                             |
| 기준 커밋 | `d7ae9e9`                                                                                              |
| 대상      | `src/**` — 특히 `_pages/product-list`, `features/product-filter`, `entities/cart`, `entities/wishlist` |
| 원칙      | 이 문서는 **테스트 코드보다 먼저 커밋한다.** 표를 채운 뒤에 배치를 바꾸면 문서를 먼저 고친다.          |
| 환경      | Node 24.17.0 · pnpm 10.15.1 · Next 16.2.10 · React 19.2.4 · vitest 4.1.10                              |

> 커버리지 숫자는 이 문서에 없다. 이번 주 산출물은 **"무엇을 지키기로 했고 왜 그렇게 정했는가"** 다.

---

## 0. 환경과 모킹 경계

### 0.1 설치할 것

| 패키지                        | 역할              | 이 프로젝트에서 필요한 이유                                |
| ----------------------------- | ----------------- | ---------------------------------------------------------- |
| `@testing-library/react`      | 렌더·조회         | 통합으로 정한 9개 항목이 컴포넌트를 그린다                 |
| `@testing-library/user-event` | 클릭·입력 재현    | 필터 폼 submit, select change, 담기 버튼 토글              |
| `@testing-library/jest-dom`   | DOM matcher       | `toBeDisabled`, `toHaveAttribute('aria-pressed')`          |
| `jsdom`                       | DOM 환경          | 아래 0.2 참조                                              |
| `msw`                         | 네트워크 가로채기 | `apiClient` 의 `fetch` 를 바꿔치기하지 않기 위해           |
| `@playwright/test`            | E2E               | history 왕복·새로고침·`localStorage` persist 는 jsdom 한계 |

`jsdom` 을 고른다. `happy-dom` 이 더 빠르지만 이번 주 통합 테스트가 `history`, `localStorage`, 상대경로 `fetch` 를 한꺼번에 쓴다. 셋업 시간 차이보다 **호환성 사고 하나가 더 비싸다**고 판단했다. 실제 셋업 시간은 0.8에서 재고, 차이가 유의미하면 그때 다시 본다.

---

### 0.2 DOM 환경 분리 — `test.projects`

**결정: `vitest.config.ts` 에 `projects` 두 개(`node`, `jsdom`)를 둔다.**

지금 `vitest.config.ts` 는 `environment: 'node'` 단일이고, 기존 테스트 5개는 전부 DOM이 필요 없다.

```
src/app/api/home/route.test.ts
src/app/api/products/route.test.ts
src/app/api/_data/commerce.test.ts
src/app/performance-lab/inp/products.test.ts
src/examples/week-07-performance/HeroSection.test.tsx   ← renderToStaticMarkup, DOM 불필요
```

마지막 파일은 확장자가 `.tsx` 지만 `renderToStaticMarkup` 으로 문자열만 비교하므로 **DOM이 필요 없다.** 따라서 "`.tsx` 면 jsdom" 같은 확장자 기준 분리는 이 레포에서 틀린다. 파일 경로/이름 기준으로 나눈다.

**후보와 탈락 이유**

| 후보                            | 판정                                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `environmentMatchGlobs`         | **불가.** vitest 4 에서 제거됐다. 설치된 `node_modules/vitest/dist` 에 심볼이 없다.                                           |
| 파일 상단 `@vitest-environment` | 가능하지만 탈락. `setupFiles` 가 전역이라 **DOM이 필요 없는 5개도 MSW 서버 기동·`jest-dom` 확장 비용을 매번 낸다.**           |
| **`test.projects` (채택)**      | `setupFiles` 를 jsdom 프로젝트에만 건다. node 테스트는 MSW를 아예 모른다. 셋업 시간도 프로젝트별로 따로 찍혀 0.8 비교가 쉽다. |

명령은 여전히 `vitest run` 하나다. 두 프로젝트가 한 번에 돈다.

```ts
// vitest.config.ts (예정)
projects: [
  {
    test: {
      name: 'node',
      environment: 'node',
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['src/**/*.dom.test.{ts,tsx}'],
    },
  },
  {
    test: {
      name: 'jsdom',
      environment: 'jsdom',
      include: ['src/**/*.dom.test.{ts,tsx}'],
      setupFiles: ['./src/test/setup.dom.ts'],
      environmentOptions: { jsdom: { url: 'http://localhost:3000' } },
    },
  },
],
```

`*.dom.test.tsx` 라는 **접미사로 나눈다.** 디렉터리로 나누면(`__tests__/unit`, `__tests__/integration`) 테스트가 대상 코드에서 멀어진다. 이 레포는 지금도 테스트를 대상 파일 옆에 두고 있으므로 그 관례를 유지한다. 접미사는 파일명만 보고 어느 환경에서 도는지 알 수 있다는 이점도 있다.

`jsdom.url` 을 `http://localhost:3000` 으로 고정하는 이유는 0.3에 있다.

---

### 0.3 모킹 경계 — MSW를 `fetch` 앞이 아니라 네트워크에 둔다

**결정: `apiClient` 의 `fetch` 를 건드리지 않는다. 요청은 실제로 나가고 MSW의 `setupServer` 가 가로챈다.**

`src/shared/api/apiClient.ts` 는 origin을 이렇게 정한다.

```ts
const base = typeof window === 'undefined' ? `${getAppOrigin()}${this.baseUrl}` : this.baseUrl;
```

jsdom에서는 `window` 가 있으므로 **상대경로 `/api/products` 로 요청이 나간다.** jsdom의 기본 URL은 `about:blank` 라서 상대경로가 해석되지 않는다. 그래서 0.2에서 `jsdom.url` 을 고정했다. 이 한 줄이 없으면 MSW 핸들러가 요청을 못 받고 원인 찾기 어려운 실패가 난다.

**핸들러 정책**

- 기본 핸들러(`src/test/handlers.ts`)에는 **성공 경로만** 둔다. `GET /api/products` 200, `GET /api/home` 200.
- 실패·빈 결과·지연은 **그 테스트 안에서** `server.use(...)` 로 덮는다. 기본 핸들러에 시나리오 분기를 넣으면 어떤 테스트가 무엇을 기대하는지 파일을 넘나들며 읽어야 한다.
- `onUnhandledRequest: 'error'`. **모킹되지 않은 요청이 조용히 나가지 않게** 막는다. 경고(`'warn'`)로 두면 CI 로그에 묻힌다.

**응답 지연**

mock API의 지연은 `waitForMockApi` 가 `NODE_ENV === 'test'` 일 때 0ms로 떨어뜨린다. 그래서 **route handler 단위 테스트는 지연을 만나지 않는다.** 통합 테스트의 지연은 MSW 핸들러가 정하고, E2E는 production 실행이라 **500ms 실지연을 그대로 만난다.** 세 층이 지연을 다르게 겪는다는 사실을 여기 적어 둔다 — 2단계에서 통합 테스트에 임의 대기를 넣고 싶어질 때 돌아볼 자리다.

**AS-IS 정리**

`fetch`/`axios` 를 바꿔치기하는 코드는 지금 레포에 없다. 새로 만들지 않는 것이 이 절의 요구다. 다만 `src/services/products.ts` 에 **모듈 레벨 캐시**(`let cache: Promise<...> | null`)가 있어 테스트 간에 살아남는다. 이 파일은 이번 주 15개 항목에 들어가지 않으므로 건드리지 않지만, 나중에 이 경로를 테스트하면 캐시 리셋이 필요하다는 것을 남겨 둔다.

---

### 0.4 서버 상태 — 테스트용 QueryClient는 `retry: false`

`src/shared/api/queryClient.ts` 는 `retry` 를 지정하지 않는다. 즉 **TanStack Query 기본값인 3회 재시도 + 지수 백오프**가 걸린다. 에러 경로 통합 테스트를 앱과 같은 QueryClient로 돌리면 실패 확정까지 수 초가 걸려 타임아웃 난다.

테스트 렌더 헬퍼는 매 테스트마다 `retry: false` 인 새 `QueryClient` 를 만든다. 싱글턴(`getQueryClient`)을 쓰지 않는다 — 캐시가 다음 테스트로 새기 때문이다.

여기서 **의도적으로 포기하는 것**: 재시도 정책 자체는 테스트하지 않는다. 재시도 횟수는 라이브러리 기본값이고 우리가 고른 값이 아니다. 우리 결정인 것은 `shouldEscalateToBoundary` 의 4xx/5xx 분기이고, 그건 6번 항목에서 잡는다.

---

### 0.5 격리 — 전역 스토어와 `localStorage`

`useCartStore` / `useWishlistStore` 는 `persist` 미들웨어를 쓴다(`commerce-cart`, `commerce-wishlist`). 모듈 레벨 싱글턴이라 **테스트 파일 안에서 상태가 이어진다.**

`setup.dom.ts` 의 `afterEach` 에서 세 가지를 되돌린다.

1. `useCartStore.setState({ cart: [] })`, `useWishlistStore.setState({ wishlist: [] })`
2. `localStorage.clear()`
3. `cleanup()` (Testing Library), `server.resetHandlers()`

"파일을 단독으로 돌리든 순서를 바꿔 돌리든 같은 결과"는 이 셋으로 확보한다. 2단계에서 `vitest run --sequence.shuffle` 로 한 번 확인한다.

---

### 0.6 Playwright — production build 위에서

```ts
// playwright.config.ts (예정)
webServer: {
  command: 'pnpm start',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
},
```

`pnpm dev` 로 돌리지 않는다. 이 앱은 서버 컴포넌트 prefetch + `APP_ORIGIN` 절대 URL 분기가 있어서 dev와 production의 동작이 갈릴 여지가 있다. 그리고 mock API의 500ms 지연은 production에서만 나타난다 — **E2E가 잡아야 할 대기 문제가 dev에서는 아예 재현되지 않는다.**

`pnpm start` 는 빌드 산출물을 요구하므로 `pnpm build` 가 선행돼야 한다. 명령 배치(0.7)가 이 순서를 보장한다.

---

### 0.7 명령 구조 — E2E는 `pnpm test` 밖, `pnpm check` 안

**결정**

```jsonc
"test":     "vitest run",                    // 단위 + 통합 (node/jsdom 두 프로젝트)
"test:e2e": "playwright test",               // E2E
"check":    "pnpm test && pnpm lint && pnpm typecheck && pnpm build && pnpm test:e2e",
```

`pnpm test` 에 E2E를 넣지 않는 이유: 개발 중 가장 자주 두드리는 명령이 **매번 production build와 서버 기동을 끌고 가면 안 된다.** 단위·통합은 초 단위, E2E는 build 포함 분 단위다. 피드백 주기가 다른 둘을 한 명령에 묶으면 빠른 쪽이 느린 쪽에 끌려간다.

`pnpm check` 에는 넣는 이유: 과제와 CI(`.github/workflows/quality.yml`)가 **`pnpm check` 하나로 품질을 판정한다.** E2E가 어느 명령에도 안 걸리면 CI에서 영영 안 돈다. `build` **뒤에** 두는 것은 `pnpm start` 가 빌드 산출물을 요구하기 때문이다.

CI는 이미 `pnpm exec playwright --version` 이 성공하면 Chromium을 받아오도록 되어 있으므로 워크플로 수정은 필요 없다.

---

### 0.8 셋업 시간 비교 — 측정 예정

전부 jsdom으로 돌렸을 때와 분리했을 때를 비교해 기록한다. 0단계 구현 후 채운다.

| 구성                         | transform | setup | collect | tests | 총  |
| ---------------------------- | --------- | ----- | ------- | ----- | --- |
| 전부 jsdom 단일 프로젝트     | –         | –     | –       | –     | –   |
| **node / jsdom 분리 (채택)** | –         | –     | –       | –     | –   |

`vitest run` 출력의 `Duration ... (transform, setup, collect, tests, environment, prepare)` 줄을 그대로 옮긴다. 3회 실행 중 중앙값을 쓴다.

---

## 1. 검증 방법을 정한다

> "빨간불이 되면 알게 되는 것" 칸에 _"컴포넌트가 렌더된다"_ 류가 들어가면 그 항목은 잘못 잡은 것이다. **깨졌을 때 사용자가 겪는 일**을 쓴다.

| #   | 검증 대상                                 | 방법론   | 그렇게 정한 이유                                                                                                                                      | 빨간불이 되면 알게 되는 것                                                                                           |
| --- | ----------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | 장바구니·위시리스트 개수 파생             | **단위** | 개수는 store에 저장하지 않고 `cart.length` 로 파생한다. 파생 규칙 자체는 `toggle` 순수 함수라 DOM 없이 `getState()` 로 검증된다.                      | 같은 상품을 두 번 담으면 헤더 개수가 2로 늘거나, 다시 눌러도 안 빠져서 **헤더 숫자와 실제 담긴 상품이 어긋난다**     |
| 2   | URL 조건 → query key                      | **단위** | `parseFilterParams → toProductListQuery → productListQueryOptions.list().queryKey` 전 구간이 순수 함수다. 렌더 없이 key를 직접 비교할 수 있다.        | 조건이 달라졌는데 key가 같아 **이전 조건의 목록이 그대로 보이거나**, 조건이 같은데 key가 달라져 매번 재요청한다      |
| 3   | `parseFilterParams` (직접 고른 순수 로직) | **단위** | 아래 별도 설명                                                                                                                                        | 허용하지 않는 `sort`·`category` 가 그대로 조회에 실려 **400을 받거나**, `page=0`·`NaN` 이 1로 안 떨어져 빈 화면      |
| 4   | 목록 로딩 → 성공                          | **통합** | 스켈레톤 → 목록 전환은 `useQuery` 상태와 `keepPreviousData` 가 함께 만드는 결과다. 세 조각을 따로 보면 이 전환을 못 잡는다.                           | 로딩 문구가 끝나지 않거나, 응답의 `totalCount` 와 화면의 "총 N개"·카드 수가 어긋난다                                 |
| 5   | 목록 빈 결과                              | **통합** | 0건 안내 문구가 `describeQuery` 로 **조회 조건을 되읽어** 만들어진다. 조건과 문구의 연결은 렌더해야 보인다.                                           | 0건인데 안내가 없어 화면이 비거나, 안내 문장의 조건이 실제 조회 조건과 다르다                                        |
| 6   | 목록 에러                                 | **통합** | `shouldEscalateToBoundary` 로 4xx는 인라인, 5xx는 상위 ErrorBoundary로 **갈린다.** 이 분기의 결과는 "무엇이 화면에 남는가"라서 렌더해야 판정된다.     | 5xx인데 인라인으로 삼켜 경계가 안 뜨거나, 4xx인데 경계로 던져 **고칠 수단인 필터 폼까지 사라진다**                   |
| 7   | 에러에서 재시도로 복구                    | **통합** | 인라인 `refetch()` 와 경계의 `resetErrorBoundary`+`QueryErrorResetBoundary` 는 서로 다른 복구 경로다. 둘 다 "다시 성공 목록이 보이는가"로만 검증된다. | 재시도를 눌러도 에러 화면이 남는다 — reset이 query cache에 닿지 않아 **사용자가 새로고침 말고는 빠져나갈 길이 없다** |
| 8   | 카테고리 변경 → 목록 변경                 | **통합** | select change → nuqs URL → query key → 재조회까지가 한 사슬이다. 중간 한 곳만 봐도 사슬이 끊긴 걸 못 잡는다.                                          | 카테고리를 바꿔도 목록이 그대로거나, `page` 가 1로 리셋되지 않아 **3페이지에서 카테고리를 바꾸면 빈 화면**           |
| 9   | 정렬 변경 → 순서 변경                     | **통합** | 8번과 같은 사슬. 다만 결과가 "개수"가 아니라 **카드의 순서**라 렌더된 DOM 순서를 봐야 한다.                                                           | 정렬 파라미터가 요청에 안 실리거나, 실려도 화면 순서가 응답 순서를 따르지 않는다                                     |
| 10  | 페이지 이동 → 목록 변경                   | **통합** | `totalPages` 계산과 버튼 `disabled` 가 결과 컴포넌트 안에 있다. 경계(1페이지·마지막 페이지)가 곧 버튼 상태라 렌더 없이 못 본다.                       | 마지막 페이지에서 "다음"이 안 막혀 **빈 목록으로 넘어가거나**, 로딩 중 연타로 페이지가 건너뛴다                      |
| 11  | 조작이 URL에 반영 · URL로 재진입          | **통합** | `NuqsTestingAdapter` 가 `searchParams` 초기값과 `onUrlUpdate` 스파이를 준다. 실제 브라우저 없이 **양방향을 둘 다** 볼 수 있다.                        | 조작해도 URL이 안 바뀌어 **공유 링크가 무의미**해지거나, URL로 들어와도 폼이 기본값으로 뜬다                         |
| 12  | 담기 → 헤더 개수 · 다시 누르면 빠짐       | **통합** | 목록의 버튼과 헤더는 서로 모르고 store로만 이어진다. **두 컴포넌트를 함께 렌더**해야 이 연결이 검증된다. 1번(파생 규칙)과 잡는 것이 다르다.           | 버튼 라벨은 "담김"인데 헤더 숫자가 안 늘거나, 반대로 헤더만 늘고 버튼 `aria-pressed` 가 안 바뀐다                    |
| 13  | 뒤로·앞으로 가기로 필터 복원              | **E2E**  | `history: 'push'` 의 효과는 **실제 history 스택**에서만 나타난다. `NuqsTestingAdapter` 는 URL 변경을 이벤트로 알려줄 뿐 스택을 쌓지 않는다.           | `push` 가 `replace` 로 바뀌어 뒤로가기가 **필터 이전이 아니라 페이지를 떠난다**                                      |
| 14  | 새로고침해도 필터 상태가 유지             | **E2E**  | 문서 재로드가 필요하다. jsdom에는 재로드가 없다.                                                                                                      | 새로고침하면 조건이 기본값으로 돌아가 **작업 중이던 검색이 날아간다**                                                |
| 15  | 목록 진입 → 담기 → 헤더 확인              | **E2E**  | `persist` 의 `localStorage` 왕복 + Next hydration까지 한 번에 지나는 유일한 항목. production build에서만 이 조합이 진짜로 재현된다.                   | hydration 불일치나 persist 미동작으로 **새로고침 후 헤더가 0으로 돌아간다**                                          |

**배치 요약**: 단위 3 · 통합 9 · E2E 3.

각 항목마다 **정상 케이스와 경계 케이스를 함께** 넣는다. 경계 후보를 미리 적어 둔다.

| #   | 경계 케이스                                                                 |
| --- | --------------------------------------------------------------------------- |
| 1   | 같은 id 두 번 담기 · 담기지 않은 id 빼기 · 빈 목록에서 빼기                 |
| 2   | `q: ''` 와 `q` 미지정 · `page: 1` 과 `page` 미지정 · 키 순서만 다른 객체    |
| 3   | 배열 param(`?sort=a&sort=b`) · 미허용 값 · `page=0` · `page=NaN` · 공백 `q` |
| 4   | `totalCount` 가 `pageSize` 보다 작을 때 · 정확히 같을 때                    |
| 5   | 조건 없는 0건 vs 검색어·카테고리가 있는 0건 (문구가 달라야 한다)            |
| 6   | 400(인라인) vs 500(경계) 두 경로                                            |
| 7   | 인라인 재시도 vs 경계 재시도 · 재시도가 또 실패                             |
| 8   | 3페이지에서 카테고리 변경 → `page=1`                                        |
| 9   | 가격 동률일 때 순서 안정성                                                  |
| 10  | 1페이지에서 "이전" disabled · 마지막에서 "다음" disabled · `totalCount=0`   |
| 11  | 기본값 조건은 URL에서 생략되는가 · 미허용 값이 담긴 URL로 재진입            |
| 12  | 같은 상품을 두 번 토글 후 헤더가 0으로 · 서로 다른 두 상품                  |
| 13  | 두 단계 뒤로 → 한 단계 앞으로                                               |
| 14  | 조건이 여러 개 걸린 상태에서 새로고침                                       |
| 15  | 담은 뒤 새로고침 · 다른 페이지로 이동 후 복귀                               |

---

### 세 번째 항목을 `parseFilterParams` 로 고른 이유

`src/features/product-filter/model/parseFilterParams.ts` 를 골랐다.

이 함수를 고른 것은 "순수해서"가 아니다. 순수한 함수는 이 레포에 여럿 있다. 이걸 고른 이유는 **깨졌을 때 조용히 틀리기 때문**이다.

이 함수는 서버(`searchParams`)와 클라이언트(nuqs) 양쪽이 **같은 규칙으로 URL을 읽게** 만드는 자리다. 서버에는 nuqs가 없으므로 SSR metadata와 본문이 같은 조회 조건을 만들려면 이 함수가 nuqs 파서와 같은 결과를 내야 한다. 여기가 어긋나면 화면은 정상으로 보이고 metadata만 다른 조건을 가리킨다 — **눈으로는 안 잡히는 종류의 버그**다.

그리고 입력이 `Record<string, string | string[] | undefined>` 라 경계가 실제로 많다. 같은 키가 두 번 오면 배열이 되고, `page` 는 `Number()` 를 통과한 뒤 `Number.isSafeInteger(page) && page >= 1` 로 걸러진다. `Number('')` 가 `0` 이라는 것, `Number(undefined)` 가 `NaN` 이라는 것에 이 가드가 의존한다. 표에 있는 다른 후보들(`toSearchParams`, `describeQuery`)보다 **한 줄 고쳤을 때 사용자가 겪는 결과가 크다.**

---

## 2. 애매했던 판단

### 판단 1 — "조작이 URL에 반영 · URL로 재진입"(11번)을 E2E가 아니라 통합에 둔 것

이 항목은 URL이 대상이라 E2E가 자연스러워 보였다. 실제로 13·14번과 같은 nuqs 위에서 돈다.

통합으로 정한 근거는 **이 항목이 검증하려는 것이 브라우저 기능이 아니라 우리 코드의 결정**이라는 점이다. 여기서 지키려는 건 두 가지다. (a) 조작이 URL에 실리는가, (b) URL로 들어왔을 때 폼 초기값이 복원되는가. `NuqsTestingAdapter` 는 `searchParams` 초기값을 주입할 수 있고 `onUrlUpdate` 로 어떤 쿼리스트링이 쓰였는지 스파이할 수 있으므로, 둘 다 브라우저 없이 정확히 관측된다. 게다가 통합이면 **"기본값 조건은 URL에서 생략되는가"** 같은 경계까지 값 수준으로 단언할 수 있다. E2E에서는 주소창 문자열을 정규식으로 훑어야 해서 단언이 흐려진다.

**다른 쪽을 골랐다면**: E2E 항목이 3개에서 4개가 되고 `pnpm check` 시간이 늘었을 것이다. 대신 nuqs 어댑터 차이(`adapters/next/app` vs 테스트 어댑터)로 인한 위험은 사라진다 — 지금 배치는 **테스트 어댑터가 실제 Next 어댑터와 다르게 동작할 위험을 감수한 것**이다. 이 위험은 13·14번이 실제 브라우저에서 같은 nuqs 상태를 지나가므로 부분적으로 덮인다. 완전히 덮이지는 않는다.

### 판단 2 — "목록 에러"(6번)를 단위가 아니라 통합에 둔 것

분기 자체는 `shouldEscalateToBoundary(error)` 라는 순수 함수다. 400을 넣으면 `false`, 500을 넣으면 `true`. 단위로 두 줄이면 끝난다.

그런데 그 테스트는 **아무것도 안 지킨다.** 함수가 옳게 답해도 `ProductListResult` 가 `throwOnError` 에 그 함수를 안 걸어두면 화면은 여전히 틀린다. 6번이 지키려는 건 "분기 함수가 맞는 값을 돌려주는가"가 아니라 **"4xx일 때 필터 폼이 화면에 남는가"** 다. 필터 폼이 남는지는 `ProductListPage` 가 폼을 ErrorBoundary **밖에** 두었기 때문에 성립하는 성질이고, 그건 컴포넌트 구조를 렌더해야만 보인다.

**다른 쪽을 골랐다면**: 실행은 훨씬 빨랐을 것이고, 3단계에서 `shouldEscalateToBoundary` 의 부등호를 뒤집는 뮤테이션은 잡혔을 것이다. 하지만 **`throwOnError` 줄을 통째로 지우는 변경은 살아남는다.** 그게 이 항목에서 제일 무서운 회귀다. 속도를 포기하고 그 회귀를 잡는 쪽을 골랐다.

---

## 3. 이 목록 밖은 어떻게 할 것인가

### 다음에는 하면 좋겠다 — `shared/ui/select` 의 키보드 상호작용

`src/shared/ui/select/` 는 `useSelect` 리듀서, floating 배치, 외부 클릭·ESC 처리를 직접 구현한 공용 컴포넌트다.

- **변경 빈도: 높다.** 공용 컴포넌트라 쓰는 곳이 늘 때마다 요구가 추가된다. reducer에 상태가 하나 붙는 식으로 계속 자란다.
- **실패 비용: 높다.** 접근성 회귀는 **눈으로 안 보인다.** 마우스로 눌러 보면 멀쩡하고, 키보드 사용자만 못 쓰게 된다. 리뷰에서도 잘 안 걸린다.

이번 주에 안 하는 이유는 15개 항목이 상품 목록 흐름에 집중돼 있어서다. 지금 붙이면 이번 주 판정 기준이 흐려진다. 다음 주 후보 1번으로 둔다.

### 앞으로도 안 하겠다 — `calculateCardPresentation` 의 체크섬 값

`src/app/performance-lab/inp/products.ts` 의 15만 회 루프 체크섬이다.

- **변경 빈도: 사실상 0.** 7주차 INP 실험용으로 "느린 계산"을 만들려고 쓴 코드다. 값 자체에 도메인 의미가 없다.
- **실패 비용: 0에 가깝다.** 체크섬이 달라져도 사용자가 겪는 일이 없다. 이 함수의 존재 이유는 **CPU를 쓰는 것**이지 특정 숫자를 내는 게 아니다.

여기에 테스트를 붙이면 **구현을 그대로 베낀 단언**이 된다. 리팩터링할 때마다 기대값을 다시 계산해서 넣어야 하는, 회귀를 잡는 게 아니라 변경을 막는 테스트다. 이건 앞으로도 안 한다.

같은 기준으로 **제외하는 것들**: 스켈레톤 카드가 12개 그려지는지, CSS module 클래스명이 붙는지, `ProductCard` 의 마크업 구조. 전부 변경 빈도는 높고 실패 비용은 낮다 — 테스트가 있으면 오히려 변경을 방해한다.

---

## 부록 — 2·3단계 예고

이 문서만 읽고 2·3단계에 무엇이 들어갈지 예측할 수 있어야 한다는 완료조건에 대한 답이다.

**2단계에 생길 파일**

```
src/test/setup.dom.ts                                    ← MSW·jest-dom·store 초기화
src/test/handlers.ts                                     ← 성공 경로 기본 핸들러
src/test/renderWithProviders.tsx                         ← QueryClient(retry:false) + NuqsTestingAdapter
src/entities/cart/model/useCartStore.test.ts             ← 1
src/entities/wishlist/model/useWishlistStore.test.ts     ← 1
src/features/product-filter/model/parseFilterParams.test.ts  ← 3
src/_pages/product-list/model/toProductListQuery.test.ts     ← 2
src/_pages/product-list/ui/ProductListPage.dom.test.tsx      ← 4·5·6·7·8·9·10·11
src/widgets/header/ui/Header.dom.test.tsx                    ← 12
e2e/product-list-history.spec.ts                             ← 13·14
e2e/cart-flow.spec.ts                                        ← 15
```

E2E 셀렉터는 `getByRole('button', { name: '다음' })` 처럼 **역할과 이름 기반**으로 쓴다. `codegen` 산출물을 그대로 두지 않는다. 통합에서도 같다 — `getByTestId` 를 쓰게 되면 왜 다른 방법으로 안 됐는지를 그 자리에 주석으로 남기고 이 문서에 옮긴다.

**3단계 뮤테이션 실험 후보** (방법론마다 하나 이상, 눈에 잘 안 띄는 분기로 고른다)

| 층   | 망가뜨릴 곳                                                | 왜 이걸 고르나                                        |
| ---- | ---------------------------------------------------------- | ----------------------------------------------------- |
| 단위 | `parseFilterParams` 의 `page >= 1` → `page >= 0`           | 경계 부호 하나. `page=0` 케이스가 없으면 살아남는다   |
| 통합 | `ProductListResult` 의 `throwOnError` 줄 제거              | 판단 2에서 지목한, 제일 잡고 싶은 회귀                |
| E2E  | `useProductFilterState` 의 `history: 'push'` → `'replace'` | 통합에서는 절대 안 잡힌다. E2E의 존재 이유를 검증한다 |

세 실험이 전부 한 번에 잡히면 쉬운 곳만 고른 것이므로 후보를 다시 고른다.

---

## AI 사용 내역

- **AI에게 맡긴 것**: 코드베이스 사실 확인(설치된 vitest 4에서 `environmentMatchGlobs` 제거 여부, `nuqs/adapters/testing` 의 실제 export, `waitForMockApi` 의 `NODE_ENV` 분기), 위 표의 초안 작성, 문서 구조.
- **직접 정한 것**: 15개 항목의 **방법론 배치**, 각 항목의 **단언 대상**("빨간불이 되면 알게 되는 것" 칸), **모킹 경계**(MSW를 네트워크에 두고 `fetch` 를 바꿔치기하지 않는다), 환경 분리 방식, E2E 명령 배치, 목록 밖 포함/제외 기준.
- 2단계에서 셋업·픽스처·MSW 핸들러 같은 반복 코드는 AI에게 맡기되, **`expect` 의 내용은 이 문서의 마지막 칸을 따른다.**
