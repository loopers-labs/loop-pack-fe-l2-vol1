# ProductListPage 관심사 분리 리뷰 & 리팩터링 기록

대상: `src/productList/ProductListPage.tsx` (리팩터링 전 ~542줄, UI·서버 상태·클라이언트 상태·localStorage·API·URL 동기화·도메인 규칙·포맷·페이지네이션이 한 파일에 혼재).

리팩터링 후 페이지는 **조합만** 남기고(약 120줄, JSX 위주) 나머지를 레이어로 분리했다. 참조 패턴은 같은 레포의 `src/market/`(이미 리팩터링된 체크아웃 화면).

---

## 1. 관심사 분류표 — 위치 · 관심사 · 분리 후보 · 분리/비분리 근거

| 관심사 | 원래 위치(라인) | 분리 후보 → 옮긴 위치 | 분리함? | 근거 |
| --- | --- | --- | --- | --- |
| 도메인 타입 | 8–26 (Product/Response/SortBy) | `types.ts` | ✅ | 모든 레이어가 의존하는 계약. 한 곳에 모아야 서버 스펙 변경 시 추적 지점이 좁아짐. `market/types.ts` 관례와 동일 |
| 옵션 데이터·타입가드 | 32–53 (CATEGORIES/SORT_OPTIONS/PAGE_SIZE/isSortBy/isViewMode) | `constants.ts` | ✅ | 드롭다운·버튼을 그리는 여러 컴포넌트가 공유. 정적 데이터라 컴포넌트와 변경 이유가 다름 |
| 서버 상태 (fetch/loading/error) | 61–64, 102–132 | `hooks/useProducts.ts` | ✅ | "서버에서 상품을 가져온다"는 한 문장 책임. **race condition 가드**를 여기 가둠. 페이지는 결과만 받음 |
| API 호출·쿼리 빌드·응답 변환 | 106–124 (fetch 인라인) | `api/productApi.ts` | ✅ | DIP — hook 이 fetch 구현이 아니라 service 추상에 의존. 서버 스펙이 바뀌어도 수정점이 한 곳 |
| 클라이언트 필터 상태 + 핸들러 | 66–80, 170–214 | `hooks/useProductFilters.ts` | ✅ | 필터/검색/정렬/페이지가 "page=1 리셋" 규칙으로 한 흐름. 페이지에서 9개 useState + 9개 핸들러를 들어낼 수 있음 |
| localStorage 동기화(공통) | 83–100, 135–150 | `hooks/useLocalStorageState.ts` | ✅ | wishlist·recentlyViewed가 **read+parse+sync-effect 패턴을 그대로 중복**. 진짜 로직 재사용 케이스 |
| 위시리스트 도메인 | 216–222 | `hooks/useWishlist.ts` | ✅ | "토글/포함 여부"라는 도메인 동작. `isWished`는 state 아닌 계산으로 |
| 최근 본 상품 도메인 | 224–229 | `hooks/useRecentlyViewed.ts` | ✅ | LRU 10개 push 규칙은 별도 변경 이유 |
| URL 쿼리 동기화 | 157–168 | `hooks/useSyncFiltersToUrl.ts` | ✅ | 브라우저 history(외부 시스템) 동기화 = 정당한 useEffect. 페이지에서 분리해 의도를 드러냄 |
| 도메인 규칙·포맷·페이지네이션 계산 | 232–236, 385–405 | `utils.ts` (순수 함수) | ✅ | discountRate/badge/isNew/포맷/페이지번호는 입력→출력 순수 함수. **테스트로 동작 고정**(`utils.test.ts`) |
| 헤더 UI | 254–262 | `components/ProductListHeader.tsx` | ✅ | props-in 표현 컴포넌트. `market` 의 섹션 분할 입도와 동일 |
| 필터 패널 UI | 264–325 | `components/FilterPanel.tsx` | ✅ | 카테고리·가격·옵션·초기화가 한 시각적 섹션 |
| 검색/정렬/보기 UI | 327–352 | `components/SearchSortBar.tsx` | ✅ | 상단 컨트롤 바 한 덩어리 |
| 상품 그리드 + 카드 | 354–491 | `components/ProductGrid.tsx` + `ProductCard.tsx` | ✅ | god 컴포넌트의 핵심 비대 지점. 카드 1건 책임을 분리하면 도메인 계산이 JSX에서 빠짐 |
| 배지 렌더 | 422–435 | `components/ProductBadges.tsx` | ✅ | 뷰모델(`ProductBadges`)을 받아 span 매핑만. 계산은 utils, 렌더는 여기로 분리 |
| 검색어 하이라이트 | 363–383 (인라인 함수) | `utils.splitHighlightParts` + `components/HighlightedText.tsx` | ✅ | 순수 토큰화(utils)와 `<mark>` 렌더(컴포넌트)를 분리. **regex escape 버그도 여기서 수정** |
| 페이지네이션 UI | 493–534 | `components/Pagination.tsx` | ✅ | 번호 계산은 `getPageNumbers`(utils), 버튼 렌더는 컴포넌트 |
| 에러 화면 | 243–250 | `components/ProductListError.tsx` | ✅ | 다시 시도 액션을 가진 독립 화면 |
| 스크롤 맨 위로 | 152–155 | (페이지에 인라인 유지) | ❌ | 3줄 `window.scrollTo` DOM 동기화. hook 으로 감싸면 추적 비용만 늘어 over-abstraction |
| 재고 필터(`getVisibleProducts`) | 119–123 (fetch 안) | `utils` + 페이지 렌더 중 계산 | ✅(계산화) | **파생값을 state/effect에서 빼 계산으로**. fetch 의존성에서 제거(버그 2) |
| 백그라운드 로딩 표시 | 536–539 | (페이지에 인라인 유지) | ❌ | 1줄 JSX. 컴포넌트화하면 간접 지시만 늘어남 |
| empty state | 359–360 | (ProductGrid 내부 유지) | ❌ | 그리드 데이터에 강결합된 사소한 분기. ProductGrid 안에 두는 게 응집 |

---

## 2. 분리하지 않은 것 — 명시적 근거 (over-abstraction 회피)

리뷰 원칙: "로직이 있냐"가 아니라 **"별도의 변경 이유를 갖느냐"**. 아래는 일부러 분리하지 않았다.

- **스크롤-투-탑 effect** → 페이지에 인라인. 3줄짜리 단일 DOM 호출을 `useScrollToTopOnChange` 로 감싸는 건 한 줄을 위한 hook. 추적 비용만 증가.
- **백그라운드 로딩 인디케이터 / empty state** → 1줄 JSX. 별도 컴포넌트화하면 indirection만 추가.
- **FilterPanel 을 Category/PriceRange/InStock 으로 더 쪼개기** → 다른 곳에서 재사용되지 않음. `market` 도 섹션 단위로 한 컴포넌트. 재사용이 생기면 그때 쪼갠다.
- **`useProductCard` 같은 hook 신설 금지** → 카드 로직(`getProductBadges`, `formatPrice`)은 **순수 함수**다. hook 으로 감싸면 "custom hook = 로직 재사용이지 순수 계산 래핑이 아니다" 원칙 위반.
- **`market/Price.tsx` 재사용** → 형제 도메인(`market`)의 컴포넌트를 cross-import 하지 않음. 도메인 경계를 흐리는 대신 공용 순수 함수 `formatPrice` 사용. (Price 를 공용 위치로 승격하는 건 이 PR 범위 밖.)

---

## 3. 결함 처리 — red→green 으로 증명

원칙: *리팩터(구조 개선)하는 순간 자연히 사라지는 결함은 별도 테스트를 만들지 않는다. 깨끗한 구조에서도 남는 별개 로직 결함만 "실패 테스트 → 수정" 으로 증명한다.*
아래는 그렇게 남은 결함으로, **red→green 으로 증명**해 별도 커밋으로 분리했다.

| # | 버그 | 위치(원본) | 증명·수정 |
| --- | --- | --- | --- |
| 3 | **하이라이트 RegExp 미이스케이프** — `new RegExp("(" + q + ")")`가 `(`·`[`·`*` 검색 시 throw. 순수함수로 옮겨도 escape 는 안 생기는 **별개 로직 결함** | 366 | ① 먼저 실패 테스트 커밋(`splitHighlightParts("a(b)c", "(")` → red) ② `escapeRegExp` 추가 커밋(green). 순수 테스트라 통합 도구 불필요 |

> 부수: localStorage `catch {}`가 에러를 삼키던 부분은 `useLocalStorageState`로 옮기며 **왜 무시하는지 주석**(손상값/비공개 모드/용량 초과)을 달아 의도를 명시했다.

---

## 4. 최종 구조

```
src/productList/
  ProductListPage.tsx          # 조합만 (hooks 호출 + 컴포넌트 트리)
  ProductListPage.css          # 변경 없음
  _mockApi.ts                  # 변경 없음 (scaffolding)
  types.ts                     # Product, ProductListResponse, SortBy, CategoryFilter,
                               #   ViewMode, ProductFilters, ProductQuery, ProductBadges
  constants.ts                 # CATEGORIES, SORT_OPTIONS, PAGE_SIZE, isSortBy, isViewMode
  utils.ts                     # formatPrice, calculateDiscountRate, getDaysSince,
                               #   isNewProduct, getProductBadges, getVisibleProducts,
                               #   getTotalPages, getPageNumbers, splitHighlightParts
  utils.test.ts                # vitest — regex escape 결함 회귀 테스트 (별도 red→green 커밋)
  api/
    productApi.ts              # buildProductSearchParams, fetchProducts(signal)
  hooks/
    useProducts.ts             # 서버 상태 + race guard
    useProductFilters.ts       # 필터/검색/페이지 상태 + 핸들러 + 파생 query
    useLocalStorageState.ts    # localStorage 영속 primitive (공유)
    useWishlist.ts
    useRecentlyViewed.ts
    useSyncFiltersToUrl.ts     # history.replaceState 동기화
  components/
    ProductListHeader.tsx
    FilterPanel.tsx
    SearchSortBar.tsx
    ProductGrid.tsx
    ProductCard.tsx
    ProductBadges.tsx
    HighlightedText.tsx
    Pagination.tsx
    ProductListError.tsx
```

레이어 관계: **Service**(어디서 가져오는가) ← **Hook**(어떻게 동작하는가: 서버·클라이언트·파생값 조합) ← **Component**(어떻게 보이는가). 페이지는 hook들을 조합하고 파생값(`getVisibleProducts`, `getTotalPages`)만 렌더 중 계산한다.

---

## 5. 검증

- **커밋 구성**: ① `refactor`(레이어 분해, regex 결함은 의도적으로 잔존) ② `test`(regex 실패 테스트, **red**) ③ `fix`(escape 추가, **green**). 리팩터와 red→green 을 분리해 "고치기 전 빨강"을 history 로 입증.
- `pnpm test` — 기존 `src/utils/index.test.ts` + `src/productList/utils.test.ts`(regex) green. `pnpm build`(tsc -b + vite) 통과.
- red 입증: `git checkout <test 커밋>` → `pnpm test` 로 빨강 확인 → 브랜치 복귀.
- 브라우저(`pnpm dev`) — 렌더·검색 하이라이트·URL 동기화·empty state·`스(트`(정규식 특수문자) 무에러 확인. in-stock 토글은 재요청 없이 파생값으로 처리.
