# RFC — 6주차 FSD 전환

- 작성일: 2026-07-29
- 브랜치: `feat/week-06` (베이스 `ba7593c`)
- 대상: 5주차까지 만든 커머스(홈·상품 목록·검색·카테고리·정렬·페이지네이션·장바구니·위시리스트)

---

## 0단계 — 동작 기준선

폴더를 옮기기 전에 실측한 결과다. 전환 후 이 표를 그대로 다시 돌려 회귀를 판정한다.

측정 환경: `pnpm dev` (Next 16.2.10 Turbopack, localhost:3000), 2026-07-29.

### `pnpm check`

`test · lint · typecheck · build` 전부 통과. `pnpm format:check`도 통과.

### API 계약

`/api/*`를 직접 호출해 확인했다. 16개 케이스 전부 5주차에 기록한 계약과 일치한다.

| 케이스 | 요청 | 상태 | 지연 | 응답 |
| --- | --- | --- | --- | --- |
| 홈 정상 | `/api/home` | 200 | 669ms | `banner` + `categories 5` + `popularProducts 6` + `newProducts 6` |
| 홈 빈 결과 | `/api/home?scenario=empty` | 200 | 511ms | `banner`·`categories` 유지, 상품 배열만 0 |
| 홈 에러 | `/api/home?scenario=error` | 500 | 513ms | `{"message":"홈 데이터를 불러오지 못했습니다."}` |
| 목록 기본 | `/api/products` | 200 | 549ms | 12개 / total 30 / 첫 3개 `p1,p2,p3` |
| 목록 최신순 | `/api/products?sort=latest` | 200 | 511ms | 12개 / 첫 3개 `p26,p6,p27` |
| 목록 인기순 | `/api/products?sort=popular` | 200 | 512ms | 12개 / 첫 3개 `p21,p11,p15` |
| 검색 | `/api/products?q=셔츠` | 200 | 509ms | 1개 / total 1 / `p9` |
| 페이지 초과 | `/api/products?page=999` | 200 | 509ms | `products 0` + **`totalCount 30`** |
| pageSize 경계 | `/api/products?pageSize=24` | 200 | 507ms | 24개 |
| pageSize 초과 | `/api/products?pageSize=25` | **400** | 6ms | `{"message":"요청 조건을 확인해주세요."}` |
| pageSize 0 | `/api/products?pageSize=0` | **400** | 4ms | 동일 |
| sort 오타 | `/api/products?sort=newest` | **400** | 4ms | 동일 |
| category 오타 | `/api/products?category=nope` | **400** | 3ms | 동일 |
| 빈 결과 | `/api/products?scenario=empty` | 200 | 506ms | `products 0` + **`totalCount 0`** |
| 서버 에러 | `/api/products?scenario=error` | 500 | 508ms | `{"message":"상품 목록을 불러오지 못했습니다."}` |
| 400 vs 500 | `/api/products?sort=newest&scenario=error` | **400** | 6ms | 400이 우선, 지연 없음 |

계약상 확인된 성질 세 가지:

1. **`sort` 생략 ≠ `sort=latest`.** 생략하면 fixture 순서(`p1,p2,p3`), 명시하면 최신순(`p26,p6,p27`). 현재 구현은 `useProductFilters`가 `latest`를 기본값으로 들고 있고 `getProducts`가 그 값을 그대로 실어 보내므로, URL에 `sort`가 없어도 API에는 `sort=latest`가 간다. 화면 첫 3개가 `p26,p6,p27`인 것으로 확인했다.
2. **빈 결과가 두 종류다.** 검색 0건은 `totalCount 0`, 페이지 초과는 `totalCount 30`. 둘 다 200이다.
3. **400은 지연 없이(3~6ms), 200·500은 500ms 고정 지연.** 400이 500보다 우선한다.

### 라우트 응답

| 경로 | 상태 |
| --- | --- |
| `/` | 200 |
| `/products` | 200 |
| `/products?q=셔츠&sort=popular&page=2` | 200 |
| `/dialog-demo` | 200 |
| `/select-demo` | 200 |
| 없는 경로 | 404 |

### URL 상태 (검색·카테고리·정렬·페이지네이션)

브라우저에서 직접 조작해 확인했다.

| 동작 | 결과 |
| --- | --- |
| 검색어 입력 | 타이핑 중에는 URL 불변 — **Enter 제출** 방식. 제출 시 `?q=후디`, 총 1개 |
| 카테고리 변경 | `?category=fashion` 즉시 반영, 총 6개 |
| 정렬 변경 | `?sort=popular` 즉시 반영 |
| 페이지 이동 | `다음` → `?page=2`, 표시 `2 / 3`. 1페이지에서 `이전` disabled |
| 조건 변경 시 페이지 | `?page=2` 상태에서 정렬 변경 → `?sort=popular` (page 파라미터 소멸, 1페이지로 리셋) |
| 기본값 URL 표기 | nuqs가 기본값을 URL에서 생략 (`sort=latest`, `page=1`은 URL에 안 남음) |

### 뒤로/앞으로 가기, 새로고침, URL 공유

`history: 'push'` 설정대로 조작마다 히스토리가 쌓인다. 3단계 왕복에서 URL·select 값·결과 개수가 모두 정확히 복원됐다.

| 단계 | URL | 복원된 화면 |
| --- | --- | --- |
| 시작 | `?sort=popular&category=fashion` | 총 6개, `1 / 1`, select `[fashion, popular]` |
| 뒤로 1회 | `?sort=popular` | 총 30개, `1 / 3`, select `[all, popular]` |
| 뒤로 2회 | `?page=2` | 총 30개, `2 / 3`, select `[all, latest]` |
| 앞으로 1회 | `?sort=popular` | 총 30개, `1 / 3`, select `[all, popular]` |

`?sort=price-asc&page=2`로 직접 진입한 결과와 그 상태에서 새로고침한 결과가 동일했다(`2 / 3`, 첫 상품 동일). URL 공유가 성립한다.

`?scenario=error`·`?scenario=empty`를 **페이지 URL에 붙여도 무시된다.** `useProductFilters`가 파싱하지 않고 `getProducts`도 params에 싣지 않는다 — 과제가 요구한 "`scenario`는 mock 전용, `ProductListQuery`에 넣지 않는다"를 만족한다.

### 정상·로딩·에러·빈 상태

에러 상태는 코드를 고치지 않고, 브라우저에서 `window.fetch`를 감싸 해당 요청에만 `scenario=error`를 주입해 재현했다.

| 상태 | 상품 목록 | 홈 |
| --- | --- | --- |
| 로딩 | `불러오는 중…` (조건 변경 150ms 시점에 포착) | 동일 |
| 빈 결과 | `조건에 맞는 상품이 없어요.` | 배너·카테고리 **유지** + 섹션별 `인기 상품이 없어요.` / `신상품이 없어요.` |
| 에러 | `role="alert"` + `상품을 불러오지 못했어요.` + `다시 시도` — **헤더·검색·필터 유지** | `role="alert"` + `홈 데이터를 불러오지 못했어요.` + `다시 시도` — **헤더·배너·카테고리 전부 소실** |
| 인라인 재시도 | `다시 시도` 클릭 → 전체 새로고침 없이 복구 확인 | 동일 구조 |

재시도 관측: 홈 API를 강제 실패시켰을 때 fetch가 **4회**(최초 1 + 재시도 3) 발생했다. `QueryProvider`에 `retry` 설정이 없어 TanStack Query 기본값이 걸리고, 지수 백오프 때문에 **에러 UI가 뜨기까지 7초 이상** 걸린다. 2.5초 시점에는 아직 `불러오는 중…`이었다.

### 장바구니·위시리스트

| 동작 | 결과 |
| --- | --- |
| 목록에서 `담기` 2개 + `찜` 1개 | 헤더 `위시리스트 1  장바구니 2` |
| 버튼 토글 | `♡ 찜` → `♥ 찜`, `담기` → `빼기` |
| `<Link>`로 홈 이동 | 배지 유지 + 홈의 같은 상품도 `♥ 찜`·`빼기`로 동기화 |
| `<Link>`로 목록 복귀 | 배지·버튼 상태 유지 |
| 하드 리로드 | **초기화됨.** `localStorage`에 스토어 키 없음 = `persist` 미적용 |

과제 0단계는 "페이지 이동 중 유지"를 요구하므로 요구사항은 충족한다. 새로고침 유지는 요구 대상이 아니다.

### 기준선에서 발견한 이슈

리팩토링 중 고칠지 말지 결정해야 할 항목이다. (구조 변경과 기능 변경은 커밋을 분리한다.)

| # | 내용 | 근거 |
| --- | --- | --- |
| 1 | 홈 조회 실패 시 헤더·배너·카테고리까지 화면 전체가 사라진다 | `src/app/page.tsx`의 `isError` early return(14행)이 `SiteHeader`를 포함한 성공 `return`(24행)보다 앞에 있다 |
| 2 | `retry` 정책 미설정 → 실패 인지까지 7초 이상 | `QueryProvider`가 `staleTime`만 지정 |
| 3 | `ProductCard`가 파일로 존재하지 않는다 | `src/components/ProductGrid.tsx:12`의 비공개 함수 |

---

## 1단계 — RADIO

> 아래는 직접 작성한다. 정답 폴더 트리를 옮겨 적는 문서가 아니라, 내 코드에서 내린 결정을 설명하는 문서여야 한다.

### R — Requirements

<!-- AI 초안 — 검토·수정 후 PR에 AI 사용 표기 -->

**기능 요구사항**

5주차까지 누적된 커머스다. 홈은 배너·카테고리·인기 상품 6개·신상품 6개를 보여주고, 상품 목록은 검색(Enter 제출)·카테고리 5종·정렬 4종·페이지네이션(12개/페이지)을 URL 상태로 제공한다. 상품 카드에서 장바구니 담기/빼기·위시리스트 찜/해제를 토글하면 헤더 배지에 개수가 반영되고, 클라이언트 페이지 이동 중 유지된다. 데모 라우트 2개(dialog-demo·select-demo)는 4주차 공통 컴포넌트의 소비자로 남아 있다.

**비기능 요구사항**

- `pnpm check`(test·lint·typecheck·build)가 커밋 게이트이자 CI다. 전환의 **어느 단계에서도** 이 게이트가 깨지지 않아야 한다 — 마이그레이션을 단계로 나누는 이유다.
- 타입 침묵 금지 — `as`·`eslint-disable`을 쓰지 않는다. 이동으로 타입이 안 맞으면 구조를 고치지, 타입을 침묵시키지 않는다.
- husky + lint-staged 커밋 게이트와 Prettier 포맷 규칙 유지.

**이번에 반드시 보존할 동작**

0단계 기준선 표의 전 항목을 보존 대상으로 한다. 그중 전환 작업으로 특히 끊기기 쉬운 것:

- URL에 `sort`가 없어도 API 요청에는 `sort=latest`가 명시된다 — 이 연결이 끊겨도 에러가 나지 않아, 조용히 틀린 순서가 나온다.
- 검색·카테고리·정렬 변경 시 page가 1로 리셋된다.
- `<Link>` 클라이언트 이동 중 장바구니·위시리스트 배지와 카드 버튼 상태가 유지된다.

단, **홈 조회 실패 시 화면 전체(헤더·배너·카테고리 포함)가 사라지는 현재 동작은 보존 대상에서 제외한다.** 4단계 요구사항("조회 실패는 나머지 화면을 모두 가리지 않는 범위에서 표시")과 정면 충돌하는 결함이라 의도적으로 변경한다. 구조 이동 커밋과 분리해 별도 커밋으로 처리하고, 재현 방법·원인·수정 위치·검증 결과를 기록한다.

**이번 주에 하지 않을 것**

| 하지 않는 것 | 이유 |
| --- | --- |
| `src/app/api/**` 이동 | 과제가 전환 범위 제외를 허용한다. mock 백엔드는 강사 소유이고, `eslint.config.mjs`의 테스트 lint 예외가 경로 패턴으로 걸려 있어 이동 비용 대비 이득이 없다 |
| `types/commerce.ts` 분해 | 참조 8곳 중 3곳이 전환 제외한 mock 백엔드다. 분해하면 제외 영역을 건드리고, 강사 소유 파일이라 다음 주 스타터 동기화의 충돌 지점이 된다. shared/types로 간주하고 물리적으로 유지한다 |
| Zustand `persist` 추가 | 요구사항은 "페이지 이동 중 유지"까지다. 새로고침 유지는 기능 추가라 리팩토링 범위 밖이다 |
| `retry` 정책 조정 | 전환 단계에서는 건드리지 않는다. 4단계에서 `throwOnError` 기준을 세울 때 함께 재검토한다 |
| `examples/` 미사용 tsx 삭제 | 강사 제공 참고 자료라 유지한다. 실제로 쓰이는 `week-05-layout.css`의 import만 layout 1회로 정리한다 |
| Advanced A·B 선착수 | 기본 과제 완성 전에는 착수하지 않는다. 완성 후 여유가 있으면 A(의존성 하네스)를 우선 검토한다 — ESLint 규칙 2개는 비용이 작고, widgets를 생략한 구조에서도 성립한다 |

### A — Architecture

<!-- AI 초안 -->

**현재 구조에서 실제로 겪는 문제 (3개)**

1. **`ProductCard`가 표현과 행위를 한 덩어리로 들고 있다.** `components/ProductGrid.tsx:12`의 비공개 함수라 파일조차 없고, 상품 표현(이미지·브랜드·가격)과 찜·담기 버튼이 한 컴포넌트에 있으며 그 안에서 `shopStore`를 직접 구독한다(13~16행). 상품을 보여주기만 하면 되는 곳에서 재사용할 방법이 없다. FSD 관점으로 옮기면 이는 entities(상품 표현)가 features(사용자 행위)를 아는 **역방향 의존**이다.
2. **장바구니와 위시리스트가 한 스토어에 섞여 있고, 위시리스트 코드가 3개 파일에 흩어져 있다.** `stores/shopStore.ts`(상태·토글) · `components/ProductGrid.tsx`(찜 버튼) · `components/SiteHeader.tsx`(배지) — 셋 다 장바구니 코드와 같은 파일이다. "위시리스트를 통째로 제거한다면"이라는 사고 실험에서 grep 없이 삭제 목록을 만들 수 없다. 과제가 준 응집 실패 판정 기준에 현재 구조가 그대로 걸린다.
3. **페이지 컴포넌트가 조회·상태 분기·레이아웃·헤더 배치를 모두 소유한다.** `app/page.tsx` 68줄이 `useQuery`, 로딩/에러 분기, 4개 섹션 배치, `SiteHeader` 렌더를 전부 한다. `app/products/page.tsx`는 154줄에 컴포넌트 3개가 들어 있다. 이 문제는 0단계에서 실측 결함으로 증명됐다 — 홈은 조회 실패 시 `isError` early return(14행)이 `SiteHeader`를 품은 성공 return(24행)보다 앞이라 **헤더·배너·카테고리까지 사라지고**, 목록은 `ProductsResult`만 교체돼 살아남는다. 같은 앱에서 에러 처리 범위가 갈리는 원인이 컴포넌트 경계다.

부수 관찰: 현재 `features/home`·`features/products`는 이름만 features이고 실제로는 페이지별 데이터 모듈이다(사용자 행위 아님). 폴더 이름이 아니라 역할이 기준이라는 FSD 명제의 반례가 프로젝트 안에 이미 있다.

**목표 폴더 트리** (현재 트리는 부록 A 참고)

```
src/
├── app/                        # Next 라우팅 + 앱 초기화 (FSD app 레이어 겸함)
│   ├── layout.tsx              # NuqsAdapter → QueryProvider → SiteHeader + children
│   ├── providers.tsx           # ← providers/QueryProvider.tsx
│   ├── SiteHeader.tsx          # ← components/SiteHeader.tsx (전역 크롬)
│   ├── page.tsx                # 얇게: <HomePage /> 렌더만
│   ├── products/page.tsx       # 얇게: <ProductsPage /> 렌더만
│   ├── dialog-demo/ · select-demo/   # import 경로만 shared/ui로 수정
│   └── api/                    # 전환 제외 (R절)
│
├── _pages/
│   ├── home/
│   │   ├── ui/HomePage.tsx     # ← app/page.tsx 본문
│   │   └── api/                # ← features/home/{home.api,home.queries}.ts
│   └── products/
│       ├── ui/ProductsPage.tsx # ← ProductsPageContent + ProductsResult
│       ├── ui/SearchForm.tsx
│       ├── model/useProductFilters.ts
│       └── api/                # ← features/products/{products.api,products.queries}.ts
│
├── features/
│   ├── add-to-cart/ui/AddToCartButton.tsx    # ← ProductCard에서 추출
│   └── toggle-wishlist/ui/WishButton.tsx     # ← 〃
│
├── entities/
│   ├── product/ui/ProductCard.tsx   # 표현만. actions 슬롯을 받음
│   ├── product/ui/ProductGrid.tsx   # renderActions를 카드에 전달
│   ├── cart/model/store.ts          # ← stores/shopStore.ts 분리
│   └── wishlist/model/store.ts      # ← 〃 분리
│
├── shared/ui/{dialog,select}/  # ← components/ui/*
├── types/commerce.ts           # 물리적 유지, shared/types로 간주 (R절·결정표)
└── examples/week-05-layout/    # 전환 범위 외 (CSS import만 layout 1회로)
```

**사용할 레이어만 선택한 근거**

만드는 레이어 4개:

- `shared` — `ui/dialog`(189줄)·`ui/select`(206줄) 둘 다 내부 의존이 0이고 도메인을 모른다. 이미 shared의 정의를 만족한다.
- `entities` — 상품 표현이 홈 2개 섹션 + 목록에서 재사용된다(문제 1). 장바구니·위시리스트는 도메인별로 분리한다(문제 2).
- `features` — 담기·찜 **두 행위만**. "행위 하나 = feature 하나" 기준이며, 문제 1의 해법으로 카드에서 행위를 떼어 여기 둔다.
- `_pages` — 문제 3의 해법. URL 상태 소유권도 여기 둔다. `src/app/**`은 Next 라우팅 예약 디렉터리라 얇은 진입점으로 유지하고, `src/pages`는 Pages Router로 오인되므로 만들지 않는다.

만들지 않는 레이어:

- `_app` — 옮길 것이 `QueryProvider` 17줄 하나인데 그 조합은 이미 `src/app/layout.tsx`가 한다. 따로 만들면 껍데기 한 겹이 늘고 전역 설정이 두 곳으로 나뉜다.
- `widgets` — 강의 기준으로 FSD 적정 규모가 파일 100개 이상인데 이 프로젝트는 26개다. 이 규모에서 간접층 한 겹은 비용만 있다. widgets가 맡을 책임은 이렇게 분배한다: `SiteHeader`는 전역 크롬이므로 layout이 1회 렌더(페이지별 중복 렌더 자체가 문제 3의 증상이었다), `ProductGrid`는 행위 없는 상품 표현이므로 entities. **비용: 카드+버튼 조합 JSX가 홈·목록 두 페이지에 중복된다.** 이 중복은 widgets 생략의 대가로 감수한다. 재도입 트리거: 조합이 3곳 이상에서 재사용되거나 여러 슬라이스를 묶는 독립 UI 블록이 생기면 그때 widgets를 도입한다(queryOptions의 entities 승격 기준과 같은 원칙).
- 검색·필터 feature — `useProductFilters`는 nuqs로 URL을 직접 소유하므로 라우트에 종속된다. feature로 빼면 "이 URL 구조를 쓰는 페이지에서만 동작하는" 재사용 불가 슬라이스가 된다. 한 곳에서만 쓰여서가 아니라 **URL 소유권이 페이지에 있어서** 페이지 세그먼트에 둔다.
- `processes` — 과제 규칙상 사용하지 않는다(결정 아님).

**허용 / 금지 import 예시**

```
✅ features/add-to-cart/ui → entities/cart/model        상위가 하위를 (버튼이 store 훅 사용)
✅ _pages/products/ui → entities/product/ui, features/*  페이지가 카드와 행위를 조합
✅ app/SiteHeader.tsx → entities/cart, entities/wishlist 전역 크롬이 배지 개수만 구독
❌ entities/product/ui → features/add-to-cart            하위가 상위를 — 역방향 금지
❌ features/add-to-cart → features/toggle-wishlist       같은 레이어 슬라이스 간 직접 import 금지
❌ entities/cart → entities/product                      같은 레이어 — 조합은 상위에서
```

**트레이드오프와 대안 검토**

강의 기준으로 이 프로젝트(파일 26개)는 FSD 적정 규모(100개 이상)에 못 미친다. 그럼에도 적용하는 이유: (1) 규모가 아니라 증상이 기준이다 — 문제 1~3이 이미 실측 결함(홈 에러 화면 소실)과 응집 실패(위시리스트 3파일 산개)로 나타났다. (2) 레이어를 4개만 만들어 오버헤드를 규모에 맞췄다 — 필요 없는 레이어를 만들지 않는 결정이 이 트레이드오프의 완충장치다. 비용은 초기 이동 비용, 조합 JSX 중복, 파일 수 증가(카드·버튼 분리)다.

- 대안 A — 현 구조 유지 + ESLint import 규칙: 의존 방향은 통제되지만 문제 2·3(응집·책임 분리)은 import 규칙으로 풀리지 않는다. 기각.
- 대안 B — 도메인 폴더 + 하위 components/hooks/services: 응집은 얻지만 레이어 규칙이 없어 문제 1(역방향 의존)을 막을 장치가 없다. 기각.

**단계별 마이그레이션 계획과 검증 방법**

하위 레이어부터 4단계. 각 단계 후 `pnpm check` + 해당 기준선 항목 재확인. 구조 이동 커밋과 기능 변경 커밋(홈 에러 화면 — R절)은 분리한다.

| 단계 | 작업 | 검증 |
| --- | --- | --- |
| 1. shared | dialog·select 이동, 데모 2페이지 import 수정 | `pnpm check` + 데모 라우트 2개 200 |
| 2. entities | ProductCard 추출(actions 슬롯) + ProductGrid 이동 + store 2분할(선택자 훅 6개 시그니처 유지) | `pnpm check` + 배지·토글·`<Link>` 이동 유지 |
| 3. features | 담기·찜 버튼 추출, 카드 조합을 renderActions로 전환 | `pnpm check` + 카드 버튼 동작·상태 동기화 |
| 4. _pages + app | 페이지 본문 이동, SiteHeader→layout, QueryProvider→app/providers.tsx, CSS import 정리 | `pnpm check` + URL 왕복·새로고침·직접 진입 전체 재확인 |

**파일 매핑표**

이동하는 파일:

| 현재 위치 | 목표 위치 | 레이어/세그먼트 | 이유 |
| --- | --- | --- | --- |
| `components/ProductGrid.tsx` (내부 `ProductCard`) | `entities/product/ui/ProductCard.tsx` + `ProductGrid.tsx` | entities/product/ui | 카드를 파일로 추출, 표현만 남김. 행위는 슬롯으로 |
| `ProductCard` 안의 담기·찜 버튼 | `features/add-to-cart/ui/` · `features/toggle-wishlist/ui/` | features/*/ui | 행위 하나 = feature 하나 |
| `components/SiteHeader.tsx` | `app/SiteHeader.tsx` | app | 전역 크롬, layout 1회 렌더 |
| `components/ui/dialog/` · `select/` | `shared/ui/dialog/` · `select/` | shared/ui | 도메인 무관, 내부 의존 0 |
| `stores/shopStore.ts` | `entities/cart/model/store.ts` + `entities/wishlist/model/store.ts` | entities/*/model | 도메인별 분리 (문제 2) |
| `features/home/*` | `_pages/home/api/` | _pages/home/api | 소비자가 홈 페이지 하나 |
| `features/products/products.{api,queries}.ts` | `_pages/products/api/` | _pages/products/api | 소비자가 목록 페이지 하나 |
| `features/products/useProductFilters.ts` | `_pages/products/model/` | _pages/products/model | URL 소유권 = 페이지 |
| `app/page.tsx` 본문 | `_pages/home/ui/HomePage.tsx` | _pages/home/ui | 라우팅 파일은 얇은 진입점으로 |
| `app/products/page.tsx` 본문 | `_pages/products/ui/ProductsPage.tsx` + `SearchForm.tsx` | _pages/products/ui | 〃 |
| `providers/QueryProvider.tsx` | `app/providers.tsx` | app | 앱 초기화는 app 레이어 소관 |

그 자리에 남기는 파일:

| 파일 | 이유 |
| --- | --- |
| `app/api/**` (6개) | 전환 제외 (R절). lint 예외 경로 패턴 연동 |
| `types/commerce.ts` | 분해 안 함 (R절·결정표). shared/types로 간주 |
| `examples/week-05-layout/` | 강사 참고 자료. CSS import만 layout 1회로 정리 |
| `app/dialog-demo/` · `select-demo/` | shared/ui의 소비자 라우트. import 경로만 수정 |

**애매한 파일 결정표 (6개)**

| 대상 | 후보 A | 후보 B | 최종 결정 | 기준 |
| --- | --- | --- | --- | --- |
| `ProductCard` | `entities/product/ui` | `widgets/product-card` | **A** | 홈 2개 섹션+목록에서 재사용되는 표현이다. 행위(담기·찜)는 actions 슬롯으로 받아 분리하므로 카드 자체에는 비즈니스 행위가 없다 |
| 상품 목록 queryOptions | `entities/product/api` | 상품 목록 페이지의 `api` | **B** | 현재 소비자가 목록 페이지 하나뿐이다. 여러 페이지 재사용이 생기는 시점에 entities로 승격한다 |
| 장바구니 store | `entities/cart/model` | 장바구니 행위 feature의 `model` | **A** | 헤더 배지가 행위와 무관하게 상태를 읽는다 → 도메인 상태. 행위 feature는 이 상태의 소비자다 |
| `src/types/commerce.ts`의 `Product` | `entities/product/model` | `shared/types` 유지 | **B** | 참조 8곳 중 3곳이 전환 제외한 mock 백엔드(강사 소유)다. 분해하면 제외 영역을 수정하게 되고 다음 주 동기화 충돌 지점이 된다 |
| `SiteHeader` | `widgets/site-header` | `app` (layout 옆) | **B** | widgets 생략의 귀결. 전역 크롬이라 layout이 1회 렌더한다 — 페이지별 헤더 렌더가 문제 3의 증상이었고, 홈 에러 시 헤더 소실도 함께 해소된다 |
| `useProductFilters` | `features/search-products` | `_pages/products/model` | **B** | nuqs로 URL을 직접 소유해 라우트에 종속된다. feature로 빼면 재사용 불가 슬라이스가 된다 |

### D — Data Model (상태 분류표)

<!-- AI 초안 -->

5주차에 정한 Source of Truth는 폴더 이동으로 달라지지 않는다. 바뀌는 것은 **소유 슬라이스**뿐이다.

| 상태 | Source of Truth | 소유 슬라이스/레이어 | 소비하는 곳 | 이동 후에도 중복 저장하지 않는 방법 |
| --- | --- | --- | --- | --- |
| 상품 조회 결과 | 서버 / TanStack Query 캐시 | `_pages/home/api` · `_pages/products/api` (queryOptions 정의) | HomePage, ProductsPage | 컴포넌트는 `useQuery` 반환값을 그대로 렌더하고 어떤 스토어에도 복사하지 않는다. `totalPages` 같은 파생값은 저장하지 않고 렌더 중 계산한다 |
| 검색·정렬·페이지 | URL / nuqs | `_pages/products/model` (`useProductFilters`) | ProductsPage (필터 UI + 쿼리 키) | `useQueryStates`가 URL을 직접 읽고 쓴다. `useState` 사본을 두지 않으며, 필터 값은 queryKey로만 서버 상태에 연결된다 |
| 장바구니·위시리스트 | Zustand | `entities/cart/model` · `entities/wishlist/model` (분리) | `app/SiteHeader` (배지), features 버튼 (포함 여부·토글) | id 목록만 보관하고 서버 상품 데이터를 스토어에 복사하지 않는다. 개수는 저장하지 않고 `length`로 파생(기존 설계 유지). store 본체는 export하지 않고 선택자 훅만 공개 |
| Dialog 열림 여부 | React 로컬 상태 | 사용하는 컴포넌트 (demo 라우트) | 해당 UI | 열림 상태를 전역·URL로 승격하지 않는다 — 공유·복원 요구가 없다 |

예외 하나를 명시한다: `SearchForm`의 입력값은 제출 전까지 `useState`로 들고 있다. 이는 URL 상태의 사본이 아니라 **아직 제출되지 않은 draft**(로컬 UI 상태)이며, `key={filters.q}`로 URL 변경 시 리셋되므로 두 상태가 어긋난 채 공존하지 않는다.

### I — Interface

<!-- AI 초안 -->

**Public API 사용 여부와 방식**

기준을 하나로 통일한다: **숨길 내부가 생기는 순간 `index.ts`를 만든다.** barrel(경로 단축용 습관적 재수출)과의 차이가 여기서 갈린다 — index를 두는 슬라이스는 전부 "외부가 알아도 되는 것"의 목록이 내부보다 실제로 작다. 재수출 한 줄로 아무것도 숨기지 못하는 index는 barrel이므로 만들지 않는다. `export *`는 쓰지 않고 named export만 나열한다(이름 충돌·순환 방지).

| 슬라이스 | index | 공개하는 것 | 숨기는 것 |
| --- | --- | --- | --- |
| `entities/product` | ✅ | `ProductCard`, `ProductGrid` + props 타입 | 카드 내부 마크업, 이미지 처리 |
| `entities/cart` | ✅ | `useCartCount`, `useIsInCart`, `useToggleCart` | **store 본체** — 아무도 store 전체를 구독 못 하게(기존 파일 스코프 은닉을 슬라이스 스코프로 확장) |
| `entities/wishlist` | ✅ | `useWishCount`, `useIsWished`, `useToggleWish` | 〃 |
| `shared/ui/select` | ✅ (기존 유지) | `useSelect` + 공개 타입 | 훅 내부 로직 |
| `shared/ui/dialog` | — | 단일 파일 구현(`index.tsx`가 곧 구현) | — |
| `features/*` 2개 | ❌ | 버튼 컴포넌트 (직접 import) | 파일 1개 = 숨길 내부 없음. index는 barrel이 된다 |
| `_pages/*` | ❌ | 페이지 컴포넌트 (직접 import) | 소비자가 라우팅 진입점 하나뿐 — 계약을 맺을 외부가 없다 |

features에 내부(model 등)가 생기면 그 시점에 index를 추가한다 — widgets 재도입·queryOptions 승격과 같은 "필요해지는 시점에 도입" 원칙.

**`ProductCard`와 행위의 조합 방법**

`ProductCard`는 `actions?: ReactNode` 슬롯을 받고, `ProductGrid`는 `renderActions?: (product: Product) => ReactNode`를 받아 카드에 전달한다. 버튼을 꽂는 조합은 `_pages`(HomePage·ProductsPage)에서 한다. entities는 features의 존재를 모른다 — 역방향 의존이 원천적으로 불가능한 구조다(확인 질문 1의 답).

### O — Optimization

<!-- AI 초안 -->

**TanStack Query 캐시 정책 — 유지**

기본 `staleTime` 20초, 홈 5분(배너·카테고리는 거의 안 바뀜), 목록 60초 — 5주차 결정을 그대로 유지한다. 폴더 이동은 캐시 정책을 바꿀 이유가 아니다. **queryKey도 그대로 유지한다**(`['home']`, `['products','list',query]`) — 이동 중 키가 바뀌면 캐시 무효화로 동작이 달라지므로, 키 불변 자체가 보존 항목이다. `retry` 미설정 문제는 4단계에서 `throwOnError` 기준과 함께 재검토한다(R절).

**로딩·에러 경계 범위**

상세 설계는 4단계 표에서 한다. 방침만 적는다: 조회 실패는 결과 영역 안에서 인라인 처리(현 목록 패턴)하고, 홈도 같은 패턴으로 정렬해 헤더·배너가 생존하게 한다(별도 커밋 — R절). 예상 밖 렌더링 오류는 route segment `error.tsx`가 맡는다. `loading.tsx`/Suspense와 Query `isPending`의 범위 구분도 4단계에서 기록한다.

**이번 주에 하지 않을 최적화**

- 측정 없는 선제 최적화(`React.memo`·`useMemo` 살포) — 근거 없는 복잡도만 늘린다.
- 번들 분석·code splitting·이미지 최적화 — 7주차 범위다. 7주차가 Before 측정에서 시작하므로 지금 손대지 않는다.
- `useSuspenseQuery` 전환 — 현 `useQuery` + `isPending` 패턴을 유지한다. 전환은 에러 경계 재설계와 얽히는 별도 결정이라 이번 범위에 넣지 않는다.

---

## 4단계 — 에러 처리 경계

| 실패 유형 | 처리 위치 | Error Boundary로 전파하는가 | 사용자 UI | 재시도 방법 | 이 경계를 선택한 이유 |
| --- | --- | --- | --- | --- | --- |
| 상품 목록 조회 실패 |  |  |  |  |  |
| 잘못된 검색 조건(4xx) |  |  |  |  |  |
| 예상하지 못한 렌더링 오류 |  |  |  |  |  |
| 장바구니 행위의 비즈니스 오류 |  |  |  |  |  |

---

## 5단계 — 삭제 시나리오 자가 검증

**위시리스트 기능을 통째로 제거한다면**

- 삭제할 폴더·파일:
- 삭제 후 수정이 필요한 파일:
- 판정:

**신상품 뱃지를 상품 카드에 추가한다면**

- 터치할 파일:
- 판정:

---

## 부록 A — 현재 파일 인벤토리 (전환 전)

`src/` 전체 26개 `.ts`/`.tsx` + 비-TS 5개. 배치 판단은 넣지 않았다 — 파일 매핑표를 쓰기 위한 사실 정리다.

### 라우팅 (`src/app`)

| 파일 | 줄 | 역할 | 내부 import |
| --- | --- | --- | --- |
| `app/layout.tsx` | 36 | RootLayout. `NuqsAdapter` → `QueryProvider` 마운트, 폰트·`metadata` | `@/providers/QueryProvider` |
| `app/page.tsx` | 68 | 홈 페이지 전체. `'use client'`. `useQuery` 조회 + 로딩/에러 분기 + 배너·카테고리·인기·신상품 4개 섹션 레이아웃 | `features/home/home.queries`, `components/SiteHeader`, `components/ProductGrid`, examples CSS |
| `app/products/page.tsx` | 154 | 목록 페이지 전체. `'use client'`. `Suspense` 래퍼 + `ProductsPageContent`(필터 UI) + `ProductsResult`(조회·상태분기·페이지네이션) + `SearchForm`(로컬 `useState`) 3개 컴포넌트가 한 파일에 | `features/products/products.queries`, `features/products/useProductFilters`, `components/SiteHeader`, `components/ProductGrid`, `types/commerce`, examples CSS |
| `app/dialog-demo/page.tsx` | 125 | 4주차 Dialog 데모 라우트 | `components/ui/dialog` |
| `app/select-demo/page.tsx` | 376 | 4주차 Select 데모 라우트 | `components/ui/select` |

### Mock 백엔드 (`src/app/api`) — 강사 제공

| 파일 | 줄 | 역할 | 내부 import |
| --- | --- | --- | --- |
| `api/_data/commerce.ts` | 359 | fixture(상품 30개·카테고리·배너) + `waitForMockApi` 지연 | `types/commerce` |
| `api/_data/commerce.test.ts` | 124 | fixture 검증 | `./commerce` |
| `api/home/route.ts` | 56 | `GET /api/home` | `api/_data/commerce`, `types/commerce` |
| `api/home/route.test.ts` | 59 | 라우트 테스트 | `./route` |
| `api/products/route.ts` | 121 | `GET /api/products` (검증·정렬·페이지네이션) | `api/_data/commerce`, `types/commerce` |
| `api/products/route.test.ts` | 404 | 라우트 테스트 | `./route` |

> `eslint.config.mjs`에 `src/app/api/**/*.test.ts` 한정 lint 예외 블록이 경로 패턴으로 걸려 있다. 이 파일들을 옮기면 그 패턴도 같이 고쳐야 한다.

### 화면 조각 (`src/components`)

| 파일 | 줄 | 역할 | 내부 import |
| --- | --- | --- | --- |
| `components/ProductGrid.tsx` | 61 | `ProductGrid`(export) + `ProductCard`(12행, **비공개**). 카드가 이미지·브랜드·이름·가격 표현과 찜·담기 버튼을 함께 들고 있고, 스토어를 직접 구독한다 | `types/commerce`, `stores/shopStore`, `next/image` |
| `components/SiteHeader.tsx` | 20 | 헤더. 로고·`상품` 링크 + 위시리스트/장바구니 개수 배지 | `stores/shopStore`, `next/link` |
| `components/ui/dialog/index.tsx` | 189 | 4주차 Dialog. 합성 컴포넌트, `createPortal`. **내부 의존 없음** | (없음) |
| `components/ui/select/index.tsx` | 15 | `useSelect`와 타입 re-export만 하는 파일 | `./useSelect` |
| `components/ui/select/useSelect.ts` | 206 | 4주차 headless select 훅. 생김새를 모름. **내부 의존 없음** | (없음) |

### 데이터 접근 (`src/features`) — 이름은 features지만 사용자 행위가 아니라 페이지별 데이터 모듈

| 파일 | 줄 | 역할 | 내부 import |
| --- | --- | --- | --- |
| `features/home/home.api.ts` | 24 | `getHome()` — `/api/home` fetch + 런타임 타입가드 | `types/commerce` |
| `features/home/home.queries.ts` | 11 | `homeQueries.home()` — `staleTime` 5분 | `./home.api` |
| `features/products/products.api.ts` | 32 | `getProducts(query)` — 쿼리스트링 조립 + fetch + 타입가드 | `types/commerce` |
| `features/products/products.queries.ts` | 12 | `productQueries.list(query)` — `staleTime` 60초 | `./products.api`, `types/commerce` |
| `features/products/useProductFilters.ts` | 48 | nuqs `useQueryStates`. 카테고리·정렬 리터럴 목록 보유, 조건 변경 시 `page` 리셋. **내부 의존 없음** | (없음) |

### 상태·전역 (`src/providers`, `src/stores`, `src/types`)

| 파일 | 줄 | 역할 | 내부 import |
| --- | --- | --- | --- |
| `providers/QueryProvider.tsx` | 17 | `QueryClient` 생성. `staleTime` 20초만 지정, `retry` 미지정 | (없음) |
| `stores/shopStore.ts` | 33 | Zustand. **장바구니와 위시리스트 두 도메인을 한 스토어**에 보유. 스토어 자체는 export하지 않고 선택자 훅 6개(`useCartCount`·`useWishCount`·`useIsInCart`·`useIsWished`·`useToggleCart`·`useToggleWish`)만 공개 | (없음) |
| `types/commerce.ts` | 52 | 도메인 타입 10개(`Product`·`Category`·`CategoryId`·`ProductSort`·`ProductListQuery`·`HomeResponse`·`ProductListResponse`·`ApiErrorResponse`·`MockApiScenario`)가 한 파일에 | (없음) |

### 참고용 (`src/examples`) — 강사 제공, 자동 적용 대상 아님

| 파일 | 줄 | 역할 |
| --- | --- | --- |
| `examples/week-05-layout/HomeLayoutExample.tsx` | 88 | **어디에서도 import되지 않음** |
| `examples/week-05-layout/ProductListLayoutExample.tsx` | 103 | **어디에서도 import되지 않음** |
| `examples/week-05-layout/week-05-layout.css` | — | `app/page.tsx`와 `app/products/page.tsx`가 직접 import. **실제로 쓰이는 스타일** |
| `examples/week-05-layout/README.md` | — | 설명 |

### 비-TS

`app/globals.css`, `app/favicon.ico`, 위 CSS·README.

### 피인용 관계 (삭제 시나리오용)

| 모듈 | 이 모듈을 import하는 곳 |
| --- | --- |
| `types/commerce.ts` | `api/_data/commerce`, `api/home/route`, `api/products/route`, `ProductGrid`, `home.api`, `products.api`, `products.queries`, `app/products/page` (8곳) |
| `stores/shopStore.ts` | `ProductGrid`, `SiteHeader` (2곳) |
| `components/ProductGrid.tsx` | `app/page`, `app/products/page` (2곳) |
| `components/SiteHeader.tsx` | `app/page`, `app/products/page` (2곳) |
| `api/_data/commerce.ts` | `api/home/route`, `api/products/route`, `commerce.test` (3곳) |
| `components/ui/dialog` | `app/dialog-demo/page` (1곳) |
| `components/ui/select` | `app/select-demo/page` (1곳) |

> 위시리스트 관련 코드는 현재 `stores/shopStore.ts`(상태·토글), `components/ProductGrid.tsx`(찜 버튼), `components/SiteHeader.tsx`(배지) 세 파일에 나뉘어 있고, 장바구니 코드와 같은 파일들에 섞여 있다.
