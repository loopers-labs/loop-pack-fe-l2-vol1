# Loopers Pack — Frontend L2 Vol.1

Loopers 프론트엔드 과정(TypeScript · React · Next.js)의 과제 제출 & 피드백 레포입니다.
4주차부터 이 레포가 **커머스 프로젝트(Next.js)** 본체가 됩니다.

## 7주차 성능 개선 사례

느린 Home API가 Hero의 DOM 삽입과 이미지 발견을 늦췄고, 원본 Hero는 `7,545,525 bytes`를 전송했습니다.

적용 범위는 다음과 같습니다.

- semantic shell로 API 응답 전에도 의미와 Hero 영역을 제공하고 최종 레이아웃의 geometry를 예약했습니다.
- responsive Hero delivery로 전송량을 desktop `80,836 bytes`, mobile `32,294 bytes`로 줄였습니다.
- 상품 목록의 여섯 상태와 대체 요청 취소 시 최신 URL·상태·결과의 무결성을 검증했습니다.
- metadata, non-blocking prefetch/hydration과 초기 HTML 계약을 정리했습니다.

| 지표 | Before          | After       | 판정                            |
| ---- | --------------- | ----------- | ------------------------------- |
| FCP  | `237.7291ms`    | `208.782ms` | Before 범위 내 변화로 결론 보류 |
| LCP  | `6981.484125ms` | `693.173ms` | 개선 방향 확인                  |
| CLS  | `0`             | `0`         | 변화 없음                       |

회귀 검증은 기능, URL/state, responsive, 접근성, 시각 품질, hydration, CLS, FSD와 quality gate를 함께 다뤘습니다.

`f4167e9`는 mobile 품질 문제로 rejected 처리했고, preload/priority gate는 source 실험 없이 닫았습니다. Advanced A는 median total `120ms < 200ms`여서 **NOT ENTERED**입니다.

상세 근거: [전체 RFC](docs/rfc/week07-performance.md) · [Hero 실험](docs/rfc/week07-performance.md#hero-실험과-결정) · [After](docs/rfc/week07-performance.md#after) · [회귀 검증](docs/rfc/week07-performance.md#회귀-검증) · [Advanced gate](docs/rfc/week07-performance.md#advanced-a-진입-게이트)

## 시작하기

필수 도구는 Node.js 24.17.0과 pnpm 10.15.1입니다. `.nvmrc`는 현재 권장 LTS를 고정하고, `package.json`의 Node.js 범위(`>=22.12.0`)는 지원 가능한 Node.js 22 이상을 허용합니다.

```bash
nvm use
pnpm install
pnpm dev
```

`pnpm test`는 전체 Vitest 테스트가 통과해야 완료됩니다. `pnpm check`는 테스트, lint, 타입 검사, 프로덕션 빌드를 순서대로 실행하며 네 단계가 모두 통과해야 완료됩니다. GitHub Actions도 pull request와 `main` push에서 같은 `pnpm check`를 실행합니다.

> Next.js(App Router) + React 19 + TypeScript. 1~3주차 React+Vite 산출물은 개인 브랜치 히스토리에 남아 있습니다.

## 구조

```txt
src/
  app/                           # Next App Router entry
    api/
      _data/
        commerce.ts
      home/
        route.ts
      products/
        route.ts
    products/
      error.tsx
      loading.tsx
      page.tsx
    error.tsx
    favicon.ico
    globals.css
    layout.tsx
    page.tsx
    providers.tsx
  shared/
    ui/
      select/                    # Select (Headless) — 4주차 1단계
        components/
        lib/
        types/
      dialog/                    # Dialog (Compound) — 4주차 2단계
docs/assignments/                # 주차별 과제 명세
```

> Next entry와 라우트 파일은 `src/app`에, 재사용 가능한 UI와 도메인 기능은 하위 FSD 레이어에 둡니다.

## 주차별 과제

- [1주차 — 코드 리뷰 & AI 협업 환경 구축](docs/assignments/week-01.md)
- [3주차 — 관심사 분리 & Custom Hook](docs/assignments/week-03.md)
- [4주차 — Next.js 커머스 프로젝트 골격](docs/assignments/week-04.md)
- 새 과제가 올라오면 **본인 포크의 `main`을 이 레포(upstream)와 동기화**해 받으세요.
  - GitHub: 포크 레포의 **Sync fork** 버튼
  - CLI: `git fetch upstream && git switch main && git merge upstream/main`

## 코드 품질 하네스

이 프로젝트는 AI가 생성한 코드도 동일한 기준으로 검증하기 위해 ESLint,
Prettier, Husky, lint-staged를 사용합니다.

### ESLint

ESLint는 포맷보다 코드 품질과 버그 가능성 검출에 집중합니다.

주요 설정은 다음과 같습니다.

- Next.js flat config(`core-web-vitals`, `typescript`)를 기본 baseline으로 사용합니다.
- TypeScript strict type-aware rules로 타입 회피와 불명확한 코드를 줄입니다.
- React Hooks / React Compiler lint rules로 Hook 호출 순서, dependency 누락, 렌더 중 state 변경, effect 내 동기 state 변경을 감지합니다.
- React JSX rules로 JSX 보안 및 React 작성 관습을 점검합니다.
- jsx-a11y로 접근성 문제를 정적으로 점검합니다.
- unused-imports / simple-import-sort로 사용하지 않는 import를 제거하고 import 순서를 일관되게 유지합니다.
- Next 라우트 파일(`src/app/**/{page,layout,loading,error,not-found}.tsx`)은 프레임워크 계약상 default export를 허용합니다.

### Prettier

Prettier는 코드 포맷팅만 담당합니다. ESLint와 포맷 책임이 겹치지 않도록
`eslint-config-prettier`를 사용합니다.

### Git Hook

커밋 전 `lint-staged`를 실행합니다.

- 변경된 TS/TSX 파일: ESLint 자동 수정 후 Prettier 적용
- 변경된 JS/JSON/CSS/MD 파일: Prettier 적용

검사를 통과하지 못하면 커밋되지 않습니다.

### Scripts

```bash
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm typecheck
pnpm build
```

- `pnpm lint`: 전체 소스 ESLint 검사
- `pnpm lint:fix`: 자동 수정 가능한 ESLint 문제 수정
- `pnpm format`: Prettier로 포맷 적용
- `pnpm format:check`: 포맷 위반 여부 확인
- `pnpm typecheck`: Next 단일 TypeScript 프로젝트 타입 검사
- `pnpm build`: Next production 빌드

## 제출

1. 이 레포를 **포크**한다.
2. 포크에서 주차 작업 브랜치를 만든다 (예: `feat/week-04`).
3. 과제를 진행하고 커밋·푸시한다 (본인 포크에).
4. **메인 레포로 PR**을 연다. PR 템플릿(이번 주 학습 / 피드백 받고 싶은 부분)을 채운다.
5. 모든 PR이 한곳에 모이므로 서로 리뷰하고, 코치 피드백 + 다음 세션 구두 방어로 이어진다.

> PR은 **메인 레포(upstream)로** 올립니다 — 모두의 PR이 한곳에 모여 서로 리뷰할 수 있습니다. (협력자 추가는 필요 없습니다.)

## 5주차 과제 기록 — 상태관리 아키텍처

> 홈과 상품 목록을 만들며 서버·URL·클라이언트 상태의 경계를 직접 정의합니다.

### 상태 분류 표

| 상태                                                     | 소유자                                         | 수명                                      | 공유 범위                            | 선택 이유                                                                                                 |
| -------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| 홈 데이터(banner·categories·popularProducts·newProducts) | TanStack Query(서버 상태)                      | staleTime 동안 캐시, 이후 재조회          | 홈 화면                              | 원본은 서버. 내가 소유하지 않는 스냅샷이므로 Query 캐시에 맡기고 staleTime으로 신선도를 관리한다          |
| 상품 목록(products·totalCount·page·pageSize)             | TanStack Query(서버 상태)                      | query key별로 캐시, staleTime 이후 재조회 | 목록 화면                            | 검색·카테고리·정렬·페이지 조건이 query key에 반영되어 조건별 캐시를 재사용한다                            |
| 카테고리 목록                                            | TanStack Query(서버 상태, 홈·목록 쿼리에 포함) | 홈·목록 쿼리 캐시 안에서 함께 보관        | 홈·목록                              | 별도 쿼리로 분리하지 않고 응답에 포함된 값을 사용한다. 독립 쿼리로 두면 홈·목록이 각각 중복 조회하게 된다 |
| 검색어(q)                                                | nuqs(URL 상태)                                 | URL 수명                                  | 공유·새로고침·앞뒤 이동 복원         | 검색 조건의 원본은 URL. 공유·새로고침·뒤로 가기로 같은 결과가 복원되어야 한다                             |
| 카테고리(category)                                       | nuqs(URL 상태)                                 | URL 수명                                  | 공유·새로고침·앞뒤 이동 복원         | 홈의 카테고리 링크로 진입하거나 공유 링크로 복원되어야 한다                                               |
| 정렬(sort)                                               | nuqs(URL 상태)                                 | URL 수명                                  | 공유·새로고침·앞뒤 이동 복원         | 정렬 조건도 공유·복원 대상. 기본값 `latest`를 URL에 명시해 API 요청과 항상 일치시킨다                     |
| 페이지(page)                                             | nuqs(URL 상태)                                 | URL 수명                                  | 공유·새로고침·앞뒤 이동 복원         | `page`는 양의 정수만 허용해 그 외 값은 `1`로 정규화한다. 검색·카테고리·정렬이 바뀌면 1로 돌아간다         |
| 비로그인 장바구니(cart)                                  | Zustand(전역 클라이언트 상태)                  | 세션 수명, persist로 새로고침 후 복원     | 홈·목록(헤더 카운트, 상품 담기 버튼) | 여러 페이지에서 함께 쓰는 비로그인 사용자의 로컬 상태. 서버 원본이 없는 동안 Zustand가 임시 소유자다      |
| 비로그인 위시리스트(wishlist)                            | Zustand(전역 클라이언트 상태)                  | 세션 수명, persist로 새로고침 후 복원     | 홈·목록(헤더 카운트, 상품 찜 버튼)   | 장바구니와 동일한 근거. 서버 동기화가 생기면 소유권이 서버로 이동한다                                     |
| 모달·드롭다운 열림 여부                                  | React 로컬 상태                                | 컴포넌트 수명                             | 해당 컴포넌트                        | 한 화면에서만 쓰는 일시적 UI 상태. 공유·복원 필요가 없으므로 전역에 두지 않는다                           |
| 제출 전 입력 초안(검색 input 값 등)                      | React 로컬 상태 또는 nuqs                      | 컴포넌트 수명 또는 URL 수명               | 해당 화면                            | URL 상태와 동기화해야 하는 값은 nuqs로, 일시적 초안은 React 로컬 상태로 둔다                              |

### 책임 분담 기준

- **TanStack Query** — 서버에서 온 데이터의 조회 상태와 캐시 수명. 서버 응답을 Zustand에 복사하지 않는다. `queryOptions`로 query key·queryFn·staleTime을 한곳에 모아 재사용한다.
- **nuqs** — 검색·카테고리·정렬·페이지처럼 공유·새로고침·앞뒤 이동으로 복원해야 하는 조건. `NuqsAdapter`로 App Router를 감싸고 `useQueryStates`와 parser로 관리한다. `history: "push"`로 각 변경을 앞뒤 이동에서 복원한다.
- **Zustand** — 여러 페이지에서 함께 쓰는 비로그인 장바구니·위시리스트. 컴포넌트는 필요한 값과 action만 selector로 선택해 구독한다. 헤더 개수는 별도 저장하지 않고 파생한다.
- **React 로컬 상태** — 모달 열림 여부·입력 초안처럼 한 화면·컴포넌트 수명에 머무는 일시적 UI 상태. 전역에 올리지 않는다.

### 캐시 정책(staleTime · gcTime)

- **홈 쿼리** — `staleTime: 60_000`(1분). 홈은 여러 섹션을 묶어 한 번에 가져오고 갱신 주기가 짧지 않아 1분 정도 신선도를 유지한다. `gcTime`은 기본값(5분)으로 두어 컴포넌트 언마운트 후 재방문 시 캐시를 재사용한다.
- **목록 쿼리** — `staleTime: 30_000`(30초). 검색·카테고리·정렬·페이지 조건이 query key에 들어가 조건별 캐시가 만들어진다. 30초면 사용자가 같은 조건으로 돌아올 때 최신 결과를 다시 보여주면서도 짧은 시간 내 재방문은 캐시로 처리한다. `gcTime`은 기본값으로 두어 앞뒤 이동 중 캐시가 유지되도록 한다.
- **scenario** — mock API 검증 전용 제어값. 사용자가 관리하는 `ProductListQuery`와 필터 상태에는 포함하지 않지만, 진단 결과의 캐시 격리를 위해 product query key와 실제 GET에는 의도적으로 포함한다. 서버에서 `MockApiScenario`로 구분한다.
- **목록 요청 취소 경계** — 브라우저 `getProductList` query function만 TanStack Query의 `signal`을 Ky에 전달해 대체된 요청을 취소한다. 같은 key·GET을 만드는 `getServerProductList` descriptor는 native fetch memoization 검증 자격을 보존하도록 signal을 전달하지 않으며, options에 `signal: undefined`도 만들지 않는다. 브라우저의 abort 관찰만으로 Route Handler 실행 중단이나 서버 call count 감소를 주장하지 않는다.

### 전역으로 올리지 않은 상태

- **모달·드롭다운 열림 여부** — 한 화면에서만 쓰는 일시적 UI 상태는 React 로컬 상태로 둔다. 전역 store에 넣으면 불필요한 리렌더와 store 복잡도만 증가한다.
- **검색 입력 초안** — URL 상태와 동기화해야 하는 최종 검색어는 nuqs로 두되, 타이핑 중인 초안은 컴포넌트 로컬 상태로 다루어 매 입력마다 URL이 바뀌지 않게 한다. 외부에서 URL이 바뀌면(앞뒤 이동, 컴포넌트가 직접 반영한 URL 변경이 다시 돌아오는 경우) draft를 재마운트 없이 조용히 따라가고, 자체 debounce는 포커스를 유지한다.
- **계산 가능한 값** — 헤더의 장바구니/위시리스트 개수, 할인 여부, 품절 여부 등은 별도 상태로 중복 저장하지 않고 파생한다.

### Zustand store 데이터 형태와 selector 경계

- **데이터 형태** — `cart: Record<productId, true>`, `wishlist: Record<productId, true>`로 productId 집합만 저장한다. 상품 상세 정보는 TanStack Query 캐시에서 가져오고 store에 복사하지 않는다.
- **selector 경계** — Header는 `cartSelectors.count` / `wishlistSelectors.count`로 파생 개수만 구독한다. 상품 버튼은 `cartSelectors.isInCart(productId)` / `wishlistSelectors.isInWishlist(productId)`로 해당 상품 포함 여부만 구독하고, action(`addToCart` / `removeFromCart`, `toggleWishlist`)은 `useCartStore((state) => state.addToCart)`처럼 컴포넌트 내부에서 별도 selector로 따로 가져온다.

### 로그인·서버 동기화가 생기면

위시리스트 소유권이 서버로 이동한다. 이때 로컬 익명 위시리스트를 계정 데이터에 합칠지, 버릴지, 충돌을 어떻게 처리할지 정한 뒤 Zustand의 역할을 서버 상태의 임시 입력 또는 UI 상태로 다시 제한한다. 장바구니도 같은 기준으로 서버 동기화 시점을 설계한다.

### Advanced A — 상태 영속화

기본 과제의 장바구니·위시리스트는 새로고침 시 초기화되어도 됐지만, 이번엔 Zustand `persist`로 localStorage에 저장하고 복원한다. 두 store 모두 `zustand-middleware-pipe`의 `pipe.use(devtools(...)).use(persist(...))` 순서로 middleware를 조립한다.

- **저장 대상** — `partialize`로 `items`만 영속화한다. actions과 selector는 store 인스턴스에 묶여있어 저장할 필요 없다.
- **저장 키·버전** — `commerce-cart` / `commerce-wishlist`, `version: 1`. 버전이 바뀌면 `migrate`가 실행된다.
- **복구 전략** — `migrate`는 `unknown`을 받아 Zod(`z.record(z.string(), z.literal(true))`)로 검증한다. 스키마를 통과하면 저장값을 그대로 쓰고, 깨지거나 오래된 값이면 빈 상태(`{ items: {} }`)로 폴백한다. 같은 Zod 검증은 `merge`에서도 매 rehydration마다 `mergeCartState` / `mergeWishlistState`를 통해 다시 돌기 때문에 현재 버전에서 값이 깨진 경우(예: `items`에 `false`나 객체가 들어간 경우)에도 빈 상태로 폴백한다. 사용자가 손으로 localStorage를 바꿔도 앱이 깨지지 않는다.
- **Hydration mismatch** — `skipHydration: true`로 두고, 클라이언트에서만 `useHydratePersistedStore` 훅이 `store.persist.rehydrate()`를 호출한다. SSR 시점엔 항상 빈 상태를 렌더하고 클라이언트 마운트 후 영속 상태를 끌어올려 Next.js hydration 불일치를 회피한다. 이 훅은 `hasHydrated()`로 idempotent하게 동작한다.
- **호출 지점** — Header(root layout에 있음)에서 cart·wishlist 두 store를 한 번씩 hydrate한다. ProductCard는 hydration 후 selector가 자동 리렌더하므로 별도 호출이 필요 없다.
- **로그인·서버 동기화와의 관계** — 영속화는 어디까지나 비로그인 사용자의 로컬 익명 상태를 보존하기 위한 임시 수단이다. 서버가 위시리스트 원본을 소유하게 되면 persist를 걷어내고 TanStack Query로 대체한다. 이때 마이그레이션은 "로컬 익명 상태를 계정 데이터에 합칠지 버릴지"라는 정책 결정으로 바뀐다.

### Advanced D — 테스트

과제의 핵심 상태 계약은 자동화 테스트와 브라우저 route-sync 확인으로 나누어 보호한다. `vitest` 환경은 `environment: 'node'`로 두고, DOM·React 렌더링·실제 URL hydration이 필요한 검증은 dev 서버를 띄운 뒤 수동으로 확인한다.

- **Zustand action + selector** — `src/entities/cart/model/CartStore.test.ts`, `src/entities/wishlist/model/WishlistStore.test.ts`. addToCart·removeFromCart·clearCart·toggleWishlist 액션이 items 집합을 의도대로 변경하는지, cartSelectors.count·isInCart·wishlistSelectors.count·isInWishlist가 store state에서 올바르게 파생되는지 검증한다. 개수를 별도 상태로 저장하지 않고 파생한다는 과제 계약을 테스트가 보호한다.
- **Header 개수 파생** — count selector가 items 길이를 반환하고 추가·제거에 따라 정확히 증감하는지 검증한다. Header가 별도 count 상태를 두지 않는다는 계약을 보호.
- **nuqs URL 조건 ↔ query key 일치** — `src/features/product-filter/model/useProductFilters.test.ts`에서 `productFilterParsers`의 기본값(q='', category='all', sort='latest', page=1)과 enum을 검증하고, `src/entities/product/api/ProductService.test.ts`에서 `queryKeyFactory.product.list(query, diagnosticScenario)`가 ProductListQuery 전체와 진단 descriptor를 key에 반영하는지, q·category·sort·page·pageSize·scenario 각 변경이 key를 바꾸는지, 동일 입력은 동일 key를 반환하는지 검증한다.
- **홈·목록 store 동기화** — cart/wishlist entity 테스트가 각 store의 action·selector 계약을 보호하고, 홈·목록이 같은 store를 공유하는지와 route 전환 중 상태가 유지되는지는 dev 서버를 통한 브라우저 route-sync 흐름으로 확인한다. 별도의 자동화 store-sync 테스트 파일은 두지 않는다.

**테스트 경계** — 단위 테스트는 순수 로직과 타입 계약만 검증한다. React 렌더링 결과, nuqs의 실제 URL 동기화, hydration 시점의 store 값 변화, 페이지 전환 중 카운트 유지는 dev 서버를 띄운 뒤 수동으로 확인한다(`검증 결과` 섹션). 이 경계를 둔 이유는 단위 테스트가 DOM·Next.js 라우터 없이 빠르게 돌고 상태 계약 자체를 명확히 검증하며, UI 흐름은 실제 라우터와 마운트 타이밍 위에서 확인하는 쪽이 신뢰도가 높기 때문이다.

`productFilterParsers`를 useProductFilters.ts에서 export하도록 리팩터링한 이유는, 훅이 아닌 parser 객체 자체를 단위 테스트에서 직접 검증하기 위해서다. 훅은 DOM/React가 필요하지만 parser 계약(기본값·enum)은 순수 객체 검증으로 충분하다.

### 검증 결과

- **URL 공유**: `?category=fashion&q=stan&page=2` 링크를 새 탭에서 열면 같은 검색·카테고리·정렬·페이지 조건이 복원되고 동일한 상품 목록이 표시된다. ✅
- **새로고침**: 현재 URL의 검색·카테고리·정렬·페이지가 모두 유지된다. nuqs가 URL에서 상태를 재수신(hydrate)한다. ✅
- **앞뒤 이동**: `?q=sta` → `?q=stanley` 순으로 변경한 뒤 뒤로 가면 `?q=sta`로 URL과 input 값이 모두 복원된다(수동 확인). ✅
- **검색 debounce**: 3글자를 100ms 안에 빠르게 입력하면 입력 직후엔 URL이 바뀌지 않고, 멈춘 뒤 300ms 후 `?q=sta`로 한 번만 갱신된다. 매 키스트로크마다 URL이 바뀌지 않는다(수동 확인). ✅
- **페이지네이션**: totalCount=30, pageSize=12일 때 `1 / 3`에서 다음 버튼 활성, `2 / 3`에서 양쪽 활성, `3 / 3`에서 다음 비활성. URL `?page=N`이 동기화된다(수동 확인). ✅
- **store 일관성**: 홈에서 담은 상품이 목록의 헤더 카운트와 상품 버튼 상태에 즉시 반영된다. Zustand store가 단일 인스턴스이므로 두 화면이 같은 상태를 공유한다. ✅
- **클라이언트 페이지 이동**: 홈→목록→홈 이동 중 장바구니·위시리스트 상태와 헤더 개수가 유지된다. Header를 root layout으로 옮겨 라우트 전환에도 카운트가 초기화되지 않는다. ✅
- **영속화(persist)**: 상품을 담거나 찜한 뒤 새로고침하면 헤더 카운트와 상품 버튼 상태가 그대로 복원된다. localStorage를 직접 지우면 빈 상태로 돌아간다. 잘못된 값(예: `items`에 `false` 또는 객체)을 주입해도 `migrate`와 rehydration 시 `merge`가 같은 Zod 검증을 다시 돌려 빈 상태로 폴백해 앱이 깨지지 않는다. ✅
- **hydration 일치**: SSR HTML은 항상 빈 카운트로 렌더하고, 클라이언트 마운트 후 `useHydratePersistedStore`가 `rehydrate()`를 호출해 영속 상태를 반영한다. React hydration 경고가 발생하지 않는다. ✅

### AI 활용

- 상태 분류와 캐시 정책 설계, FSD 레이어 배치, persist·hydration 전략에 AI 도움을 받았습니다.
- 최종 설계는 과제 명세의 checklist와 `docs/rules/fsd-architecture.md`를 기준으로 직접 검토했습니다.
