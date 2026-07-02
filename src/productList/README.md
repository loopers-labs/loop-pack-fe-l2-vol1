# ProductListPage 관심사 분류표

| 위치 | 관심사 | 분리 후보 | 분리 이유 | 분리하지 않을 근거 |
|------|--------|-----------|-----------|-------------------|
| `type Product, ProductListResponse, SortBy` | 타입 분리 | `types/type.ts` | 커스텀 훅에서도 사용, UI에서도 사용 | — |
| `const escapeRegExp` | 날짜 순수함수 | `utils/` | 재사용 가능 | — |
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
