# RFC — 8주차 프론트엔드 테스트 계획

- 작성일: 2026-08-20
- 브랜치: `feat/week-08` (베이스 `ecc352e7`)
- 대상: 7주차까지 만든 커머스 — 홈 · 상품 목록(검색·카테고리·정렬·페이지네이션) · 장바구니 · 위시리스트
- 원칙: **커버리지 숫자를 올리지 않는다.** 무엇을 지킬지 먼저 정하고, 정한 것만 고정하고, 그 테스트가 진짜로 잡는지 손으로 확인한다.

이 문서는 테스트 코드보다 먼저 커밋한다. 2·3단계에 무엇이 들어갈지 이 문서만 읽고 예측할 수 있어야 한다.

---

## 0단계 — 환경과 모킹 경계

### 출발점 (실측)

작업 전 `pnpm test` 결과다. 이 값이 환경 분리 비교의 기준선이 된다.

```
Test Files  5 passed (5)
     Tests  41 passed (41)
  Duration  186ms (transform 140ms, setup 0ms, import 242ms, tests 91ms, environment 0ms)
```

- 기존 테스트 5개는 전부 DOM이 필요 없다. `HeroSection.test.tsx`도 `.tsx`지만 `renderToStaticMarkup`으로 문자열만 만들므로 node에서 돈다. **확장자로 환경을 가를 수 없다**는 뜻이다.
- `environment 0ms` — 지금은 DOM 셋업 비용이 0이다. 전부 jsdom으로 돌리면 이 값이 얼마가 되는지가 분리의 근거가 된다.
- `grep -rn "vi.mock|vi.spyOn|global.fetch" src` → **0건**. `products.api.ts`·`home.api.ts`가 native `fetch`를 직접 쓰므로, 앱 코드의 HTTP 클라이언트를 바꿔치기한 곳이 애초에 없다. MSW로 옮길 부채가 없고, 이 상태를 유지하는 것이 이번 주의 제약이다.

### 결정 1 — 환경 분리는 `test.projects`

Vitest 4에서 `environmentMatchGlobs`는 제거됐다(`vitest` 4.1.10 타입에 존재하지 않음). 남은 선택지는 둘이다.

| 방식 | 장점 | 채택 여부 |
| --- | --- | --- |
| 파일 상단 `// @vitest-environment jsdom` 도크블록 | 설정 파일 변경 없음 | ❌ — setup(MSW·jest-dom·cleanup)을 파일마다 붙여야 하고, 어느 파일이 어느 환경인지 config만 봐선 알 수 없다 |
| **`test.projects` 2개 (node / dom)** | 환경별 `setupFiles` 분리, 리포터가 프로젝트별로 나뉘어 셋업 시간이 그대로 보인다 | ✅ |

```ts
// vitest.config.ts (실제 적용)
test: {
  projects: [
    {
      extends: true,
      test: {
        name: 'node',
        environment: 'node',
        include: ['src/**/*.test.{ts,tsx}'],
        exclude: ['src/**/*.dom.test.{ts,tsx}'],
      },
    },
    {
      extends: true,
      test: {
        name: 'dom',
        environment: 'jsdom',
        include: ['src/**/*.dom.test.{ts,tsx}'],
        setupFiles: ['./vitest.setup.dom.ts'],
        environmentOptions: { jsdom: { url: 'http://localhost:3000' } },
      },
    },
  ],
}
```

- **파일명 규칙: `*.dom.test.{ts,tsx}`만 jsdom, 나머지는 전부 node.** 기존 5개를 한 개도 옮기지 않고 끝났다. 확장자 기준(`.tsx` = DOM)은 위에서 본 이유로 쓸 수 없다. `.ts`도 규칙에 넣은 이유는 JSX 없이 DOM 환경만 필요한 테스트가 있기 때문이다(브라우저 경계에서의 `getProducts` 확인).
- `extends: true`로 루트의 `resolve.alias`(`@` → `src`)를 두 프로젝트가 그대로 상속한다.
- `jsdom.url`을 `http://localhost:3000`으로 고정하는 이유: `apiUrl()`은 클라이언트에서 **상대 경로**를 반환한다(`src/shared/api/base-url.ts`). jsdom의 기본 base URL은 `about:blank`이라 상대 경로 `fetch`가 해석되지 않고, MSW가 가로챌 대상 자체가 만들어지지 않는다.

### 결정 2 — DOM 구현은 jsdom

happy-dom이 더 빠르지만 jsdom을 쓴다. 이번 주 통합 테스트의 대상이 **URL·history·form submit** 같은 브라우저 표준 동작이고(11·12번), 이 영역에서 구현 충실도가 낮으면 "테스트만 통과하는" 결과가 나온다. 속도는 아래 표에서 실제로 얼마나 손해인지 재고, 손해가 크면 그때 재검토한다.

### 결정 3 — 모킹 경계는 네트워크 한 겹

- 통합 테스트의 경계는 **HTTP**다. `getProducts`/`getHome`은 진짜로 호출되고, 진짜로 `fetch`가 나가고, MSW가 그 요청을 가로챈다. 응답 파싱(`isProductListResponse`)·에러 변환(`HttpError`·`InvalidResponseError`)까지 전부 실제 코드를 지난다.
- `server.listen({ onUnhandledRequest: 'error' })` — 모킹되지 않은 요청은 조용히 나가는 대신 테스트를 실패시킨다.
- **기본 핸들러에는 성공 경로만 둔다.** 500·빈 결과·지연은 각 테스트가 `server.use()`로 덮는다. 기본값에 실패를 섞으면 "이 테스트가 무엇을 전제하는가"가 파일 밖으로 새어 나간다.
- 지연은 MSW 핸들러가 정하므로 통합 테스트는 프로덕션의 500ms를 흉내 내지 않는다. **실제 지연을 만나는 건 E2E뿐**이고, 이것이 아래 통합/E2E 역할 분담의 근거 하나다.

배치:

```
src/shared/test/msw/handlers.ts   기본(성공) 핸들러
src/shared/test/msw/server.ts     setupServer
src/shared/test/fixtures.ts       Product·Home 고정 데이터 빌더
src/shared/test/render.tsx        QueryClientProvider + NuqsTestingAdapter 래퍼
vitest.setup.dom.ts               jest-dom · MSW 생명주기 · 스토어 리셋
playwright.config.ts              production build 위 E2E
e2e/                              Playwright spec
```

픽스처는 스타터의 mock 데이터(`src/app/api/_data/commerce.ts`)를 쓰지 않고 `makeProduct`/`makeProductList`로 직접 만든다. 스타터 데이터가 바뀌면 관계없는 테스트가 무더기로 깨지고, 각 테스트가 무엇을 전제했는지도 파일 밖으로 새어 나가기 때문이다.

`pnpm install`이 msw의 build script를 무시한다는 경고가 뜨는데 승인하지 않는다. 그 스크립트는 브라우저용 service worker(`public/mockServiceWorker.js`)를 까는 것이고, 여기서는 node/jsdom의 `setupServer`만 쓴다. E2E는 모킹 없이 실제 Route Handler를 탄다.

`src/shared/`에 두는 이유: 기존 `@` alias를 그대로 쓸 수 있고(루트 `tests/`에 두면 상대 경로가 길어지거나 alias를 하나 더 만들어야 한다), 도메인을 모르는 재사용 코드라는 shared의 정의에도 맞는다. 앱 코드는 이 경로를 import하지 않으므로 번들에 들어가지 않는다.

### 결정 4 — 격리

이번 주 기준으로 테스트 사이에 새는 상태는 세 가지다.

| 새는 것 | 어떻게 끊나 |
| --- | --- |
| zustand 스토어 (`cart`·`wishlist`) | 모듈 전역이라 파일 안에서 계속 살아 있다. `vitest.setup.dom.ts`의 `afterEach`에서 `useCartStore.setState({ cart: [] })`·`useWishlistStore.setState({ wishlist: [] })` |
| TanStack Query 캐시 | 테스트마다 `createAppQueryClient()`로 새로 만든다. 모듈 전역 싱글턴을 쓰지 않는다 |
| 끝나지 않은 요청·예약된 재시도 | `afterEach`에서 그 테스트가 만든 QueryClient들을 `cancelQueries()`로 끊고 비운다 (2단계 절의 플레이크 기록 참조) |
| DOM · MSW 핸들러 | `cleanup()` + `server.resetHandlers()` |

`localStorage`는 이번 구현에 없다. 장바구니·위시리스트는 **메모리 전용**이라 새로고침하면 사라진다(14번이 "필터 상태"만 다루는 이유). 나중에 persist를 붙이면 그때 격리 대상에 추가한다.

### 결정 5 — Playwright는 production build 위, E2E는 별도 명령

```ts
// playwright.config.ts (계획)
webServer: {
  command: 'pnpm start',
  url: 'http://127.0.0.1:3000',
  reuseExistingServer: !process.env.CI,
}
```

- **`pnpm test`에 넣지 않는다.** vitest는 초 단위고 watch로 계속 돌리는 명령이다. E2E는 빌드 산출물 + 브라우저 + 500ms 고정 지연이 붙어 분 단위다. 매 저장마다 돌 수 없는 것을 같은 명령에 묶으면 둘 다 안 쓰게 된다.
- 대신 **`pnpm check`의 마지막**에 붙인다: `test → lint → typecheck → build → test:e2e`. `build`가 방금 만든 산출물을 `pnpm start`가 그대로 쓰므로 빌드는 1회다. CI(`quality.yml`)는 이미 `pnpm check` 하나만 돌리고 Playwright 설치 분기도 갖고 있어 워크플로 수정이 필요 없다.
- 대안이었던 `command: 'pnpm build && pnpm start'`는 `pnpm check` 안에서 빌드를 두 번 돌린다. 그래서 안 쓴다. 대가로 **`pnpm test:e2e` 단독 실행은 `pnpm build` 선행이 필요**하고, 이 제약은 `playwright.config.ts` 주석에 남겼다.

### 셋업 시간 비교 (실측)

**최종 트리(12파일 91개) 기준으로 재집계했다.** 0단계 당시에도 같은 비교를 했지만(7파일 44개, environment 580ms 대 3.69s), 그 시점의 파일 구성은 2단계에서 스모크 테스트를 흡수하며 사라져 어느 커밋에서도 재현할 수 없다. 지금 표는 현재 트리에서 그대로 다시 돌릴 수 있는 값이다.

측정: 같은 머신 연속 실행, 분리 8회·전부 jsdom 3회의 중앙값. 두 구성 모두 **같은 12개 파일(91개)** 을 돌린 결과다.

| 구성 | Test Files | environment | setup | Duration |
| --- | --- | --- | --- | --- |
| 작업 전 (전부 node, DOM 테스트 없음) | 5 (41 tests) | 0ms | 0ms | 186ms |
| **분리 (node + dom projects)** | 12 (91 tests) | **999ms** | **394ms** | **6.33s** |
| 전부 jsdom (순진한 단일 설정) | 12 (91 tests) | 9.08s | 4.15s | 7.13s |

- **DOM 환경 셋업 비용이 9.1배(999ms → 9.08s)** 다. jsdom이 필요한 파일은 12개 중 3개인데, 전부 jsdom으로 돌리면 나머지 9개가 매번 브라우저 흉내 환경을 세운다.
- setup(= `vitest.setup.dom.ts` 실행: jest-dom matcher 등록 + MSW 기동)은 10.5배다. 전부 jsdom 구성에서는 DOM도 네트워크도 안 쓰는 API 라우트 테스트까지 MSW 서버를 세우고 끈다.
- **전체 실행 시간 차이는 1.13배(6.33s → 7.13s)로 작아 보이는데, 여기에 속으면 안 된다.** 두 구성 모두 tests가 5.96s로 같고 그게 전체를 지배하기 때문이다. 그 5.96s의 대부분은 실패 경로 테스트가 화면과 같은 재시도 정책(1회·1초 지연)을 실제로 태우는 시간이다. 환경 비용만 떼어 보면 9~10배이고, 이 비용은 DOM이 필요 없는 테스트가 늘어날 때마다 파일 수에 비례해 쌓인다.

### 0단계에서 실제로 확인한 것

| 확인 | 결과 |
| --- | --- |
| 기존 테스트 5개 | 그대로 통과 (node 프로젝트, 41 tests) |
| DOM/비DOM 한 명령 동시 실행 | `pnpm test` 한 번에 통과 (0단계 커밋 시점 6 파일 43개 → 최종 12 파일 91개) |
| 상대 경로 요청을 MSW가 가로채나 | 가로챈다. `getProducts({ category: 'casual', page: 2 })`가 만든 요청이 `http://localhost:3000/api/products?category=casual&page=2`로 관측됐다 — jsdom base URL 설정이 실제로 필요한 조각이었다 |
| 모킹 안 된 요청이 조용히 나가나 | 안 나간다. 임시로 `fetch('/api/unknown')`을 던져 보니 `[MSW] Cannot bypass a request when using the "error" strategy`로 테스트가 실패했다 (확인 후 프로브 파일 삭제) |
| HTTP 클라이언트 바꿔치기 | 없음. 앱 코드는 native `fetch`를 그대로 쓴다 |
| Playwright가 production build 위에서 도나 | 돈다. `pnpm check`의 `build` 다음 `test:e2e`가 `pnpm start`로 그 산출물을 띄우고 통과 |

0단계 환경 확인용으로 남긴 테스트 2개:

- `src/_pages/products/api/products.api.dom.test.ts` — 브라우저 환경에서의 요청 경로 + 계약 위반 → `InvalidResponseError` 변환 (2단계 이후에도 유지)
- `src/app/SiteHeader.dom.test.tsx` — jsdom + Testing Library 확인용. 2단계에서 12번 테스트가 같은 것을 더 넓게 검증하므로 **흡수하고 삭제**했다
- `e2e/smoke.spec.ts` — production build 확인용. 15번 E2E가 같은 여정을 밟으므로 **흡수하고 삭제**했다

---

## 1단계 — 무엇을 어떻게 검증할지

### 검증 배치

| # | 검증 대상 | 방법론 | 그렇게 정한 이유 | 빨간불이 되면 알게 되는 것 |
| --- | --- | --- | --- | --- |
| 1 | 장바구니·위시리스트 개수 파생 | **단위** | 규칙(토글·중복 없음·`length`로 파생)에 DOM이 필요 없다. 스토어의 vanilla API로 직접 호출한다 | 같은 상품을 두 번 담으면 개수가 2가 된다 / 개수가 별도 필드로 새어 목록과 어긋난다 |
| 2 | URL 조건 → query key | **단위** | `loadProductFilters`(nuqs 파서)와 `productQueries.list().queryKey` 둘 다 순수 함수다. 서버 metadata와 본문이 같은 키를 만든다는 계약이 여기 걸려 있다 | 같은 조건이 다른 키를 만들어 캐시가 안 맞고 요청이 두 번 나간다 / 다른 조건이 같은 키를 써서 남의 목록이 뜬다 |
| 3 | 순수 로직 1개 — **`describeFilters`** | **단위** | 내가 고른 항목. 0건 화면의 안내 문구를 만드는 유일한 분기 로직이고, `category === 'all'`은 문구에서 빼는 경계가 있다. 깨지면 사용자는 "왜 0건인지"를 잃는다. 부수효과가 없어 DOM 없이 전 조합을 싸게 돌 수 있다 | 0건 안내가 현재 URL 조건과 다른 말을 한다 / 조건이 없는데 "전체 목록"이 아닌 문구가 나온다 |
| 4 | 목록 로딩 → 성공 | **통합** | 스켈레톤 → 목록 전이는 컴포넌트·쿼리·응답 파싱이 맞물린 결과라 어느 한 조각만으로는 확인되지 않는다 | 최초 진입이 빈 화면이나 영원한 스켈레톤으로 멈춘다 |
| 5 | 목록 빈 결과 | **통합** | 빈 결과가 두 종류다 — 검색 0건(`totalCount 0`)과 페이지 초과(`totalCount 30`, `products 0`). 6주차 RFC에 기록된 계약이고, 화면이 이 둘을 같은 문구로 다뤄야 한다 | 0건인데 스켈레톤이 계속 돈다 / 조건 문구 없이 빈 그리드만 남는다 |
| 6 | 목록 에러 | **통합** | `HttpError` → 인라인 실패 UI 경로. retry 1회 정책까지 실제로 태워야 "실패를 언제 인지하는가"가 검증된다 | 실패가 화면에 안 나타나고 로딩 상태로 남는다 / 계약 위반이 아닌 오류가 error.tsx로 튄다 |
| 7 | 에러에서 재시도로 복구 | **통합** | 1차 500 → `server.use()`로 200 교체 → "다시 시도" 클릭. 캐시된 에러가 복구를 막는 문제(7주차에 `error.tsx`에서 겪음)를 여기서도 확인한다 | "다시 시도"가 캐시된 에러만 다시 던지고 화면이 안 돌아온다 |
| 8 | 카테고리 변경 → 목록 변경 | **통합** | 요청 쿼리(MSW가 받은 URL)와 화면을 함께 단언해야 "UI만 바뀌고 요청은 그대로"를 잡는다 | 필터가 요청에 안 실린다 / `page` 리셋이 빠져 3페이지에서 카테고리를 바꾸면 빈 페이지가 뜬다 |
| 9 | 정렬 변경 → 순서 변경 | **통합** | 위와 같다. 정렬 결과의 순서는 MSW 핸들러가 정한 응답 순서로 고정해 화면 순서를 확인한다 | 정렬이 요청에 안 간다 / 응답 순서를 화면이 뒤집는다 |
| 10 | 페이지 이동 → 목록 변경 | **통합** | 이전/다음 버튼의 `disabled` 경계(1페이지·마지막 페이지)가 화면 계산(`Math.max(1, ceil(total/pageSize))`)에 걸려 있다 | 마지막 페이지에서 더 넘어간다 / 1페이지에서 "이전"이 눌린다 |
| 11 | 조작이 URL에 반영 · URL로 재진입 | **통합** | nuqs `NuqsTestingAdapter`가 `onUrlUpdate`(반영)와 `searchParams` 초기값(재진입)을 둘 다 준다. 진짜 브라우저 히스토리는 13·14가 이미 담당하므로 여기서 또 재지 않는다 | 조작해도 URL이 안 바뀌어 링크 공유·새로고침이 깨진다 / 쿼리스트링을 들고 들어와도 기본값으로 렌더된다 |
| 12 | 담기 → 헤더 개수 · 다시 누르면 빠짐 | **통합** | 검증 대상은 "스토어 구독 경로"다. 헤더와 목록을 한 트리에 렌더해 담기 → 개수 증가 → 다시 누르면 감소를 확인한다 | 담아도 헤더가 안 변한다(선택자 구독 누락) / 다시 눌러도 안 빠진다 |
| 13 | 뒤로·앞으로 가기로 필터 복원 | **E2E** | 진짜 history 스택이 필요하다. `useQueryStates`의 `history: 'push'` 설정이 실제로 엔트리를 쌓는지는 테스트 어댑터로 확인할 수 없다 | 뒤로 가기가 필터를 잃거나 한 번에 사이트 밖으로 나간다 |
| 14 | 새로고침해도 필터 상태 유지 | **E2E** | 진짜 reload는 서버 렌더 경로(`loadProductFilters` → prefetch)까지 다시 지난다. 필터가 URL 상태라는 설계가 실제로 성립하는지를 여기서만 확인할 수 있다 | 새로고침이 조건을 날린다 / 서버가 정규화한 조건과 클라이언트 화면이 어긋난다 |
| 15 | 목록 진입 → 담기 → 헤더 확인 | **E2E** | `(commerce)/layout`이 헤더를 조합하는 실제 구조 위에서, production build로 확인하는 유일한 여정 | 레이아웃이 헤더를 빠뜨렸거나 프로덕션 빌드에서만 깨지는 조합을 잡는다 |

15개 항목 모두 현재 구현에 대응하는 기능이 있다. 빠진 기능은 없다.

### 애매했던 판단 둘

**(1) 11번 — 통합인가 E2E인가.**
"조작이 URL에 반영되고 URL로 재진입된다"는 브라우저 주소창의 이야기라 E2E가 자연스러워 보였다. 통합으로 정한 이유는, 이 동작이 실제로 결정되는 지점이 **nuqs 어댑터 경계**이기 때문이다. `useProductFilters`가 `setFilters`를 부르면 어댑터가 URL을 갱신하고, 재진입은 어댑터가 준 `searchParams`를 파서가 읽는 것으로 끝난다. `NuqsTestingAdapter`의 `onUrlUpdate`는 그 경계에서 나가는 쿼리스트링을 그대로 보여주므로, "카테고리를 바꾸면 `?category=casual&page=1`이 나간다"를 정확히 단언할 수 있다. 그리고 이건 브라우저가 아니라 내 코드가 정한 규칙이다(`page` 리셋 포함).
E2E로 옮겼다면 같은 규칙을 훨씬 비싸게 재게 된다. 프로덕션 빌드 + 500ms 지연 위에서 URL 문자열을 비교하는 셈인데, 13·14번이 이미 진짜 브라우저에서 히스토리·리로드를 확인하므로 브라우저 고유의 위험은 거기서 커버된다. 대신 잃는 것도 있다: `history: 'push'`가 실제로 엔트리를 쌓는지는 통합에서 확인되지 않는다. 그 한 조각만 13번에 넘겼다.

**(2) 12번 — 통합인가 E2E인가.**
헤더는 `(commerce)/layout.tsx`가 소유하고 목록은 `page.tsx`가 소유한다. 즉 **"헤더와 목록이 한 화면에 같이 있다"는 사실 자체는 레이아웃이 만든 것**이고, 통합 테스트에서는 그 조합을 테스트가 직접 만들어 준다. 그래서 통합으로 정하면 "레이아웃이 헤더를 빼먹었다"는 실패는 절대 잡히지 않는다.
그럼에도 통합으로 둔 이유는 이 항목의 검증 대상이 조합이 아니라 **파생 구독**이기 때문이다. `useCartCount`는 `cart.length`만 구독하고, 담기 버튼은 `useIsInCart`·`useToggleCart`만 구독한다. 이 셋이 같은 스토어를 보고 있는지, 토글이 양방향인지는 컴포넌트 두 개만 있으면 확인된다. 여기에 정상(담기 → 1) + 경계(같은 상품 다시 → 0, 다른 상품 → 2)를 붙이면 E2E로는 감당 못 할 밀도가 나온다.
빠진 조각 — "실제 레이아웃 조합" — 은 15번 E2E가 정확히 그 여정을 밟는 것으로 메운다. 두 항목을 합쳐서 하나의 커버리지로 본다.

### 이 목록 밖은 어떻게 할 것인가

**다음에는 하면 좋겠다 — `(commerce)/error.tsx`의 복구 경로.**
`reset()`만으로는 복구되지 않고 `queryClient.resetQueries()`를 먼저 불러야 한다는 건 7주차에 재현으로 겨우 찾아낸 동작이다. 코드만 봐서는 왜 두 줄이 다 필요한지 알 수 없고, 누군가 "중복 같다"며 한 줄을 지우면 **계약 위반 오류에서 영영 못 빠져나오는 화면**이 된다. 변경 빈도는 낮지만(에러 경계는 자주 안 건드린다) 실패 비용이 크고 발견이 늦다 — 테스트가 값어치를 하는 전형적인 자리다. 이번 주에 안 하는 이유는 `InvalidResponseError`를 만들려면 MSW로 계약 위반 응답을 만들고 error 경계까지 태워야 해서, 15개를 마친 뒤에 붙이는 게 맞기 때문이다.

**앞으로도 안 하겠다 — 스켈레톤·카드의 시각 구조.**
`ProductsSkeleton`의 CSS module 클래스 구성, `ProductCard`의 `toLocaleString()` 가격 포맷, `next/image`가 만드는 `srcset` 같은 것들이다. 변경 빈도는 높고(디자인은 계속 바뀐다) 깨지면 화면을 열자마자 보인다 — 즉 테스트가 사람보다 먼저 알려주는 게 없다. 반대로 테스트는 클래스명 하나 바꿀 때마다 빨간불이 되어 "고쳐야 할 실패"가 아니라 "지워야 할 소음"이 된다. 스켈레톤에 대해 이번 주에 고정하는 건 오직 **"최초 진입에 스켈레톤이 보이고 목록으로 교체된다"**(4번)까지고, 그 안이 몇 칸인지·무슨 색인지는 고정하지 않는다.

---

## 2단계 — 구현 계획

| 파일 | 항목 | 환경 | 테스트 |
| --- | --- | --- | --- |
| `src/entities/cart/model/store.test.ts` | 1 | node | 6 |
| `src/entities/wishlist/model/store.test.ts` | 1 | node | 4 |
| `src/_pages/products/model/productFilters.test.ts` | 2 | node | 8 |
| `src/_pages/products/model/describeFilters.test.ts` | 3 | node | 6 |
| `src/_pages/products/ui/ProductsPage.dom.test.tsx` | 4 · 5 · 6 · 7 · 8 · 9 · 10 · 11 | jsdom | 18 |
| `src/features/add-to-cart/ui/AddToCartButton.dom.test.tsx` | 12 | jsdom | 6 |
| `e2e/filters.spec.ts` | 13 · 14 | Chromium / production | 4 |
| `e2e/cart.spec.ts` | 15 | Chromium / production | 3 |

`pnpm test` 12개 파일 91개 통과(node 9파일 65개 · dom 3파일 26개), `pnpm test:e2e` 7개 통과. `pnpm check` 전체 통과.

지킬 규칙:

- **항목마다 정상 + 경계.** 예: 5번은 검색 0건과 페이지 초과 둘 다, 10번은 중간 페이지와 마지막 페이지 둘 다, 12번은 담기·다시 담기·다른 상품 셋.
- **테스트 이름에 조건과 결과를 적는다.** `renders`·`works`·`should be true` 금지. `카테고리를 바꾸면 page가 1로 돌아가고 새 카테고리 목록을 요청한다` 형태로 쓴다.
- **요소는 사용자가 인식하는 방식으로 찾는다.** 이 구현은 `aria-label`(`"{상품명} 장바구니"`), `role="alert"`, `aria-label="상품 검색 결과"`, `role="status"`가 이미 붙어 있어 `getByRole`/`getByLabelText`로 대부분 닿는다. `getByTestId`를 쓰게 되면 왜 다른 방법이 안 됐는지 그 자리에 주석으로 남긴다.
- **`waitFor`는 첫 대기에만.** `await screen.findByRole(...)` 하나로 비동기 경계를 넘고, 그 뒤 단언은 동기로 한다.
- **단위 항목은 DOM 없이 통과한다.** 1·2·3번을 컴포넌트 렌더로 통과시키면 배치가 어긋난 것이다.
- **E2E는 조건 기반 대기만.** `sleep`·고정 타임아웃 금지. 프로덕션 mock API의 500ms는 `expect(...).toBeVisible()`의 자동 대기로 흡수한다. 셀렉터는 role + name으로 정리한다.

### 2단계에서 실제로 지킨 것 · 걸린 것

- **`getByTestId`는 한 번도 쓰지 않았다.** 앞선 주차에 걸쳐 붙여 둔 접근성 속성으로 전부 닿았다 — `aria-label="상품 검색 결과"`는 5주차(`30f8678`), 담기·찜 버튼의 `"{상품명} 장바구니"`는 6주차 FSD 3단계(`f877c1b`), `role="alert"`·`role="status"`는 7주차 2단계(`1b1e64d`)에서 왔다. 테스트를 쓰면서 마크업을 고칠 일도 없었다.
- **`waitFor`는 첫 대기에만.** 각 테스트는 `findBy*` 하나로 비동기 경계를 넘고 나머지 단언은 동기다. 예외는 "요청이 나갔는지"를 보는 자리(`requests.at(-1)`)인데, 화면에 드러나지 않는 값이라 폴링 외에는 방법이 없어 그 한 줄만 `waitFor`로 감쌌다.
- **문구 단언은 요소 단위로.** `총 {n}개` 같은 JSX는 텍스트 노드가 쪼개져 `getByText('총 2개')`가 안 맞는다. 사용자가 인식하는 단위인 영역(`getByRole('region', { name: '상품 검색 결과' })`)을 잡고 `toHaveTextContent`로 확인했다.
- **실패 경로는 화면과 같은 재시도 정책을 그대로 태운다.** `createAppQueryClient()`를 쓰므로 `HttpError`는 1회 재시도(기본 지연 1초)를 지나 실패 UI에 도달한다. 그래서 에러 계열 테스트에만 `timeout: 3000`을 명시했다 — 테스트를 빠르게 만들려고 `retry: false`로 바꾸면 실제 화면과 다른 경로를 재게 된다.
- **격리 확인.** 각 파일 단독 실행 통과, `--sequence.shuffle`(seed 7·42)로 순서를 섞어도 91개 전부 통과. zustand 스토어가 다음 테스트로 넘어가지 않는지는 12번 파일 마지막에 그 자체를 확인하는 테스트로 못박았다.

**플레이크 한 건 — 관측, 오진, 재현, 수정.** 이번 주에서 가장 오래 붙든 문제라 과정을 그대로 적는다.

1. **관측.** 문서를 재검증하며 `pnpm test`를 돌리던 중 한 번 `Test Files 1 failed | 11 passed`로 끝났다. 그때 `Tests` 줄을 캡처하지 못해 어느 테스트였는지 몰랐다.
2. **재현 실패.** 같은 명령을 33회(연속 18회·shuffle 6회·빌드 부하 병행 3회) 돌렸지만 나오지 않았다.
3. **오진.** "실패 경로 테스트가 남긴 재시도 요청이 `server.close()` 이후에 도착한다"고 추측했다. 실패 요청을 띄운 채 끝나는 프로브 파일로 확인해 봤지만 취소 로직을 켜든 끄든 통과해서, 가설을 확정하지 못한 채 예방 조치(`afterEach`에서 `cancelQueries()`)만 넣었다.
4. **재현.** 그 뒤 `pnpm check`에서 다시 실패했고, 이번에는 잡혔다 — `재시도도 실패하면 실패 화면을 그대로 유지한다`가 `Unable to find role="alert"`로 2054ms 만에 실패했다.
5. **원인.** 추측과 달리 남은 요청 문제가 아니라 **테스트가 화면의 중간 상태를 몰랐던 것**이었다. `@tanstack/query-core`의 `fetchState`는 `data === undefined`인 쿼리를 다시 조회할 때 `error`를 지우고 `status`를 `pending`으로 되돌린다. 그래서 "다시 시도"를 누르면 재시도(1회·1초 지연)가 끝날 때까지 화면은 **스켈레톤으로 돌아가고**, 최종 실패 후에야 실패 화면이 다시 뜬다. 내 단언은 `findByRole('alert')`의 기본 대기 1000ms라 그 1초 구간과 경계에 걸쳐 있었다. dom 프로젝트만 돌리면 통과하고 전체 실행(node 프로젝트 병행)에서 실패한 것도 이걸로 설명된다 — CPU 경합이 경계를 넘겼다.
6. **수정.** 그 테스트를 사용자가 보는 상태 전이 그대로 다시 썼다: 다시 시도 → **스켈레톤** → (재시도 실패) → **실패 화면**. 대기는 다른 실패 계열과 같은 `RETRY_TIMEOUT`을 쓴다. 이후 전체 실행 8회 연속 통과.

처음 본 1회도 같은 원인일 가능성이 높다(같은 파일 한 개만 실패했고 다른 실패 후보가 없다). 다만 그때 출력을 남기지 않아 확정할 수는 없다.

예방 조치로 넣은 `cancelQueries()`는 되돌리지 않고 둔다. 이번 실패의 원인은 아니었지만 "테스트가 진행 중인 요청을 다음 테스트로 넘기지 않는다"는 격리 원칙 자체는 맞기 때문이다. **다만 그것으로 이 플레이크를 고쳤다고 말할 수는 없다.**

배운 것: 비동기 테스트에서 **최종 상태만 단언하면 중간 상태의 길이에 조용히 의존하게 된다.** 화면이 A → B → C로 가는데 C만 확인하면, B가 얼마나 오래 머무는지가 테스트의 통과 여부를 정한다. 그 구간을 아는 순간 단언으로 적어야 할 것이 하나 더 생긴다.

**E2E가 내 테스트의 버그를 먼저 잡았다.** 14번(새로고침 유지)에서 정렬을 바꾼 직후 첫 상품명을 읽고 새로고침 뒤와 비교했는데 값이 달랐다. 구현 문제가 아니라 `keepPreviousData` 때문이었다 — 요청이 끝나기 전에는 직전 조건의 목록이 그대로 보이므로, 그때 읽은 이름은 새 조건의 첫 상품이 아니다. "갱신 중…" 표시가 떴다가 사라지는 것을 기다린 뒤 읽도록 고쳤다. 조건 기반 대기를 쓰라는 규칙이 왜 있는지가 여기서 그대로 드러났다.

---

## 3단계 — 자가 검증 실험 (실행 결과)

구현을 한 곳씩 망가뜨리고 테스트가 잡는지 확인했다. **테스트 코드는 건드리지 않았고**, 실험이 끝난 뒤 전부 되돌렸다(마지막 `pnpm check` 통과로 확인).

| # | 망가뜨린 곳 | 어떻게 바꿨나 | 결과 | 실패한 테스트 |
| --- | --- | --- | --- | --- |
| 1 | `productFilterParsers.ts` (단위) | `parseAsStringLiteral(CATEGORIES)` → `parseAsString` — 카테고리 정규화 제거 | **잡힘** | 단위 `목록에 없는 카테고리는 all로 정규화되어 기본 진입과 같은 키가 된다` + 통합 `URL에 없는 조건 값이 들어오면 기본값으로 정규화해서 요청한다` |
| 2 | `useProductFilters.ts` (통합) | `setCategory`에서 `page: 1` 삭제 | **잡힘** | 통합 `다른 페이지를 보던 중 카테고리를 바꾸면 1페이지부터 다시 본다` |
| 3 | `useProductFilters.ts` (E2E) | `history: 'push'` → `'replace'` | **잡힘 (E2E만)** | E2E 13번 2개. **vitest 91개는 전부 통과** |
| 4 | `(commerce)/layout.tsx` (E2E) | `<SiteHeader />` 호출 삭제 | **잡힘 (E2E만)** | E2E 15번 3개. **vitest 91개는 전부 통과** — 12번 통합 테스트도 통과했다 |
| 5 | `ProductsPage.tsx` (통합) | `Math.max(1, Math.ceil(...))` → `Math.ceil(...)` | **살아남음** → 테스트 보강 후 잡힘 | (보강 전) 없음 → (보강 후) 통합 `검색 결과가 0건이면 어떤 조건 때문인지 문구로 알려준다` |

### 실패 메시지만 보고 원인을 알 수 있었나

- **1번**: 통합 쪽 메시지가 `expected '없는카테고리' to be 'all'`이라 한 줄로 끝났다. 단위 쪽은 요약이 `to deeply equal [ 'products', 'list', { q: '', …(3) } ]`로 잘려 나와서 요약만으로는 어느 필드가 다른지 알 수 없었고, 아래 diff까지 봐야 했다. 테스트 이름이 "카테고리는 all로 정규화된다"라고 말해 주기 때문에 실용적으로는 충분했다.
- **2번**: `expected '3' to be '1'` + 테스트 이름 `다른 페이지를 보던 중 카테고리를 바꾸면 1페이지부터 다시 본다`. 바로 알 수 있었다.
- **3·4번**: 둘 다 `Error: element(s) not found`였다. **여기서는 메시지만으로 원인을 짚지 못했다.** 뒤로 가기가 페이지 밖으로 나가 버렸는지, 헤더가 사라진 건지는 실패한 줄 번호와 셀렉터(`getByLabel('정렬')`, `getByRole('banner')`)를 보고 한 단계 더 추론해야 했다. E2E에서 "요소가 없다"는 실패는 원인 후보가 넓다는 걸 확인한 셈이다. 대응으로 셀렉터를 더 쪼개지는 않았다 — 대신 `trace: 'on-first-retry'` 설정이 이미 있어 재현 시 추적할 수 있고, 이 두 실험은 어차피 실패한 spec 이름(`뒤로·앞으로 가기로…`, `목록에서 담기 → 헤더 확인`)이 원인 영역을 좁혀 준다.

### 살아남은 변경 (5번) — 왜 못 잡았나

`totalPages = Math.max(1, Math.ceil(totalCount / pageSize))`에서 `Math.max(1, ...)`를 지우면 0건일 때 `totalPages`가 0이 되어 페이지 표시가 **`1 / 0`** 이 된다. 그런데 5번(빈 결과) 테스트는 *0건 문구*와 *상품 카드가 없다*만 확인하고 있었다. 화면의 다른 조각(페이지네이션)이 0건 상태에서 어떻게 보여야 하는지를 아무도 적어 두지 않았던 것이다.

빈 결과 케이스에 `expect(pagination()).toHaveTextContent('1 / 1')` 한 줄을 추가했다. 변경을 되돌리기 전에 먼저 돌려 **보강한 단언이 실제로 빨간불이 되는 것**을 확인했고(`Expected element to have text content` 실패), 그 다음 구현을 원복했다.

여기서 배운 것: 상태별 테스트를 쓸 때 "그 상태에서 보여야 할 것"만 확인하고 **"그 상태에서 다른 영역이 어떻게 되는지"** 는 빼먹기 쉽다. 0건은 목록 영역의 이야기지만 페이지네이션도 같은 데이터를 읽는다.

### 3·4번이 확인해 준 것

1단계에서 "12번을 통합으로 두면 레이아웃이 헤더를 빼먹는 실패는 잡히지 않는다"고 적고 그 조각을 15번 E2E에 넘겼다. 4번 실험이 그 문장을 그대로 재현했다 — **헤더를 레이아웃에서 지워도 vitest 91개는 전부 통과했고 E2E만 빨간불이 됐다.** 3번(`history: 'replace'`)도 마찬가지로 통합이 전부 통과했다. 두 실험은 "E2E가 통합의 상위 호환이라 중복"이라는 통념이 이 배치에서는 틀렸다는 증거다.

반대로 1번은 단위와 통합이 **둘 다** 잡았다. 중복이지만 진단 비용이 다르다 — 단위는 3ms 만에 "정규화가 깨졌다"고 말하고, 통합은 8ms에 "요청에 잘못된 값이 실렸다"고 말한다. 둘 다 남겨 둔다.

---

## Advanced — Stryker 범위 (선택)

- 변형 대상: `src/_pages/products/model/**`, `src/entities/*/model/store.ts`, `src/_pages/products/api/products.queries.ts`, `src/shared/api/**` — **1단계에서 단위로 분류한 파일만.**
- 제외: `src/**/ui/**`, `src/app/api/**`. 통합 테스트가 걸리는 컴포넌트를 넣으면 변형 하나마다 jsdom + MSW가 다시 서므로 끝나지 않는다.
- 점수 100%를 목표로 하지 않는다. 살아남은 변형 중 의미 있는 2개 이상을 골라 테스트를 보강하고, 죽일 수 없는 변형(의미가 안 바뀌는 것)은 이유를 적는다. 전체 실행 시간을 재고 상시 사용 여부를 판단한다.

---

## 이 계획 때문에 먼저 바꾼 프로덕션 코드 3곳

테스트를 쓰기 전에 필요한 최소 변경이다. 기능은 그대로다(`pnpm check` 통과, 기존 41개 테스트 유지).

**1. zustand 스토어를 모듈 밖으로 내보냈다** — `src/entities/{cart,wishlist}/model/store.ts`
`create()`가 만든 상태는 모듈 전역이라 테스트 사이에 새어 나간다. 리셋 경로가 없으면 "파일을 단독으로 돌리든 순서를 바꿔 돌리든 같은 결과"라는 2단계 요구를 만족할 수 없다. `useCartStore`·`useWishlistStore`를 export하되 **`index.ts`의 공개 API(선택자 훅)는 그대로 뒀다.** 화면 코드는 여전히 스토어를 직접 보지 않고, 이 모듈 경로를 import하는 건 테스트뿐이다.

**2. QueryClient 정책을 팩토리로 뽑았다** — `src/shared/api/query-client.ts` (신규), `src/app/providers.tsx`
`retry`·`throwOnError` 정책이 `providers.tsx` 안에 인라인이라, 통합 테스트가 자기 QueryClient를 새로 만들면 **프로덕션과 다른 실패 경로를 검증**하게 된다(6·7번이 무의미해진다). `createAppQueryClient()` 하나를 화면과 테스트가 같이 쓴다. 서버 prefetch용 `get-query-client.ts`는 "기본값 없는 새 클라이언트"라는 별도 계약이라 건드리지 않았다.

**3. `describeFilters`를 model로 내렸다** — `src/_pages/products/model/describeFilters.ts` (신규)
`ProductsPage.tsx` 안의 모듈 private 함수라 DOM 없이 부를 수 없었다. 3번(순수 로직)을 단위로 두기로 한 이상 UI 파일 밖에 있어야 한다. 함수와 함께 `CATEGORY_OPTIONS`도 옮겼다 — 필터 select와 0건 문구가 같은 라벨 표를 봐야 하기 때문이다.

---

## AI 사용 범위

- **맡긴 것**: 환경 분리 설정 스케치, MSW 핸들러·픽스처·렌더 래퍼 같은 반복 코드, 이 문서의 초안 구조.
- **직접 정한 것**: 15개 항목의 방법론 배치와 그 이유, **단언의 내용**, **모킹 경계(HTTP 한 겹)**, 목록 밖에서 할 것과 안 할 것.
- AI가 만든 테스트는 3단계에서 반드시 망가뜨려 본다. 통과하는 테스트를 만드는 건 쉽고, 아무것도 안 잡는 테스트를 만드는 건 더 쉽다.

## 커밋 순서

1. 프로덕션 코드 3곳 변경 (위 절)
2. **이 문서** — 테스트 코드보다 먼저
3. 0단계 환경·MSW·Playwright 설정 + 셋업 시간 실측 ✅
4. 2단계 구현 (단위 → 통합 → E2E) ✅
5. 3단계 실험 기록 + 5번 보강 (망가뜨린 코드는 전부 원복) ✅

1~3은 한 커밋으로 묶지 않는다. 설계 문서가 테스트 코드보다 먼저 커밋돼야 하므로 2와 3 사이에 커밋 경계를 둔다.
