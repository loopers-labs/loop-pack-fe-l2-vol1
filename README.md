# Loopers Pack — Frontend L2 Vol.1

Loopers 프론트엔드 과정(TypeScript · React · Next.js)의 과제 제출 & 피드백 레포입니다.
4주차부터 이 레포가 **커머스 프로젝트(Next.js)** 본체가 됩니다.

## 시작하기

필수 도구는 Node.js 24.17.0과 pnpm 10.30.2입니다. `.nvmrc`는 현재 권장 LTS를 고정하고, `package.json`의 Node.js 범위(`>=22.12.0`)는 지원 가능한 Node.js 22 이상을 허용합니다.

```bash
nvm use
pnpm install
pnpm dev
```

`pnpm test`는 전체 Vitest 테스트가 통과해야 완료됩니다. `pnpm check`는 lint, 타입 검사, 의존성 경계, 테스트, 프로덕션 빌드, 포맷 검사를 순서대로 실행하며 모두 통과해야 완료됩니다. GitHub Actions도 pull request와 `main` push에서 같은 검증을 실행합니다.

> Next.js(App Router) + React 19 + TypeScript. (1~3주차 React+Vite 산출물은 각자 개인 브랜치 히스토리에 있습니다.)

## 프로젝트 구조

커머스 코드는 FSD(Feature-Sliced Design)의 **App → Pages → Widgets → Features → Entities → Shared** 여섯 레이어로 둔다. route와 route handler는 루트 `app/`의 Next 경계에만 두고, 화면·상태·UI의 책임은 `src/` 레이어가 소유한다.

```txt
app/                            # Next App Router: 얇은 route·route handler·error 경계
├─ (commerce)/                  # URL 세그먼트를 만들지 않는 커머스 route group
│  ├─ layout.tsx                # <CommerceProviders> 조립
│  ├─ page.tsx                  # "/"의 HomeView public API 연결
│  ├─ products/page.tsx         # "/products"의 ListView public API 연결
│  └─ error.tsx                 # 커머스 error boundary
├─ api/
│  ├─ _mock/                    # route handler가 사용하는 mock catalog·home 데이터
│  ├─ home/route.ts             # GET /api/home
│  ├─ products/route.ts         # GET /api/products
│  └─ product-options/route.ts  # 4주차 상품 옵션 mock API
├─ week-04/page.tsx             # 4주차 화면 보존
├─ layout.tsx                   # root layout
└─ globals.css                  # 전역 CSS
src/
├─ _app/                        # App: QueryClient·Nuqs provider와 공통 shell 조립
├─ _pages/
│  ├─ home/                     # Pages: 홈 화면·홈 API query
│  └─ product-list/             # Pages: 목록 화면·URL/query·페이지네이션
├─ widgets/
│  └─ header/                   # Widgets: 전역 Header UI
├─ features/
│  ├─ add-to-cart/              # Features: AddToCartButton·장바구니 store
│  └─ toggle-wishlist/          # Features: WishlistToggleButton·위시리스트 store
├─ entities/
│  └─ product/                  # Entities: Product 타입·카테고리·ProductCard
├─ shared/
│  ├─ api/                      # Shared: fetch와 HTTP error 기반
│  └─ ui/                       # Shared: dialog·select UI primitive
└─ products/                    # 4주차 legacy 상품 옵션 slice; FSD 레이어와 공존
docs/assignments/                # 주차별 과제 명세
```

- 새 화면은 `src/_pages`에서 시작한다(pages-first). UI는 `ui/`, 상태·규칙은 `model/`, 데이터 호출은 `api/` segment에 콜로케이션한다.
- 일반적인 외부 slice 접근은 각 slice 루트의 named public API(`index.ts`)만 import한다. 내부 파일로의 deep import는 금지한다. 단, Entity 간 불가피한 관계는 producer의 소비자 전용 `@x/<consumer>.ts` 진입점만 예외로 허용한다.
- `src/products`는 4주차 legacy slice다. 새 커머스 코드는 FSD 여섯 레이어에 추가한다.

## 왜 이렇게 했는가

- **screaming architecture**: 폴더 이름이 "무슨 기술이냐"가 아니라 "무슨 기능이냐"를 외치게 한다. `components/`, `hooks/`, `utils/`처럼 기술별로 나누면 기능 하나를 이해하는 데도 여러 폴더를 오가야 한다.
- **YAGNI**: `shared/`로 올리는 기준은 "나중에 쓸 수도 있어서"가 아니라 "지금 이미 둘 이상의 피처가 쓰고 있어서"다. 미리 공용화하지 않는다.
- **규칙이 구조를 강제한다**: `.dependency-cruiser.cjs`는 `pnpm depcruise`의 `depcruise src`로 `src/`만 검사한다. 따라서 FSD 규칙은 여섯 FSD 레이어에서 시작하는 edge에 적용되고, `src/products`에는 path-agnostic한 `no-circular`만 직접 적용된다. 루트 `app/**`은 scan root 밖이다.
  - **방향**: 모든 경로의 순환을 막는 `no-circular`, Shared의 독립성을 지키는 `shared-is-independent`, 그리고 상위 레이어 import를 차단하는 `fsd-no-upward-shared`, `fsd-no-upward-entities`, `fsd-no-upward-features`, `fsd-no-upward-widgets`, `fsd-no-upward-pages`가 App → Pages → Widgets → Features → Entities → Shared 방향을 고정한다.
  - **slice 격리**: `fsd-no-cross-slice`는 `_pages`·`widgets`·`features`·`entities`의 같은 레이어 내 다른 slice 직접 import를 막는다.
  - **public API family**: 일반 slice와 Shared 진입점은 `fsd-entry-point-only-slices`, `fsd-entry-point-only-shared-ui`, `fsd-entry-point-only-shared-api`, `fsd-entry-point-only-shared-api-shared-ui`, `fsd-entry-point-only-shared-ui-internal`, `fsd-entry-point-only-app`, `fsd-entry-point-only-app-shared-ui`가 root `index.ts` 외 deep import를 막는다. Entity 간 불가피한 관계만 `fsd-no-cross-entity-slice`, `fsd-entry-point-only-entity-slices`가 producer의 소비자 전용 `@x/<consumer>.ts`를 허용한다.

## 상태 소유권

5주차 커머스 기능(홈과 상품 목록)은 상태를 종류별로 네 곳에 나눠 둔다. 기준은 하나다. **원본(source of truth)이 있는 곳에 상태를 둔다.** 원본이 서버에 있으면 TanStack Query, 원본이 URL이어야 하면(공유하거나 새로고침하거나 뒤로가기로 복원돼야 하는 조건) nuqs, 원본이 클라이언트에만 있고 여러 화면이 함께 읽고 써야 하면 Zustand, 원본이 한 컴포넌트 수명 안에서만 의미 있으면 React 로컬 state로 둔다.

구현을 시작하기 전에 상태와 소유자, 수명, 공유 범위, 선택 이유를 다음 표로 먼저 정리했다.

| 상태                                                    | 소유자                                           | 수명                                                                   | 공유 범위                                            | 선택 이유                                                                                                                     |
| ------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 서버 데이터(홈 응답, 상품 목록)                         | TanStack Query                                   | `staleTime`과 `gcTime`으로 캐시 수명을 관리(홈 5분/10분, 목록 1분/5분) | `QueryClientProvider`를 구독하는 모든 화면(홈, 목록) | 원본이 서버이므로 조회 상태와 캐싱, 재검증을 자체 관리하는 라이브러리에 맡기고 클라이언트에 복제하지 않는다                   |
| URL 복원 조건(`q`, `category`, `sort`, `page`)          | nuqs                                             | URL이 존재하는 동안 유지되고 새로고침이나 공유에도 남는다              | 이 URL을 여는 모든 사용자, 같은 브라우저의 앞뒤 이동 | 공유하거나 새로고침하거나 뒤로가기로 복원돼야 하는 조건의 원본은 URL이라 타입 있는 URL 상태 훅으로 관리한다                   |
| 비로그인 전역 클라이언트 상태(`cartIds`, `wishlistIds`) | Feature별 Zustand store                          | 탭과 세션 동안 유지되고 새로고침 시 초기화(`persist` 미적용)           | `Header`, `AddToCartButton`, `WishlistToggleButton`  | 여러 화면(홈, 목록)이 같은 담김과 찜 상태를 동시에 읽고 써야 하나, 두 사용자 행위의 상태를 각각 해당 Feature slice가 소유한다 |
| 제출 전 검색어 draft                                    | React 로컬 state(`list-filter-bar`의 `useState`) | 컴포넌트 마운트 동안, 제출 시 URL의 `q`로 반영되고 이후 폐기           | `list-filter-bar` 내부에만                           | 한 화면 수명의 입력이라 전역화할 이유가 없고, 타이핑마다 URL을 쓰면 히스토리가 오염된다                                       |

### 캐시 수명(`staleTime`과 `gcTime`) 근거

홈은 `staleTime` 5분(300000ms), `gcTime` 10분(600000ms)이다. 배너와 카테고리처럼 거의 바뀌지 않는 편집 데이터라 캐시를 길게 유지해도 최신성 손실이 적다. 목록은 `staleTime` 1분(60000ms), `gcTime` 5분(300000ms)이다. 검색과 카테고리, 정렬, 페이지 조합마다 별도 캐시 엔트리가 쌓이므로 `gcTime`을 짧게 잡아 더 이상 쓰지 않는 조합의 메모리를 빠르게 되돌린다.

### store 데이터 형태와 selector 경계

`features/add-to-cart/model/store.ts`는 `cartIds: Set<string>`과 `toggleCart`를, `features/toggle-wishlist/model/store.ts`는 `wishlistIds: Set<string>`과 `toggleWishlist`를 각각 소유한다. 두 store 모두 `Product` 객체는 담지 않는다. 상품 데이터의 원본은 서버이고 TanStack Query가 소유하므로, store가 `Product`를 복제해 담으면 같은 데이터에 두 번째 원본이 생긴다.

selector 경계도 필요한 값만 구독하도록 나눈다. `Header`는 `useCartCount`와 `useWishlistCount`로 각각의 개수를 구독하고, `AddToCartButton`과 `WishlistToggleButton`은 자신이 소유한 store에서 해당 상품의 상태와 action만 구독한다. 담기 버튼 하나를 눌러도 그 상품 카드와 헤더만 리렌더되고, 목록에 함께 렌더된 다른 상품 카드는 영향받지 않는다.

### 전역으로 올리지 않은 상태

검색어 draft와 모달 열림 여부는 전역으로 올리지 않는다. 두 값 모두 원본이 한 컴포넌트 수명 안에만 의미가 있다. 검색어 draft는 제출 전까지만 그 화면에 존재하고 제출되면 URL의 `q`로 대체되며, 모달 열림 여부는 그 모달을 띄운 컴포넌트가 사라지면 함께 사라져야 하는 값이다. 여러 화면이 동시에 읽거나 써야 할 이유가 없는 상태를 Zustand로 올리면, 실제로는 로컬인 상태가 전역 변경을 트리거해 무관한 컴포넌트까지 리렌더시킬 위험만 생긴다.

### 위시리스트와 로그인, 서버 동기화

로그인과 서버 동기화가 도입되면 위시리스트의 원본이 서버로 옮겨간다. 그 시점에는 로컬 익명 상태(현재 Zustand가 들고 있는 `wishlistIds`)를 계정 데이터에 합칠지, 버릴지, 충돌을 어떻게 처리할지부터 정해야 한다. 그 결정이 끝난 뒤 Zustand의 역할은 두 가지 중 하나로 좁혀진다. 서버 뮤테이션이 확정되기 전의 임시 입력(optimistic 버퍼)이거나, 서버 데이터와 무관한 순수 UI 상태(예: 방금 찜한 아이템의 하이라이트 애니메이션 플래그)다. 지금처럼 위시리스트 자체의 원본으로 남을 수는 없다.

### 컴포넌트 경계: ProductCard와 Feature 버튼

상품 카드는 표시 전용 `ProductCard`로 두고, 담기와 찜은 각각 `AddToCartButton`, `WishlistToggleButton` Feature가 맡는다. 기준은 변경 이유가 다르다는 것이다. 카드 레이아웃(이미지, 이름, 가격)은 디자인 변경으로 바뀌고, 담김·찜 상태는 사용자 조작(Zustand 토글)으로 바뀐다. `ProductCard`는 store를 구독하지 않는 순수 표시 컴포넌트이고, 각 Feature 버튼만 자신의 selector를 구독한다. 카드 자체가 store를 구독하면 담기 버튼 하나를 누를 때마다 목록에 렌더된 카드 30개 전부가 리렌더된다.

### 데이터 정확성 검증의 1차 안전망

MSW 핸들러는 응답을 직접 합성하지 않고 실제 라우트 핸들러(`app/api/products/route.ts`와 `app/api/home/route.ts`)의 `GET`에 위임한다. 그래서 데이터 정확성(검증과 정렬, 페이지네이션)의 1차 안전망은 `app/api/products/route.test.ts`이고, 컴포넌트 렌더 스위트(`list-view`, `home-view` 등 상위 테스트)가 픽스처 파생 값(예: `총 30개`)을 단정하는 것은 데이터 정확성을 다시 검증하려는 목적이 아니라 그 계약이 화면에 올바르게 배선됐는지 관찰하는 수단이다. 다만 이 수단이 픽스처에 결합돼 있어, 카탈로그(픽스처)가 바뀌면 `route.test.ts`뿐 아니라 상위 스위트도 함께 깨진다.

### `use-list-query` 검증 표면

`use-list-query` 훅은 `renderHook`으로 직접 부르지 않는다. 이 훅의 사용자는 `list-view` 컴포넌트이므로, 훅의 동작(URL 파싱, `page` 리셋, 요청 직렬화)은 `list-view` 렌더 스위트를 통해 검증한다. `page-parser`와 `use-list-query` 두 단위 스위트는 파서 표와 모듈 표면(named export, 모듈 스코프 상수)만 다룬다.

`page` 리셋(검색이나 카테고리, 정렬 변경 시 `page`를 1로 되돌리는 동작)의 소유 위치는 **훅 내부 불변식**이다. `setQuery`에 넘기는 partial에 `q`, `category`, `sort` 중 하나라도 있으면 훅이 `page: 1`을 함께 넣는다. 호출자(`list-filter-bar` 등)의 규약으로 두지 않는 이유: 그러면 `list-filter-bar`가 `setQuery({ q })`만 호출해도 통과해버려 리셋 로직이 지켜지는지 아무도 강제하지 않는다. 이 배치가 고정하는 것은 "`page: 1`이 한 곳에만 존재한다"가 아니라 "호출자가 리셋 로직을 복제하지 않는다"이다. `list-view.tsx`의 범위 초과 복구 버튼(`setQuery({ page: 1 })`)은 리셋 불변식과 다른 동작(사용자 조작에 의한 1페이지 이동)이라 별도로 존재한다.

### URL 상태 정규화 미적용 근거

[`docs/react/url-state.md`](./docs/react/url-state.md) 1절은 마운트 시 URL 파라미터가 허용 스키마를 벗어나면 strip하고 `replace`로 쓰라고 규정한다. 이번 목록 화면은 이 절을 구현하지 않는다. `useQueryStates(LIST_QUERY_PARSERS)`가 `q`, `category`, `sort`, `page` 4개 키만 선언적으로 읽고 쓰고, 파서 맵에 없는 키는 nuqs가 아예 건드리지 않는다. "스키마 밖 키를 걸러 앱 상태로 들여보내지 않는다"는 1절의 목적은 파서 맵을 4개로 제한하는 것만으로 이미 달성되어 있어, 그 위에 별도의 strip과 `replace` 로직을 얹을 필요가 없다.

귀결: 스키마 밖 쿼리 키(예: 오타나 외부 유입 트래킹 파라미터)는 strip되지 않으므로 URL에 그대로 남는다. 이것이 문제가 되지 않는 이유는 그 키들이 애초에 `use-list-query`나 API 요청 어디에도 읽히지 않기 때문이다. 목록 요청은 파싱된 5필드만 재직렬화해서 보내므로, 잔존하는 미지 키는 눈에 보이는 URL 잡음일 뿐 상태나 요청에 영향을 주지 않는다. 알려진 4개 키 자체의 값 정규화(범위를 벗어난 `category`, 비정상 `page` 등)는 각 파서(예: `page` 클램프)와 서버 라우트 검증이 이미 맡고 있어, 별도의 마운트 정규화 단계가 벌 수 있는 값도 없다.

### Suspense 경계와 정적 프리렌더

nuqs의 `useQueryStates`는 내부에서 `useSearchParams()`를 호출한다. Next.js는 정적 프리렌더 중 `useSearchParams()`를 만나면 `BailoutToCSRError`로 해당 트리를 클라이언트 렌더로 강등하는데, 이 강등을 막으려면 `useSearchParams()`를 쓰는 서브트리를 Suspense로 감싸야 한다. `next dev`는 이 에러를 조기 반환해 브라우저 화면으로는 드러나지 않으므로, 관찰할 수 있는 유일한 표면은 `pnpm build`(정적 생성 로그의 `missing-suspense-with-csr-bailout`)뿐이다. 그래서 `CommerceProviders`는 `NuqsAdapter`를 `Suspense fallback={null}`로 감싼다.

`fallback`을 `null`로 둔 이유: 이 Suspense 경계는 공유 `layout.tsx`에 있어 `/`와 `/products` 양쪽 자식을 함께 감싼다. 목록 전용 스켈레톤을 fallback으로 넣으면 홈 첫 페인트에서도 잠깐 상품 그리드 스켈레톤이 보이는 화면 버그가 생긴다. 눈에 보이는 pending 상태는 각 화면이 TanStack Query의 `isPending`으로 직접 그린다. 이 경계는 프리렌더 요건을 만족시키는 용도로만 쓴다.

**결정: `/`는 정적(`○`)으로 프리렌더된 상태를 유지한다.** `Header`를 이 Suspense 경계 밖에 둬 nuqs 훅 없이 서버에서 렌더되게 했으므로 `/`는 그대로 정적 페이지로 남는다. 이후 `dynamic = "force-dynamic"`이나 서버 프리페치를 추가하면 이 결정이 깨진다. 라우트 전환을 검증하는 빌드 산출물 검사(프리렌더된 `/` HTML이 존재하고 그 안에 `href="/products"`를 포함하는지 확인하는 검사)가 프리렌더된 HTML을 직접 읽으므로, 그런 변경을 하려면 그 검사부터 함께 고쳐야 한다.

## AI 생성 범위

5주차 커머스 상태 관리 구현(`src/_app`, `src/_pages`, `src/widgets`, `src/features`, `src/entities`, `src/shared`와 관련 테스트, 이 설계 문서를 포함한 README 변경)은 Claude Code로 생성하고 직접 리뷰했다. 상태를 어느 라이브러리가 가질지에 대한 판단은 이 문서에 근거를 남겨 직접 검토했고, 구현이 그 판단대로 동작하는지는 `pnpm check`(lint, 타입, `depcruise`, 테스트, 빌드, 포맷)로 기계적으로 재확인한다.

### 시각 회귀 테스트

이번 범위에서 시각 회귀(visual regression) 테스트는 **비활성(DEFERRED)**이다. `.github/workflows/**`는 AI 편집이 차단되어 있어 CI 워크플로에 `container:`를 지정할 수 없고, 로컬 Docker baseline은 CI의 렌더 스택과 달라(한글 텍스트가 지배적인 화면에서는 폰트 폴백 차이가 곧 픽셀 차이로 나타난다) 로컬에서 2회차 런이 green이어도 CI green을 보장하지 못한다.

**활성 조건**: (a) `.github/workflows/ci.yml`에 `container:`를 지정해 CI 렌더 스택을 고정하거나, (b) baseline을 CI 환경에서 `--update-snapshots`로 직접 생성한다. 두 조건 모두 사람의 결정과, AI 편집이 차단된 파일 수정이 필요하다.

### Advanced 항목

D(상태 아키텍처 테스트) 4항목 전부와 C(사용자 경험 개선)의 한 항목을 했다. A(상태 영속화)와 B(App Router 서버 프리패치)는 하지 않았다.

**D: 상태 아키텍처 테스트**

| 과제 항목                      | 검증 위치                                                                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Zustand action과 selector      | Feature별 `store.test.ts`(토글 왕복, 새 Set 교체), `add-to-cart-button.test.tsx`와 `wishlist-toggle-button.test.tsx`(selector 구독 결과가 `aria-pressed`에 반영되는지)               |
| Header 개수 파생               | `header.test.tsx` 5개. store에 값을 넣고 `Header`만 렌더해 개수가 따라오는지                                                                                                         |
| nuqs URL 조건과 query key 일치 | `queries.test.ts`가 5필드 각각이 queryKey를 바꾸는지 단정하고, `list-view.test.tsx`가 MSW Life-cycle events API로 실제 요청 쿼리를 캡처해 URL 조건이 요청에 그대로 나가는지 단정한다 |
| 홈과 목록의 store 동기화       | `home-list-sync.test.tsx`                                                                                                                                                            |

선택 이유: 상태 소유권 4분할이 이번 과제의 본체인데, 그 경계가 지켜지는지는 코드를 읽어서 알 수 없다. `AddToCartButton` 또는 `WishlistToggleButton`이 로컬 `useState`로 상태를 들고 있어도 화면 하나만 보는 스위트는 전부 통과한다. 홈과 목록, `Header`를 한 트리에 렌더해 공통 상품(p26)을 한 번만 토글하는 `home-list-sync.test.tsx`만이 그 오귀속을 잡는다. 카드가 2장인데 헤더 개수가 1이어야 한다는 단정이 판별력의 핵심이다.

추가한 복잡도: 새 DOM이나 E2E 환경은 넣지 않았다. Vitest와 React Testing Library, MSW, happy-dom은 이전 주차에 이미 있었고, QueryClient와 `NuqsTestingAdapter`를 주입하는 테스트 렌더 헬퍼만 추가했다.

**C: 전체 페이지를 새로고침하지 않는 오류 재시도**

network·5xx는 각 page query의 `throwOnError`가 커머스 route boundary로 전파한다. fallback은 상세 오류 대신 고정 사용자 문구를 보이고, 재시도에서 TanStack Query의 error boundary reset과 Next `reset()`을 차례로 호출해 전체 페이지 새로고침 없이 같은 route를 다시 시도한다. 4xx와 empty는 사용자가 현재 화면 문맥을 잃지 않도록 화면 내 inline 상태로 남기며, 4xx 오류 UI의 재시도는 해당 query를 다시 요청한다. `error.test.tsx`가 두 reset 호출과 고정 문구를, `home-view.test.tsx`와 `list-view.test.tsx`가 inline 재시도 후 성공 화면 전환을 단정한다.

C의 나머지 네 항목(검색어 debounce, 다음 페이지 prefetch, 목록 이동 전 prefetch, 페이지 변경 중 기존 목록 유지)은 하지 않았다.

### 검증 결과: 새로고침, URL 공유, 앞뒤 이동, 페이지 이동

브라우저 QA로 네 시나리오를 직접 확인했다(전체 조작 순서와 스크린샷은 [`docs/qa/week-05`](./docs/qa/week-05) 참고). **URL 공유**는 새 세션에서 `/products?q=스탠리&sort=price-asc`를 열면 두 조건이 유지된 채 상품 4개가 렌더되고 검색창에도 '스탠리'가 채워진다(QA-1). **앞뒤 이동**은 페이지와 정렬, 카테고리 변경을 거친 히스토리 7상태와 앞으로 3회 모두 URL이 각 단계와 정확히 일치했고(QA-2), 뒤로가기 시 검색창 값도 URL의 `q`로 재동기화됐다(QA-4).

**새로고침**은 URL 복원 조건과 비로그인 전역 상태의 소유권 분리를 그대로 드러낸다. URL 조건(`?q=스탠리`)은 새로고침 후에도 유지되지만, Zustand가 들고 있는 장바구니와 위시리스트 개수는 담아둔 값과 무관하게 0으로 초기화된다(QA-3). 위 표의 "탭과 세션 동안 유지되고 새로고침 시 초기화(`persist` 미적용)"가 실제로 관찰된 결과다. **페이지 이동**은 이 초기화가 "문서 교체" 자체에서 온다는 것을 대조로 보여준다. 헤더의 '상품' 링크로 이동하거나(QA-5) 카테고리 칩으로 `/products?category=home`에 도달해도(QA-6) 장바구니와 위시리스트 개수는 유지된다. 새로고침이 문서를 교체해 상태를 날린 것과 달리, 클라이언트 라우팅은 문서를 교체하지 않는 soft navigation이므로 Zustand 상태가 그대로 살아남는다.

## 주차별 과제

- 과제 명세는 `docs/assignments/week-0N.md` 에 있습니다.

## 새 주차 과제 받기

각 주차 과제는 이 메인 레포에 업데이트됩니다. 새 과제가 올라오면 **본인 포크의 `main`을 이 레포(upstream)와 동기화**해 받으세요.

- 간단히: 포크한 GitHub 레포 페이지의 **Sync fork** 버튼.
- CLI: `git remote add upstream https://github.com/loopers-labs/loop-pack-fe-l2-vol1.git` 등록 후 `git fetch upstream && git switch main && git merge upstream/main`.

## 제출

1. 이 레포를 **포크**한다.
2. 포크에서 주차 작업 브랜치를 만든다 (예: `feat/week-04`).
3. 과제를 진행하고 커밋·푸시한다 (본인 포크에).
4. **메인 레포로 PR**을 연다. PR 템플릿(이번 주 학습 / 피드백 받고 싶은 부분)을 채운다.
5. 모든 PR이 한곳에 모이므로 서로 리뷰하고, 코치 피드백 + 다음 세션 구두 방어로 이어진다.
