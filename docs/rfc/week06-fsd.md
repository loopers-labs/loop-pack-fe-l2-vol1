# RFC — 6주차 FSD 전환

- 작성일: 2026-07-28
- 브랜치: `feat/week-06`
- 상태: 구조 변경·자동 검증 완료 (1–8단계 · check · E2E 통과, 수동 M1–M9·layout shift·예상 밖 렌더링 오류 재현까지 전부 완료)

> 배치 결정과 자가 검증은 확정했다. **남은 이슈와 검증 상태는 아래 표만 단일 기준으로 관리한다.** 상세 실행 순서는 [rfc-review-checklist.md](../week-06/rfc-review-checklist.md)에서 확인한다.

---

## 남은 이슈와 최종 검증

상태가 바뀌면 이 표와 관련 본문 결과만 갱신한다. 해결 과정에서 내린 구조적 판단은 [decisions.md](../week-06/decisions.md)에 남긴다.

| ID  | 상태 | 항목                     | 결과·남은 작업                                                                   |
| --- | ---- | ------------------------ | -------------------------------------------------------------------------------- |
| R1  | 해결 | 홈 API 응답 타입 소유권  | `HomeApiResponse`를 mock API가 소유, 역방향 참조 제거                            |
| R2  | 해결 | 홈 오류 재시도           | query reset 후 route reset, Chromium·WebKit 복구 확인                            |
| R3  | 해결 | 상품 목록 오류 경계      | `ApiError`는 인라인, 계약 밖 예외는 경계로 전파                                  |
| R4  | 해결 | Zustand 단위 테스트      | action·selector·persist Vitest 5/5                                               |
| V1  | 해결 | 최종 자동 검증           | `pnpm check` 통과, 예상 라우트 5개 확인                                          |
| V2  | 해결 | 핵심 E2E                 | Chromium·WebKit 36/36 통과                                                       |
| V3  | 해결 | 수동 M1–M9·layout shift  | 2026-07-31 전부 통과                                                             |
| V4  | 해결 | 예상 밖 렌더링 오류 재현 | 2026-07-31 `HomeContent`에 임시 throw 삽입해 재현·복구 확인, 임시 코드 제거 완료 |

처리 현황: R1–R4와 V1–V4 전부 완료했다. 남은 미해결 항목 없음.

---

## 0. 동작 기준선

### 검증 전략

검증 목적을 충족하는 가장 저렴한 계층부터 사용한다.

- `pnpm lint`와 `pnpm typecheck`로 import 방향과 타입 계약을 단계마다 확인한다.
- Vitest 단위 테스트로 Route Handler 입력 검증·정렬·fixture 계약처럼 브라우저가 필요 없는 로직을 확인한다.
- Playwright E2E는 URL 탐색, hydration, persist 복구처럼 실제 브라우저 경계가 필요한 핵심 흐름에 한정한다.
- 스켈레톤 전환의 layout shift와 홈의 로딩·에러·빈 상태처럼 자동화하지 않은 시각적 동작은 수동으로 확인한다.
- 판정은 "비슷해 보인다"가 아니라 **관찰값 문자열 일치**로 한다.

| 시점                  | 실행                                                            | 산출물               |
| --------------------- | --------------------------------------------------------------- | -------------------- |
| 구조 변경 전 (기준선) | `pnpm check`, `pnpm test:e2e`, 수동 M1~M9                       | 아래 표의 Before 열  |
| 구조 변경 중 (단계별) | `pnpm lint`, `pnpm typecheck`, 영향받는 Vitest                  | 마이그레이션 단계 표 |
| 구조 변경 후 (최종)   | `pnpm check`, 핵심 Playwright E2E, 수동 M1~M9·layout shift 확인 | 아래 표의 After 열   |

### 자동 검증 결과

최초 측정: 2026-07-28, `feat/week-06` (구조 변경 전)

최근 재확인: 2026-07-31, 현재 작업 트리. `pnpm check`와 Chromium·WebKit E2E 36/36 통과. 수동 검증 M1–M9와 layout shift 확인까지 전부 완료했다.

| 명령               | 구조 변경 전 | 구조 변경 후  | 판정                                                            |
| ------------------ | ------------ | ------------- | --------------------------------------------------------------- |
| `pnpm check`       | 통과         | ✅ 통과       | 동일                                                            |
| ├ `pnpm test`      | 36/36 통과   | ✅ 47/47 통과 | 단위 검증 11개 추가                                             |
| ├ `pnpm lint`      | 통과         | ✅ 통과       | 동일                                                            |
| ├ `pnpm typecheck` | 통과         | ✅ 통과       | 동일                                                            |
| └ `pnpm build`     | 라우트 6개   | ✅ 라우트 5개 | `hydration-demo` 삭제만큼 감소, 나머지 구성·동적/정적 구분 동일 |
| `pnpm test:e2e`    | 40/40 통과   | ✅ 36/36 통과 | persist 내부 검증 2개를 Vitest로 이동해 브라우저별 4개 감소     |

> `pnpm test`는 8단계에서 한 번 **0개**가 잡히는 상태를 지나왔다. app 디렉터리를 root로 옮기면서 Route Handler 테스트가 `app/` 아래로 갔는데 `vitest.config.ts`의 `include`가 `src/**`에 머물러 있었다. 0개 실행은 실패로 잡히지 않아 기준선 비교로도 드러나지 않았다. `include`를 고쳐 36/36으로 복구했다. **통과 개수만이 아니라 수집된 파일 수도 함께 확인해야 한다.**

#### 기존 E2E 플레이키

WebKit의 `debounce 대기 중 페이지를 떠나면…`은 격리 반복에서 간헐적으로 실패했지만, 최종 병렬 스위트는 4회 모두 36/36 통과했다. 구조 변경과 무관한 타이밍 경합으로 판단해 이번 범위에서는 수정하지 않고 후속 조사 대상으로 남긴다.

### 수동 검증 결과

기대 동작과 관찰값(화면 문구·`총 N개`·URL 쿼리스트링·헤더 숫자)이 문자열까지 일치하면 체크한다. 어긋나면 체크하지 않고 실제 관찰값을 판정 열에 적는다.

| #   | 시나리오                 | 조작                                                                   | 기대 동작                                                                | 구조 변경 전 | 구조 변경 후 | 판정                                                                                                                |
| --- | ------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------ | ------------ | ------------------------------------------------------------------------------------------------------------------- |
| M1  | 홈 로딩                  | Network Slow 3G + `/` 하드 리로드                                      | `홈을 불러오는 중…` 노출 후 본문 교체                                    | `[x]`        | `[x]`        | 2026-07-31 통과                                                                                                     |
| M2  | 홈 에러와 재시도 복구    | Route Handler를 임시 플래그로 강제 실패시킨 뒤 `다시 시도` 클릭        | `문제가 발생했어요` + `다시 시도` → 클릭 후 새 요청 발생, 정상 화면 복구 | `[x]`        | `[x]`        | Chromium·WebKit 통과(Chromium 3/3 반복)                                                                             |
| M3  | 홈 빈 상태               | 같은 자리에 `?scenario=empty` 임시 추가                                | 배너·카테고리 유지, 인기/신상품 섹션 미노출                              | `[x]`        | `[x]`        | 2026-07-31 통과                                                                                                     |
| M4  | 홈 정상                  | `/`                                                                    | 배너 `매일 새롭게 발견하는 취향`, 카테고리 5개, 인기·신상품 6개씩        | `[x]`        | `[x]`        | 2026-07-31 통과                                                                                                     |
| M5  | 목록 로딩·정상           | `/products` 첫 진입                                                    | 스켈레톤 → `총 30개`, `1 / 3`; 완료 전후 layout shift 없음               | `[x]`        | `[x]`        | 2026-07-31 통과, layout shift 없음 확인                                                                             |
| M6  | 조건 전환 중 목록 유지   | 목록에서 카테고리 변경                                                 | 이전 목록 유지한 채 흐려짐(`aria-busy`) → 새 결과 교체                   | `[x]`        | `[x]`        | 2026-07-31 통과                                                                                                     |
| M7  | URL 공유                 | `/products?q=스탠리&category=home&sort=price-desc` 를 새 탭에 붙여넣기 | `총 4개` + 검색·카테고리·정렬 값 복원                                    | `[x]`        | `[x]`        | 2026-07-31 통과                                                                                                     |
| M8  | 페이지 이동 중 상태 유지 | 홈에서 찜·담기 → 목록 이동 → 홈 복귀                                   | 헤더 숫자 유지, 같은 상품 `aria-pressed=true`                            | `[x]`        | `[x]`        | 2026-07-31 통과                                                                                                     |
| M9  | 잘못된 페이지 보정       | `/products?page=0` 직접 진입                                           | 첫 페이지 데이터와 `1 / 3` 노출, 에러 UI 미노출                          | `[ ]`        | `[x]`        | 2026-07-31 통과. URL은 `?page=0`으로 유지되며 미정정 — 별도 개선 과제, [decisions.md](../week-06/decisions.md) 12번 |

> M2·M3은 홈 데이터가 서버에서 prefetch되어 브라우저 DevTools로 재현할 수 없다. `scenario`를 코드에 임시로 넣어 확인한 뒤 반드시 원복하고, 그 변경은 커밋하지 않는다.

### 테스트 계층별 커버 범위

같은 내부 동작을 여러 계층에서 중복 검증하지 않도록 책임을 나눈다.

| 0단계 요구 항목                 | 커버 방식        | 근거                                                                                  |
| ------------------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| API 입력 검증·정렬·fixture 계약 | Vitest           | Route Handler와 fixture는 브라우저 없이 빠르게 검증 가능                              |
| 검색·카테고리·정렬·페이지네이션 | E2E              | URL과 화면 결과가 함께 변하는 브라우저 흐름만 검증                                    |
| URL 공유·새로고침·뒤로/앞으로   | E2E + 수동 M7    | History API와 직접 진입은 실제 브라우저 경계                                          |
| 장바구니·위시리스트 상태 전이   | Vitest           | Zustand action·selector·persist 손상값과 migration을 브라우저 없이 검증               |
| 화면 간 상태 동기화·헤더 개수   | E2E + 수동 M8    | 홈과 목록을 가로지르는 사용자 흐름만 E2E에 남김                                       |
| 상품 목록의 에러·빈 상태        | E2E              | 네트워크 실패·재시도와 사용자에게 보이는 복구 경로를 검증                             |
| 상품 목록의 로딩·layout shift   | E2E + 수동 M5·M6 | 이전 목록 유지 여부는 E2E, 스켈레톤과 실제 콘텐츠의 위치 변화는 수동 확인             |
| 홈의 정상 렌더                  | E2E(부분) + M4   | hydration 후 중복 요청 여부와 주요 화면 결과를 확인                                   |
| 홈의 로딩·에러·빈 상태          | 수동 M1~M3       | 현재 자동 시나리오가 없어 수동으로 남기며, 반복 비용이 커지면 통합 테스트 도입을 검토 |

### 리팩토링 중 발견한 기존 버그

구조 변경 커밋과 분리해서 기록한다. 없으면 "해당 없음".

| 재현 방법                                                                             | 원인                                                                                                               | 수정 위치                                                                                              | 검증 결과                                              |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| M2 상태(`?scenario=error`)에서 홈 에러 화면의 `다시 시도` 클릭 → 화면이 그대로 유지됨 | `reset()`이 react-query의 `errorResetBoundary`를 초기화하지 않아 `retryOnMount: false` → 재요청이 안 일어남        | `_app/ui/RootErrorFallback.tsx`                                                                        | 두 reset 연결 완료, Chromium·WebKit 런타임 재검증 통과 |
| `/products?page=0`으로 직접 진입하면 상품 API가 400을 반환하고 목록 오류 UI가 노출됨  | 정수 parser가 `0`과 음수도 유효한 정수로 통과시켜 API의 `page >= 1` 검증까지 잘못된 값이 전달됨                    | `entities/product/api/query-schema.ts`, `e2e/week-05-state.spec.ts`                                    | 첫 페이지 보정 E2E 통과, 수동 M9 대기                  |
| `/products` 최초 로딩 완료 시 필터와 카드 높이가 추가되면서 결과 영역이 아래로 이동함 | 로딩 중 필터를 렌더링하지 않았고 카드 skeleton도 실제 카드의 제목·가격·행위 영역 높이를 확보하지 않음              | `_pages/product-list/ui/ProductFiltersSkeleton.tsx`, `widgets/product-card/ui/ProductGridSkeleton.tsx` | 2026-07-31 수동 확인, layout shift 없음                |
| 검색어 입력 중 URL 상태가 외부에서 바뀌면 effect가 input DOM 값을 직접 덮어쓸 수 있음 | uncontrolled input의 DOM 값과 URL 상태를 ref·effect로 수동 동기화해 사용자의 입력 초안과 외부 상태를 구분하지 않음 | `_pages/product-list/ui/ProductFilters.tsx`                                                            | controlled input 및 URL 동기화로 변경                  |

홈 재시도는 App Router `reset()`만으로 TanStack Query의 오류 상태가 초기화되지 않는 문제였다. `useQueryErrorResetBoundary` reset을 먼저 호출하도록 수정했고 Chromium·WebKit에서 새 요청과 정상 복구를 확인했다. 상세 분석과 판단 과정은 [decisions.md](../week-06/decisions.md) 11번에 남겼다.

---

## R — Requirements

### 기능 요구사항 (5주차까지)

현재 코드에서 실제로 동작하는 것만 적는다. 위치는 **구조 변경 전(5주차) 기준**이다. 구조 변경 후의 자리는 아래 `파일 매핑표`와 `After 폴더 트리`에서 본다.

| 영역          | 요구사항                                                                   | 5주차 구현 위치                                                     |
| ------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 홈            | 배너·카테고리·인기 상품·신상품(각 6개) 렌더                                | `app/(home)/_components/HomeContent.tsx`                            |
| 홈            | 서버 prefetch 결과를 hydrate해 브라우저 재요청 없이 렌더                   | `app/(home)/page.tsx`, `service/queryClient.ts`                     |
| 상품 목록     | 검색(300ms debounce)·카테고리·정렬(4종)·페이지네이션(12개 단위)            | `app/products/_components/*`, `service/products/*`                  |
| 상품 목록     | 조건 변경 시 `page`를 1로 되돌림                                           | `useProductFilters.ts`                                              |
| 상품 목록     | 조건 전환 중 이전 목록 유지(`keepPreviousData`)                            | `service/products/queries.ts`                                       |
| 상품 목록     | 마지막 페이지 초과 시 빈 상태 + 앞 페이지 복귀 수단 유지                   | `ProductListResults.tsx`                                            |
| URL 상태      | 검색·카테고리·정렬·페이지를 URL에 반영, 공유·새로고침·뒤로/앞으로에서 복원 | `service/products/searchParams.ts` (nuqs)                           |
| 장바구니·위시 | 상품별 담기/빼기 토글, 헤더 개수 표시, localStorage 영속·손상값 복구       | `store/*`, `components/ui/header/Header.tsx`                        |
| 공통          | 홈은 라우트 경계(`loading.tsx`/`error.tsx`), 목록은 인라인 로딩·에러 UI    | `app/(home)/loading.tsx`, `app/error.tsx`, `ProductListResults.tsx` |
| Mock API      | `/api/home`·`/api/products` Route Handler, 입력 검증과 `scenario` 제어값   | `app/api/**`                                                        |

### 비기능 요구사항

- 상위→하위 단방향 의존만 허용하고, 위반을 리뷰 없이도 판별할 수 있어야 한다.
- 하나의 기능을 지우거나 고칠 때 손댈 파일을 **grep 없이** 예측할 수 있어야 한다(5단계 삭제 시나리오의 판정 기준).
- 서버·URL·클라이언트·로컬 상태의 Source of Truth가 폴더 이동으로 바뀌지 않아야 한다.
- Client 경계는 지금처럼 최대한 리프에 둔다(`WishlistButton`, `AddCartButton`, `Header`, `ProductListContent`).
- TypeScript strict, `any`·non-null assertion·배럴 파일 금지 등 기존 컨벤션을 유지한다.
- 정적 검사와 Vitest는 구조 변경 전후로 같은 결과를 내야 한다. E2E는 브라우저 경계의 핵심 흐름만 보존한다.

### 이번에 반드시 보존할 동작

0단계 기준선의 자동·수동 검증 항목을 보존하되, 별도 버그 수정으로 합의한 항목은 변경된 기대 동작을 기준으로 삼는다. 폴더 이동으로 깨지기 쉬운 동작은 다음과 같다.

- 홈의 서버 prefetch → hydrate 경로. 서버·클라이언트가 **같은 `queryOptions`를 공유**해야 성립하므로, 옮기면서 둘로 갈라지면 즉시 깨진다.
- `getApiBaseUrl`의 서버/클라이언트 분기. 서버 실행 코드와 클라이언트 훅이 다른 레이어로 갈릴 때 잘못 섞이면 SSR이 깨진다.
- nuqs parser의 단일 정의(`productListQueryParsers`). 화면은 같은 parser에 히스토리 옵션만 얹고, API 요청도 같은 스키마로 직렬화해야 한다.
- `pageSize=12` 고정 계약. 호출 타입에서는 `pageSize`를 제외하고 API 직렬화 직전에만 추가해 화면이 임의 값을 넘기지 못하게 한다.
- zustand persist store의 **저장 키**(`cart`·`wishlist`). 파일을 옮겨도 키가 바뀌면 사용자의 기존 localStorage 값이 유실된다.
- Client 경계 위치. 상위 컴포넌트에 `'use client'`가 올라가면 트리 전체가 Client가 되어 SSR 동작이 달라진다.

### 이번 주에 하지 않을 것과 그 이유

| 하지 않을 것                                             | 이유                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 기능 추가·UI 변경                                        | 이번 주는 리팩토링이다. 기능이 섞이면 "동작 보존"을 검증할 기준선이 무의미해진다.                                                                                                                                                                                                                                                                                                                                                                                            |
| 상품 목록의 서버 prefetch 적용                           | URL 조건마다 결과가 달라 이득을 따져야 하는 별개 주제다(5주차에도 보류).                                                                                                                                                                                                                                                                                                                                                                                                     |
| ~~미사용 자산(`components/ui/select`·`dialog` 등) 삭제~~ | ~~삭제는 구조 이동과 다른 종류의 변경이다. 이번엔 **배치만** 정하고 삭제 여부는 근거와 함께 따로 남긴다.~~ → **2단계에서 삭제로 결정했다.** 이후 Select와 Dialog를 복원하고 Select를 범용 기반과 상품 옵션 UI로 나눴지만, `ProductFilters` 재사용 근거가 성립하지 않는다는 결론까지 도달했다. 피드백 반영에서 원래 기준을 다시 적용해 소비처와 구체적인 계획이 없는 상품 옵션 UI·Select 기반·Dialog를 최종 삭제했다. 상세 흐름은 [decisions.md](../week-06/decisions.md) 4번 |
| Advanced B(변경 반경 실험)                               | 요구사항을 추가하면 동작 보존 중심의 마이그레이션 범위를 벗어난다. 의존성 하네스(A)만 ESLint로 적용한다.                                                                                                                                                                                                                                                                                                                                                                     |
| E2E 플레이키 1건 수정                                    | 구조 변경과 무관한 타이밍 이슈다. 같은 커밋에 섞으면 회귀 판정이 흐려진다.                                                                                                                                                                                                                                                                                                                                                                                                   |
| 캐시 정책(staleTime) 변경                                | 폴더 위치와 무관하다. 옮기기만 하고 값은 그대로 둔다.                                                                                                                                                                                                                                                                                                                                                                                                                        |

---

## A — Architecture

### 현재 구조에서 실제로 겪는 문제

1. **한 기능의 코드가 세 폴더로 흩어진다.** 위시리스트 하나가 `store/wishlistStore.ts`(상태) + `store/createCollectionStore.ts`(구현) + `components/ui/productCard/ProductCardActions.tsx`(행위 UI) + `components/ui/header/Header.tsx`(개수 표시)에 걸쳐 있다. "위시리스트를 지운다"는 질문에 grep 없이 답할 수 없다.
2. **폴더 이름이 파일 종류만 말하고 역할을 말하지 않는다.** `components / hooks / utils / types / store`는 전부 "무엇인가"만 알려주고 "누구 것인가"는 알려주지 않는다. 새 파일을 만들 때마다 종류로 분류되어, 도메인이 같은 파일이 서로 멀어진다.
3. **공용 UI에 비즈니스 행위가 들어가 있다.** `components/ui/productCard/ProductCard.tsx`가 `ProductCardActions`를 직접 import하고, 그 안에서 `useCartStore`·`useWishlistStore`를 구독한다. 즉 "상품 표현"이 "장바구니·위시리스트 도메인"에 묶여 있어, 행위 없는 곳에서 카드만 재사용할 수 없다.
4. **`types/commerce.ts`가 여러 도메인의 타입 창고다.** `Product`·`Category`·`ProductSort`·`HomeResponse`·`ProductListResponse`·`MockApiScenario`가 한 파일에 있고, 서버 라우트(`app/api/**`)와 클라이언트(`service/**`)가 **같은 파일**을 함께 본다. 소유자가 불분명하고, 한 도메인 타입만 바꿔도 무관한 소비처가 함께 딸려온다.
5. **라우트에서 쓰이지 않는 자산이 공용 폴더에 섞여 있다.** `components/ui/select/*` 3종, `components/ui/dialog`, `hooks/useSelect`, `types/product-options.ts`, `utils/formatPrice.ts`, `utils/isSoldOut.ts`는 현재 어느 라우트에서도 import되지 않는다(select 3종끼리만 서로 참조). 공용 폴더에 있다는 이유로 "공용"처럼 보이지만 실제 소비처는 0이다.
6. **기존 유틸이 있는데 재사용되지 않는다.** `utils/formatPrice.ts`가 있는데도 `ProductCard.tsx:31`은 `product.price.toLocaleString('ko-KR')`를 인라인으로 쓴다. 종류별 폴더에 있으면 "이미 있는지" 확인하는 비용이 커진다는 증상.

> 3·6번은 이동만으로 해결되지 않아 구조 변경과 함께 책임을 분리했다. `ProductCardActions`를 제거하고 두 feature 버튼을 widget에서 조합했으며, 가격 표시는 기존 `formatPrice`를 사용하도록 바꿨다.

### Before 폴더 트리

구조 변경 전 책임 단위만 표시한다(`.module.css`·정적 자산 생략).

```
src/
├── app/
│   ├── (home)/{page,loading,_components/HomeContent}.tsx
│   ├── products/{page,_components/*}.tsx
│   ├── api/{home,products}/route.ts
│   ├── hydration-demo/page.tsx
│   ├── error.tsx
│   └── providers.tsx
├── components/ui/
│   ├── {banner,categorySection,header,pageContainer,pagination}/
│   ├── productCard/{ProductCard,ProductCardActions}.tsx
│   ├── productGrid/
│   └── {dialog,select}/                  # 라우트 사용처 없음
├── service/{home,products}/
├── store/{cartStore,wishlistStore,createCollectionStore}.ts
├── hooks/{useDebouncedCallback,useSelect}.ts
├── types/{commerce,product-options}.ts
├── utils/{formatPrice,getApiBaseUrl,isSoldOut}.ts
└── examples/week-05-layout/
```

### After 폴더 트리

최종 상태는 레이어·슬라이스·세그먼트 중심으로 표시한다.

```
src/
├── _app/
│   ├── providers/Providers.tsx
│   ├── styles/globals.css
│   └── ui/RootErrorFallback.tsx
├── _pages/
│   ├── home/{api,ui}/
│   └── product-list/{model,ui}/
├── widgets/
│   ├── header/
│   └── product-card/{model,ui}/
├── features/
│   ├── add-to-cart/ui/
│   └── add-to-wishlist/ui/
├── entities/
│   ├── product/{api,model}/
│   ├── cart/model/
│   └── wishlist/model/
└── shared/
    ├── api/
    ├── lib/
    ├── styles/
    └── ui/{PageContainer,Pagination}/

app/
├── (home)/{page,loading}.tsx
├── products/page.tsx
├── api/{_data,_types.ts,home,products}/
├── error.tsx
└── layout.tsx
```

### 사용할 레이어와 선택 근거

| 레이어     | 사용 여부 | 근거                                                                                                    |
| ---------- | --------- | ------------------------------------------------------------------------------------------------------- |
| `_app`     | ✅        | 앱 전체 배선 (providers, globals.css, root error fallback)                                              |
| `_pages`   | ✅        | 홈·상품목록 페이지와 전용 UI·로직 (SearchParams, useProductFilters, HeroBanner)                         |
| `widgets`  | ✅        | Header, product-card (add-to-cart·add-to-wishlist feature 조합)                                         |
| `features` | ✅        | add-to-cart, add-to-wishlist (사용자의 상품 담기 행위)                                                  |
| `entities` | ✅        | product, cart, wishlist (도메인 타입·상태)                                                              |
| `shared`   | ✅        | 도메인 비종속 API 기반·라이브러리·UI (query client, URL 기반, debounce·가격 포맷·페이지네이션, 공용 UI) |

### 허용 / 금지 import 예시

```ts
// ✅ 허용 (상위→하위 단방향)

// _pages → _app (금지)
// import { Providers } from '@/_app/providers' ✗

// widgets → features·entities·shared (O)
import { useCartStore } from '@/entities/cart'
import { AddCartButton } from '@/features/add-to-cart'
import { Pagination } from '@/shared/ui/Pagination/Pagination'

// features → entities·shared (O)
import { useCartStore } from '@/entities/cart'

// _pages → entities (O) — 화면이 도메인의 조회 계약과 parser를 가져다 쓴다
import { productListQueryParsers, useProductListQuery } from '@/entities/product'

// shared → entities·features·widgets·_pages (금지)
// import { ProductCard } from '@/widgets/product-card' ✗ (상향 의존)
// 8단계 이후 상향 의존 예외는 0건이다. eslint-disable 없이 통과한다.

// 같은 레이어 내: 직접 import 금지, 상위 Public API 사용
// features/add-to-cart에서 features/add-to-wishlist를 직접 import ✗
// 대신 상위 widgets/product-card에서 조합
```

### 파일 매핑표

최종 구조를 기준으로 이동·삭제 결과를 기록한다.

| 현재 위치                                               | 목표 위치                                       | 레이어 / 슬라이스 / 세그먼트   | 이유                                                                   |
| ------------------------------------------------------- | ----------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| `app/{providers,globals,error,page.module}`             | `_app/{providers,styles,ui}`                    | `_app` / —                     | 전역 배선·fallback                                                     |
| `app/(home)/**`의 화면 구현                             | `_pages/home/{api,ui}`                          | `_pages` / `home`              | 홈 화면 조립·조회 계약                                                 |
| `app/products/**`의 화면 구현                           | `_pages/product-list/{model,ui}`                | `_pages` / `product-list`      | 목록 화면·URL adapter                                                  |
| `app/hydration-demo/page.tsx`                           | 삭제                                            | —                              | 역할을 마친 실험 라우트                                                |
| `service/queryClient.ts`, `utils/getApiBaseUrl.ts`      | `shared/api/*`                                  | `shared` / — / `api`           | 도메인 비종속 API 배선                                                 |
| `hooks/useDebouncedCallback.ts`, `utils/formatPrice.ts` | `shared/lib/*`                                  | `shared` / — / `lib`           | 범용 타이밍·표시 변환                                                  |
| `store/createCollectionStore.ts`                        | `shared/lib/create-collection-store.ts`         | `shared` / — / `lib`           | 두 entity가 공유하는 범용 팩토리                                       |
| `pageContainer`, `pagination`                           | `shared/ui/{PageContainer,Pagination}`          | `shared` / — / `ui`            | 도메인 없는 공용 UI                                                    |
| `useSelect`, `SelectToggleIcon`                         | 삭제                                            | —                              | 분리 후에도 외부 소비처와 구체적인 사용 계획이 없어 최종 정리          |
| 상품 옵션 select 3종·옵션 타입·품절 판단                | 삭제                                            | —                              | 상품 상세 등 실제 옵션 선택 조합 위치가 생길 때 필요한 계약만 재검토   |
| `dialog`                                                | 삭제                                            | —                              | controlled/uncontrolled 구현과 별개로 현재 소비처와 재사용 계획이 없음 |
| `types/commerce.ts`의 상품·카테고리 타입                | `entities/product/model/*`                      | `entities` / `product` / model | 상품 도메인 계약                                                       |
| `HomeResponse`                                          | `_pages/home/api/model.ts`                      | `_pages` / `home` / `api`      | 홈 화면 전용 조립 응답                                                 |
| 상품 목록 응답·쿼리 타입                                | `entities/product/api/model.ts`                 | `entities` / `product` / `api` | 상품 목록 엔드포인트 계약                                              |
| mock API 타입                                           | `app/api/_types.ts`                             | 전환 범위 밖                   | mock 백엔드 내부 계약                                                  |
| `ProductCard`·`ProductGrid`·skeleton                    | `widgets/product-card/{model,ui}`               | `widgets` / `product-card`     | 두 상품 행위 feature를 조합                                            |
| `ProductCardActions.tsx`                                | 삭제 후 `add-to-cart`, `add-to-wishlist`로 분리 | `features` / 각 행위 / `ui`    | 독립된 사용자 행위                                                     |
| `cartStore.ts`, `wishlistStore.ts`                      | `entities/{cart,wishlist}/model`                | `entities` / 각 슬라이스       | 도메인 상태                                                            |
| `components/ui/header/*`                                | `widgets/header/*`                              | `widgets` / `header`           | cart·wishlist를 조합하는 내비게이션                                    |
| `categorySection`, `banner`                             | `_pages/home/ui`                                | `_pages` / `home` / `ui`       | 홈에서만 사용하는 UI                                                   |

### 애매한 파일 결정표 (5개 이상)

과제가 지정한 4개와 이 프로젝트에서 실제로 판단이 갈린 파일을 함께 기록한다.

| 대상                      | 후보 A                      | 후보 B                       | 최종 결정                                 | 기준                         |
| ------------------------- | --------------------------- | ---------------------------- | ----------------------------------------- | ---------------------------- |
| `ProductCard`             | `entities/product/ui`       | `widgets/product-card`       | **B** — 두 feature 조합                   | 독립 UI 블록의 조합 책임     |
| 상품 목록 queryOptions    | `entities/product/api`      | 페이지 `api`                 | **A**                                     | 상품 도메인을 아는 read API  |
| 홈 queryOptions·응답      | `entities`                  | `_pages/home/api`            | **B**                                     | 화면 전용 조립 응답          |
| 장바구니 store            | `entities/cart/model`       | feature `model`              | **A**                                     | 상태와 행위의 경계           |
| `Product` 타입            | `entities/product/model`    | `shared/types`               | **A**                                     | 도메인 타입의 소유자         |
| `createCollectionStore`   | `shared/lib`                | 한 entity가 소유             | **A**                                     | 두 entity가 공유하는 범용성  |
| 상품 검색 파라미터        | `_pages/product-list/model` | `shared/config`              | **분리** — 계약은 entity, URL 동작은 page | 한 파일에 있던 두 책임       |
| 페이지네이션·상품 필터 훅 | `features`                  | `shared` 계산 + page adapter | **분리** — controlled 계산과 nuqs 연결    | 범용 계산과 화면 상태의 경계 |

상세한 후보 변경 과정은 [decisions.md](../week-06/decisions.md) 5·6·8·9번에 기록했다.

### 마이그레이션 단계와 검증

| 단계 | 대상                                        | 검증                                 | 결과                             |
| ---- | ------------------------------------------- | ------------------------------------ | -------------------------------- |
| 1    | `_app`, `_pages`, 얇은 라우팅 진입점        | lint·typecheck·의존 위반 주입        | 통과, 위반 2종 탐지              |
| 2    | 범용 API·lib·UI를 `shared`로 이동           | 정적 검사·잔여 경로 검색             | 통과, 옛 경로 참조 0건           |
| 3    | product·cart·wishlist entity 분리           | 정적 검사·persist 키 확인            | 통과, 저장 키 유지               |
| 4    | ProductCard를 feature에 중간 배치           | `entities → features` 확인           | 통과, 7단계에서 책임 재검토      |
| 5    | header widget·홈 전용 UI 이동               | 정적 검사·Public API 우회 검색       | 통과                             |
| 6    | 조회 계층·URL 상태·라우터 이동              | 정적 검사·상향 의존 확인             | 통과, 페이지네이션 adapter 분리  |
| 7    | ProductCard widget과 두 action feature 분리 | 정적 검사·옛 결합 코드 검색          | 통과, toggle·persist 동작 유지   |
| 8    | 조회 계약 소유권·공용 레이아웃 최종 정리    | test·lint·typecheck·질의 문자열 대조 | 통과, disable 0건·순환 의존 제거 |

최종 검증은 `pnpm check`와 Playwright 36/36으로 완료했으며 수동 M1–M9는 별도 표에서 관리한다.

---

## D — Data Model

### 상태 분류표

Source of Truth와 소비처는 5주차 결정을 유지한다(폴더 이동으로 바뀌지 않는다). 소유 슬라이스만 이번에 정한다.

| 상태                | Source of Truth     | 소유 슬라이스/레이어                                                                                    | 소비하는 곳        | 이동 후에도 중복 저장하지 않는 방법                                                                                                       |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 홈 조회 결과        | 서버/TanStack Query | `_pages/home/api`                                                                                       | 홈                 | 응답을 store에 옮겨 담지 않는다. 서버 prefetch와 클라이언트가 **같은 `homeQueries.detail()`** 을 import해 캐시를 공유한다.                |
| 상품 목록 조회 결과 | 서버/TanStack Query | `entities/product/api`                                                                                  | 상품 목록          | 위와 같다. 화면은 `productQueries`만 보고 fetch 구현은 슬라이스 안에 숨는다.                                                              |
| 검색·정렬·페이지    | URL/nuqs            | parser는 `entities/product/api/query-schema`, 히스토리 동작은 `_pages/product-list/model/search-params` | 상품 목록          | 확정값은 URL에만 둔다. 검색 중 `draft`만 로컬 state로 관리하고, 뒤로·앞으로 가기로 URL이 바뀌면 controlled input을 동기화한다.            |
| 장바구니·위시리스트 | Zustand             | `entities/cart/model`, `entities/wishlist/model`                                                        | 헤더, 상품 행위 UI | store hook은 Public API로 공개하되 소비처가 selector로 필요한 값·action만 구독한다. 개수는 `ids.length`로 파생하고 persist 키를 유지한다. |

> 서버 응답을 Zustand에 복사하지 않는다. URL의 확정 검색값과 입력 중 draft는 수명이 다르므로 분리하되, 같은 확정값을 두 저장소에 중복 보관하지 않는다.

---

## I — Interface

### 슬라이스별 공개 / 비공개

| 슬라이스                   | 공개하는 값                                                                                                 | 숨기는 구현 세부                                                                                                     | 이유                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `_app/providers`           | 라우팅 진입점이 직접 참조하는 Providers 컴포넌트                                                            | QueryClient 생성 로직                                                                                                | `_app`은 슬라이스가 없어 별도 index를 만들지 않는다                |
| `_pages/home`              | HomePage, HomeLoading 컴포넌트                                                                              | 홈 화면 내부 구성                                                                                                    | 라우팅 파일에 필요한 진입점만 공개                                 |
| `_pages/home/api`          | (슬라이스 내부에서만 사용)                                                                                  | getHome, homeQueries, useSuspenseHomeQuery, GetHomeResponse                                                          | 홈 화면 전용 조회 계약이라 밖에 열 대상이 없다                     |
| `_pages/product-list`      | ProductListPage 컴포넌트                                                                                    | useProductFilters, useProductPagination, SORT_OPTIONS, 히스토리 옵션                                                 | 페이지별 진입점, URL adapter는 내부에서 관리                       |
| `widgets/header`           | Header 컴포넌트                                                                                             | store 구독 로직                                                                                                      | 헤더는 독립 widget                                                 |
| `widgets/product-card`     | ProductCard, ProductGrid, ProductGridSkeleton, ProductCardItem                                              | 카드 내부 배치·스타일                                                                                                | 상품 표현과 두 feature를 조합하는 독립 widget                      |
| `features/add-to-wishlist` | WishlistButton                                                                                              | wishlist store 구독·임시 toggle 구현                                                                                 | 위시리스트 추가 행위를 공개                                        |
| `features/add-to-cart`     | AddCartButton                                                                                               | cart store 구독·임시 toggle 구현                                                                                     | 장바구니 추가 행위를 공개                                          |
| `entities/product`         | Product·ProductSort·Category 타입, 고정 pageSize, useProductListQuery, 응답 타입, 조회 parser와 정렬 허용값 | getProductList의 fetch 구현, productQueries·productQueryKeys, serializeProductListQuery, 카테고리 parser 내부 허용값 | 도메인 타입과 목록 조회 계약 중 외부 소비처가 있는 심볼만 공개한다 |
| `entities/cart`            | useCartStore                                                                                                | createCollectionStore 설정 세부                                                                                      | store hook을 공개하고 소비처가 selector로 필요한 계약만 구독       |
| `entities/wishlist`        | useWishlistStore                                                                                            | createCollectionStore 설정 세부                                                                                      | store hook을 공개하고 소비처가 selector로 필요한 계약만 구독       |
| `shared`                   | api·lib·ui·styles의 필요한 모듈을 직접 경로로 import                                                        | 각 모듈의 구현 세부                                                                                                  | 슬라이스가 없어 Public API index를 만들지 않는다                   |

### `ProductCard` + 장바구니·위시리스트 조합 방법

- 조합 위치: `widgets/product-card/ui/ProductCard.tsx`
- 방식: `ProductCard`가 `WishlistButton`과 `AddCartButton`을 각 feature의 Public API에서 가져와 조합한다.
- 각 feature는 자기 entity store만 구독한다. feature끼리는 직접 참조하지 않으며, 두 행위의 협력은 상위 `widgets` 레이어에서 완결한다.
- 현재 store의 `toggle`은 구조 변경 전 동작을 보존하기 위한 임시 구현이다. 향후 장바구니·위시리스트 페이지가 생기면 추가 API와 삭제·수정 API를 분리하고, 삭제·수정 행위는 각 페이지에서 조합한다.

### Public API 결정

- barrel file과의 차이에 대한 이해: barrel file(`index.ts`)은 공용 폴더의 편의성 re-export(모든 것을 한 줄로 import). Public API는 **슬라이스 외부에 의도적으로 공개하는 계약**(필요한 것만 명시적으로). 전자는 배럴 파일 지양 규칙에 위배, 후자는 명확한 경계다.
- 선택: **슬라이스별 명시적 index.ts** (1단계 결정대로 슬라이스 루트 한 겹만 배럴)
- 의도와 근거:
  - 편의성과 명확성 균형 — 필요할 때만 import (예: `import { ProductCard } from '@/widgets/product-card'`)
  - 각 슬라이스의 공개 면 명확화 — index.ts에 나열된 것이 공개 계약
  - server-only 모듈 분리 — 현재 서버 전용 면은 `shared/api/query-client.ts`의 `getServerQueryClient` 하나뿐이라 `index.server.ts`를 만들지 않았다. 서버에서만 부를 수 있는 모듈이 늘면 그때 슬라이스별로 나눈다

### Zustand store Public API 결정

- 선택: `entities/cart`와 `entities/wishlist`가 각각 `useCartStore`, `useWishlistStore`를 Public API로 공개한다.
- 소비 규칙: React 소비처는 `useStore((state) => state.value)` 형태의 selector로 필요한 상태나 action만 구독한다. selector 없는 전체 store 구독과 전체 state 구조 분해는 허용하지 않는다.
- action도 `useStore((state) => state.toggle)`처럼 선택하며, 상태 변경은 공개 action을 통한다. 소비처가 임의로 `setState()`를 호출하지 않는다.
- 목적별 wrapper hook은 동일한 selector가 반복되거나 도메인 계산·정책을 캡슐화해야 할 때만 도입한다. 단순히 store 내부 API가 기술적으로 노출된다는 이유만으로 `useCartIds`, `useToggleCart`를 추가하지 않는다.
- 근거: 현재 소비처는 widget과 각 feature로 제한되어 있고 모두 selector를 사용한다. 이 방식은 구독 범위를 좁히면서 불필요한 wrapper 계층을 만들지 않는다.

```ts
const cartCount = useCartStore((state) => state.ids.length)
const toggleCart = useCartStore((state) => state.toggle)
```

---

## O — Optimization

**TanStack Query 캐시 정책** — 현재 값을 그대로 유지한다. 폴더 위치와 캐시 정책은 무관하고, 값을 함께 바꾸면 구조 변경 때문에 생긴 차이인지 구분할 수 없다.

| 쿼리      | staleTime          | 그 외                               | 근거 (5주차 결정)                        |
| --------- | ------------------ | ----------------------------------- | ---------------------------------------- |
| 홈        | 1분                | 서버 prefetch + hydrate             | 인기·신상품의 최신 노출이 중요           |
| 상품 목록 | 5분                | `placeholderData: keepPreviousData` | 같은 검색·필터 결과를 재사용해 요청 감소 |
| 공통      | gcTime 기본값(5분) | —                                   | 별도로 조정할 근거가 아직 없음           |

**로딩 경계 범위** — 현재 세 층이 각각 다른 범위를 맡는다.

| 수단                | 담당 범위                                   | 현재 위치                                                                 |
| ------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `loading.tsx`       | 홈 라우트 전체(서버 렌더 대기)              | `app/(home)/loading.tsx` → `_pages/home/ui/HomeLoading.tsx`               |
| `<Suspense>`        | 상품 목록에서 URL을 읽는 Client 서브트리    | `_pages/product-list/ui/ProductListPage.tsx`                              |
| Query `isPending`   | 목록 데이터의 최초 로드(필터·카드 스켈레톤) | `_pages/product-list/ui/ProductListContent.tsx`, `ProductListResults.tsx` |
| `isPlaceholderData` | 조건 전환 중(이전 목록 유지, 흐리게)        | `_pages/product-list/ui/ProductListResults.tsx`                           |

목록에 `loading.tsx`가 없는 이유: 목록은 URL 조건이 바뀔 때마다 재조회되는데 라우트 로딩 UI를 쓰면 조건을 바꿀 때마다 화면이 통째로 스켈레톤으로 바뀐다. 이전 목록을 유지하는 편이 낫다고 판단해 컴포넌트 단위(`isPending`/`isPlaceholderData`)로 처리한다. `products/page.tsx`의 `<Suspense>`는 로딩 표현이 아니라 `useSearchParams`에 필요한 **경계**다.

스켈레톤은 실제 필터·카드의 이미지 비율, 텍스트·행위 영역과 반응형 배치를 미리 확보한다. 정적 구조만으로 layout shift가 없다고 확정할 수 없으므로 M5에서 로딩 완료 전후 요소 위치를 직접 확인한다.

**에러 경계 범위** — 위 4단계 표 참조. 홈은 라우트 경계, 목록은 컴포넌트 인라인.

**이번 주에 하지 않을 최적화와 이유**

- 상품 목록 서버 prefetch — URL 조건마다 결과가 달라 이득을 따져봐야 하는 별개 주제.
- `select`를 이용한 리렌더 격리 — 소비처가 하나뿐이라 지금은 이득이 없다(5주차 판단 유지).
- 번들 분할·이미지 최적화 — 측정한 성능 문제가 없다. 근거 없는 최적화는 구조 변경의 검증을 방해한다.
- Public API(`index.ts`) 도입으로 인한 번들 영향 — 슬라이스 루트 한 겹만 두기로 결정했지만(I 섹션), 번들 크기는 측정하지 않았다. 재-export 한 겹이 tree-shaking을 막는지는 `pnpm build` 결과를 구조 변경 전후로 비교해야 알 수 있고, 그건 이번 주 검증 범위 밖이다.

---

## 4단계 — 에러 처리 경계

### 에러 처리 표

구조 변경 후 현재 구현 기준이다. 목록은 복구 가능한 조회 실패를 화면 안에서 처리하고, 홈의 Suspense 조회 실패와 예상 밖 렌더링 오류는 루트 경계에서 처리한다.

| 실패 유형                     | 처리 위치                                                          | Error Boundary로 전파하는가       | 사용자 UI                                                          | 재시도 방법                      | 이 경계를 선택한 이유                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 상품 목록 HTTP·네트워크 실패  | `_pages/product-list/ui/ProductListResults.tsx`의 `isError` 분기   | 아니오 (`ApiError`는 인라인 처리) | `상품 목록을 불러오지 못했어요.` + `다시 시도`                     | `refetch()` (전체 새로고침 없음) | 필터 UI를 남겨야 사용자가 조건을 바꿔 실패에서 빠져나갈 수 있다. 목록만 실패했는데 화면 전체를 덮지 않는다.                                                                  |
| 잘못된 검색 조건(4xx)         | 1차는 nuqs parser, 그래도 뚫리면 위와 같은 인라인 경로             | 아니오                            | 허용 밖 `category`·`sort`와 1 미만 `page`는 기본값으로 조용히 복구 | 조건 변경                        | 사용자가 URL을 직접 고칠 수 있는 값이라 에러 화면보다 기본값 복구가 낫다. parser를 통과한 요청이 API 검증에서 실패할 때만 인라인 에러로 노출한다.                            |
| 예상하지 못한 렌더링·API 오류 | `_app/ui/RootErrorFallback.tsx` (루트 `app/error.tsx`가 re-export) | 예                                | `문제가 발생했어요` + `오류 코드`(digest) + `다시 시도`            | query reset 후 `reset()`         | 어디서 날지 모르는 오류와 응답 파싱 실패 등 API 계약 밖의 예외는 라우트 경계에서 받는다. 홈은 `useSuspenseQuery`라 조회 실패도 여기로 온다.                                  |
| 홈 데이터 조회 실패           | `_app/ui/RootErrorFallback.tsx` (루트 `app/error.tsx`가 re-export) | 예 (`useSuspenseQuery`가 throw)   | 위와 동일                                                          | query reset 후 `reset()`         | 홈은 라우트 전체가 이 데이터에 의존해 부분 표시가 의미 없다. 목록과 정반대 선택이고, 그 이유가 "화면이 데이터에 얼마나 의존하는가"다.                                        |
| 장바구니 행위의 비즈니스 오류 | **해당 없음**                                                      | —                                 | —                                                                  | —                                | 현재 장바구니·위시리스트는 서버 통신 없이 로컬 상태만 토글한다. 실패 경로가 존재하지 않는다. **서버 저장이나 재고 검증이 생기면** 그때 이벤트 핸들러에서 처리할 대상이 된다. |

### `throwOnError` 기준

- 기준은 HTTP status 자체가 아니라 **해당 데이터가 화면 전체를 막는가, 사용자가 현재 화면에서 복구할 수 있는가**다.
- 홈은 화면 전체가 조회 결과에 의존하므로 `useSuspenseQuery`가 모든 조회 실패를 루트 `error.tsx`로 전파한다.
- 상품 목록의 `getProductList`는 예상 가능한 HTTP·네트워크 실패를 `ApiError`로 변환한다. `throwOnError`는 `ApiError`를 `false`로 판정해 필터와 인라인 재시도 UI를 남긴다.
- 응답 파싱 실패처럼 API 계약 밖의 예외는 `throwOnError`가 `true`로 판정해 루트 경계로 보낸다.
- `ApiError.status`는 관측·정책 변경 가능성을 위해 보존하지만, 현재는 4xx와 5xx를 서로 다른 UI로 나누지 않는다.

### 이벤트 핸들러·비동기 콜백 오류

Error Boundary가 잡지 못하는 이유: React의 Error Boundary는 **렌더링·라이프사이클·자식 생성자**에서 던져진 오류만 잡는다. 이벤트 핸들러와 `setTimeout`·`Promise` 콜백은 React의 렌더 스택 밖에서 실행되므로 경계를 통과하지 못하고 그대로 전역(`window.onerror` / `unhandledrejection`)으로 빠진다.

현재 프로젝트에서의 처리 위치:

- 찜·담기 토글: 동기 로컬 상태 변경이라 실패 경로 없음. _(서버 통신이 붙으면 핸들러 안에서 `try/catch` + 사용자 피드백으로 처리)_
- `refetch()`: TanStack Query가 결과를 `isError`로 되돌려주므로 콜백에서 던지지 않는다.
- debounce 콜백(`useDebouncedCallback`): 안에서 하는 일이 nuqs 세터 호출뿐이라 던지지 않는다.

### 실패 재현 결과

| 시나리오             | 재현 방법                                                                                          | 관찰한 동작                                                                                                                                                                             | 판정                                                                                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 상품 목록 500과 복구 | Playwright에서 첫 요청은 500, `다시 시도` 후 정상 응답으로 가로채기                                | 필터를 유지한 채 오류를 표시하고 같은 URL에서 새 요청으로 목록 복구                                                                                                                     | Chromium·WebKit 통과                                                                                                                                                                                |
| 홈 조회 실패         | Route Handler에 임시 플래그 조건을 넣어 강제 500, 플래그 제거 후 `다시 시도`                       | 루트 fallback 노출 → 재시도 시 새 `/api/home` 요청과 정상 화면 복구                                                                                                                     | Chromium·WebKit 통과, Chromium 3/3 반복 확인. 임시 코드 제거 완료                                                                                                                                   |
| 예상 밖 렌더링 오류  | `HomeContent`에 쿼리 파라미터(`?forceError=1`)로 토글되는 임시 throw 삽입 후 `/?forceError=1` 접근 | 루트 `error.tsx`(`RootErrorFallback`)가 `문제가 발생했어요` + `다시 시도`로 정상 포착. `다시 시도`는 같은 URL이라 동일하게 재현되고, 파라미터 없는 `/`로 이동하면 정상 홈 화면으로 복구 | Chromium(Playwright headless) 통과, 콘솔에 에러 스택 기록 확인. `오류 코드`(digest)는 dev 모드 특성상 미노출 — 프로덕션 빌드에서만 채번되는 값이라 판정에서 제외. 임시 코드 제거 완료(`git diff` 0) |

> 나머지 수동 시나리오(M1–M9·layout shift)는 V3에서, 예상 밖 렌더링 오류 재현은 V4에서 2026-07-31 모두 확인했다. V3·V4 모두 해결로 닫혔다.

---

## 5단계 — 삭제 시나리오 자가 검증

### 위시리스트 기능을 통째로 제거한다면

- 삭제할 폴더·파일: `src/features/add-to-wishlist/**`, `src/entities/wishlist/**`
- 삭제 후 수정이 필요한 실행 코드: `widgets/product-card/ui/ProductCard.tsx`의 버튼 조합, `widgets/header/Header.tsx`의 store 구독·개수 표시
- 함께 정리할 검증·문서: 위시리스트 localStorage와 화면 동기화를 검증하는 Vitest/E2E, 위시리스트를 공개 계약으로 적은 RFC·결정 문서
- 응집 판정: 핵심 상태와 행위 UI는 두 슬라이스에 응집되어 있고, 수정 지점도 두 상위 조합부로 예측 가능하다. 상태(entity)와 행위(feature)를 분리한 결과라 물리적으로 한 폴더만 지우는 구조는 아니지만, grep 없이 변경 반경을 설명할 수 있다.

### 신상품 뱃지를 상품 카드에 추가한다면

- 터치할 파일: 표시만 추가한다면 `widgets/product-card/model/types.ts`, `ui/ProductCard.tsx`, `ProductCard.module.css`. “등록 후 N일” 같은 신상품 판정 정책이 필요하면 `entities/product/model`에 순수 도메인 함수를 추가하고 Public API로 공개한다.
- 판정: 배지 표현은 widget에 응집된다. 날짜 기준 정책까지 widget에 넣으면 표현과 도메인 규칙이 섞이므로, 요구사항의 성격에 따라 entity와 widget 두 경계로 나누는 것이 예측 가능하다.

### 발견한 파편화

| 파편화 내용                                         | 이번 주에 고칠 것 / 남길 것 | 근거                                                                                        |
| --------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------- |
| cart·wishlist가 같은 `createCollectionStore`를 공유 | 남김                        | 저장 방식에 종속되지 않은 공통 구현이며 각 entity의 공개 계약과 persist 키는 분리되어 있다. |
| Header가 cart·wishlist entity를 직접 구독           | 남김                        | 두 도메인 상태를 한 내비게이션 블록에서 조합하는 widget의 의도된 책임이다.                  |
| ProductCard가 두 feature 버튼을 조합                | 남김                        | 상위 widget이 하위 feature를 조합하므로 역방향 의존이 없고 변경 지점도 명확하다.            |

---

## Advanced (선택)

### A. 의존성 하네스

- 선택 여부: 적용
- 도구와 규칙: `eslint-plugin-boundaries`. 하위→상위 import 금지, 같은 레이어의 다른 슬라이스 직접 참조 금지, Public API 우회를 검사한다.
- 실패/통과 결과: 의도적으로 만든 `entities → _pages`, `_pages/home → _pages/product-list`, `shared → _pages` 위반을 각각 탐지했다. 피드백 반영에서는 루트 `app/`을 검사 범위에 추가하고 `app/api`를 별도 element로 분리했으며, 임시 위반 파일로 `app/api → _pages`도 탐지되는 것을 확인했다. 최종 코드에서는 관련 `eslint-disable`이 0건이다.

### B. 변경 반경 실험

- 선택 여부: 미적용
- 이유: 구조 변경과 동작 보존을 먼저 완료하기 위해 새 기능 추가는 범위에서 제외했다.

따라서 구현 전 예상과 실제 diff 비교표는 작성하지 않는다.

---

## FSD 이해 확인 질문

1. `ProductCard`가 찜 버튼을 직접 import하면 어떤 의존 규칙을 어기며, 어디에서 조합해야 하는가?

   `entities/product`의 카드가 feature를 import한다면 `entities → features` 상향 의존을 만든다. 현재 `ProductCard`는 두 feature를 조합하는 `widgets/product-card`에 있으므로 직접 import가 허용되며, 조합 책임도 widget에 모인다.

2. 한 페이지에서만 쓰는 검색 로직도 반드시 feature여야 하는가? 내 프로젝트에서는 어떻게 결정했는가?

   소비처 수만으로 feature를 만들지 않는다. 상품 목록 검색은 독립된 사용자 행위라기보다 이 페이지의 URL 조건을 조작하는 화면 상태이므로 `_pages/product-list/model`에 두었고, 범용 debounce와 페이지네이션 계산만 `shared/lib`로 분리했다.

3. `formatPrice`는 항상 `shared/lib`인가? 통화·회원 등급·상품 정책이 포함되면 결정이 어떻게 달라지는가?

   현재 함수는 숫자를 한국 원화 표시 문자열로 바꾸는 순수 포맷이라 `shared/lib`에 둘 수 있다. 회원 등급 할인이나 상품별 가격 정책을 계산하기 시작하면 해당 도메인의 규칙이므로 entity 또는 관련 feature로 옮기고, shared에는 표현 변환만 남긴다.

4. 두 feature가 협력해야 할 때 직접 import하지 않고 어떤 상위 레이어에서 조합했는가?

   `add-to-cart`와 `add-to-wishlist`는 서로 import하지 않는다. 두 버튼은 `widgets/product-card`가 조합하고, 두 상태의 개수는 `widgets/header`가 각 entity를 구독해 조합한다.

5. 폴더 이동 후에도 TanStack Query 데이터와 Zustand 데이터를 서로 복사하지 않은 이유는 무엇인가?

   서버 조회 결과의 Source of Truth는 TanStack Query 캐시이고, 사용자 컬렉션의 Source of Truth는 Zustand persist store다. 서로 복사하면 동기화 시점과 무효화 책임이 두 군데로 늘어나므로, 각 소비자가 필요한 원본 저장소를 직접 구독하게 유지했다.

6. barrel file과 Public API는 무엇이 다른가? 내 프로젝트에서는 어느 쪽을 선택했고 그 의도는 무엇인가?

   barrel은 import 경로를 줄이기 위해 내부 구현을 넓게 재수출하지만, Public API는 외부에 보장할 계약만 의도적으로 공개한다. 이 프로젝트는 sliced layer의 루트 `index.ts`에 named export만 두고, 슬라이스가 없는 `shared`는 필요한 모듈을 직접 import해 공개 범위를 구분했다.

---

## AI 리뷰 기록

| AI가 지적한 내용                                                      | 수용 / 반려       | 근거                                                                                                                             |
| --------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `ProductCard`를 feature가 아니라 widget으로 배치하고 두 action을 분리 | 수용              | 두 feature를 조합하는 독립 UI 블록이며 `entities → features` 역방향 의존을 피한다.                                               |
| 상품 목록 parser 전체를 shared로 이동                                 | 반려              | 상품 category·sort·page 계약은 product 도메인을 알고 있어 shared에 둘 수 없다. parser는 entity, 히스토리·라벨은 page가 소유한다. |
| `usePagination`에서 page parser를 직접 import                         | 반려 후 대안 적용 | shared의 상향 의존을 만들기 때문에 controlled 입력으로 바꾸고 page adapter에서 nuqs를 연결했다.                                  |
| E2E 중심 검증 유지                                                    | 반려              | Route Handler·Zustand 내부 로직은 Vitest가 더 저렴하다. 브라우저 경계만 E2E에 남기는 기준으로 수정했다.                          |

---

> 이 문서의 골격(제목·표 헤더·질문)은 AI(Claude)가 `docs/assignments/week-06.md`의 요구 항목을 기준으로 생성했습니다.
>
> AI를 사용한 범위는 다음과 같습니다.
>
> - **측정값**: 0단계의 자동 검증 결과(`pnpm check`·`pnpm test:e2e` 실행 결과와 플레이키 판정)
> - **현재 코드에서 읽어낸 사실**: 기능 요구사항 표, Before 폴더 트리, 에러 처리 표의 현재 구현 동작, 로딩 경계 구분, 캐시 정책 현재 값, E2E 커버 범위
> - **원인 분석**: `리팩토링 중 발견한 기존 버그`의 홈 에러 재시도 건. 증상 관찰과 "고치지 않고 기록만 한다"는 결정은 작성자가 했고, react-query 소스 대조를 통한 원인 규명은 AI가 했습니다.
> - **설계 대안 제안**: 구조 문제 후보, 애매한 파일의 후보, 하지 않을 작업과 최적화 범위
> - **문서 정합성 검토**: 최종 코드와 After 트리·상태 소유권·Public API·검증 전략의 불일치 탐지
>
> 최종 배치와 수용·반려 판단은 `decisions.md`의 결정 근거에 맞춰 확정했다. 실행하지 않은 런타임 검증 결과는 AI가 추정하지 않고 `검증 대기`로 남겼다.
