# Week 06 FSD 마이그레이션 RFC

## 기준선과 범위

- 현재 기록: RFC 커밋 `0a02a65`는 첫 소스 이동 커밋 `208003b`의 조상이다. 이
  순서는 `GIT_MASTER=1 git merge-base --is-ancestor 0a02a65 208003b`로
  재확인한다.
- 현재 작업 트리는 별도 retry-scope 작업의 source/test 변경을 포함한다. 이 RFC는
  그 변경을 덮어쓰지 않으며, 문서 검증과 애플리케이션 최종 게이트를 구분한다.
- 현재: 아래 설계, 매핑, 삭제 시나리오, 이해 확인 답변, AI disclosure와 최종 local
  source/test/browser 검증 결과를 기록했다.
- 대기: 실제 PR, remote CI, screen-reader 음성, human approval은 아직 pending이다.

## RADIO

### 요구사항

홈과 상품 목록의 Query 기반 loading/empty/error 상태, nuqs URL filter,
장바구니·위시리스트 동기화와 localStorage 영속화, 접근 가능한 상품 행동을 보존한다.
서버 데이터는 TanStack Query, 공유 가능한 filter는 nuqs, 비로그인 장바구니·위시리스트
집합은 Zustand, 일시 UI는 React local state가 소유한다.

이번 범위에서는 Advanced A/B, 새 state library, URL `scenario` 상태, response 계약
변경, Pages Router, `processes`, `src/app/api/**` 이동을 하지 않는다. Route Handler와
mock fixture는 프런트엔드 경계의 test infrastructure로 제자리에 둔다. barrel export를
추가하지 않고 실제 파일 경로 import를 사용한다.

### 아키텍처

#### 현재 문제

1. 상품 표현이 사용자 행동 feature를 직접 import하면 entity가 상위 layer를 알아야 한다.
2. 상품 목록이 다른 widget slice를 직접 조합하면 조합 책임이 분산된다.
3. cart/wishlist의 영속 domain state와 행동 UI의 소유 경계가 이름으로 고정되어 있지
   않았다.
4. 4xx 인라인 복구와 5xx·schema·rendering failure의 route 경계가 문서화되어 있지
   않았다.

#### 이전 트리

```txt
src/
  app/
    api/{_data,home,products}/
    {layout,page,providers}.tsx
    products/{loading,page}.tsx
  entities/product/{api,model}/
  features/
    cart/{model,ui}/
    wishlist/{model,ui}/
    product-filter/{model,ui}/
  shared/{api,lib,ui}/
  views/{home,product-list}/ui/
  widgets/
    header/ui/
    product-card/ui/
    product-list/ui/
```

#### 목표 트리

```txt
src/
  app/
    error.tsx
    {layout,page,providers}.tsx
    providers.test.ts
    products/{error,loading,page}.tsx
    api/**                         # retained, outside migration scope
  entities/
    product/
      api/
        ProductRepository.ts
        ProductRepository.test.ts
        ProductService.ts
      model/
      ui/ProductCard.tsx
    cart/model/{CartStore,CartStore.test}.ts
    wishlist/model/{WishlistStore,WishlistStore.test}.ts
  features/
    add-to-cart/ui/AddToCartButton.tsx
    toggle-wishlist/ui/ToggleWishlistButton.tsx
    product-filter/{model,useProductFilters.ts;ui/FilterBar.tsx}
  shared/
    api/
      ApiClient.ts
      ApiClient.test.ts
      ApiErrorResponse.ts
      ApiErrorPolicy.ts
      ApiErrorPolicy.test.ts
    lib/useHydratePersistedStore.ts
    ui/
      DebouncedInput.tsx
      InlineQueryError.tsx
      useInlineQueryRetry.ts
  views/{home,product-list}/ui/
  widgets/
    header/ui/Header.tsx
    product-list/ui/{ProductGrid,ProductListSection}.tsx
```

`src/app/api/**`, `src/views/{home,product-list}/ui/`, and the existing product model
segment remain in place. `src/pages`, `src/_pages`, `processes`, empty segments, and
`index.ts` barrels are not part of the target tree.

#### import 정책

허용하는 실제 파일 경로 import는 다음과 같다.

```ts
import { ProductCard } from '@/entities/product/ui/ProductCard'
import { AddToCartButton } from '@/features/add-to-cart/ui/AddToCartButton'
import { ProductGrid } from '@/widgets/product-list/ui/ProductGrid'
```

slice root barrel과 상위 layer를 향하는 entity import, sibling widget import는 금지한다.
허용 방향은 `app -> views -> widgets -> features -> entities -> shared`이며, 같은
layer의 협력은 하나의 slice 안에 두거나 상위 layer에서 조합한다.

#### ProductCard 경계

`ProductCard`는 image/alt, 가격·할인, `article` 의미 구조와 상품 local
`formatPrice`만 표현한다. action button은 `productId`, `productName`과 자기 selector를
소유하며, `ProductGrid`가 action node를 slot으로 조합한다. 따라서 entity가 feature를
import하지 않고도 카드에 보이는 행동을 유지한다.

#### 전체 파일 매핑

| 현재 위치                                                                 | 목표 위치                                                           | 레이어 / 슬라이스 / 세그먼트 | 이동 또는 유지하는 이유                                   |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------- |
| `src/app/page.tsx`                                                        | 유지                                                                | app route                    | 얇은 route entry가 `HomeView`를 렌더링한다.               |
| `src/app/products/page.tsx`                                               | 유지                                                                | app route                    | 얇은 route entry가 `ProductListView`를 렌더링한다.        |
| `src/app/products/loading.tsx`                                            | 유지                                                                | app route                    | 상품 route 전환 loading은 route가 소유한다.               |
| 없음                                                                      | `src/app/error.tsx`                                                 | app error boundary           | root의 예상 밖 rendering failure fallback과 reset을 둔다. |
| 없음                                                                      | `src/app/products/error.tsx`                                        | products error boundary      | products segment fallback과 reset을 둔다.                 |
| `src/app/{layout,providers}.tsx`                                          | 유지                                                                | app bootstrap                | Header, QueryClient, NuqsAdapter 조합은 app에 둔다.       |
| 없음                                                                      | `src/app/providers.test.ts`                                         | app test                     | Query retry/throw 기본 계약을 검증한다.                   |
| `src/app/api/**`                                                          | 유지                                                                | app API, 범위 제외           | mock handler와 fixture의 위치·계약을 바꾸지 않는다.       |
| `src/views/home/ui/HomeView.tsx`                                          | 유지                                                                | home view                    | home query와 route-view 조합을 맡는다.                    |
| `src/views/product-list/ui/ProductListView.tsx`                           | 유지                                                                | product-list view            | filter와 목록 widget 조합을 맡는다.                       |
| `src/widgets/header/ui/Header.tsx`                                        | 유지                                                                | header widget                | 공통 shell에서 entity store를 소비한다.                   |
| `src/widgets/product-list/ui/ProductGrid.tsx`                             | 유지                                                                | product-list widget          | entity card와 action feature를 조합한다.                  |
| `src/widgets/product-list/ui/ProductListSection.tsx`                      | 유지                                                                | product-list widget          | 목록 loading/error/empty 영역을 맡는다.                   |
| `src/widgets/product-card/ui/ProductCard.tsx`                             | `src/entities/product/ui/ProductCard.tsx`                           | product entity UI            | 상품 표현을 entity로 이동하고 widget slice를 제거한다.    |
| `src/features/cart/model/{CartStore,CartStore.test}.ts`                   | `src/entities/cart/model/{CartStore,CartStore.test}.ts`             | cart entity model            | 영속 cart 집합과 test 계약을 domain 소유로 둔다.          |
| `src/features/wishlist/model/{WishlistStore,WishlistStore.test}.ts`       | `src/entities/wishlist/model/{WishlistStore,WishlistStore.test}.ts` | wishlist entity model        | 영속 wishlist 집합과 selector 계약을 domain 소유로 둔다.  |
| `src/features/cart/ui/AddToCartButton.tsx`                                | `src/features/add-to-cart/ui/AddToCartButton.tsx`                   | add-to-cart feature          | 행동 UI를 독립 action slice로 둔다.                       |
| `src/features/wishlist/ui/ToggleWishlistButton.tsx`                       | `src/features/toggle-wishlist/ui/ToggleWishlistButton.tsx`          | toggle-wishlist feature      | 행동 UI를 독립 action slice로 둔다.                       |
| `src/features/product-filter/{model,ui}/**`                               | 유지                                                                | product-filter feature       | parser, URL 갱신, control을 하나의 경계로 유지한다.       |
| `src/features/store-sync.test.ts`                                         | 삭제                                                                | obsolete test                | module identity 대신 entity test와 route 계약을 검증한다. |
| `src/entities/product/api/{ProductRepository,ProductService}.ts`          | 유지                                                                | product entity API           | transport, schema, query key, stale time을 함께 소유한다. |
| 없음                                                                      | `src/entities/product/api/ProductRepository.test.ts`                | product entity test          | schema boundary 통과·거부 계약을 검증한다.                |
| `src/entities/product/model/{types,ResponseSchema,ProductQuerySchema}.ts` | 유지                                                                | product entity model         | product DTO/schema/query 계약을 소유한다.                 |
| `src/shared/api/{ApiClient,ApiErrorResponse}.ts`                          | 유지                                                                | shared API                   | payload 검증과 transport 정규화를 소유한다.               |
| 없음                                                                      | `src/shared/api/ApiErrorPolicy.ts`                                  | shared API                   | retry/throw 판정만 공통으로 제공한다.                     |
| 없음                                                                      | `src/shared/api/ApiClient.test.ts`                                  | shared API test              | HTTP payload와 transport 정규화를 검증한다.               |
| 없음                                                                      | `src/shared/api/ApiErrorPolicy.test.ts`                             | shared API test              | 4xx·5xx·network·timeout·schema·unknown matrix를 검증한다. |
| `src/shared/lib/useHydratePersistedStore.ts`                              | 유지                                                                | shared lib                   | idempotent persistence hydration은 범용 infrastructure다. |
| `src/shared/ui/DebouncedInput.tsx`                                        | 유지                                                                | shared UI                    | domain 비종속 input primitive다.                          |
| 없음                                                                      | `src/shared/ui/InlineQueryError.tsx`                                | shared UI                    | 일반 alert/retry 표현만 제공한다.                         |
| 없음                                                                      | `src/shared/ui/useInlineQueryRetry.ts`                              | shared UI                    | refetch 동안 오류 문구와 retry pending 수명을 관리한다.   |
| `src/shared/ui/{dialog,select}/**`, `src/examples/**`, `src/popover.d.ts` | 유지                                                                | unrelated shared/example     | 이번 migration과 무관하므로 건드리지 않는다.              |

#### 배치가 애매한 항목의 결정

| 대상                                | 후보 A                    | 후보 B                                | 최종 결정                                          | 기준                                                              |
| ----------------------------------- | ------------------------- | ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| `ProductCard`                       | `entities/product/ui`     | `widgets/product-card`                | `entities/product/ui`                              | 행동 의존 없이 상품을 표현하고 여러 조합에서 재사용한다.          |
| 상품 목록 queryOptions              | `entities/product/api`    | 상품 목록 page의 `api`                | `entities/product/api`                             | home과 목록이 함께 소비하는 transport 계약이다.                   |
| 장바구니 store                      | `entities/cart/model`     | 장바구니 행동 feature의 `model`       | `entities/cart/model`                              | 영속 product-ID 집합은 UI 행동과 독립된 domain state다.           |
| 위시리스트 store                    | `entities/wishlist/model` | 위시리스트 행동 feature의 `model`     | `entities/wishlist/model`                          | 영속 집합과 selector는 버튼 하나보다 넓은 계약이다.               |
| 행동 button                         | entity UI                 | 개별 action feature                   | `features/add-to-cart`, `features/toggle-wishlist` | entity state를 소비하는 사용자 행동으로 상위에서 조합한다.        |
| `src/types/commerce.ts`의 `Product` | `entities/product/model`  | `shared/types` 유지                   | `entities/product/model`                           | product domain type의 ownership을 한 곳에 둔다.                   |
| 상품 filter                         | `views/product-list`      | `features/product-filter`             | `features/product-filter`                          | parser, hook, control이 하나의 이름 있는 interaction 경계다.      |
| `formatPrice`                       | `shared/lib`              | `entities/product/ui/ProductCard.tsx` | product-local helper                               | 한국 원화 상품 정책을 포함한 표현 규칙이다.                       |
| persisted-store hydration           | Header local hook         | `shared/lib`                          | `shared/lib`                                       | idempotent persistence infrastructure이며 Header가 호출 지점이다. |

#### 마이그레이션 단계와 검증 방법

1. RFC를 소스 이동 전에 고정한다. 현재 기록은 위의 ancestor 명령으로 확인한다.
2. cart/wishlist store를 entity model로 옮기고 action UI를 독립 feature로 분리한다.
3. 순수 `ProductCard`를 entity로 옮기고 `ProductGrid`에서 action slot을 조합한다.
4. 실제 파일 경로 import와 app/view/widget ownership을 다시 연결한다.
5. shared API에서 transport 오류를 분류하고 Query retry/throw 판정을 중앙화한다.
6. 4xx 인라인 복구와 5xx·schema·rendering route boundary를 추가한다.
7. 자동화와 browser의 normal/error/race/accessibility 시나리오를 실행한다.
8. 삭제 시나리오, AI 수용·반려 근거, 제출 전 pending 항목을 갱신한다.

각 단계의 검증은 좁은 test 또는 구조 scan을 먼저 실행하고, 최종 source/browser
게이트는 별도의 final synchronization에서 실행한다. 이 문서는 실행하지 않은 결과를
통과로 표시하지 않는다.

### 데이터 모델

| 상태                | Source of Truth           | 소유 슬라이스/레이어                 | 소비하는 곳          | 이동 후에도 중복 저장하지 않는 방법                            |
| ------------------- | ------------------------- | ------------------------------------ | -------------------- | -------------------------------------------------------------- |
| 상품 조회 결과      | 서버/TanStack Query       | `entities/product/api`, view         | 홈, 상품 목록        | response를 Zustand에 복사하지 않는다.                          |
| 검색·정렬·페이지    | URL/nuqs                  | `features/product-filter`            | 상품 목록            | 최종 filter를 React/Zustand에 복제하지 않는다.                 |
| 장바구니·위시리스트 | Zustand                   | `entities/cart`, `entities/wishlist` | Header, 상품 행동 UI | product-ID 집합만 저장하고 product response는 저장하지 않는다. |
| Dialog 열림 여부    | React 로컬 상태           | 해당 UI                              | 해당 UI              | cross-view가 아니므로 승격하지 않는다.                         |
| 입력 draft          | React 로컬 상태 또는 nuqs | 해당 입력 UI                         | filter control       | URL에 반영할 최종값과 typing draft를 분리한다.                 |

영속 계약은 `commerce-cart`, `commerce-wishlist`이며 version `1`과 `items`만 저장한다.
Zod가 저장된 `items`를 검증하고 잘못된 값은 빈 상태로 처리한다. `skipHydration`으로
SSR 초기 상태를 비워 두고 Header mount 후 `useHydratePersistedStore`가 한 번
rehydrate한다.

### 인터페이스

slice는 slice-root API가 아니라 named export가 있는 실제 파일을 직접 노출한다.
내부 helper와 migration schema는 해당 파일 안에 숨긴다. `ProductCard`는 상품·표현
props와 optional action node를 공개하고, action button은 자기 `productId`,
`productName`, selector/action만 소비한다. `ProductService`는 `home`과
`product.list(query)` query key를 유지하며, `FilterBar`는 `useProductFilters`의 값과
callback을 받아 별도 filter store를 만들지 않는다.

### 최적화

홈 `staleTime: 60_000`, 상품 목록 `staleTime: 30_000`, 기본 Query `gcTime`, 기존 query
key, mock delay를 유지한다. 홈 Query `isPending`은 홈 content loading을, 상품 route의
`loading.tsx`는 route transition을, 목록 Query `isPending`은 FilterBar를 유지한 결과
영역을 맡는다. cache를 Zustand에 복사하거나 측정 없는 memoization, 새 optimization
library를 추가하지 않는다.

## 오류와 복구 정책

| 실패 유형                     | 처리 위치                   | Error Boundary로 전파하는가      | 사용자 UI                                | 재시도 방법                                        | 이 경계를 선택한 이유                                          |
| ----------------------------- | --------------------------- | -------------------------------- | ---------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| 상품 목록 조회 실패           | view와 `ProductListSection` | 4xx는 아니오, 5xx·transport는 예 | 결과 영역의 alert 또는 products fallback | 4xx는 inline retry, 5xx·transport는 boundary reset | 사용자가 수정할 수 있는 입력 오류와 예상 밖 장애를 분리한다.   |
| 잘못된 검색 조건(4xx)         | query error state           | 아니오                           | FilterBar를 남긴 inline alert            | retry button으로 해당 query를 다시 요청            | 화면의 나머지 조건과 복구 control을 보존한다.                  |
| 예상하지 못한 rendering 오류  | app/products `error.tsx`    | 예                               | route별 fallback과 reset                 | Query reset 후 Next reset                          | component tree의 예상 밖 오류를 route 범위에 가둔다.           |
| 장바구니 행위의 비즈니스 오류 | 현재 local store action     | 해당 없음                        | 해당 없음                                | 현재 원격 실패가 없어 추가하지 않는다.             | 존재하지 않는 실패를 위한 speculative handler를 만들지 않는다. |

빈 2xx는 오류가 아니므로 inline empty 영역을 유지하고 retry/boundary를 사용하지
않는다. Error Boundary는 event handler와 async callback의 later throw를 자동으로
잡지 못하므로, 현재 local action에는 원격 오류 경계를 추가하지 않는다.

### 오류 class/status matrix

| 오류 class/status                                | `retry(0)` | `retry(1)` | `throwOnError` | 현재 처리                                  |
| ------------------------------------------------ | ---------- | ---------- | -------------- | ------------------------------------------ |
| 인식된 `ApiClientError` 4xx                      | false      | false      | false          | Query error state와 inline retry에 남긴다. |
| 인식된 `ApiClientError` 5xx                      | true       | false      | true           | 한 번 재시도한 뒤 route boundary로 보낸다. |
| Ky `NetworkError`                                | true       | false      | true           | 한 번 재시도한 뒤 route boundary로 보낸다. |
| Ky `TimeoutError`                                | true       | false      | true           | 한 번 재시도한 뒤 route boundary로 보낸다. |
| 성공 2xx 뒤 product `ZodError`                   | false      | false      | true           | 예상 밖 schema 오류로 전파한다.            |
| JSON decoding `SyntaxError` 또는 unknown `Error` | false      | false      | true           | 분류하지 않고 예상 밖 오류로 전파한다.     |

## 재현 가능한 검증 기록

이 절의 current 결과는 명령의 exit code와 scan 결과로만 기록한다. browser 시나리오는
동일한 local dev server와 Playwright request interception으로 다시 실행할 수 있으며,
실행하지 않은 시나리오는 pending으로 남긴다.

### Current checks

| 확인 대상                       | 재실행 명령 또는 시나리오                                                                                                                                                | 현재 상태                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| RFC/source ordering             | `GIT_MASTER=1 git merge-base --is-ancestor 0a02a65 208003b`                                                                                                              | current: exit 0                                                  |
| RFC format                      | `pnpm exec prettier docs/rfc/week06-fsd.md --check`                                                                                                                      | current: Todo 6에서 exit 0                                       |
| required sections               | fail-closed exact-heading loop below                                                                                                                                     | current: exit 0 means every listed heading matched independently |
| forbidden claim scan            | `grep -nF "$(printf 'remote') $(printf 'parity')" docs/rfc/week06-fsd.md; grep -nF "$(printf '.omo/evidence/week06')-fsd" docs/rfc/week06-fsd.md`                        | current: zero matches가 기준                                     |
| unsupported history/visual scan | `grep -nE -e '정상[[:space:]]+push' -e 'pixel[[:space:]]+diff' -e 'captu[r]e?' -e 'review[[:alpha:]]*er[[:space:]]+approval' -e '승[인].*완[료]' docs/rfc/week06-fsd.md` | current: zero matches가 기준                                     |
| format                          | `pnpm format:check`                                                                                                                                                      | current: exit 0                                                  |
| tests                           | `pnpm test`                                                                                                                                                              | current: 12 files, 122 tests passed                              |
| lint                            | `pnpm lint`                                                                                                                                                              | current: exit 0                                                  |
| typecheck                       | `pnpm typecheck`                                                                                                                                                         | current: exit 0                                                  |
| production build                | `pnpm build`                                                                                                                                                             | current: exit 0                                                  |
| aggregate check                 | `pnpm check`                                                                                                                                                             | current: test 12/122, lint, typecheck, build 모두 exit 0         |
| working-tree probe              | `GIT_MASTER=1 git status --short`                                                                                                                                        | current: plan 범위의 unstaged source/test/docs 변경만 있음       |
| missing-artifact probe          | `test ! -e "$(printf '.omo/evidence/week06')-fsd"`                                                                                                                       | current: legacy artifact directory 없음                          |

```bash
for heading in '## RADIO' '#### 이전 트리' '#### 목표 트리' \
  '#### 전체 파일 매핑' '#### 배치가 애매한 항목의 결정' \
  '#### 마이그레이션 단계와 검증 방법' '### 데이터 모델' \
  '## 오류와 복구 정책' '## 삭제 시나리오' '## FSD 이해 확인 답변' \
  '## AI 지원과 검토 기록'; do
  grep -Fqx "$heading" docs/rfc/week06-fsd.md || {
    printf 'missing heading: %s\n' "$heading" >&2
    exit 1
  }
done
```

The loop checks every heading as a complete line; a missing heading exits nonzero.

### Current Chromium browser scenarios

1. Normal: Playwright Chromium에서 home/products, filter·pagination URL, reload,
   Back/Forward, cart/wishlist route 이동·영속화를 확인했다.
2. Error recovery: `/api/home`과 `/api/products`의 400 interception에서 inline alert와
   retry를, 500 interception에서 각 route fallback과 interception 제거 뒤 reset 복구를
   확인했다.
3. Retry race: scope A retry를 지연한 채 scope B로 바꾸고 B retry도 진행한 뒤 A를 늦게
   완료해도 B message와 pending state가 유지되고, B 완료 뒤 정상 결과가 복구됨을
   확인했다.
4. Interaction and mobile: Enter/Space activation, focus와 `aria-pressed` 유지,
   `aria-busy`, 375x812 가로 overflow 없음, fresh success console의 product/runtime error
   0건을 확인했다. browser route, storage, page/context, server process group과 port를
   정리했다.

위 결과는 local Playwright Chromium 실행에 한정한다. 실제 screen-reader audio, 다른
browser engine, 실제 PR, remote CI, human approval은 아직 pending이다. fresh success
console의 기존 Image LCP advisory 1건은 이번 범위에서 수정하지 않았다.

## 삭제 시나리오

### wishlist 제거

위시리스트를 통째로 제거하면 다음 세 파일을 삭제한다.

- `src/entities/wishlist/model/WishlistStore.ts`
- `src/entities/wishlist/model/WishlistStore.test.ts`
- `src/features/toggle-wishlist/ui/ToggleWishlistButton.tsx`

다음 두 조합 지점만 수정한다.

- `src/widgets/header/ui/Header.tsx`: wishlist store/selector, hydration 호출, count와
  표시를 제거한다. cart hydration/count/UI는 유지한다.
- `src/widgets/product-list/ui/ProductGrid.tsx`: wishlist action import와 slot만 제거한다.
  `AddToCartButton`과 `ProductCard` 조합은 유지한다.

`src/shared/lib/useHydratePersistedStore.ts`는 cart가 계속 사용하므로 유지한다.
filter, product model/API, shared API, app route와 handler는 wishlist 소비자가 아니므로
수정하지 않는다. 기존 `commerce-wishlist` 저장값은 기능 제거 뒤 읽히지 않는 데이터다.
상태와 행동이 각각 하나의 entity와 feature에 모이고, 상위 widget의 두 조합 지점만
남으므로 삭제 반경을 예측할 수 있다.

### 신상품 badge 추가

현재 계약을 신뢰할 수 있는 badge 변경의 예측 파일은 다음 다섯 개다.

- `src/entities/product/model/ResponseSchema.ts`: `createdAt`을 유효한 ISO datetime으로
  검증한다.
- `src/entities/product/model/ResponseSchema.test.ts`: 유효·무효 날짜 계약을 검증한다.
- `src/entities/product/model/ProductNewness.ts`: 고정된 N일 정책을 받는 순수 판정 규칙을
  둔다.
- `src/entities/product/model/ProductNewness.test.ts`: 경계와 미래 시각을 검증한다.
- `src/entities/product/ui/ProductCard.tsx`: 검증된 product와 판정 결과를 표현한다.

이 다섯 파일이면 schema boundary, domain policy, regression test, card 표현의 책임이
닫힌다. mock의 현재 문자열만 믿는 한 파일 prototype은 외부 응답 계약을 보장하지
않으므로 채택하지 않는다. `ProductGrid`, view, repository, service, handler까지
확장할 근거는 현재 요구사항에 없다.

## FSD 이해 확인 답변

1. `ProductCard`가 wishlist button을 import하면 entity가 feature를 import하여 하위에서
   상위로 향하는 의존 방향을 어긴다. `ProductGrid`가 action slot을 조합하고, page별
   변형이 필요하면 view가 조합한다.
2. 한 page에서만 쓰인다는 이유만으로 검색 로직이 자동으로 feature가 되지는 않는다.
   이 프로젝트에서는 parser, URL 계약, `FilterBar`가 하나의 이름 있는 interaction
   경계를 이루므로 `product-filter` feature로 유지한다.
3. `formatPrice`는 항상 `shared/lib`일 필요가 없다. 한국 원화 상품 정책을 포함하므로
   product-local로 두며, 안정적인 다중 domain 가격 정책이 생길 때만 shared 도구를
   검토한다.
4. feature끼리는 직접 import하지 않는다. `ProductGrid`가 add-to-cart와
   toggle-wishlist를 entity card 옆에서 조합하므로 각 feature는 독립적이다.
5. Query는 서버 snapshot/cache를, Zustand는 비로그인 product-ID 집합을 소유한다.
   서로 복사하면 stale 동기화 책임만 생기므로 원본과 수명이 다른 데이터를 중복 저장하지
   않는다.
6. barrel은 경로를 줄이는 re-export이고 public API는 외부 소비를 허용하는 계약이다.
   이 저장소는 둘 다 slice root에 도입하지 않고 실제 파일 경로 import를 택해 의존 경로와
   변경 반경을 드러낸다.

## AI 지원과 검토 기록

AI는 repository inventory, RFC 초안, 구조 scan과 재현 가능한 검증 절차 설계에 도움을
주었다. 최종 문서는 assignment 표와 현재 source ownership을 대조해 작성했으며, local
Chromium에서 실행한 결과만 current로 기록했다. remote·screen-reader·human 결과는 현재
사실로 올리지 않았고 human review와 approval은 아직 pending이다.

| 검토 결정                                                                       | 처리 | 근거                                                            |
| ------------------------------------------------------------------------------- | ---- | --------------------------------------------------------------- |
| 과제의 `_pages` 대신 `views` 사용                                               | 수용 | repository FSD 규칙의 route 조합 layer와 일치한다.              |
| 실제 파일 경로 import 사용                                                      | 수용 | slice root barrel을 만들지 않는 저장소 정책과 일치한다.         |
| `ProductCard` entity와 widget action slot                                       | 수용 | entity의 상위 feature 의존을 제거하면서 행동을 보존한다.        |
| slice-root barrel 도입                                                          | 반려 | direct-file import 정책과 충돌한다.                             |
| `src/app/api/**` 이동 또는 영구 scenario query                                  | 반려 | API 경계와 사용자 URL 계약을 변경한다.                          |
| 화면별 오류 문구를 shared API에 넣기                                            | 반려 | shared는 class/status 판정만 소유해야 한다.                     |
| 문서의 unrerunnable evidence, remote 결과, unverified approval을 current로 기록 | 반려 | 재실행 가능한 local command/scenario로 확인할 수 없는 주장이다. |

### 제출 상태

- Current: RFC 구조와 설계 기록, current/pending 경계, rerunnable verification 목록이
  있으며, local source/test/build gate와 Chromium browser 시나리오가 통과했다.
- Pending: actual PR, remote CI, screen-reader audio, 다른 browser engine, human approval.
