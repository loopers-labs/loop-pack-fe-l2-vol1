# productList — 관심사 분리 & Custom Hook (3주차)

God 컴포넌트였던 `ProductListPage.tsx`를 **components / hooks / services / utils** 레이어로 분리하였습니다.

---

## 폴더 구조

```
productList/
  ProductListPage.tsx   페이지 — 훅 호출과 JSX 조립만 담당
  types.ts              Product 도메인 모델 타입
  dto.ts                상품 목록 조회 API 요청/응답 타입
  components/           렌더링만 담당하는 UI 컴포넌트
  hooks/                상태와 로직을 담당하는 커스텀 훅
  services/             api 함수 (fetcher)
  utils/                순수함수
```

---

## Custom Hook — 각 훅의 한 문장

| Hook                | 한 문장 설명                                                  |
| ------------------- | ------------------------------------------------------------- |
| `useProducts`       | 서버 fetch, error, loading 상태를 관리하고 refetch를 제공한다 |
| `useProductFilters` | 상품 조회 조건을 관리하고 URL에서 초기값을 복원한다           |
| `usePagination`     | 페이징 처리를 담당한다                                        |
| `useScrollToTop`    | 값이 바뀌면 스크롤을 최상단으로 올린다                        |
| `useDebouncedValue` | 값이 안정될 때까지 반영을 지연한다                            |
| `useWishlist`       | 위시리스트를 localStorage와 동기화하며 관리한다               |
| `useRecentlyViewed` | 최근 본 상품을 localStorage와 동기화하며 관리한다             |

---

## 분리한 것 (근거)

| 대상                                          | 분리 근거                                                                                                      |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `useProducts`                                 | 페이지가 서버 fetch/error/loading을 직접 관리하며 렌더링과 서버 통신이 결합되어 있어 분리하였습니다            |
| `useProductFilters`                           | 검색 조건이 초기화될 때 함께 초기화되는 값들을 한 곳에 모았습니다                                              |
| `usePagination` / `useScrollToTop`            | 스크롤 이동은 page 외 다른 상태에서도 발생할 수 있어, 페이징 훅은 온전히 페이징만 담당하도록 나눴습니다        |
| `useWishlist` / `useRecentlyViewed`           | 같은 데이터를 다루는 초기화/저장/조작 로직을 한 곳에 모았습니다                                                |
| `getProductList` + `apiClient`                | 페이지가 직접 수행하던 fetch와 URL 조립을 분리 — service만 봐도 API 스펙이 보이게 하였습니다                   |
| `types.ts` / `dto.ts`                         | util 함수가 service를 역방향 import하는 순환 참조가 생겨 타입을 별도 파일로 분리하였습니다                     |
| `utils/` 순수함수들                           | 카드 렌더에 인라인으로 산재하던 계산 로직의 의도를 네이밍으로 드러내기 위해 분리하였습니다                     |
| `ProductGrid`                                 | 로딩/에러를 페이지 전체 early return으로 처리하면 검색창까지 언마운트되어 포커스를 잃는 문제가 있었습니다      |
| `ProductCard`, `HighlightText`, 필터 컨트롤들 | 목록과 카드 한 장의 책임이 한 덩어리였던 것을, 각 컴포넌트가 자기 렌더링과 이벤트 파싱만 담당하도록 나눴습니다 |

## 분리하지 않은 것 (근거)

| 대상                           | 분리하지 않은 근거                                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `searchQuery`를 별도 훅으로    | 서버로 가는 파라미터는 한 곳에서 관리하는 것이 낫다고 판단하여 `useProductFilters`에 함께 두었습니다 |
| URL 동기화 effect              | 분리하고 싶었지만 단순 로직을 이관하는 냄새가 나서 페이지에 남겨두었습니다                           |
| `useLocalStorageState` 공통 훅 | localStorage 동기화가 두 훅에서 중복되지만 아직 2회 반복이라 공통화를 보류하였습니다                 |
| refetch를 Context로 공급       | props drilling이 한 단계뿐이라 오버엔지니어링의 경계라고 판단하였습니다                              |
| `ProductBadge` 컴포넌트        | 한 줄 span 래퍼일 뿐 로직/재사용 이득이 없어 만들지 않았습니다                                       |

---

## 상태 3분할

| 유형       | 상태                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| 서버       | products, totalCount, isLoading, error (`useProducts`)                   |
| 클라이언트 | 조회 조건(`useProductFilters`), page, viewMode, wishlist, recentlyViewed |
| 파생값     | totalPages, 디바운스된 검색어/가격, 상품 뱃지 (state로 들지 않고 계산)   |
