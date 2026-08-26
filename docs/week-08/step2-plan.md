# 8주차 2단계 실행 계획

> **관련 문서**
>
> - 과제 — [week-08.md](../assignments/week-08.md) 2단계
> - 0단계 — [현황 점검](./step0-status.md)
> - 1단계 — [테스트 계획](../rfc/week08-test-plan.md)
> - 이 계획의 대조 결과 — [step2-review.md](./step2-review.md)

이 문서만 읽고 작업을 이어갈 수 있도록 쓴다. 항목 번호(1~15번)는 1단계 문서 「1. 검증 방법」 표의 번호다.

---

## 현재 인계 상태 — 다음 작업은 과제 3단계

0·1·2단계는 완료했다. 다음 작업자는 2단계 구현을 다시 만들지 말고, 아래 **과제 3단계 자가 검증**부터 시작한다.

### 완료된 것

- node/jsdom Vitest project 분리와 MSW setup
- 1단계 표의 15개 항목 구현
- 단위·통합 테스트 파일별 단독 실행 확인
- `pnpm check` 통과
- production build 기반 Chromium·WebKit E2E 통과
- `waitForTimeout`, `getByTestId`, skip, snapshot, `toBeTruthy()` 없음
- Technical Writing 초안: `/Users/wendy/dev-wil/week-08.md`
- 1단계 계획서와 테스트 코드 대조 — 어긋난 자리와 원인은 `docs/week-08/step2-review.md`

### 대조에서 고친 것

구현을 끝낸 뒤 계획서와 코드를 대조해 어긋난 자리를 정리했다.

- MSW 핸들러가 `route.ts`와 같은 조건에서 400을 주도록 수정(잘못된 쿼리에도 200을 주던 상태)
- 계획에 없던 `onUrlUpdate` 단언 제거, 안 쓰는 헬퍼 옵션·`queryClient.clear()` 정리
- `HeaderCart.test.tsx` → `Header.test.tsx`(존재하지 않는 컴포넌트 이름), `fireEvent` → `userEvent`
- `PRODUCT_PAGE_SIZE` 하드코딩 제거, 로딩 단언을 요청 시작 이후로 이동
- 각 테스트 파일 상단에 계획서 항목 번호 주석 추가
- 계획서의 11번·7번·「모킹 경계」·「3단계 예고」를 구현 결과에 맞춰 개정

2단계까지의 변경은 커밋했다. 대조에서 나온 수정분은 아직 커밋하지 않았다. 사용자 소유 변경과 untracked 파일이 있으므로 임의로 stage·commit하거나 다른 변경을 되돌리지 않는다.

### 바로 해야 할 일: 단위·통합·E2E 변형 실험

실험 결과는 새 문서 `docs/week-08/step3-result.md`에 기록한다. 각 실험은 **구현 한 곳만 임시로 변경하고 테스트 코드는 건드리지 않은 상태에서** 실행한다. 결과를 기록한 직후 구현을 원래대로 복구한다.

| #   | 계층 | 임시로 망가뜨릴 구현                                                                                  | 실행할 검증                                                                                              | 기대하는 실패                                                   |
| --- | ---- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | 단위 | `src/shared/lib/get-total-pages.ts`의 `Math.max(1, Math.ceil(...))`를 `Math.ceil(...)`로 바꾼다       | `pnpm exec vitest run src/shared/lib/get-total-pages.test.ts`                                            | 상품 0개의 최소 1페이지 경계 테스트                             |
| 2   | 통합 | `src/_pages/product-list/model/useProductFilters.ts`의 `setCategory`에서 `page: 1`만 제거한다         | `pnpm exec vitest run src/_pages/product-list/ui/ProductListContent.test.tsx`                            | 3페이지에서 카테고리를 바꾸면 1페이지로 돌아가는 테스트         |
| 3   | E2E  | `src/shared/lib/create-collection-store.ts`의 `partialize`가 `{ ids: [] }`를 저장하도록 임시 변경한다 | `pnpm build && pnpm exec playwright test e2e/state-restoration.spec.ts --grep "목록에서 찜·담기한 상태"` | 클릭 직후 상태는 유지되지만 새로고침 뒤 Header 개수 복원이 실패 |

E2E 후보로 **persist storage key 이름만 바꾸지 않는다**(1단계 문서의 「3단계 예고」도 같은 결론으로 갱신했다)** 같은 실행 안에서 새 key에 저장하고 같은 key로 다시 읽기 때문에 새로고침 복원이 그대로 통과할 수 있어 의도한 결함이 아니다. `partialize` 변경은 화면의 즉시 상태는 유지하면서 저장 데이터만 비워 통합과 E2E 경계를 구분한다.

### 실험별 기록 형식

```md
| #   | 망가뜨린 곳 | 어떻게 바꿨나 | 결과            | 실패한 테스트 |
| --- | ----------- | ------------- | --------------- | ------------- |
| 1   |             |               | 잡힘 / 살아남음 |               |
```

표 아래에는 실험마다 다음 내용을 문단으로 적는다.

1. 실패 메시지만 보고 원인을 추측할 수 있었는가
2. 어떤 공개 동작을 해당 테스트가 지키고 있었는가
3. 살아남았다면 왜 못 잡았는가
4. 살아남은 경우 어떤 단언을 보강했고, 같은 변형을 다시 적용했을 때 실패했는가
5. 구현을 원래대로 복구했는가

### 실험 순서

1. 시작 전에 `git diff --check`로 현재 패치 상태를 확인한다.
2. 단위 변형 하나만 적용 → 대상 테스트 실행 → 결과 기록 → 구현 복구 → 대상 테스트 재실행.
3. 통합 변형 하나만 적용 → 대상 테스트 실행 → 결과 기록 → 구현 복구 → 대상 테스트 재실행.
4. E2E 변형 하나만 적용 → production build 기반 대상 E2E 실행 → 결과 기록 → 구현 복구 → 대상 E2E 재실행.
5. 세 실험 중 전부 너무 쉽게 잡혔다면 경계가 아닌 단순 반환값 삭제를 고른 것은 아닌지 검토한다. 살아남은 변경이 나오면 숨기지 말고 테스트를 보강한다.
6. 최종 구현에 변형이 남아 있지 않은지 diff로 직접 확인한다.
7. `pnpm check`와 `pnpm test:e2e`를 최종 실행한다.
8. `docs/week-08/step3-result.md`의 결과를 `/Users/wendy/dev-wil/week-08.md`의 「3단계 실험」에 반영한다.

### Claude에게 전달할 명령

```text
docs/week-08/step2-plan.md의 「현재 인계 상태 — 다음 작업은 과제 3단계」부터 읽고 과제 3단계 자가 검증을 진행해줘.

단위·통합·E2E 변형을 한 번에 하나씩만 적용하고, 각 대상 테스트의 실패 결과와 메시지를 docs/week-08/step3-result.md에 기록해. 매 실험 직후 구현을 원복하고 대상 테스트가 다시 통과하는지 확인해. 살아남은 변경은 숨기지 말고 이유를 분석한 뒤 테스트를 보강하고 같은 변형으로 다시 검증해.

마지막에는 변형이 남지 않았는지 diff를 확인하고 pnpm check와 production 기반 pnpm test:e2e를 실행해. 결과를 /Users/wendy/dev-wil/week-08.md의 3단계 실험 부분에도 반영해. 기존 사용자 변경은 보존하고 commit은 하지 마.
```

Advanced의 Stryker mutation testing은 선택 사항이다. 사용자가 별도로 요청하지 않으면 Basic 3단계까지만 진행한다.

---

## 0. 시작 전에 알아야 할 것

> **아래 「0. 시작 전에 알아야 할 것」부터 「남아 있는 위험」까지는 2단계를 진행할 때 쓴 계획이고, 지금은 전부 완료된 이력이다.** 다음 작업자는 위의 「현재 인계 상태」만 보면 된다. 아래는 판단 근거를 되짚을 때 참고한다.

의존성은 모두 설치를 마쳤다.

| 패키지                        | 상태              |
| ----------------------------- | ----------------- |
| `@testing-library/react`      | 설치됨 (^16.3.2)  |
| `@testing-library/user-event` | 설치됨 (^14.6.5)  |
| `@testing-library/jest-dom`   | 설치됨 (^7.0.1)   |
| `jsdom`                       | 설치됨 (^30.0.1)  |
| `msw`                         | 설치됨 (^2.15.0)  |
| `@playwright/test`            | 설치됨 (^1.61.1)  |
| `vitest`                      | 설치됨 (^4.1.10)  |
| `nuqs`                        | 설치됨 (^2.9.0)   |
| `@tanstack/react-query`       | 설치됨 (^5.101.2) |
| `zustand`                     | 설치됨 (^5.0.14)  |

```bash
node -e "const p=require('./package.json');const a={...p.dependencies,...p.devDependencies};['@testing-library/react','jsdom','msw'].forEach(n=>console.log(n, a[n]??'미설치'))"
```

### 미리 확인해둔 사실

계획을 세우며 코드에서 확인한 것들이다. 다시 조사하지 않아도 된다.

- `tsconfig.json`이 `"jsx": "react-jsx"`다. esbuild가 automatic runtime으로 변환하므로 **`@vitejs/plugin-react`는 없어도 된다.** 문제가 생기면 그때 추가한다.
- `NuqsTestingAdapter`는 별도 설치가 필요 없다. nuqs 2.9.0이 `nuqs/adapters/testing` 서브패스를 내보낸다.
- `src/shared/api/query-client.ts`에는 서버용 `getServerQueryClient`만 있다. 클라이언트 QueryClient는 `src/_app/providers/Providers.tsx`가 `useState`로 만든다. **테스트용 QueryClient는 따로 만들어야 한다.**
- `productQueries.list`는 `placeholderData: keepPreviousData`, `staleTime: 5분`, `throwOnError: shouldThrowProductListError`를 쓴다.
- `ProductListResults`의 분기는 `isPending` → `isError` → `products.length === 0`(안에서 `totalCount > 0`으로 오버플로우 구분) → 목록 순이다.
- `Header`는 `usePathname()`을 쓴다. 12번에서 이게 걸린다(아래 「결정이 필요한 것」 ①).
- 기존 E2E는 `e2e/state-restoration.spec.ts` 하나이고 그 안에 19개 테스트가 있다. **Phase 0의 E2E 축소 전 기준이다** — 축소 후에는 9개이고 Chromium·WebKit 합쳐 18개가 실행된다.

---

## Phase 0 — 0단계 마무리 (선행 조건, 완료)

0-1~0-7 전부 완료했다. E2E workflow는 `.github/workflows/e2e.yml`, `playwright.config.ts`의 `webServer.command`는 `pnpm start`, 셋업 시간 비교는 `step0-status.md`의 「환경 셋업 시간 비교」에 있다.

`step0-status.md`의 「다음 작업 순서」와 같다. 그 문서에 각 결정의 근거가 있으니 막히면 거기를 본다.

| #   | 할 일                                                                                                                              | 완료 판정                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 0-1 | 의존성 설치 (`@testing-library/react`·`user-event`·`jest-dom`, `jsdom`, `msw`)                                                     | `pnpm test`가 여전히 초록                          |
| 0-2 | `vitest.config.ts` 환경 분리 — include에 `.tsx` 추가, `.test.tsx`만 jsdom, `environmentOptions.jsdom.url: 'http://localhost:3000'` | `HeroSection.test.tsx` 포함 8개 파일이 잡히고 통과 |
| 0-3 | MSW `setupServer` + `onUnhandledRequest: 'error'`                                                                                  | 핸들러 없는 요청이 예외를 던짐                     |
| 0-4 | `api.test.ts`의 `vi.stubGlobal('fetch')` 3곳(22·29·39번 줄)을 MSW로 교체                                                           | 아래 주의사항 참고                                 |
| 0-5 | `playwright.config.ts`의 `webServer.command`를 `pnpm start`로, `test:e2e`에 빌드 추가                                              | production 빌드 위에서 기존 E2E 통과               |
| 0-6 | E2E용 GitHub Actions workflow 추가 (chromium·webkit 설치 후 `pnpm test:e2e`)                                                       | —                                                  |
| 0-7 | 셋업 시간 비교 측정 후 `step0-status.md`에 기록                                                                                    | 전부 jsdom일 때와 나눴을 때 두 수치                |

**0-4 관찰 결과**: node 환경에서는 상대 URL로 `Request`를 만드는 단계에서 `TypeError: Failed to parse URL`이 발생하므로 `server.events.on('request:start', ...)`가 한 번도 호출되지 않는다. jsdom에 `url: 'http://localhost:3000'`을 제공하면 `request:start`에 절대 URL이 찍히고 핸들러가 정상 응답한다. 이 관찰을 근거로 `api.test.ts`에 jsdom docblock을 붙인다.

**게이트**: `pnpm check` 한 번에 기존 테스트와 새 컴포넌트 테스트(스모크 1개)가 함께 통과하기 전에는 Phase 3으로 넘어가지 않는다.

---

## Phase 1 — 단위 테스트

jsdom도 MSW도 쓰지 않으므로 Phase 0과 병행할 수 있다.

### 1-1. 3번 `getTotalPages` 분리 후 단위 테스트

현재 계산은 `src/shared/lib/usePagination.ts` 안에 한 줄로 있다.

```ts
const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
```

`src/shared/lib/get-total-pages.ts`로 분리하고 `usePagination`은 그 결과를 쓴다. 공개 동작은 바꾸지 않는다. 파일명은 kebab-case 규칙을 따른다.

경계값: `totalCount = 0`, 딱 나누어떨어지는 수, `pageSize` 미만, 1개.

### 1-2. 2번 URL 조건 → query key

대상은 `src/_pages/product-list/model/search-params.ts`의 parser와 `src/entities/product/api/queries.ts`의 `productQueryKeys.list`다.

- 정상 범위 밖 값이 정규화되는가: `page=0`, 음수, 숫자가 아닌 값, 지원하지 않는 category·sort
- 같은 URL 조건이 같은 key로 조립되는가

`parseAsPositiveInteger`는 직접 작성한 parser라 nuqs가 대신 검증해주지 않는다.

### 1-3. 1번은 기존 테스트를 그대로 둔다

`src/shared/lib/create-collection-store.test.ts`가 이미 덮는다. 새로 쓰지 않는다.

---

## Phase 2 — 통합 테스트 인프라

4~13번이 전부 여기에 얹힌다. 테스트를 쓰기 전에 세운다.

- **렌더 헬퍼** — `QueryClientProvider` + `NuqsTestingAdapter`를 묶는다. 테스트용 QueryClient는 **`retry: false`** 로 만든다. 기본 재시도 정책을 그대로 두면 6·7번 에러 테스트가 재시도를 기다리다 타임아웃한다(과제 167행 힌트).
- **MSW 핸들러** — 기본 핸들러에는 성공 경로만 둔다. `/api/products` 핸들러가 `category`·`sort`·`page` 쿼리를 읽어서 응답을 가른다. 호출 순서로 응답하지 않는다 — 잘못된 쿼리로 요청해도 순서만 맞아 통과하는 일을 막기 위해서다(1단계 문서 「모킹 경계」).
- **실패·지연·빈 결과** — 기본 핸들러에 넣지 않고 각 테스트 안에서 `server.use()`로 덮는다.
- **fixture** — 정렬로 순서가 갈리고 카테고리로 목록이 갈리는 최소 상품 세트.
- **격리** — `afterEach`에서 `server.resetHandlers()`, QueryClient 정리, `localStorage.clear()`, zustand store 초기화. store가 모듈 전역이고 `persist`를 쓰므로 반드시 필요하다.

**먼저 세울 스모크 1개**: `ProductListContent`를 렌더해 상품 하나가 보이는지. 이게 통과하면 인프라가 선 것이다.

---

## Phase 3 — 통합 테스트 본체

| 순서 | 항목                         | 메모                                                                                      |
| ---- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| 3-1  | 4번 로딩 → 성공              | MSW 성공 응답에 지연. 스켈레톤은 `aria-hidden`이라 찾지 않고 상품 부재 → 노출 전이만 본다 |
| 3-2  | 5번 빈 결과 ①0건 ②오버플로우 | 3-1과 같은 컴포넌트의 다른 분기라 이어서 한다                                             |
| 3-3  | 6번 에러 (`ApiError`)        | 해당 테스트에서 500 응답                                                                  |
| 3-4  | 7번 재시도로 복구            | 첫 응답 500, 재시도 성공. 에러 안내가 **사라지는 것**까지 단언한다                        |
| 3-5  | 8·9·10번 필터·정렬·페이지    | 8·9는 페이지가 1로 돌아가는지, 10은 반대로 필터가 유지되는지                              |
| 3-6  | 12번 담기 → 헤더 개수        | 네트워크 없음. 헤더 숫자와 버튼 `aria-pressed` 둘 다 단언                                 |
| 3-7  | 13번 디바운스 취소           | RTL + Vitest 가짜 타이머. `.test.tsx`로 쓴다(step0 환경 분리 규칙)                        |

같은 컴포넌트의 분기끼리 묶어서 진행한다. 순서를 섞으면 렌더 헬퍼를 여러 번 고치게 된다.

### 지켜야 할 규칙 (과제 2단계)

- 각 항목에 정상 케이스와 경계 케이스를 함께 넣는다
- 테스트 이름에 조건과 결과가 드러나게 쓴다 — `works`, `renders`, `should be true` 금지
- 요소는 사용자가 인식하는 방식(role·name)으로 찾는다. `getByTestId`를 썼다면 왜 다른 방법이 안 됐는지 남긴다
- 모든 검증을 `waitFor`로 감싸지 않는다. 첫 대기만 비동기로 하고 나머지는 동기로 확인한다
- 파일을 단독으로 돌리든 순서를 바꿔 돌리든 같은 결과가 나와야 한다

---

## Phase 4 — E2E 정리

통합 테스트가 다 선 뒤에 손댄다. 순서를 뒤집으면 아직 옮기지 않은 것까지 지우게 된다.

1. 11·13·14·15번을 브라우저 경계만 남기고 정리한다. locator를 role·name 기반으로 바꾼다.
2. 15번 시나리오 끝에 `page.reload()`와 헤더 개수 단언 한 줄을 붙인다(`persist` 복원 확인).
3. **그다음** 기존 E2E에서 아래를 정리한다.
   - "검색·카테고리·정렬 변경은 URL과 목록을 갱신하고 page를 1로 되돌린다" → URL 반영만 남기고 목록·페이지 번호는 RTL(8·9번)로 옮긴다
   - "마지막 페이지를 초과하면…"과 "검색 결과가 0건이면 페이지네이션을 표시하지 않는다" → 5번이 RTL에서 두 갈래를 모두 덮으므로 제거한다

E2E는 production build 위에서 돌리고, `sleep` 없이 조건 기반 대기만 쓴다.

---

## Phase 5 — 마감

- `pnpm check` 통과
- 각 테스트 파일을 단독으로 돌려도 통과
- 1단계 문서의 방법론 표와 실제 파일 배치가 어긋나지 않는지 대조
- 「모킹 경계」 표에 적은 MSW 규칙과 실제 핸들러가 일치하는지 확인

---

## 결정이 필요했던 것 (전부 결정 완료)

단언 내용과 모킹 경계는 작성자가 정한다(과제 43행). 아래 세 가지가 구현 중에 정해졌다.

- **①** `vi.mock('next/navigation')`으로 `usePathname`을 막았다(`Header.test.tsx`). 링크 강조는 12번의 관심사가 아니라 가장 싼 방법을 골랐다.
- **②** "요청이 시작된 뒤에도 상품이 없다"로 관측한다. 렌더 직후를 보면 구현과 무관하게 항상 참이라 아무것도 보장하지 못해, MSW 핸들러에서 요청 시작 플래그를 세우고 그 뒤에 부재를 단언한다.
- **③** 경계 케이스 — 4번은 위의 요청 시작 시점, 7번은 두 번 실패 후 성공, 12번은 담았다가 다시 빼는 왕복이다.

**① Header의 `usePathname()` 처리** — 12번에서 Header를 렌더하는데 `usePathname`은 App Router 컨텍스트를 요구해서 jsdom에서 그냥 렌더하면 깨진다. 선택지는 세 가지다.

| 방법                                   | 비용                                         |
| -------------------------------------- | -------------------------------------------- |
| `next/navigation`을 `vi.mock`으로 막기 | 가장 쌈. 링크 강조는 12번의 관심사가 아님    |
| `AppRouterContext.Provider`로 감싸기   | 실제에 가깝지만 내부 API에 의존              |
| Header에서 링크 강조를 분리            | 앱 코드 변경. 테스트를 위해 구조를 바꾸는 것 |

**② 4번의 "로딩 중"을 무엇으로 관측할 것인가** — 1단계에서 `aria-busy`를 추가하지 않기로 했으므로 "지연 응답 전에는 상품이 없다"가 단언이 된다. 이 단언이 아무것도 보장하지 않는 순간이 있는지 확인이 필요하다.

**③ 각 항목의 경계 케이스** — 5번(두 갈래), 8번(3페이지에서 카테고리 변경)은 정해져 있다. 4·7·12번은 아직 비어 있다.

---

## 남아 있는 위험

- **`create-collection-store.test.ts`의 `stubGlobal`** — 0단계에서 현행 유지로 결론냈다. 12번이 jsdom에서 실제 `localStorage`를 쓰게 되면서 두 파일의 방식이 달라지는데, 계층이 다르므로 문제는 아니다. 다만 12번의 격리는 별도로 확보해야 한다.
- **`keepPreviousData`** — 조건 전환 시 이전 목록이 유지된다. 8·9·10번에서 "바뀌었는지"를 볼 때 이전 목록이 남아 통과하는 착시가 생길 수 있다. 새 목록의 등장을 기다리는 단언이 필요하다.
- **CSS Modules** — vitest 기본값에서는 CSS import가 빈 객체로 처리된다. `styles.foo`가 `undefined`가 되지만 렌더는 깨지지 않는다. 클래스명으로 단언하지 않으면 상관없다.
- **런타임 실행 권한** — 이 계획의 Phase 0·3·4는 `pnpm test`, `pnpm build`, Playwright 실행이 필요하다. `CLAUDE.md`상 런타임 검증은 사용자가 명시적으로 요청했을 때만 수행하므로, 작업 재개 시 실행 허가를 먼저 확인한다.

---

_이 문서는 Claude가 작성했다. 과제 2단계 요구사항과 0·1단계 문서를 대조하고, 설치 현황·`tsconfig`의 jsx 설정·nuqs 서브패스·QueryClient 구성·`ProductListResults` 분기·`Header`의 `usePathname` 사용을 코드에서 확인해 Phase를 나눴다._

_「결정이 필요했던 것」 세 가지는 Claude가 지목만 했고 판단은 작성자가 내렸다(전부 결정 완료). 단언의 내용과 모킹 경계는 과제가 넘기지 말라고 한 결정이라 작성자가 직접 정했다._
