# 상품 목록 — 관심사 분리 기록 (3주차)

> `ProductListPage.tsx` 단일 500줄+ 컴포넌트를 **Components / Hooks / Services / Utils** 네 레이어로 갈랐다.
> **기능 추가는 없다.** 목표는 "한 번에 한 가지만 읽는" 구조 + 분리/비분리 근거 기록.

---

## 1. 관심사 분류표 (과제 1)

원래 한 파일에 섞여 있던 관심사를 훑고, 어디로 보냈는지 / 왜 안 옮겼는지 정리.

| 원래 위치 (구 ProductListPage)                                        | 관심사             | 분리 후보                                         | 결정 & 근거                                                                  |
| --------------------------------------------------------------------- | ------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| `type Product / SortBy ...`                                           | 도메인 타입        | `types.ts`                                        | ✅ 분리. 여러 레이어가 공유하는 계약이라 한 곳에.                            |
| `CATEGORIES / SORT_OPTIONS / PAGE_SIZE`                               | UI 옵션·상수       | `constants.ts`                                    | ✅ 분리. 컴포넌트가 "값을 들고 다니지" 않게.                                 |
| `fetch('/api/products...')`                                           | API 통신           | `services/productApi.ts`                          | ✅ 분리. endpoint·쿼리 조립·응답 타입을 한 곳에(DIP: 훅은 `fetch`를 모른다). |
| `useState(products/loading/error)` + fetch effect                     | 서버 상태          | `hooks/useProducts.ts`                            | ✅ 분리. 서버 상태(로딩·에러 포함) 캡슐화.                                   |
| `useState(category/price/sort/search/inStock/page)` + `handleXChange` | 클라이언트 상태    | `hooks/useProductFilters.ts`                      | ✅ 분리. "조건 바뀌면 page=1" 정책을 한 곳에 모음.                           |
| `totalPages / pageNumbers` for문                                      | 파생값             | `utils/pagination.ts`                             | ✅ 분리. **훅이 아니라 util** — 상태·effect가 없는 순수 계산이라서.          |
| `discountRate/isNew/isHot/isBest...` 인라인                           | 도메인 규칙        | `utils/productBadges.ts`                          | ✅ 분리. "특가/BEST 기준" 같은 규칙은 UI와 무관한 순수 함수.                 |
| `toLocaleString()+"원"`, 날짜 계산                                    | 포맷               | `utils/formatters.ts`, `productBadges.ts`         | ✅ 분리. 표시 규칙을 한 곳에.                                                |
| `wishlist` state + localStorage effect                                | 영속 클라 상태     | `hooks/useWishlist.ts` (+ `useLocalStorageState`) | ✅ 분리. 저장 로직 공용화.                                                   |
| `recentlyViewed` state + localStorage effect                          | 영속 클라 상태     | `hooks/useRecentlyViewed.ts`                      | ✅ 분리. 위와 같은 뼈대 재사용.                                              |
| `useEffect(scrollTo, [page])`                                         | 외부 시스템 동기화 | `hooks/useScrollToTopOnChange.ts`                 | ✅ 분리. window 동기화라는 한 가지 책임.                                     |
| `useEffect(replaceState, [...])`                                      | 외부 시스템 동기화 | `hooks/useProductListUrlSync.ts`                  | ✅ 분리. 주소창 동기화라는 한 가지 책임.                                     |
| `highlightMatch` 인라인                                               | UI 표시            | `components/Highlight.tsx`                        | ✅ 분리. JSX를 반환하므로 util이 아니라 컴포넌트로.                          |
| 카드/그리드/필터/정렬/페이지 JSX                                      | UI 렌더            | `components/*`                                    | ✅ 분리. 컴포넌트는 렌더에만 집중.                                           |
| `viewMode` state                                                      | 순수 UI 상태       | (훅 후보)                                         | ❌ **분리 안 함.** fetch에 영향 없고 쓰는 곳이 페이지뿐 → `useState` 그대로. |

---

## 2. 결과 구조

```
productList/
├─ ProductListPage.tsx      # 오케스트레이터: 훅 엮기 + 컴포넌트 배치 (로직 없음)
├─ types.ts                 # 도메인 타입 계약
├─ constants.ts             # 카테고리/정렬 옵션, PAGE_SIZE
├─ services/
│  └─ productApi.ts         # GET /api/products (endpoint·쿼리·응답 타입)
├─ hooks/
│  ├─ useProducts.ts        # 서버 상태
│  ├─ useProductFilters.ts  # 필터/검색/정렬/페이지 클라 상태
│  ├─ useWishlist.ts        # 위시리스트
│  ├─ useRecentlyViewed.ts  # 최근 본 상품
│  ├─ useLocalStorageState.ts # 위 둘의 공용 뼈대
│  ├─ useScrollToTopOnChange.ts # 페이지 전환 스크롤
│  └─ useProductListUrlSync.ts  # URL 쿼리 동기화
├─ utils/
│  ├─ productBadges.ts      # 배지 도메인 규칙 (순수)
│  ├─ formatters.ts         # 금액 포맷 (순수)
│  └─ pagination.ts         # 페이지 버튼 계산 (순수 파생)
└─ components/
   ├─ FilterPanel.tsx / SearchSortBar.tsx
   ├─ ProductGrid.tsx / ProductCard.tsx / Highlight.tsx
   └─ Pagination.tsx
```

---

## 3. Custom Hook — 각각 한 문장 (과제 3)

| Hook                     | 한 문장 (책임)                                                              |
| ------------------------ | --------------------------------------------------------------------------- |
| `useProducts`            | 필터 조건에 맞는 상품 목록을 서버에서 가져오고 로딩·에러 상태를 관리한다.   |
| `useProductFilters`      | 필터·검색·정렬·페이지 상태를 관리하고, 조건이 바뀌면 페이지를 1로 되돌린다. |
| `useWishlist`            | 위시리스트 상품 id 목록을 관리하고 localStorage와 동기화한다.               |
| `useRecentlyViewed`      | 최근 본 상품 id를 최신순 최대 10개 보관하고 localStorage와 동기화한다.      |
| `useLocalStorageState`   | number[] 상태를 localStorage와 동기화하는 공용 뼈대(위 둘이 사용).          |
| `useScrollToTopOnChange` | 지정한 값이 바뀌면 창을 맨 위로 스크롤한다.                                 |
| `useProductListUrlSync`  | 필터·페이지 상태를 URL과 양방향 동기화한다(쓰기 + popstate 되읽기).         |

> 셀프 체크: 한 문장에 "그리고"가 두 번 들어가면 분리 후보. 위 훅들은 모두 한 문장으로 끝난다.

---

## 4. 분리하지 않은 결정 (근거)

- **`viewMode`는 훅으로 빼지 않았다** — fetch에 영향 없는 순수 UI 상태이고, 쓰는 곳이 페이지 한 곳뿐. "나중에 공유할지도"는 끌어올릴 이유가 아니다. `useState` 한 줄이 가장 정직하다.
- **페이지네이션은 훅이 아니라 util** — `derivePagination`은 상태도 effect도 없다. `useX` 이름을 붙이면 "hook 규칙(순서·deps)"을 오해시킨다. 순수 계산은 util.
- **`inStock`은 클라이언트 필터로 유지 (서버 파라미터로 안 옮김)** — 서버 파라미터로 옮기면 "받아온 페이지 안에서 거르는" 페이지네이션 결과가 바뀌므로(= 기능 변경) 클라 필터를 유지한다. 단, **파생값이므로 state에 저장하지 않고 `useProducts` 반환 시 계산**한다 → `inStockOnly` 토글에 서버 재요청이 안 나가고, "파생값은 계산한다" 원칙과도 맞는다. (`filter()` 결과를 `setProducts`로 저장하던 초안을 리뷰 피드백으로 수정 — "You Might Not Need an Effect".)

---

## 5. 상태 3분할 & Effect 정당성 (셀프 리뷰)

- **서버 상태**: `products / totalCount / isLoading / error` → `useProducts`.
- **클라이언트 상태**: 필터·검색·정렬·페이지(`useProductFilters`), viewMode(페이지), 위시리스트·최근본(localStorage 훅).
- **파생값**: `totalPages / pageNumbers`(util로 계산), 배지 플래그·포맷(util). **state로 들고 있지 않는다.**
- **남은 useEffect는 전부 "외부 시스템 동기화"**: 서버 fetch, localStorage, window 스크롤, 주소창(`replaceState`). 상태를 상태로 "동기화"하는 effect는 없다(`react-hooks/set-state-in-effect` 게이트도 통과). fetch effect는 **서버 조회·원본 저장만** 담당하고, `inStock` 필터는 effect가 아니라 **파생 계산**으로 뺐다(§4).

---

## 6. AI 표기

마킹은 "작업의 수준"으로 나눈다.

- **기계적 이동·JSX 추출** (`types.ts` · `constants.ts` · `utils/formatters.ts` · 프리젠테이션 컴포넌트 6개) → 파일 상단 `// [AI 생성]`으로 표기.
- **설계 판단이 담긴 코드** (`services/*` · `hooks/*` · `utils/productBadges.ts` · `utils/pagination.ts`(훅 vs util) · `ProductListPage.tsx`) → AI 마커를 붙이지 않고 **근거 주석만** 남겼다. 분리의 "왜"는 직접 검토·결정했기 때문.

---

## 7. 리뷰 반영 (2차)

리뷰 피드백으로 아래를 수정했다.

1. **inStock 파생값** — `filter()` 결과를 `setProducts`로 저장하던 걸 없애고 `useProducts` 반환 시 계산. `inStockOnly` 토글 시 서버 재요청도 사라짐. (§4, "You Might Not Need an Effect")
2. **URL 양방향 동기화** — 쓰기만 있던 URL 동기화에 **초기 읽기 + 값 검증 + popstate 되읽기**를 추가. 새로고침·링크 공유·뒤로가기에도 필터가 유지된다. 파싱/직렬화는 `utils/productListUrl.ts`(순수 함수)로 빼고, 필터 상태는 URL과 1:1이라 한 덩어리(`FilterState`)로 합쳤다.
3. **스크롤 마운트 튐** — `useScrollToTopOnChange`가 첫 렌더에 실행되던 걸, 이전 값을 `ref`로 비교해 **값이 실제로 바뀔 때만** 스크롤하도록 수정.
4. **page 범위 초과 방어** — `?page=99`처럼 범위를 넘는 요청은 응답 후 `page > totalPages`를 감지해 마지막 페이지로 보정(빈 화면 방지). 별도 sync effect 대신 **fetch 성공 흐름 안에서** 콜백으로 처리해 `set-state-in-effect` 게이트를 피했다.
