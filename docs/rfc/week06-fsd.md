# RFC: Week 06 커머스 FSD 마이그레이션

## 1. Requirements — 목적과 불변 조건

`src/commerce`의 31개 파일을 FSD 6개 레이어로 옮기되, 사용자 행동과 상태의 Source of Truth(SoT)는 보존한다. 목표 트리는 `src/_app`, `src/_pages/{home,product-list}`, `src/widgets/header`, `src/features/{add-to-cart,toggle-wishlist}`, `src/entities/product`, `src/shared/{ui,api}`다. Next App Router의 루트 `app/`은 라우팅·얇은 조립만 담당한다.

- `find src/commerce -type f | wc -l`의 현재 값은 **31**이다(구현 19, 테스트 12).
- `src/products/**`, `docs/architecture/**`, 잠긴 게이트 설정은 변경하지 않는다. `src/pages`도 만들지 않는다.
- `scenario`는 mock 전용이며 URL 상태나 `ProductListQuery`에 넣지 않는다. 새 의존성, 서버 응답의 Zustand 복사, URL 상태의 `useState` 미러링도 금지한다.
- 구조 이동은 기존 27개 테스트를 회귀 안전망으로 쓰고, 오류 경계 기능만 RED→GREEN→정리 TDD로 만든다. 각 단계는 `pnpm check`를 통과한다.

### 기준선과 관찰 범위

기준선은 [baseline summary](/Users/toong/.omt/loop-pack-fe-l2-vol1/evidence/week06-fsd-migration/baseline/summary.md)와 `scenario-1.txt`~`scenario-8.txt`를 따른다. 홈/목록 렌더, skeleton(홈 10·목록 12), 네트워크 오류의 인라인 오류와 재시도, 빈 결과, URL 공유(필터·정렬·페이지), 홈↔목록 장바구니/찜 동기화를 보존한다. 특히 `scenario-4.txt`는 현재 abort 시 필터·헤더를 유지한 인라인 오류와 재시도를, `unroute-check.txt`는 route 해제 뒤 정상 복구를 기록한다.

#### 구조 이동 재측정 — 2026-08-03, `e00aa5b`

구조 이동 재측정은 [summary](/Users/toong/.omt/loop-pack-fe-l2-vol1/evidence/week06-fsd-migration/structure-remeasure/summary.md)와 [scenario-1.txt](/Users/toong/.omt/loop-pack-fe-l2-vol1/evidence/week06-fsd-migration/structure-remeasure/scenario-1.txt)~[scenario-8.txt](/Users/toong/.omt/loop-pack-fe-l2-vol1/evidence/week06-fsd-migration/structure-remeasure/scenario-8.txt)를 기준으로 수행했다. baseline과 재측정은 8/8 동일했다.

| Scenario          | 재측정 결과                                                                     | baseline 대비 |
| ----------------- | ------------------------------------------------------------------------------- | ------------- |
| 1. 홈 정상 렌더   | 인기/신상품·카드 12                                                             | 동일          |
| 2. 목록 정상 렌더 | 목록 12·총 30·pagination                                                        | 동일          |
| 3. skeleton       | 홈 10·목록 12                                                                   | 동일          |
| 4. network abort  | inline 오류·재시도·필터·헤더 유지, unroute 뒤 정상 복구. Error Boundary 전 단계 | 동일          |
| 5. 빈 검색        | 총 0·inline empty·boundary 없음                                                 | 동일          |
| 6. 필터 URL       | `q=케이스`·`category=digital`·`sort=price-asc`·카드 2                           | 동일          |
| 7. pagination     | page2→back1→forward2→reload2 및 첫 상품                                         | 동일          |
| 8. cart/wishlist  | 홈 toggle 뒤 목록에서 header 1/1·두 버튼 `pressed=true`                         | 동일          |

마이그레이션 전 `@/commerce`의 **앱 외부 소비자**는 5개다: `app/(commerce)/layout.tsx`, `page.tsx`, `products/page.tsx`, `app/api/home/route.ts`, `app/api/products/route.ts`. 반면 **repo 전체 `@/commerce` import**는 테스트 `src/commerce/handler-parity.test.ts`까지 포함하여 6개다. 전자는 실행 조립 경계, 후자는 테스트를 포함한 검색 결과이므로 같은 수로 취급하지 않는다.

## 2. Architecture — 제안 구조와 의존 규칙

```
app/                         # Next App Router: route·route handler·error 경계
src/_app/                    # FSD App: provider와 전역 조립
src/_pages/{home,product-list}/ # 화면 UI·query api·URL model
src/widgets/header/          # 교차 화면 헤더
src/features/{add-to-cart,toggle-wishlist}/ # 사용자 행동과 각 Zustand store
src/entities/product/        # Product/Category 도메인과 순수 카드
src/shared/{ui,api}/         # 공용 UI와 범용 HTTP/error 기반
app/api/_mock/               # mock seed·시나리오·handler 지원
```

`_app`은 Next의 `app/`이 아니다. `src/_app`은 FSD 조립 레이어이고, `app/`은 Next가 예약한 App Router 디렉터리다. 같은 충돌을 피하려 FSD Pages는 `src/_pages`에 두며 `src/pages`는 만들지 않는다. 이는 `docs/architecture/layers.md`의 명명 규칙과 일치한다.

하향 의존은 `_app → widgets → features → entities → shared`와 `_pages → features/entities/shared`로 제한한다. 슬라이스 밖 접근은 `index.ts`의 named export만 쓴다. `export *`와 빈 폴더·미사용 barrel은 허용하지 않는다. `app/**`은 `depcruise src` 스캔 밖이므로, route의 slice import와 조립 테스트로 별도 관리한다.

### Alternatives — 선택하지 않은 안

| 대안                                                 | 판단   | 반려 사유                                                                                                    |
| ---------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| header를 `_app`에 둠                                 | 반려   | provider 조립 안에 count 표시가 숨고 삭제 응집성이 약해진다.                                                 |
| cart/wishlist를 entity 또는 shared 단일 store로 유지 | 반려   | 두 행동의 독립 소유권을 흐리고 shared 독립성 의도와 맞지 않는다.                                             |
| queryOptions를 entity에 모음                         | 반려   | 각 페이지 한 곳만 소비한다. pages-first 원칙에 반한다.                                                       |
| domain typed fetch를 `shared/api`에 둠               | 반려   | page 응답 타입을 import하여 `shared-is-independent`를 깨뜨린다.                                              |
| mock을 shared/api에 둠                               | 반려   | frontend가 mock 내부에 결합되고 shared가 위 레이어를 알게 된다.                                              |
| 페이지별/전역 error boundary                         | 반려   | client-fetch에 단일 `(commerce)` 그룹 경계면 충분하다.                                                       |
| `loading.tsx` 추가                                   | 비채택 | 데이터는 RSC segment 대기가 아닌 클라이언트 TanStack Query로 가져오며 기존 skeleton이 관찰 가능한 로딩 UX다. |

## 3. Data Model — 상태 분류와 소유권

| 상태 분류       | SoT             | 현재/목표 소유자                                                | 보존 규칙                                                                     |
| --------------- | --------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 서버 상태       | TanStack Query  | `queries.ts` → 각 `_pages/*/api` queryOptions                   | 응답을 Zustand에 복사하지 않는다.                                             |
| URL 상태        | nuqs            | `use-list-query.ts` → `_pages/product-list/model`               | `q/category/sort/page`, `history: "push"`, page-reset·no-op guard를 보존한다. |
| 클라이언트 상태 | Zustand         | commerce 단일 store → add-to-cart·toggle-wishlist feature model | Set 기반 toggle과 derived count를 분리 보존한다.                              |
| 로컬 UI 상태    | React component | 각 화면/컴포넌트                                                | 다른 SoT를 다시 미러링하지 않는다.                                            |
| mock 상태       | `app/api/_mock` | catalog/home/products와 scenario                                | `empty/error`는 API 테스트용이며 사용자 URL 계약이 아니다.                    |

캐시 정책은 의미 있는 동작 계약이다. home은 `staleTime: 300000`, `gcTime: 600000`, product-list는 `staleTime: 60000`, `gcTime: 300000`을 **값까지 그대로** 유지한다. 이동은 query key·queryFn·캐시 정책을 바꾸지 않는다.

### 애매한 파일 결정표

| 현재 파일             | 목표 위치                                            | 결정             | 근거                                                                |
| --------------------- | ---------------------------------------------------- | ---------------- | ------------------------------------------------------------------- |
| `providers.tsx`       | `src/_app/providers.tsx`                             | 이동             | QueryClient, Suspense/NuqsAdapter, Header를 조립하는 전역 껍데기다. |
| `product-actions.tsx` | 두 feature button으로 분할 후 삭제                   | 분할/재작성      | cart·wishlist는 독립 행동이며 ProductCard의 상향 의존을 제거한다.   |
| `commerce.module.css` | 각 소비자의 module.css                               | 분할             | CSS 소유권을 Header·페이지·카드 소비자에 맞춘다.                    |
| `api/types.ts`        | entities, 각 page api, shared/api, mock types로 분할 | 분할             | 도메인·응답·transport·mock 타입의 소비자가 다르다.                  |
| `use-list-query.ts`   | `_pages/product-list/model`                          | 이동             | URL parser와 reset/page 규칙은 목록 화면 전용이다.                  |
| `api/catalog.ts`      | `app/api/_mock/catalog.ts`                           | 이동             | seed와 지연은 backend simulation 전용이다.                          |
| `product-card.tsx`    | `entities/product/ui`                                | 재작성 포함 이동 | `actions?: ReactNode` slot을 받아 순수 표시 컴포넌트가 된다.        |

## 4. Interface — public API와 은닉

| slice                      | 공개 API                                                    | 숨기는 내부 구현                                                      |
| -------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------- |
| `_app`                     | `CommerceProviders`                                         | QueryClient 생성·Suspense 조립                                        |
| `_pages/home`              | `HomeView`, `HomeResponse`, `homeQueryOptions`              | `fetchHome`, section 내부 UI                                          |
| `_pages/product-list`      | `ListView`, 목록 contract type, `isProductSort`             | `fetchProductList`, `useListQuery`, parser, filter/pagination 내부 UI |
| `widgets/header`           | `Header`                                                    | markup·style 세부                                                     |
| `features/add-to-cart`     | button, `useCartCount`                                      | Zustand store 구현·Set 변경 세부                                      |
| `features/toggle-wishlist` | button, `useWishlistCount`                                  | Zustand store 구현·Set 변경 세부                                      |
| `entities/product`         | `ProductCard`, Product/Category/CategoryId, `isCategoryId`  | 카드 markup·category list 구현                                        |
| `shared/api`               | `fetchJson`, `ApiErrorResponse`, `HttpError`, `isHttpError` | transport 구현 세부                                                   |

feature store를 테스트·상위 조립에서 직접 reset해야 하는 경우만 `app/(commerce)/home-list-sync.test.tsx`가 `model/store`를 의도적으로 깊게 import한다. 이는 cross-slice를 조립하는 테스트의 한정된 예외이며, 실행 코드의 public API 규칙은 유지한다.

## 5. Optimization — 에러·로딩·검증 전략

### 에러 처리: 마이그레이션 전과 구현 결과

| 구분         | 마이그레이션 전 UX/표현                       | 구현 결과                                                                                | 전파하는가 |
| ------------ | --------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------- |
| 5xx HTTP     | status 없는 `Error`, view의 `isError` 인라인  | `HttpError(status >= 500)`를 각 page query의 `throwOnError`가 route boundary로 전파한다. | 예         |
| network 실패 | status 없는 `Error`, 인라인                   | `fetch`가 던진 원래 `Error`(non-`HttpError`)를 그대로 route boundary로 전파한다.         | 예         |
| 4xx HTTP     | 현재 API에는 세분 정책 없음, 인라인 오류 경로 | `HttpError(status < 500)`는 view에서 인라인 오류와 재시도 버튼으로 처리한다.             | 아니오     |
| empty 응답   | 빈 결과 UI                                    | view가 인라인 empty UI로 처리한다.                                                       | 아니오     |

구현은 `homeQueryOptions`와 `productListQueryOptions`에 각각 `throwOnError: (error) => (isHttpError(error) ? error.status >= 500 : true)`를 둔다. `HttpError`의 status가 500 이상이면 route boundary `app/(commerce)/error.tsx`로 전파하고, status가 500 미만이면 view에 남긴다. `fetch`가 거부되면 `fetchJson`은 별도 typed network class로 변환하지 않고 원래 `Error`를 그대로 전파하므로, non-`HttpError`는 boundary로 전파한다. 전역 `defaultOptions`에는 이 정책을 두지 않는다.

`app/(commerce)/error.tsx`의 재시도 버튼은 `useQueryErrorResetBoundary().reset()`과 Next `reset()`을 각각 한 번 호출한다. Query cache의 error 상태와 Next route boundary를 모두 재설정해야 전체 새로고침 없이 재시도할 수 있다. `unstable_retry()`는 client-fetch에 불필요한 refresh라 사용하지 않는다. 같은 segment의 `layout.tsx`는 `error.tsx`가 감싸지 않으며, Header는 `CommerceProviders`가 layout 안에서 렌더링하므로 boundary fallback에서도 남는다.

TDD는 `HttpError`와 guard, 두 page query의 `throwOnError` predicate, boundary의 두 reset 호출, home/list의 5xx·network 전파를 대상으로 했다. RED 증거는 [error-boundary/red.txt](/Users/toong/.omt/loop-pack-fe-l2-vol1/evidence/week06-fsd-migration/error-boundary/red.txt)로, 구현 전 7파일의 10개 실패를 기록한다. GREEN 증거는 [error-boundary/green.txt](/Users/toong/.omt/loop-pack-fe-l2-vol1/evidence/week06-fsd-migration/error-boundary/green.txt)로, targeted 7파일/68테스트와 전체 40파일/226테스트 통과를 기록한다. 브라우저 검증은 아직 수행하지 않았으며, 최종 QA에서 `network route "**/api/products*" --abort` 후 boundary와 Header를 확인하고, `network unroute` 뒤 reset을 눌러 reload 없이 회복하는지 검증한다.

### Advanced A와 depcruise

기존 1단계 경로 정규식은 2단계 FSD slice를 인식하지 못한다. 따라서 **구조 이동보다 먼저** harness를 바꾼다. 그렇지 않으면 새 `features → entities` 의존이 옛 `no-cross-feature`에 걸려 단계별 green 조건을 지킬 수 없다.

- 유지: `no-circular`, `shared-is-independent`.
- 교체: `fsd-no-upward`, `$1/$2` 캡처 기반 `fsd-no-cross-slice`, `fsd-entry-point-only`.
- 범위: 여섯 FSD 레이어에서 시작하는 `src/` edge만. 과도기 `src/commerce`와 `src/products`는 새 FSD 규칙의 직접 대상이 아니며, `app/**`은 scan root 밖이다.

#### depcruise violation 재현 — TODO 3 기록

`src/features/tmp/index.ts`에 빈 named export와 `src/entities/tmp/model/violation.ts`의
`../../../features/tmp` import를 임시로 추가한 뒤 실행했다. `entities → features` 상향 edge가
`fsd-no-upward` family의 entities 규칙으로 실패하는 것을 확인했다.

```text
$ pnpm depcruise
  error fsd-no-upward-entities: src/entities/tmp/model/violation.ts → src/features/tmp/index.ts

x 1 dependency violations (1 errors, 0 warnings). 79 modules, 201 dependencies cruised.
ELIFECYCLE Command failed with exit code 1.
```

두 임시 파일을 삭제하고 빈 `src/features/tmp`, `src/entities/tmp/model`, `src/entities/tmp`
디렉터리도 제거한 뒤 다시 실행했다.

```text
$ pnpm depcruise
✔ no dependency violations found (77 modules, 200 dependencies cruised)
```

## 6. Implementation — 31개 파일 매핑

아래 행은 `find src/commerce -type f | wc -l = 31`의 전수 매핑이다. `이동`은 행위 보존 경로 변경, `분할/재작성`은 소유권 또는 contract 변경을 동반한다.

|   # | 현재 파일                  | 목표 위치/처리                                              | 유형        |
| --: | -------------------------- | ----------------------------------------------------------- | ----------- |
|   1 | `api/catalog.ts`           | `app/api/_mock/catalog.ts`                                  | 이동        |
|   2 | `api/fetch.ts`             | `shared/api/fetch.ts`(generic) + 각 `_pages/*/api/fetch.ts` | 분할/재작성 |
|   3 | `api/home.ts`              | `app/api/_mock/home.ts`                                     | 이동        |
|   4 | `api/products.ts`          | `app/api/_mock/products.ts`; guard/sort는 entity/page api   | 분할/재작성 |
|   5 | `api/types.ts`             | entity·page api·shared/api·`app/api/_mock/types.ts`         | 분할/재작성 |
|   6 | `commerce.module.css`      | Header·home·product-list·entity의 module.css                | 분할        |
|   7 | `handler-parity.test.ts`   | `_pages/product-list/api/handler-parity.test.ts`            | 이동        |
|   8 | `header.test.tsx`          | `widgets/header/ui/header.test.tsx`                         | 이동        |
|   9 | `header.tsx`               | `widgets/header/ui/header.tsx`                              | 이동        |
|  10 | `home-list-sync.test.tsx`  | `app/(commerce)/home-list-sync.test.tsx`                    | 이동        |
|  11 | `home-view.test.tsx`       | `_pages/home/ui/home-view.test.tsx`                         | 이동        |
|  12 | `home-view.tsx`            | `_pages/home/ui/home-view.tsx`                              | 이동        |
|  13 | `index.test.ts`            | slice별 public API contract test로 교체                     | 분할/재작성 |
|  14 | `index.ts`                 | slice별 `index.ts` contracts로 교체 후 삭제                 | 분할/재작성 |
|  15 | `list-filter-bar.tsx`      | `_pages/product-list/ui/list-filter-bar.tsx`                | 이동        |
|  16 | `list-pagination.tsx`      | `_pages/product-list/ui/list-pagination.tsx`                | 이동        |
|  17 | `list-view.test.tsx`       | `_pages/product-list/ui/list-view.test.tsx`                 | 이동        |
|  18 | `list-view.tsx`            | `_pages/product-list/ui/list-view.tsx`                      | 이동        |
|  19 | `page-parser.test.ts`      | `_pages/product-list/model/page-parser.test.ts`             | 이동        |
|  20 | `product-actions.test.tsx` | 각 feature button test로 교체                               | 분할/재작성 |
|  21 | `product-actions.tsx`      | 두 feature button으로 분할 후 삭제                          | 분할/재작성 |
|  22 | `product-card.test.tsx`    | `entities/product/ui/product-card.test.tsx`                 | 이동        |
|  23 | `product-card.tsx`         | `entities/product/ui/product-card.tsx` (actions slot)       | 분할/재작성 |
|  24 | `product-section.tsx`      | `_pages/home/ui/product-section.tsx`                        | 이동        |
|  25 | `providers.tsx`            | `_app/providers.tsx`                                        | 이동        |
|  26 | `queries.test.ts`          | home/list page api test로 분할                              | 분할/재작성 |
|  27 | `queries.ts`               | home/list page api queryOptions로 분할                      | 분할/재작성 |
|  28 | `store.test.ts`            | 각 feature model store test로 분할                          | 분할/재작성 |
|  29 | `store.ts`                 | 각 feature `model/store.ts`로 분할 후 삭제                  | 분할/재작성 |
|  30 | `use-list-query.test.ts`   | `_pages/product-list/model/use-list-query.test.ts`          | 이동        |
|  31 | `use-list-query.ts`        | `_pages/product-list/model/use-list-query.ts`               | 이동        |

## 7. Migration — bottom-up 순서와 회귀 방지

1. 기준선 8개를 기록하고 이 RFC를 **첫 단독 commit**으로 둔다.
2. depcruise를 FSD 5-rule set으로 먼저 재작성하고 intentional violation을 fail-then-pass로 증명한다.
3. `shared/api`에서 generic transport와 `ApiErrorResponse`만 분리한다.
4. `entities/product`로 도메인 타입·category guard·slot 기반 ProductCard를 이동하고 mock seed와의 drift guard를 추가한다.
5. cart/wishlist feature store와 button을 분리하고 header를 count hook으로 연결한다.
6. Header widget, 이어서 home/product-list page slice와 CSS·테스트를 이동한다. relative `mocks/render` 7곳과 route import 3곳만 깊이를 재계산한다.
7. mock을 `app/api/_mock`으로 이동하고 `src/`에서 mock 내부 import가 없음을 확인한다.
8. `_app`과 route wiring을 전환하고 `src/commerce`를 삭제한다. 구조 재측정은 scenario 1~8이 기준선과 동일해야 한다.
9. 오류 경계 TDD, Advanced B, 문서 동기화, 최종 QA·삭제 시나리오·architecture review 순서로 진행한다.

각 단계는 `pnpm check`(lint, typecheck, depcruise, test, build, format check)를 통과한다. dev server는 `.next` 경합을 피하려 gate 전에 중지한다. `vitest` 기본 glob과 tsconfig path 설정은 이동 뒤에도 유지되므로 설정 변경은 필요 없다.

### Advanced B — 사전 예측과 구현 결과

"전체 초기화"는 `_pages/product-list/ui/list-filter-bar.tsx`의 버튼이 `model/use-list-query.ts`의 reset을 호출해 URL의 `q`, `category`, `sort`, `page`를 기본값으로 되돌린다. 별도 `features/reset-list-filters`는 feature가 page URL model을 향해 상향 의존하게 되므로 만들지 않았다.

| 구분                 | 사전 예측                                       | 구현 결과                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 변경 반경            | 변경 slice 1개: `_pages/product-list`           | `_pages/product-list` 1개 slice에서만 `model/use-list-query.ts`, `ui/list-filter-bar.tsx`, `ui/list-view.tsx`, `ui/list-view.test.tsx` 4파일을 수정했다(59 insertions, 4 deletions).                                                                                                                                                                                                                                                 |
| public API           | 변경 없음                                       | `_pages/product-list/index.ts`는 수정하지 않아 공개 표면은 불변이다. reset과 버튼 wiring은 slice 내부 구현으로 남는다.                                                                                                                                                                                                                                                                                                               |
| RED → GREEN          | 전체 초기화 동작을 테스트로 추가                | [RED](/Users/toong/.omt/loop-pack-fe-l2-vol1/evidence/week06-fsd-migration/advanced-b/red.txt)는 버튼 부재로 2개 테스트가 실패한 상태를 기록한다. [GREEN](/Users/toong/.omt/loop-pack-fe-l2-vol1/evidence/week06-fsd-migration/advanced-b/green.txt)은 targeted 2파일/57테스트와 `pnpm check`의 전체 40파일/228테스트 통과를 기록한다.                                                                                               |
| 브라우저 URL/history | 비기본 상태는 한 번 push하고, 기본 상태는 no-op | [push/back](/Users/toong/.omt/loop-pack-fe-l2-vol1/evidence/week06-fsd-migration/advanced-b/reset.txt)는 비기본 URL에서 초기화 뒤 `/products`·기본 control·1페이지를 표시하고 history push 1회와 back 복원을 PASS로 기록한다. [기본 상태 no-op](/Users/toong/.omt/loop-pack-fe-l2-vol1/evidence/week06-fsd-migration/advanced-b/noop.txt)은 URL/history entry를 추가하지 않아 한 번의 back이 이전 페이지로 이동함을 PASS로 기록한다. |

### 삭제 시나리오 — TODO 14 기록 예정

placeholder: `toggle-wishlist`를 제거할 때 삭제할 feature slice, ProductCard slot composition 두 곳, Header의 wishlist count 소비를 나열하고 다른 slice에 남은 orphan import가 없음을 `rg`·`pnpm check`로 증명한다.

## 8. Operations — 측정, 승격, 후속 기록

구조 재측정에서는 baseline의 scenario 1\~8을 동일하게 비교한다. 최종 QA에서는 scenario 1\~3·5~8은 동일하고 scenario 4만 새 boundary 정책으로 바뀐다. API smoke, handler parity 7 case, category drift guard, public API tests도 함께 실행한다. 임시 violation stub·temporary error code는 최종 tree에 남기지 않는다.

### Architecture-review 수용/반려 — TODO 15 기록 예정

placeholder: 최종 tree에 architecture-review skill을 실행하고, 지적별 수용/반려·근거·후속 조치를 이 절에 기록한다. 이 RFC만 해당 판정의 SSOT로 삼는다.

### Success criteria

- 최종 FSD tree가 존재하고 `src/commerce`, `src/pages`는 없다. `src/products` diff는 비어 있고 `export *`는 없다.
- RFC commit은 첫 `_pages` 구조 commit의 조상이다. FSD rule 이름 3종 이상이 depcruise에 있고 `pnpm check`가 green이다.
- queryOptions의 `throwOnError`는 두 page API에만 있으며, TEMP/임시 구현은 없다.
- baseline→구조 재측정은 8/8 동일, 최종 오류 정책과 API/상태 시나리오는 문서화된 대로 통과한다.

## 9. 이해확인 Q6

1. 왜 `_app`인가? Next의 `app/`과 FSD App을 구별해 route 오인식을 막고 provider 조립을 한곳에 둔다.
2. 왜 Page가 queryOptions를 갖는가? home/list 각각 한 소비자이며 응답·URL 정책이 화면 계약이기 때문이다.
3. 왜 ProductCard는 action slot인가? entity가 feature를 import하지 않으며 두 page가 행동을 조립할 수 있기 때문이다.
4. 왜 mock은 `app/api/_mock`인가? mock은 backend simulation이고 frontend `src/`가 내부를 import하지 않기 때문이다.
5. 왜 depcruise가 먼저인가? 옛 one-level rule이 새 FSD 하향 edge를 오탐하여 단계별 green을 막기 때문이다.
6. 5xx/network과 4xx/empty의 차이는? 전자는 `throwOnError`로 boundary에 전파하고, 후자는 사용자가 문맥을 잃지 않도록 페이지 인라인 UI로 남긴다.
