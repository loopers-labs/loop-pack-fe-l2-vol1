# 3주차 — ProductListPage 관심사 분리

> 대상: `src/productList/ProductListPage.tsx` (단일 ~536줄)
> 목표: 기능 추가가 아니라 **레이어 분리 → Custom Hook 추출 → 분리 근거 기록**
> 구조: flat 레이어 (`pages · components · hooks · services · utils · types · constants`)

---

## 1. 관심사 분류 (Task 1)

컴포넌트를 **UI / 상태 / 서버 통신 / 도메인 로직** 4갈래로 훑은 결과.

### 서버 통신

| 위치 | 관심사 | 분리 후보 | 근거 |
| --- | --- | --- | --- |
| 96–126 | `fetch('/api/products')` — 쿼리 조립·호출·`res.ok`·`res.json()`·에러/로딩 | `services/productApi.ts` + `hooks/useProducts` | fetch가 컴포넌트에 직접 결합(DIP 위반). lint 112·125가 여기. 통신을 서비스로 격리 |
| 21–24 | `ProductListResponse` (응답 계약) | `types/product.ts` | 응답 형태는 타입/서비스 레이어 소유 |
| 114–116 | 응답에 `inStockOnly` client 필터 적용 | 파생값으로 이동 | 서버통신에 클라 필터가 섞여 있음 |

### 상태 (3분할)

**서버 상태**

| 위치 | 관심사 | 분리 후보 |
| --- | --- | --- |
| 55–58 | `products·totalCount·isLoading·error` | `hooks/useProducts` (`{data,isPending,error}`로 묶어 노출) |

**클라이언트 상태**

| 위치 | 관심사 | 분리 후보 | 근거 |
| --- | --- | --- | --- |
| 61–67, 70, 73 | `category·min/maxPrice·sortBy·searchQuery·page·inStockOnly` | `hooks/useProductFilters` | 필터/페이지/검색어 = URL 상태. 한 덩어리 |
| 74 | `viewMode` (grid/list) | 컴포넌트 유지 | 순수 UI 로컬, 재사용·테스트 가치 없음 |
| 77–84, 87–94 | `wishlist·recentlyViewed` (localStorage 초기화) | `hooks/useLocalStorage` | lint 80·90 (`JSON.parse` any). 범용 훅으로 타입 안전화 |

**파생값**

| 위치 | 관심사 | 분리 후보 |
| --- | --- | --- |
| 226–230 | `totalPages·pageNumbers` 페이지네이션 계산 | `utils/pagination.ts` |
| 378–398 | 상품별 `discountRate·isNew·isHot…` | `utils/product.ts` |
| 401 | `isWished = wishlist.includes(id)` | 인라인 유지 (렌더 근접) |
| 114–116 | `inStockOnly` 적용된 목록 | 컴포넌트에서 파생 계산 |

### 도메인 로직

| 위치 | 관심사 | 분리 후보 | 근거 |
| --- | --- | --- | --- |
| 378–390 | 할인율, `isHot`(≥30%), `isBest`(평점4.5&리뷰100), 품절/임박, 무료배송(≥5만) | `utils/product.ts` (순수함수, `use` 접두사 X) | 순수 규칙 → 별도 변경 이유(정책) |
| 392–398 | `isNew` (생성 7일 이내) | `utils/product.ts` | 순수 규칙 |
| 164–208 | 필터 변경 시 `setPage(1)` 리셋 규칙 + `handleResetFilters` | `hooks/useProductFilters` | "필터 바뀌면 1페이지로"는 필터의 업무 규칙 |
| 218–223 | `handleProductClick` — 최근본 prepend·dedupe·`slice(0,10)` | `hooks/useRecentlyViewed` | 진짜 로직 있음 → 훅 정당 |
| 210–216 | `handleWishlistToggle` — 토글 | 컴포넌트에서 useLocalStorage 직접 | toggle 하나뿐, 훅화하면 오버추상화 |
| 151–162 | URL 쿼리 동기화 | `hooks/useProductFilters` | 필터 상태의 반영 규칙 |

### UI

| 위치 | 관심사 | 분리 후보 |
| --- | --- | --- |
| 233–244 | 로딩/에러 early return | 컴포넌트 |
| 246–256 | 헤더(제목·총개수·위시 수) | 컴포넌트 |
| 258–319 | 필터 패널 | `components/FilterPanel` |
| 321–344 | 검색·정렬·보기모드 | `components/SearchSortBar` |
| 346–484 | 상품 그리드/카드 | `components/ProductGrid` + `ProductCard` |
| 355–375 | `highlightMatch` 검색어 하이라이팅 | `ProductCard` 내부 또는 `utils` |
| 486–527 | 페이지네이션 nav | `components/Pagination` |
| 529–532 | 백그라운드 로딩 인디케이터 | 컴포넌트 |

### Effect 정당성 (외부 시스템 동기화인가?)

| 위치 | Effect | 판정 | 귀속 |
| --- | --- | --- | --- |
| 96–126 | fetch | ✅ 네트워크 | `useProducts` |
| 128–135 / 137–144 | localStorage 저장 | ✅ 외부 저장소 | `useLocalStorage` |
| 146–149 | 페이지 변경 시 scrollTo | ✅ DOM (3줄) | 인라인 유지 |
| 151–162 | URL replaceState | ✅ history | `useProductFilters` |

→ 파생값을 effect로 동기화하는 나쁜 effect는 없음 (스타터가 잘 되어 있는 부분).

---

## 2. 분리 계획 (목표 구조)


```
src/
├── components/   ProductListPage(페이지=훅 조합+렌더) · FilterPanel · SearchSortBar · ProductGrid · ProductCard · Pagination
├── hooks/        useProducts · useProductFilters · useStoredIds · useRecentlyViewed
├── services/     productApi.ts (+ _mockApi.ts)
├── utils/        format.ts · product.ts · pagination.ts
└── types/        product.ts
```

상수(`CATEGORIES · SORT_OPTIONS · PAGE_SIZE`)는 폴더를 새로 만들지 않고 사용처에 co-locate한다 (CATEGORIES→FilterPanel, SORT_OPTIONS→SearchSortBar, PAGE_SIZE→productApi).

## 3. 분리한 것 — 한 줄 근거

| 모듈 | 역할 (한 문장) | 근거 / 핵심 결정 |
| --- | --- | --- |
| `types/product.ts` | 도메인·서버 응답 타입 | 서비스·훅·컴포넌트가 공유 → 서버 스펙 변경 시 한 곳만 수정 |
| `services/productApi.ts` | `getProducts` API 통신 | 통신을 이 레이어에 격리(DIP). 응답은 `unknown`+타입가드로 검증해 `as` 없이 타입 확정 |
| `hooks/useProducts.ts` | 상품 목록 서버 상태 조회 | race 가드(`ignore`)로 늦은 응답 무시 · 원시 필드 deps로 무한요청 방지 · `{data,isPending,error}`로 묶어 노출(추후 서버상태 도구 교체 쉬움) · 캐싱 없음(param 변경 시 매번 재요청) |
| `hooks/useStoredIds.ts` | 상품 ID 목록을 localStorage와 동기화 | wishlist·recentlyViewed 2곳 재사용 · `number[]` 전용 인라인 검증으로 `as` 없이 (제네릭·검증자 인자 없이 단순화 — YAGNI) |
| `hooks/useRecentlyViewed.ts` | 최근 본 상품 관리 | 최신순·중복제거·10개 제한 도메인 로직 보유 → 훅 정당 |
| `hooks/useProductFilters.ts` | 필터·검색·페이지 상태 + URL 동기화 | 필터 변경 시 `setPage(1)` 리셋 규칙·URL 반영을 캡슐화. 초기값을 **URL에서 복원**(버그①). `values`(입력용 즉시값)와 `params`(검색어·가격 디바운스한 요청용, 버그③)를 분리 노출 |
| `hooks/useDebouncedValue.ts` | 값 디바운스 (제네릭) | 검색어·가격을 서버 param으로 넘기기 전 완충 → 키 입력당 요청 방지(버그③). search·min·max 3곳 재사용 |
| `utils/product·format·pagination.ts` | 도메인 규칙·포맷·페이지 계산 | 순수 함수(할인율·NEW·BEST·무료배송·가격포맷·페이지번호) — `use` 접두사 없이 |
| `components/FilterPanel·SearchSortBar·ProductGrid·ProductCard·Pagination` | UI 조각 | 페이지는 훅 조합+조립만(≈90줄), 각 UI 관심사를 컴포넌트로 |


## 4. 분리하지 않은 것 — 근거

| 대상 | 근거 |
| --- | --- |
| `viewMode` | 순수 UI 로컬 상태. 재사용·테스트 가치 없음 |
| `scrollTo` 효과 | 3줄짜리 외부(DOM) 동기화. 훅화하면 간접화만 늘어남 |
| `isWished` 계산 | 렌더 근접 파생값. 변경 이유가 따로 나뉘지 않음 |
| `useWishlist` | toggle 하나뿐이라 오버 추상화. `useLocalStorage` 직접 사용 |
| 별도 View 래퍼 | 페이지 규모가 작아 Page/View 분리는 간접화만 추가 |

---

## 5. 숨은 버그 찾기·수정 (Task 4)

리팩토링과 맞물려 발견·수정. **원인 → 수정 → 그 방식을 택한 이유** 순.

### ✅ 버그① — 필터·검색·페이지 조건이 새로고침/공유 시 사라짐

- **증상:** 카테고리·검색어·페이지를 바꾸면 주소창 쿼리(`?category=fashion&page=2`)는 갱신되지만, 그 URL을 새로고침·북마크·공유로 다시 열면 전체·1페이지로 초기화됨.
- **원인:** 상태를 URL에 **쓰기만** 하고 **읽어서 초기화하지 않았다** — `useState('all')` 등 고정 기본값으로 시작해, 마운트 직후 동기화 effect가 오히려 URL을 빈 값으로 덮어씀.
- **수정:** `useProductFilters`가 마운트 시 `readInitialValues()`로 현재 URL 쿼리를 파싱해 초기 상태로 복원. 파싱은 `as` 없이 허용값 배열(`CATEGORY_VALUES`/`SORT_VALUES`)의 `find`로 좁혀 타입 안전.
- **택한 이유:** URL 상태 규칙(쓰기+읽기)을 필터 훅 한 곳에 캡슐화 → "URL이 곧 필터의 소스 오브 트루스"가 되어 레이어 분리와 자연스럽게 맞물림. (라우터 미도입 상황이라 `history.replaceState`+`URLSearchParams`로 최소 구현.)

### ✅ 버그② — 일시적 API 오류 후 새로고침 없이 재시도 불가

- **증상:** fetch가 한 번 실패하면 에러 화면이 뜨고, "다시 시도"가 `window.location.reload()` — 전체 페이지를 리로드해야만 벗어남(에러 화면이 early return이라 필터 조작으로도 못 벗어남).
- **원인:** `useProducts`에 **재요청 통로가 없어** 재시도 수단이 전체 리로드뿐이었다.
- **수정:** `useProducts`에 `reloadKey` 상태 + `refetch()`(키 증가) 추가, effect deps에 `reloadKey` 포함 → 같은 param으로 재요청. 에러 버튼을 `onClick={refetch}`로 교체.
- **택한 이유:** 서버 상태(요청/재요청)는 `useProducts`의 책임이므로 재시도도 그 훅이 소유하는 게 맞음. 리로드는 위시리스트·최근본 등 클라 상태까지 날리므로 부적절.

### ✅ 버그③ — 검색/가격 입력마다 API 요청 폭증

- **증상:** 검색창에 "헤드폰" 입력 → 글자마다 요청 1회(가격 입력도 동일). 불필요한 네트워크 폭증.
- **원인:** 입력값이 **디바운스 없이** 즉시 서버 param(useProducts deps)으로 들어갔다.
- **수정:** 제네릭 `useDebouncedValue`로 검색어·가격을 완충. `useProductFilters`가 `values`(입력 즉시값)와 `params`(디바운스된 요청값)를 분리 노출하고, `useProducts`는 `params`로만 요청.
- **택한 이유:** 입력 반응성(즉시)과 요청 절약(디바운스)은 상충 → 한 값으로 못 겸함. 두 값을 나눠 입력창은 즉시 반영, 네트워크만 완충. 하이라이트도 `params.searchQuery`로 맞춰 결과와 어긋나지 않게 함.

### ⚠️ 남겨둔 것 (원인 추정 + 제외 이유)

- **검색어 첫 입력 시 요청 2회:** 페이지 2+ 에서 검색을 시작하면 `page`가 즉시 1로 리셋되며 요청 1회 + 디바운스 후 1회가 나갈 수 있음. 
- **원인:** page 리셋은 즉시값, 검색어는 디바운스값이라 두 전이가 분리됨. 
- **제외 이유:** 키 입력당 폭증이라는 본 증상은 해소됐고, 잔여 1회를 없애려면 page 리셋까지 디바운스에 합쳐야 해 훅 복잡도가 증가 → 이번 범위에서 제외.
