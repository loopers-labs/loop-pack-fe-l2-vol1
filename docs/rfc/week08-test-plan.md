# RFC — 8주차 테스트 계획: 무엇을 지킬지 먼저 정한다

| 항목      | 내용                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------ |
| 상태      | 0·1·2·3단계 완료 (Advanced 미착수)                                                                     |
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
| `@testing-library/react`      | 렌더·조회         | 통합으로 정한 8개 항목이 컴포넌트를 그린다                 |
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
// vitest.config.ts — 구현된 값 (resolve.alias 는 생략)
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

"파일을 단독으로 돌리든 순서를 바꿔 돌리든 같은 결과"는 이 셋으로 확보한다. 확인은 통합 파일이 여럿 생긴 **2단계 완료 시점에** 했다 — 0단계에는 DOM 테스트가 한 파일뿐이라 순서를 섞어도 증명되는 것이 없었다. 실측 결과는 0.9-2에 있다.

---

### 0.6 Playwright — production build 위에서

```ts
// playwright.config.ts — 구현된 값
const APP_ORIGIN = process.env.APP_ORIGIN ?? 'http://localhost:3000';
const port = Number(new URL(APP_ORIGIN).port || 3000);

webServer: {
  command: `pnpm start -p ${port}`,
  url: APP_ORIGIN,
  env: { APP_ORIGIN },
  reuseExistingServer: false,
},
```

`pnpm dev` 로 돌리지 않는다. 이 앱은 서버 컴포넌트에서 자기 자신에게 요청을 보내고(`generateMetadata` → `apiClient` → `getAppOrigin`) `APP_ORIGIN` 절대 URL 분기가 있어서 dev와 production의 동작이 갈릴 여지가 있다. 그리고 mock API의 500ms 지연은 production에서만 나타난다 — **E2E가 잡아야 할 대기 문제가 dev에서는 아예 재현되지 않는다.**

**서버는 Playwright가 직접 띄운다 (`reuseExistingServer: false`).** 이 옵션이 켜져 있으면 Playwright는 해당 URL이 응답하는지만 보고 그게 우리 앱인지는 확인하지 않는다. 재사용으로 아끼는 것은 기동 시간 몇 초이고, 잃는 것은 **"방금 통과한 E2E가 무엇을 상대로 통과했는가"에 대한 확신**이다. production build를 검증하겠다고 정한 이상 그 build를 직접 띄우는 것이 앞뒤가 맞는다.

**포트는 `APP_ORIGIN` 에서 파생시킨다.** 이 값은 build 시 `metadataBase` 로, runtime 에는 `generateMetadata` 가 `getAppOrigin()` 으로 **자기 자신에게 fetch** 할 때의 origin 으로 쓰인다. 서버를 다른 포트로 띄우면 그 self-fetch 가 엉뚱한 곳으로 나가고, `page.tsx` 의 `catch` 가 실패를 삼켜 **metadata 만 조용히 비어 나간다.** 포트를 별도 설정으로 두면 이 둘이 어긋날 수 있으므로 env 하나로 build·runtime·Playwright 를 함께 몬다.

기본값은 3000이고, 다른 포트를 쓰려면 `APP_ORIGIN=http://localhost:3100 pnpm check` 처럼 한 곳만 바꾸면 된다.

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

### 0.8 셋업 시간 비교 — 실측

`vitest run` 출력의 `Duration ...` 줄을 그대로 옮겼다. 같은 6개 파일 44개 테스트, 3회 실행 중앙값이다.

| 구성                         | transform | setup     | import | tests | environment | 총        |
| ---------------------------- | --------- | --------- | ------ | ----- | ----------- | --------- |
| 전부 jsdom 단일 프로젝트     | 376ms     | 1.45s     | 302ms  | 303ms | 3.02s       | 1.15s     |
| **node / jsdom 분리 (채택)** | 163ms     | **121ms** | 281ms  | 255ms | **272ms**   | **705ms** |

`setup` 12배, `environment` 11배 차이다. (setup·environment는 워커별 합계라 벽시계 `총`보다 클 수 있다.)

프로젝트를 따로 돌리면 어디서 값이 나오는지가 더 분명하다.

| 프로젝트          | 파일 | 테스트 | setup   | environment |
| ----------------- | ---- | ------ | ------- | ----------- |
| `node` (기존 5개) | 5    | 41     | **0ms** | **0ms**     |
| `jsdom` (신규)    | 1    | 3      | 179ms   | 401ms       |

**분리의 값어치가 이 한 줄이다** — 기존 5개는 DOM 환경 비용을 한 푼도 내지 않는다. 전부 jsdom으로 뒀다면 테스트가 늘 때마다 이 비용이 파일 수에 비례해 쌓인다.

측정 방법: 임시 config(`environment: 'jsdom'` 단일, 같은 `setupFiles`)를 만들어 대조군을 재고 삭제했다. 커밋에 남기지 않았다.

---

### 0.9 계획이 틀린 곳 — 구현하며 드러난 것

문서를 먼저 쓰고 구현했더니 **계획 한 곳이 실제로 틀렸고, 검증 기준 하나는 시점이 일렀다.** 고친 내용과 왜 미리 못 봤는지를 남긴다.

#### (1) `src/test/` 는 lint를 통과하지 못한다

0.2에서 테스트 인프라를 `src/test/` 에 두기로 했다. 이 레포는 `eslint-plugin-boundaries` 를 `configs.strict` 로 쓰는데, strict 는 `no-unknown-files` 를 켠다. `src/test/` 는 `boundaries/elements` 의 어느 타입(app·pages·widgets·features·entities·shared)에도 안 붙는다.

실측:

```
src/test/__probe.ts
  1:1  error  File does not match any file pattern and does not belong to
               any known element   boundaries/no-unknown-files
```

우회로로 루트 `test/` 를 시도했더니 이번엔 반대편이 걸렸다.

```
src/_pages/product-list/ui/__probe.dom.test.tsx
  1:23  error  Dependencies to unknown elements and files are not allowed
                boundaries/no-unknown-dependencies
```

**해결**: `eslint.config.mjs` 의 기존 `ignores` 를 넓혀 `src/test/**` 와 `src/**/*.dom.test.{ts,tsx}` 를 뺐다. 새 관례를 만들지 않고 이미 있던 escape hatch(`src/examples/**`, `src/services/**`)와 같은 방식을 썼다.

면제가 타당한 근거는 따로 있다. **통합 테스트는 레이어를 가로지르는 것이 정상이다** — 헤더(widgets)와 목록(\_pages)을 한 화면에 올려야 12번 항목을 검증할 수 있다. FSD 의존 방향은 프로덕션 코드를 위한 규칙이고, 테스트에 그대로 적용하면 검증 자체가 불가능해진다. 프로덕션 코드의 강제는 그대로 남는다.

**왜 미리 못 봤나**: 0단계 계획을 세울 때 vitest·MSW·Playwright만 봤고 **lint 하네스를 검토 대상에 넣지 않았다.** `pnpm check` 가 `test → lint → typecheck → build` 네 단계인데 테스트 도구만 확인한 셈이다.

#### (2) 검증 기준 하나를 2단계로 미뤘다 — 이후 확인 완료

0.5에 적은 `vitest run --sequence.shuffle` 확인은 0단계에서 하지 않았다. DOM 테스트가 한 파일뿐이라 순서를 섞어도 증명되는 게 없었다. 격리 검증을 통합 테스트가 여럿 생기는 **2단계 완료 시점**으로 옮겼다.

**왜 미리 못 봤나**: 검증 항목을 "무엇을 확인하는가"로만 적고 **"그 시점에 확인이 가능한가"** 를 따지지 않았다. 계획서의 완료조건은 그 단계에서 실제로 판정될 수 있어야 한다.

**2단계 완료 후 실측** — 통합 파일이 3개가 된 시점에 다시 확인했다.

| 확인                                | 결과                            |
| ----------------------------------- | ------------------------------- |
| `vitest run --sequence.shuffle` 3회 | 12파일 112테스트, 3회 모두 동일 |
| `ProductListPage.dom.test.tsx` 단독 | 15 passed                       |
| `Header.dom.test.tsx` 단독          | 4 passed                        |
| `harness.dom.test.tsx` 단독         | 3 passed                        |

`afterEach` 의 store·`localStorage`·MSW 핸들러 초기화 셋이 실제로 격리를 만들고 있다.

---

## 1. 검증 방법을 정한다

> "빨간불이 되면 알게 되는 것" 칸에 _"컴포넌트가 렌더된다"_ 류가 들어가면 그 항목은 잘못 잡은 것이다. **깨졌을 때 사용자가 겪는 일**을 쓴다.

| #   | 검증 대상                                 | 방법론   | 그렇게 정한 이유                                                                                                                                       | 빨간불이 되면 알게 되는 것                                                                                           |
| --- | ----------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 1   | 장바구니·위시리스트 개수 파생             | **단위** | 개수는 store에 저장하지 않고 `cart.length` 로 파생한다. 파생 규칙 자체는 `toggle` 순수 함수라 DOM 없이 `getState()` 로 검증된다.                       | 같은 상품을 두 번 담으면 헤더 개수가 2로 늘거나, 다시 눌러도 안 빠져서 **헤더 숫자와 실제 담긴 상품이 어긋난다**     |
| 2   | URL 조건 → query key                      | **단위** | `parseFilterParams → toProductListQuery → productListQueryOptions.list().queryKey` 전 구간이 순수 함수다. 렌더 없이 key를 직접 비교할 수 있다.         | 조건이 달라졌는데 key가 같아 **이전 조건의 목록이 그대로 보이거나**, 조건이 같은데 key가 달라져 매번 재요청한다      |
| 3   | `parseFilterParams` (직접 고른 순수 로직) | **단위** | 아래 별도 설명                                                                                                                                         | 허용하지 않는 `sort`·`category` 가 그대로 조회에 실려 **400을 받거나**, `page=0`·`NaN` 이 1로 안 떨어져 빈 화면      |
| 4   | 목록 로딩 → 성공                          | **통합** | 스켈레톤 → 목록 전환은 `useQuery` 상태와 `keepPreviousData` 가 함께 만드는 결과다. 세 조각을 따로 보면 이 전환을 못 잡는다.                            | 로딩 문구가 끝나지 않거나, 응답의 `totalCount` 와 화면의 "총 N개"·카드 수가 어긋난다                                 |
| 5   | 목록 빈 결과                              | **통합** | 0건 안내 문구가 `describeQuery` 로 **조회 조건을 되읽어** 만들어진다. 조건과 문구의 연결은 렌더해야 보인다.                                            | 0건인데 안내가 없어 화면이 비거나, 안내 문장의 조건이 실제 조회 조건과 다르다                                        |
| 6   | 목록 에러                                 | **통합** | `shouldEscalateToBoundary` 로 4xx는 인라인, 5xx는 상위 ErrorBoundary로 **갈린다.** 이 분기의 결과는 "무엇이 화면에 남는가"라서 렌더해야 판정된다.      | 5xx인데 인라인으로 삼켜 경계가 안 뜨거나, 4xx인데 경계로 던져 **고칠 수단인 필터 폼까지 사라진다**                   |
| 7   | 에러에서 재시도로 복구                    | **통합** | 인라인 `refetch()` 와 경계의 `resetErrorBoundary`+`QueryErrorResetBoundary` 는 서로 다른 복구 경로다. 둘 다 "다시 성공 목록이 보이는가"로만 검증된다.  | 재시도를 눌러도 에러 화면이 남는다 — reset이 query cache에 닿지 않아 **사용자가 새로고침 말고는 빠져나갈 길이 없다** |
| 8   | 카테고리 변경 → 목록 변경                 | **통합** | select change → nuqs URL → query key → 재조회까지가 한 사슬이다. 중간 한 곳만 봐도 사슬이 끊긴 걸 못 잡는다.                                           | 카테고리를 바꿔도 목록이 그대로거나, `page` 가 1로 리셋되지 않아 **3페이지에서 카테고리를 바꾸면 빈 화면**           |
| 9   | 정렬 변경 → 순서 변경                     | **통합** | 8번과 같은 사슬. 다만 결과가 "개수"가 아니라 **카드의 순서**라 렌더된 DOM 순서를 봐야 한다.                                                            | 정렬 파라미터가 요청에 안 실리거나, 실려도 화면 순서가 응답 순서를 따르지 않는다                                     |
| 10  | 페이지 이동 → 목록 변경                   | **통합** | `totalPages` 계산과 버튼 `disabled` 가 결과 컴포넌트 안에 있다. 경계(1페이지·마지막 페이지)가 곧 버튼 상태라 렌더 없이 못 본다.                        | 마지막 페이지에서 "다음"이 안 막혀 **빈 목록으로 넘어가거나**, 로딩 중 연타로 페이지가 건너뛴다                      |
| 11  | 조작이 URL에 반영 · URL로 재진입          | **E2E**  | 지키는 것이 **여러 조건이 쌓인 링크가 문서 경계를 넘어 살아남는가**다. `NuqsTestingAdapter` 는 URL 상태를 누적하지 않아 단일 조작밖에 못 본다(판단 1). | 조작해도 URL이 안 바뀌어 **공유 링크가 무의미**해지거나, 받은 링크로 들어와도 폼이 기본값으로 뜬다                   |
| 12  | 담기 → 헤더 개수 · 다시 누르면 빠짐       | **통합** | 목록의 버튼과 헤더는 서로 모르고 store로만 이어진다. **두 컴포넌트를 함께 렌더**해야 이 연결이 검증된다. 1번(파생 규칙)과 잡는 것이 다르다.            | 버튼 라벨은 "담김"인데 헤더 숫자가 안 늘거나, 반대로 헤더만 늘고 버튼 `aria-pressed` 가 안 바뀐다                    |
| 13  | 뒤로·앞으로 가기로 필터 복원              | **E2E**  | `history: 'push'` 의 효과는 **실제 history 스택**에서만 나타난다. `NuqsTestingAdapter` 는 URL 변경을 이벤트로 알려줄 뿐 스택을 쌓지 않는다.            | `push` 가 `replace` 로 바뀌어 뒤로가기가 **필터 이전이 아니라 페이지를 떠난다**                                      |
| 14  | 새로고침해도 필터 상태가 유지             | **E2E**  | 문서 재로드가 필요하다. jsdom에는 재로드가 없다.                                                                                                       | 새로고침하면 조건이 기본값으로 돌아가 **작업 중이던 검색이 날아간다**                                                |
| 15  | 목록 진입 → 담기 → 헤더 확인              | **E2E**  | `persist` 의 `localStorage` 왕복 + Next hydration까지 한 번에 지나는 유일한 항목. production build에서만 이 조합이 진짜로 재현된다.                    | hydration 불일치나 persist 미동작으로 **새로고침 후 헤더가 0으로 돌아간다**                                          |

**배치 요약**: 단위 3 · 통합 8 · E2E 4. (초안은 통합 9 · E2E 3 이었다 — 11번을 옮긴 근거는 판단 1)

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
| 11  | 뒤쪽 페이지에서 검색 → 1페이지부터 · 없는 조건이 담긴 링크로 재진입         |
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

### 판단 1 — "조작이 URL에 반영 · URL로 재진입"(11번)을 통합에 뒀다가 E2E로 옮긴 것

**이 판단은 2단계에서 뒤집혔다.** 처음 근거와 뒤집은 근거를 둘 다 남긴다.

#### 처음에 통합으로 정한 근거

이 항목은 URL이 대상이라 E2E가 자연스러워 보였지만, **검증하려는 것이 브라우저 기능이 아니라 우리 코드의 결정**이라고 봤다. 지키려는 건 두 가지다 — (a) 조작이 URL에 실리는가, (b) URL로 들어왔을 때 폼이 복원되는가. `NuqsTestingAdapter` 는 `searchParams` 초기값을 주입하고 `onUrlUpdate` 로 갱신을 관측할 수 있으므로 브라우저 없이 확인된다고 판단했다.

그러면서 이렇게 적어 뒀다 — 이 배치는 **테스트 어댑터가 실제 Next 어댑터와 다르게 동작할 위험을 감수한 것**이고, 13·14번이 실제 브라우저에서 같은 nuqs 상태를 지나므로 "부분적으로 덮인다".

#### 2단계에서 그 위험이 실제로 드러났다

**`NuqsTestingAdapter` 는 URL 상태를 누적하지 않는다.** 각 `onUrlUpdate` 이벤트가 그 호출이 바꾼 조건만 담는다. 실측:

```
카테고리를 home 으로 → 정렬을 price-desc 로, 두 번 조작했을 때 받은 이벤트

  "category=home"  ||  "sort=price-desc"
                        ↑ category 가 없다
```

실제 브라우저 URL은 두 조건이 함께 쌓이는데 어댑터는 마지막 변경만 준다. 처음엔 통합에 두되 **단일 조작 왕복으로 범위를 좁혀** 우회했다. 그런데 그건 진짜 동작의 **퇴화된 케이스만 보는 테스트**다 — 사용자가 실제로 하는 일은 검색하고, 카테고리를 고르고, 정렬을 바꾼 뒤 그 주소를 보내는 것이다.

#### 뒤집은 근거 — 판정 기준을 다시 잡았다

"URL을 건드리는가"를 기준으로 삼으면 8·9·10번도 전부 E2E로 가야 한다. 그 셋도 URL을 쓴다. 실제 기준은 그게 아니었다.

| 항목   | 지키는 것          | URL이 견뎌야 하는 것      |
| ------ | ------------------ | ------------------------- |
| 8·9·10 | 조건 → 목록 반응   | 없음 (같은 문서 안)       |
| **11** | 링크 공유 → 재진입 | **문서 경계를 넘는 왕복** |
| 13     | 뒤로·앞으로        | history 스택              |
| 14     | 새로고침           | 문서 재로드               |

**기준은 "URL을 건드리는가"가 아니라 "URL이 문서 경계를 넘어 살아남아야 하는가"다.** 그 경계를 넘는 것만 통합이 흉내낼 수 없다. 11·13·14가 한 파일에 모인 이유이기도 하다.

그리고 커머스에서 **검색·필터·목록 조회는 핵심 흐름**이다. 실패 비용이 높은 흐름일수록 충실도 높은 층에서 관통시키는 편이 맞다. 다만 그 흐름의 분기·경계(3페이지에서 카테고리 변경 등)까지 E2E로 올리지는 않았다 — 같은 시간에 더 적게 잡는다.

**옮겨서 치른 값**: E2E 항목 3 → 4, 실행 시간 4.5s → 약 9s.
**옮겨서 얻은 것**: 실제 nuqs 어댑터로 실제 누적을 검증한다. 그리고 **옮기자마자 버그가 잡혔다**(아래 2.1).

#### 단언 대상도 함께 고쳤다

초안에는 `expect(updates.at(-1)?.get('page')).toBeNull()` 처럼 **쿼리스트링의 모양**을 단언한 케이스가 둘 있었다. 이건 nuqs 의 직렬화 규칙("파서 기본값과 같아진 조건은 URL 에서 지운다")을 고정한다 — 라이브러리가 기본값도 싣도록 바뀌면 테스트는 깨지는데 **사용자가 겪는 일은 없다.**

지키려는 것은 "URL 이 이렇게 생겼다"가 아니라 **"이 화면의 링크를 보내면 상대도 같은 화면을 본다"** 다. 그래서 왕복으로 바꿨다 — 조작해서 만들어진 링크를 그대로 다시 열어 같은 화면이 나오는지 본다. `onUrlUpdate` 는 단언 대상이 아니라 링크를 실어 나르는 통로로만 쓴다.

| 초안 (구현 어휘)                                   | 수정 (사용자 결과)                                             |
| -------------------------------------------------- | -------------------------------------------------------------- |
| `page 조건이 URL 에서 빠진다`                      | `3페이지에서 검색하면 1페이지 결과부터 본다`                   |
| `조건 초기화를 누르면 모든 조건이 URL 에서 빠진다` | `조건 초기화를 누르면 조건 없이 조회한 기본 목록으로 돌아간다` |

#### 2.1 옮기자마자 테스트가 버그를 잡았다

11번을 E2E로 옮기고 처음 돌린 순간 한 케이스가 빨간불이 됐다. **테스트를 고칠 게 아니라 구현이 틀린 경우**였다.

```
경계 케이스: /products?category=nope&sort=nope&page=0 로 진입

Expected substring: "1 /"
Received string:    "이전0 / 3다음"
```

**재현** — `/products?page=0` 으로 들어가면 1페이지 상품이 보이는데 페이지 표시가 `0 / 3` 이다.

**원인** — `page` 정규화 규칙이 **두 벌**이었다.

| 경로                           | 파서                                   | `?page=0` |
| ------------------------------ | -------------------------------------- | --------- |
| 서버 (`generateMetadata`)      | `parseFilterParams` — `page >= 1` 가드 | **1**     |
| 클라이언트 (`ProductListPage`) | nuqs `parseAsInteger.withDefault(1)`   | **0**     |

`withDefault` 는 파라미터가 **없을 때만** 적용된다. `'0'` 은 정수로 잘 파싱되므로 그대로 통과한다.

그 뒤 연쇄로 증상이 숨었다 — `0` 이 falsy 라 `toSearchParams` 의 `if (query.page)` 에서 파라미터가 통째로 빠지고, 서버는 `?? '1'` 로 1페이지 데이터를 정상 반환한다. **데이터는 맞고 라벨만 틀린** 형태라 눈에 잘 안 띈다.

**수정 위치** — 규칙이 두 벌인 것이 원인이므로 한쪽에 가드를 덧대지 않고 **판정을 한 곳에서만 정의**하도록 고쳤다.

- `parseFilterParams.ts` — 판정을 `isReachablePage` 로 추출해 export
- `useProductFilterState.ts` — `createParser` 로 같은 판정을 쓰는 `parseAsReachablePage`

**검증** — `APP_ORIGIN=... pnpm check` exit 0. 해당 E2E 케이스가 빨간불 → 초록불.

> 항목 3의 존재 이유가 _"서버와 클라이언트가 같은 규칙으로 URL을 읽게 만드는 자리"_ 였는데
> 정작 `page` 가 예외였다. **11번을 통합에 뒀다면 이 버그는 안 잡혔다** — 테스트 어댑터는
> 실제 nuqs 파서를 지나지 않는다.

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

## 부록 — 파일 구성

이 문서만 읽고 2·3단계에 무엇이 들어갈지 예측할 수 있어야 한다는 완료조건에 대한 답이다.

**0단계에서 이미 만든 것** (하네스 + 스모크 2개. 15개 검증 항목은 여기 없다.)

```
vitest.config.ts                    ← node / jsdom projects 분리
playwright.config.ts                ← production build, APP_ORIGIN 파생 포트, 서버 재사용 금지
eslint.config.mjs                   ← boundaries ignores 확장 (0.9-1)
src/test/fixtures.ts                ← 응답 계약만 지키는 픽스처 (mock 데이터를 import 하지 않는다)
src/test/handlers.ts                ← 성공 경로 기본 핸들러
src/test/server.ts                  ← setupServer
src/test/setup.dom.ts               ← jest-dom · MSW 수명주기 · store/localStorage 초기화
src/test/renderWithProviders.tsx    ← QueryClient(retry:false) + NuqsTestingAdapter
src/test/harness.dom.test.tsx       ← jsdom 스모크 3개
e2e/harness.spec.ts                 ← E2E 스모크 2개
```

**2단계에서 만든 파일** — 15개 항목 전부 구현했고, 배치는 1단계 표와 일치한다.

| 파일                                                          | 항목           | 테스트 |
| ------------------------------------------------------------- | -------------- | ------ |
| `src/entities/cart/model/useCartStore.test.ts`                | 1              | 7      |
| `src/entities/wishlist/model/useWishlistStore.test.ts`        | 1              | 5      |
| `src/_pages/product-list/model/toProductListQuery.test.ts`    | 2              | 16     |
| `src/features/product-filter/model/parseFilterParams.test.ts` | 3              | 19     |
| `src/_pages/product-list/ui/ProductListPage.dom.test.tsx`     | 4·5·6·7·8·9·10 | 15     |
| `src/widgets/header/ui/Header.dom.test.tsx`                   | 12             | 4      |
| `e2e/product-list-history.spec.ts`                            | 11·13·14       | 9      |
| `e2e/cart-flow.spec.ts`                                       | 15             | 4      |

이 8파일만 세면 vitest 70 · Playwright 13 = **83 케이스**. (3단계 보강 2개 포함)
여기에 0단계 스모크(jsdom 3 · E2E 2)와 기존 5파일 41을 더한 **전체 스위트가 vitest 12파일 114 · Playwright 15**이고,
`APP_ORIGIN=... pnpm check` exit 0 이다.

**항목 2를 배열 비교가 아니라 `hashKey` 로 단언한 이유**: 지키려는 것은 "queryKey 가 이렇게 생겼다"가 아니라 **캐시가 갈리는 규칙**이다. React Query 는 key 를 `hashKey` 로 해싱해 같은 해시면 같은 엔트리를 쓰고, 이 해시는 객체 키 순서에 무관하다. 배열을 깊은 비교하면 캐시 동작과 상관없는 것(키 순서)까지 고정하게 된다. 덕분에 "정규화로 기본값이 된 조건은 명시한 조건과 캐시를 공유한다" 같은 항목 2·3을 잇는 성질도 단언할 수 있었다.

**`getByTestId` 는 쓰지 않았다.** 전부 역할·이름 기반으로 잡혔다. 카드 단위 조회만 `heading.closest('article')` 로 좁혔는데, 카드에 접근 가능한 이름이 없어 `getByRole('article')` 로는 개별 카드를 지목할 수 없었기 때문이다. 상품명 heading 은 사용자가 카드를 구분하는 실제 단서이므로 이 경유는 a11y 셀렉터 원칙에 어긋나지 않는다.

**남은 중복**: `src/test/harness.dom.test.tsx` 와 `e2e/harness.spec.ts` 는 0단계에서 하네스 동작을 증명하려고 만든 스모크다. 항목 12·15와 겹치는 부분이 있어 지금은 순수 비용(E2E 2개, 약 2.5s)이다. 3단계에서 하네스 자체를 다시 건드릴 일이 없다고 판단되면 그때 지운다.

E2E 셀렉터는 `getByRole('button', { name: '다음' })` 처럼 **역할과 이름 기반**으로 쓴다. `codegen` 산출물을 그대로 두지 않는다. 통합에서도 같다 — `getByTestId` 를 쓰게 되면 왜 다른 방법으로 안 됐는지를 그 자리에 주석으로 남기고 이 문서에 옮긴다.

---

## 4. 자가 검증 — 내 테스트가 진짜 뭘 잡는지 (3단계)

구현을 일부러 망가뜨려 테스트가 잡는지 확인했다. **구현 한 곳만** 바꿨고 **테스트 코드는 건드리지 않았다.**
`git stash` 는 쓰지 않았다 — 미커밋 변경이 함께 날아간다. 파일을 `/tmp` 로 복사해 두고 되돌렸다.

```bash
cp src/target.ts /tmp/mutation-backup/     # 원본 보관
# 구현 한 곳 수정 → 실행 → 결과 기록
cp /tmp/mutation-backup/target.ts src/     # 복원
git status --short -- src e2e              # 구현이 원복됐는지 확인
```

### 실험 기록

| #   | 망가뜨린 곳                         | 어떻게 바꿨나                            | 결과         | 실패한 테스트                             |
| --- | ----------------------------------- | ---------------------------------------- | ------------ | ----------------------------------------- |
| 1   | `parseFilterParams.isReachablePage` | `page >= 1` → `page >= 0`                | **잡힘**     | 단위 3개 (parseFilterParams 2, 캐시 키 1) |
| 2   | `ProductListResult`                 | `throwOnError` 줄 삭제                   | **잡힘**     | 통합 1개 (항목 6 — 5xx 경계)              |
| 3   | `useProductFilterState`             | `history: 'push'` → `'replace'`          | **잡힘**     | E2E 3개 (항목 13 전부)                    |
| 4   | `useProductFilterState.setSort`     | `{ sort, page: 1 }` → `{ sort }`         | **살아남음** | 없음 — vitest 112 · E2E 15 전원 통과      |
| 5   | `ProductListResult` 페이지 버튼     | `disabled` 에서 `isPlaceholderData` 삭제 | **살아남음** | 없음 — vitest 113 전원 통과               |

### 잡힌 경우 — 실패 메시지로 원인을 짐작할 수 있었나

| #   | 메시지                                                                      | 판정                                                                                                |
| --- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | `expected +0 to be 1` + 제목 "0(0 페이지)이 담겨 있으면 …첫 페이지를 본다"  | ✅ 즉시 안다. 값과 제목이 같은 것을 가리킨다                                                        |
| 1   | 캐시 키 쪽은 `expected '["products",{"category":"all","page":…'` (잘림)     | ⚠️ 갈렸다는 것만 안다. **해시 문자열이 길어 어느 조건이 달라졌는지 안 보인다**                      |
| 2   | `Unable to find an element with the text: 상품 목록을 불러오지 못했습니다.` | ✅ 경계 fallback 이 안 떴다는 뜻으로 바로 읽힌다                                                    |
| 3   | `expect(locator).toHaveValue` → `element(s) not found`                      | ⚠️ **"카테고리 select 를 못 찾았다"까지만 말한다.** 뒤로가기가 페이지를 떠났다는 것은 추론해야 한다 |

**세 개 다 잡혔지만 메시지 품질은 고르지 않다.** 1의 캐시 키 쪽과 3은 손볼 자리로 남겨 둔다 —
전자는 해시 대신 갈린 조건을 함께 단언하는 편이 낫고, 후자는 URL 단언을 먼저 두면 원인이 앞에 온다.

### 실험 2에서 함께 드러난 것

`throwOnError` 를 지웠는데 **항목 7의 "서버 오류로 실패한 뒤 다시 시도" 는 깨지지 않았다.**
경계 없이 인라인으로 떨어져도 그 화면에도 "다시 시도" 버튼이 있어 같은 이름으로 통과한다.
즉 그 테스트는 **어느 경로로 복구했는지를 구별하지 못한다.** 항목 6이 경로를 갈라 주고 있어
지금은 덮이지만, 항목 6이 사라지면 조용히 무의미해지는 테스트다.

### 살아남은 경우 — 왜 못 잡았고 어떻게 고쳤나

#### 실험 4 — `setSort` 의 페이지 리셋

**사용자가 겪는 일**: 3페이지에서 정렬을 바꾸면 3페이지에 머문다. 정렬이 바뀌었으니 그 3페이지는
완전히 다른 상품이고, 사용자는 엉뚱한 곳에 떨어진다. 검색·카테고리는 리셋되는데 정렬만 안 되는
**일관성 없는 동작**이 된다.

**왜 못 잡았나**: 세 setter(`setSearch`·`setCategory`·`setSort`)가 같은 성질을 갖는데
**둘만 검증했다.** 1단계 경계 표를 보면 항목 8에는 "3페이지에서 카테고리 변경 → `page=1`"이
적혀 있는데 항목 9 칸에는 없다. 설계 시점의 누락이 그대로 구멍이 됐다.

**고친 것**: 항목 9에 경계 케이스 `3페이지에서 정렬을 바꾸면 페이지가 1로 돌아간다` 추가.

#### 실험 5 — 페이지 버튼의 로딩 가드

**사용자가 겪는 일**: 2페이지를 기다리는 동안 "다음"을 한 번 더 누르면 3페이지로 건너뛴다.
사용자는 1 → 3 으로 뛴 것처럼 느낀다.

**왜 못 잡았나**: 1단계 경계 표에 **"로딩 중 연타로 페이지가 건너뛴다"를 적어 두고도**
그걸 겨냥한 케이스를 쓰지 않았다. 항목 10에서 확인한 것은 첫 페이지·마지막 페이지의 `disabled` 뿐이라
`page <= 1` / `page >= totalPages` 는 잡히지만 `isPlaceholderData` 는 안 잡힌다.

**고친 것**: 항목 10에 `다음 페이지를 기다리는 동안에는 페이지 이동 버튼을 누를 수 없다` 추가.
MSW 를 `delay('infinite')` 로 막아 "기다리는 중" 상태를 붙들고 단언한다.

#### 보강한 테스트가 실제로 그 변형을 죽이는지 확인했다

통과만으로는 증거가 안 되므로 전 주기를 돌렸다.

| 단계        | 실험 4   | 실험 5   |
| ----------- | -------- | -------- |
| 정상 구현   | 통과     | 통과     |
| 변형 재적용 | **실패** | **실패** |
| 복원        | 통과     | 통과     |

### 이번 실험에서 배운 것

**RFC 후보 3개가 전부 한 번에 잡혔다.** 과제가 경고한 그대로 — 겨냥한 테스트가 이미 있는 자리만
골랐기 때문이다. 살아남은 둘은 후보 목록에 없었고, **"1단계 경계 표에 적어 놓고 구현하지 않은 칸"**
에서 나왔다.

다음에 뮤테이션 대상을 고를 때의 기준: 잡힐 것 같은 곳이 아니라 **계획서에 적힌 경계 중
테스트 이름으로 되짚어지지 않는 것**부터 고른다. 실제로 그게 둘 다 구멍이었다.

---

## AI 사용 내역

- **AI에게 맡긴 것**: 코드베이스 사실 확인(설치된 vitest 4에서 `environmentMatchGlobs` 제거 여부, `nuqs/adapters/testing` 의 실제 export, `waitForMockApi` 의 `NODE_ENV` 분기), 위 표의 초안 작성, 문서 구조.
- **직접 정한 것**: 15개 항목의 **방법론 배치**, 각 항목의 **단언 대상**("빨간불이 되면 알게 되는 것" 칸), **모킹 경계**(MSW를 네트워크에 두고 `fetch` 를 바꿔치기하지 않는다), 환경 분리 방식, E2E 명령 배치, 목록 밖 포함/제외 기준.
- 2단계에서 셋업·픽스처·MSW 핸들러 같은 반복 코드는 AI에게 맡기되, **`expect` 의 내용은 이 문서의 마지막 칸을 따른다.**
