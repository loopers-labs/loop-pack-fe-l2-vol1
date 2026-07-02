# productList 2차 리뷰 & 리팩터링 기록 — 서버 상태·SRP·UX

대상: `src/productList/` 전체. 1차 리팩터(커밋 `fd013e4`, 레이어 분해)로 구조는 잡혔으나,
이후 강화된 `.claude/rules/react.md` 기준과 사용자 리뷰로 **서버 상태 관리·입력 UX·SRP·레이어 명명**에서 개선점이 남았다.

이번 라운드는 12개 커밋으로 나눠 처리했다.

---

## 1. 관심사 분류표 — 위치 · 문제 · 조치

| 관심사 | 원래 위치 | 문제 / 변경 이유 | 조치 → 위치 | 처리 |
| --- | --- | --- | --- | --- |
| 서버 상태(fetch·loading·error) | `hooks/useProducts.ts` (수동 `useEffect`+`ignore` 플래그) | react.md = TanStack Query 표준. 손수 race guard 지양. AbortController 미사용 | `useQuery` + `keepPreviousData`, `signal` 연결 | ✅ |
| 검색어·가격 입력 → 요청 | `useProductFilters` query (즉시 반영) | 키스트로크마다 요청 = 네트워크 낭비 | `hooks/useDebouncedValue.ts` 신설, query 만 디바운스(300ms) | ✅ |
| 로딩 화면 분기 | `ProductListPage` `isLoading && products.length===0` | 검색 0건에서 입력 시 전체화면 로딩이 input 언마운트 → 포커스 손실 | 전체화면 로딩을 **최초 로드**로 한정, 백그라운드는 `isFetching` | ✅ |
| 가격 파싱(`parsePrice`) | `FilterPanel` 내부 인라인 | 순수 변환 함수는 컴포넌트에 두지 않는다. `Number("abc")→NaN` 누수 | `utils/index.ts` 로 이동 + NaN 가드 + 테스트 | ✅ |
| `HighlightPart` 타입 | `utils.ts` 안에서 정의·export | 타입은 `types/` 에. 순수 함수 모듈에서 타입 정의 금지 | `types/index.ts` 로 이동 | ✅ |
| 카테고리+가격+재고 필터 묶음 | `FilterPanel` 한 덩어리(prop 9개) | 독립적으로 변하는 컨트롤 묶음 = **재사용 여부와 무관하게 SRP 위반** | `components/filter/` 로 3개 섹션 분리 | ✅ |
| 검색+정렬+보기 컨트롤 묶음 | `SearchSortBar` 한 덩어리 | 위와 동일 — 서로 다른 변경 이유 | `components/searchSort/` 로 3개 컨트롤 분리 | ✅ |
| 반복 조건식 | `Pagination` `page===1`/`page===totalPages` 4회 | DRY + 의도 노출 | `isFirstPage`/`isLastPage` 명명 boolean 추출 | ✅ |
| 코드 재진술 주석 | `ProductListPage` 스크롤·파생값 주석 | 코드가 그대로 말하는 '무엇'을 반복 | 제거('왜' 주석만 유지) | ✅ |
| 레이어 디렉토리 | `api/`, flat `utils.ts`·`types.ts` | 스킬 권장 구조(`services/`·`utils/`·`types/`)와 불일치 | `services/`·`utils/index.ts`·`types/index.ts` 로 rename | ✅ |

---

## 2. 위반 지점 + 심각도

- 🔴 **높음 — 손수 fetch + ignore 플래그(`useProducts`)**: 서버 상태를 라이브러리 없이 `useEffect`+`useState`×4 + 클로저 `ignore` 로 직접 관리. race·취소·중복 제거를 직접 구현하던 것을 TanStack Query 로 위임. `signal` 을 연결해 실제 요청 취소(AbortController)까지 확보.
- 🔴 **높음 — 검색 중 포커스 손실(UX 결함)**: 검색 결과 0건에서 추가 입력 시 `isLoading && products.length===0` 이 참이 되어 페이지 전체가 `로딩 중...` 으로 교체 → 검색 input 언마운트 → 포커스·커서 소실. `keepPreviousData` + 전체화면 로딩을 최초 로드로 한정해 해소.
- 🟡 **중간 — 디바운스 부재**: 검색어·가격범위가 매 입력마다 query 갱신 → 요청 유발. 입력 state 는 즉시 반영(반응성)하되 네트워크로 가는 query 만 디바운스.
- 🟡 **중간 — FilterPanel / SearchSortBar SRP 위반**: 독립적으로 변하는 컨트롤 묶음을 한 컴포넌트가 보유, prop 9개. **1차 리뷰는 "재사용 안 되니 분리 안 함"으로 판단했으나, 판단 기준은 재사용이 아니라 SRP·응집도다.** 섹션 단위로 분리.
- 🟢 **사소 — `parsePrice`/`HighlightPart` 위치, Pagination 반복 조건, 재진술 주석**: 순수 함수/타입 제자리 배치, 명명 boolean, 주석 정리.

---

## 3. 1차 판단을 뒤집은 항목 (명시)

1차 문서(`PRODUCT_LIST_REVIEW.md` §2)는 다음과 같이 적었다.

> "**FilterPanel 을 Category/PriceRange/InStock 으로 더 쪼개기** → 다른 곳에서 재사용되지 않음. market 도 섹션 단위로 한 컴포넌트. 재사용이 생기면 그때 쪼갠다."

이 판단은 **분리 기준을 '재사용'에 둔 오판**이다. `react.md` 는 정확히 이 경우를 짚는다.

> "한 컴포넌트가 서로 독립적으로 변하는 컨트롤 묶음(예: 카테고리 + 가격범위 + 재고 필터, 또는 검색 input + 정렬 select + 보기모드 select)을 한 덩어리로 들고 있으면 **재사용 여부와 무관하게 SRP 위반**이다 → 섹션 단위로 분리한다. prop 개수가 급격히 늘면 책임 과다 신호."

따라서 `FilterPanel`·`SearchSortBar` 를 섹션/컨트롤 단위로 분리했다. 각 자식은 자기 슬라이스 props 만 받아 변경 이유가 1개로 좁혀진다.

### 3-1. 분리 후 남은 prop drilling → children 합성으로 마저 해소

섹션 분리 직후의 `FilterPanel`(9개)·`SearchSortBar`(6개)는 받은 props 를 자식에게 **그대로 전달만** 하는 중간 레이어였다. react.dev 의 지침대로 처리했다.

> "Just because you need to pass some props several levels deep doesn't mean you should put that information into context."

즉 **props 를 늘리거나 Context 로 가기 전에 `children` 합성부터.** 두 조합 루트를 레이아웃 셸로 축소하고, 상태를 가진 `ProductListPage`(`useProductFilters`)가 리프(`CategoryFilter`·`PriceRangeFilter`·`InStockToggle` / `SearchInput`·`SortSelect`·`ViewModeSelect`)에 **직접** props 를 넘긴다. 결과: `FilterPanel` 9→2(`children`+`onReset`), `SearchSortBar` 6→1(`children`). 리프 파일은 변경 없음 — 바뀐 건 드릴링 경로뿐.

판단 기준(사용자 노트 반영):

- **children vs slot** — slot 은 이름·위치가 고정된 props(예: Modal `header`/`footer`). 필터 섹션·검색 컨트롤은 그런 명명 슬롯 의미가 없고 JSX 순서로 배치가 드러나면 충분 → `children`.
- **drilling vs Context** — 경로가 `ProductListPage → 리프` **1단계**이고 값은 **로컬 필터 상태**(테마·인증·언어 같은 전역 값 아님) → Context 도입 안 함.
- `onReset` 은 `FilterPanel` 이 자기 초기화 버튼에 직접 쓰는 값("중간 컴포넌트도 그 값을 쓴다") → children 으로 빼지 않고 prop 으로 유지.

---

## 4. 결함 처리 — 테스트로 고정

| # | 항목 | 위치 | 증명 |
| --- | --- | --- | --- |
| 1 | `parsePrice` 가 `Number("abc")→NaN` 을 그대로 흘리던 누수 | `FilterPanel`(인라인) → `utils/index.ts` | utils 로 옮기며 `Number.isNaN` 가드 추가, 단위 테스트(빈문자→`""`, 숫자, NaN→`""`) 동봉 |

> 1차 라운드의 regex escape 결함은 **기존 함수의 throw** 라 `red→green`(실패 테스트 먼저)으로 증명했다. 이번 `parsePrice` 는 **새로 만든 utils 함수**라 import 자체가 컴파일되지 않는 인위적 red 를 두지 않고, 옮긴 동작과 NaN 가드를 검증하는 테스트를 함께 추가했다. (성격이 다른 두 경우를 구분.)

---

## 5. 최종 구조

```
src/productList/
  ProductListPage.tsx              # 조합 + 파생값(getVisibleProducts/getTotalPages) 계산
  services/
    productApi.ts                  # fetchProducts(query, { signal }) — AbortSignal 지원
  hooks/
    useProducts.ts                 # useQuery + keepPreviousData (서버 상태)
    useProductFilters.ts           # 필터 상태 + 핸들러 + 디바운스된 query 조합
    useDebouncedValue.ts           # 제네릭 디바운스 (신규)
    useLocalStorageState.ts / useWishlist.ts / useRecentlyViewed.ts / useSyncFiltersToUrl.ts
  utils/
    index.ts                       # 순수 함수 (formatPrice, parsePrice, badges, 페이지번호, splitHighlightParts ...)
    index.test.ts                  # parsePrice + splitHighlightParts(regex escape) 테스트
  types/
    index.ts                       # 도메인 타입 + HighlightPart
  constants.ts                     # CATEGORIES, SORT_OPTIONS, PAGE_SIZE, isSortBy, isViewMode (flat 유지)
  components/
    filter/
      FilterPanel.tsx              # children 셸 + 초기화 버튼 (props 2개)
      CategoryFilter.tsx / PriceRangeFilter.tsx / InStockToggle.tsx
    searchSort/
      SearchSortBar.tsx            # children 셸 (props 1개)
      SearchInput.tsx / SortSelect.tsx / ViewModeSelect.tsx
    ProductGrid.tsx / ProductCard.tsx / ProductBadges.tsx / HighlightedText.tsx
    Pagination.tsx / ProductListHeader.tsx / ProductListError.tsx
  _mockApi.ts                      # 변경 없음 (scaffolding)
```

레이어 관계: **Service**(어디서) ← **Hook**(어떻게 동작 — 서버 상태 = TanStack Query, 클라이언트 상태 + 디바운스 조합) ← **Component**(어떻게 보이는가, 섹션 단위 SRP).

> 디렉토리 명명: 스킬 권장 구조(`services/`·`utils/`·`types/`)에 맞춰 정렬했다. `constants.ts` 는 스킬 구조에 해당 항목이 없어 flat 유지. `api/` 도 서비스 레이어 명명으로는 동등하게 유효한 관용이지만, 이 레포는 스킬 문서와 1:1 정합을 택했다.

---

## 6. 검증

- **커밋 12개**(잘게 분리): ① 디렉토리 정리 → ② TanStack 의존성/Provider → ③ useProducts 전환 → ④ 포커스 버그 fix → ⑤ 디바운스 → ⑥ parsePrice → ⑦ HighlightPart → ⑧ FilterPanel 분리 → ⑨ SearchSortBar 분리 → ⑩ Pagination boolean → ⑪ 주석 정리 → ⑫ 본 문서. 각 커밋 husky pre-commit/pre-push 통과(우회 없음).
- `pnpm test` — 10 passed (parsePrice 3 + splitHighlightParts regex 2 + market 5). `pnpm build`(tsc -b + vite) 통과.
- 브라우저(`pnpm dev`) 수동 확인:
  - 검색 결과 0건 상태에서 추가 입력해도 **검색 input 포커스 유지**, 전체화면 로딩으로 덮이지 않고 "조건에 맞는 상품이 없습니다" 유지. (연속 입력 `zzzzz`→`zzzzzqqq` 가 끊김 없이 이어짐을 확인.)
  - 검색어를 지우면 전체 목록 복귀. 카테고리/정렬/보기 전환 즉시 반영.
  - mock 이 `window.fetch` 를 가로채 실제 네트워크 패널엔 요청이 안 잡히므로, **디바운스는 query 가 디바운스 값을 쓰는 코드 + 단위 동작**으로 보장(네트워크 카운트 측정 불가 환경).
