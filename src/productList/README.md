# ProductListPage 관심사 분류표

| 위치 | 관심사 | 분리 후보 | 분리 이유 | 분리하지 않을 근거 |
|------|--------|-----------|-----------|-------------------|
| `type Product, ProductListResponse, SortBy` | 타입 분리 | `types/type.ts` | 커스텀 훅에서도 사용, UI에서도 사용 | — |
| `const escapeRegExp` | 날짜 순수함수 | `utils/` | 재사용 가능 | `ProductCard` 한 곳에서만 사용. 재사용 가능성 없어 utils로 분리하지 않음 |
| `category, searchQuery, page, sortBy, minPrice, maxPrice, inStockOnly` | 도메인 로직 | `hooks/useProductFilter` | 상품 목록 검색 | — |
| `wishlist, setWishList` | 도메인 로직 | `hooks/useWishlist` | 위시리스트 | — |
| `recentlyViewed, setRecentlyViewed` | 도메인 로직 | `hooks/useRecentlyViewed` | 최근 본 상품 | — |
| `useEffect #1` (`const fetchProducts = async () => { setIsLoading(true); }`) | 서버 상태 | `hooks/useProductList` | 서버 상태 조합 | — |
| `const res = await fetch('/api/products?${params.toString()}')` | API 호출 | `services/productService` | API 호출 함수 | — |
| `useEffect #2` (`setItem('wishlist')`) | 상태 + 도메인 로직 | `hooks/useWishlist` | 위시리스트 도메인에 속하는 외부 시스템 동기화 | — |
| `useEffect #3` (`setItem('recentlyViewed')`) | 상태 | `hooks/useRecentlyViewed` | 최근 본 상품 도메인에 속하는 외부 시스템 동기화 | — |
| `useEffect #4` (`window.scrollTo`) | 상태 | — | — | 페이지가 바뀔 때 스크롤 이동이기 때문에, 화면을 보여주는 역할이므로 유지한다 |
| `useEffect #5` (`const params = new URLSearchParams`) | 상태 | `hooks/useProductFilter` | — | — |
| `handle~~~~~` | 이벤트 바인딩 | — | — | hook에서 받아온 것을 연결하기 때문에 분리하지 않는다 |
| 페이지네이션 계산 (인라인) | — | `hooks/useProductFilter` | `page`, `totalCount` 파생값 | — |
| 로딩/에러 early return | UI | — | — | 이 화면 전용 |
| 필터 패널 | UI | — | — | 이 화면 전용 |
| 검색, 정렬, 보기 모드 | UI | — | — | 이 화면 전용 |
| 상품 그리드 | UI | — | — | 이 화면 전용 |
| `highlightMatch`, `<article key={product.id}>` | UI | `components/ProductCard.tsx` | — | — |
| 도메인 규칙 인라인 계산 (`discountRate`, `isHot` 등) | 순수함수 | `components/ProductCard.tsx` | — | 순수함수지만 이곳에서만 사용할 것 같아서 utils로는 분리하지 않음 |
| 페이지네이션 UI | UI | `components/Pagination.tsx` | 재사용성, 가독성 | — |

## AI 리뷰와 다른 점

1. **`CATEGORIES`, `SORT_OPTIONS`, `PAGE_SIZE`** — 내 표에 누락. 필터 도메인 상수라 `useProductFilter` 이동 시 같이 가야 함.
2. **`useEffect #5` 관심사** — 내가 "상태"로 분류했는데, 정확히는 **사이드이펙트 (URL 동기화)**. `window.history.replaceState`가 외부 시스템 동기화.
3. **`useEffect #2·#3` 관심사** — 내가 "상태 + 도메인 로직" / "상태"로 분류했는데, localStorage `setItem`은 **사이드이펙트**가 더 정확함. 상태 초기화(`useState(() => localStorage.getItem(...))`)와 구분 필요.
4. **백그라운드 로딩 인디케이터** — 내 표에 누락. 분리 불필요하지만 항목으로 기록.

## 분리 결과

### 분리한 것

| 파일 | 이유 |
|------|------|
| `hooks/useProductFilter.ts` | 필터·검색·페이지 상태와 URL 동기화가 하나의 도메인. 관련 상수(`CATEGORIES`, `SORT_OPTIONS`, `PAGE_SIZE`)도 이 도메인에 속해 함께 이동. |
| `hooks/useWishlist.ts` | 상태 초기화 + localStorage 동기화 + 토글 로직이 위시리스트 도메인으로 응집. |
| `hooks/useRecentlyViewed.ts` | 상태 초기화 + localStorage 동기화 + 추가 로직이 최근 본 상품 도메인으로 응집. |
| `hooks/useProductList.ts` | 서버 상태(products, totalCount, isLoading, error)와 fetch 로직 분리. |
| `services/productService.ts` | API 호출과 요청 형태 변환(도메인 파라미터 → HTTP 쿼리 파라미터) 담당. |
| `components/ProductCard.tsx` | 상품 카드 UI와 도메인 계산(`discountRate`, `isHot` 등). 관련 상수도 함께 이동. |
| `components/Pagination.tsx` | 재사용 가능한 UI 단위. |

### 분리하지 않은 것

| 항목 | 이유 |
|------|------|
| `escapeRegExp` | `ProductCard` 한 곳에서만 사용. 재사용 가능성 없어 utils로 분리하지 않음. |
| `handle~~~~~` (이벤트 핸들러) | hook setter를 UI 이벤트에 연결하는 역할만 함. 도메인 로직 없음. |
| `useEffect` (`window.scrollTo`) | 페이지 전환 시 스크롤 이동은 화면 표시 역할이므로 컴포넌트에 유지. |

### 미구현 사항

| 항목 | 내용 |
|------|------|
| `useRecentlyViewed` | 저장 로직은 구현했으나 현재 화면에 표시하는 UI가 없음. |

## 🐞 버그 점검

### 버그 1 — URL 복원

**재현 방법**
1. 카테고리, 검색어, 페이지 등 필터 적용
2. 브라우저 새로고침 또는 URL 복사 후 새 탭에서 열기
3. 필터가 기본값으로 초기화되는지 확인

**원인**
`useProductFilter`가 상태 변경 시 URL에 쓰기만 하고, 페이지 로드 시 URL에서 읽어오지 않음.

**수정 방법**
각 `useState` 초기값을 lazy initializer로 `URLSearchParams`에서 읽어오도록 변경.

**방식을 선택한 이유**
React Router의 `useSearchParams`를 쓰면 깔끔하게 해결되지만, 최상위에 `<BrowserRouter>`로 앱을 감싸는 등 구조 변경이 필요해 이번 범위에서 과하다고 판단하여 다른 방식을 모색. React Router 없이 URL을 직접 읽는 방식으로 하게 되면 URL이 바뀌어도 React가 리렌더를 트리거하지 않기 때문에 화면이 갱신되지 않을 수 있음. 그래서 `useState` 초기값만 URL에서 읽고 이후엔 state가 주도하는 방식을 선택. 또한 `pickFromList`, `pickNumber` 헬퍼로 유효하지 않은 URL 값이 들어왔을 때 기본값으로 fallback 처리.

---

### 추가 발견 — viewMode 새로고침 시 초기화

**증상**
그리드/리스트 뷰를 변경해도 새로고침하면 항상 그리드로 초기화됨.

**원인**
`viewMode`가 컴포넌트 로컬 state로만 관리되어 새로고침 시 유지되지 않음.

**수정 방법**
`useState` 초기값을 `localStorage`에서 읽고, 변경 시 `useEffect`로 동기화. 별도 훅으로 분리하지 않고 컴포넌트에 직접 작성.

**방식을 선택한 이유**
`viewMode`는 개인 UI 취향이라 URL보다 `localStorage`가 적합. URL에 넣으면 링크 공유 시 상대방에게도 뷰 설정이 강제됨. 이 컴포넌트에서만 쓰이고 로직도 단순해 별도 훅으로 분리하지 않음.

---

### 버그 2 — 에러 후 재시도

**재현 방법**
1. 브라우저 개발자도구 → Network 탭 → Offline 모드 전환
2. 페이지 로드 → 에러 화면 확인
3. "다시 시도" 버튼 클릭 → 전체 페이지가 새로고침되는지 확인

**재현 방법 (실제)**
mock API 환경이라 네트워크 오프라인으로는 재현 불가. `productService.ts`에 `throw new Error('테스트용 에러')`를 임시로 추가해 재현.

**원인**
에러 화면의 "다시 시도" 버튼이 `window.location.reload()`를 호출해 페이지 전체를 새로고침함. 필터 상태가 초기화되고 API 재요청만 하면 되는 상황에서 불필요한 전체 리로드 발생.

**수정 방법**
`useProductList`에 `retryCount` state와 `retry` 함수 추가. `retry` 호출 시 `retryCount`가 증가해 `useEffect` deps가 바뀌면서 re-fetch가 트리거됨. 에러 버튼에서 `window.location.reload()` 대신 `retry`를 호출.

**방식을 선택한 이유**
필터 state는 그대로 유지하고 API 요청만 다시 날리는 게 목적. `useEffect`는 deps가 바뀔 때만 재실행되므로, 변경사항 없이 re-fetch를 트리거하려면 별도의 카운터 state가 필요함.

---

### 버그 3 — 검색어/가격 입력마다 API 과다 요청

**재현 방법**
1. 브라우저 개발자도구 → Network 탭 열기
2. 검색창에 "apple" 타이핑 또는 가격 입력
3. 글자/숫자 수만큼 API 요청이 발생하는지 확인

**원인**
검색어/가격 상태가 바뀔 때마다 즉시 `useProductList`가 re-fetch함. 디바운스 없음.

**수정 방법**
`useProductFilter`에서 입력값과 API 전달값을 분리.
- 검색어: `searchInput`(입력창 즉시 반영) / `searchQuery`(300ms 디바운스 후 API 전달)
- 가격: `minPriceInput`/`maxPriceInput`(입력창 즉시 반영) / `minPrice`/`maxPrice`(300ms 디바운스 후 API 전달). 하나의 `useEffect`로 두 값을 함께 처리.

**방식을 선택한 이유**
타이핑이 멈춘 뒤 한 번만 요청해 자연스럽게 검색되면서 불필요한 요청도 줄일 수 있음.

#### 추가 발견 — 초기 마운트 시 페이지 리셋

**증상**
URL에 `?q=노이즈&page=3`으로 접근하면 페이지가 3이 아닌 1로 초기화됨. 가격 디바운스도 동일한 문제가 발생.

**원인**
디바운스 `useEffect`는 초기 마운트 시에도 한 번 실행됨. 이때 `setPage(1)`이 호출되어 URL에서 복원한 페이지 값을 덮어씀. 검색어와 가격 모두 해당.

**수정 방법**
`setSearchQuery`, `setMinPrice`, `setMaxPrice`를 함수형 업데이트로 바꿔 이전 값(`prev`)과 현재 값을 비교. 실제로 달라졌을 때만 `setPage(1)`을 호출.

**방식을 선택한 이유**
`setSearchQuery` 함수형 업데이트로 이전 값과 비교해, 쿼리가 실제로 바뀔 때만 `setPage(1)`을 호출하도록 수정.

---

### 추가 발견 — 로딩 시 전체 화면 교체

**발견한 문제**
필터나 검색어를 변경할 때마다 로딩 화면이 전체 페이지를 덮어 필터 패널, 헤더까지 사라짐.

**왜 개선이 필요한가**
로딩 중에도 사용자가 필터를 바꾸거나 다른 조작을 할 수 있어야 하는데, 전체 화면이 교체되면 아무것도 할 수 없음. UX가 불필요하게 끊기고, 바뀔 필요 없는 헤더·필터 패널까지 언마운트됐다가 다시 마운트되어 성능에도 좋지 않음.

**수정 방법**
전체 화면 early return 제거. 로딩 중에는 그리드 영역과 페이지네이션만 숨기고 나머지 UI는 그대로 유지. `renderProducts` 함수로 로딩/빈 결과/상품 목록 조건을 분기.

---

### 버그 4 — URL page가 totalPages 초과 시 빈 화면

**재현 방법**
1. URL에 `?page=999` 입력 후 접근
2. 빈 상품 목록이 표시되는지 확인

**원인**
`useProductFilter`가 URL에서 page 값을 복원할 때 유효 범위 검사를 하지 않음. `totalPages`는 API 응답 이후에만 알 수 있어 초기화 시점에 클램핑 불가.

**수정 방법**
`ProductListPage`에서 데이터 로드 완료 후 `page > totalPages`이면 `setPage(totalPages)` 호출.

**방식을 선택한 이유**
`useProductFilter`는 필터/URL 상태만 담당하고 서버 데이터를 모름. `useProductList`는 서버 데이터만 담당하고 URL을 모름. 두 훅의 결과를 모두 아는 `ProductListPage`에서 조율하는 것이 역할 분리에 맞음.

---

### 추가 발견 — 로딩 중 stale totalCount 표시

**증상**
검색어나 필터를 바꾸면 로딩 중에 헤더에 이전 결과의 총 개수가 잠깐 표시됨.

**원인**
`totalCount`는 API 응답이 도착해야 갱신되므로 로딩 중엔 이전 값이 유지됨.

**현재 범위에서 수정하지 않는 이유**
skeleton UI나 optimistic update로 해결하는 영역으로 이번 과제 범위를 벗어남.

---

### 추가 발견 — minPrice > maxPrice 입력 시 결과 없음

**증상**
최소 가격이 최대 가격보다 크면 조건에 맞는 상품이 없습니다가 표시됨.

**원인**
클라이언트에서 유효성 검사 없이 그대로 API에 전달.

**수정하지 않는 이유**
API가 빈 결과를 반환할 뿐 앱이 오동작하지 않아 수정하지 않음.
