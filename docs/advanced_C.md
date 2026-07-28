# Advanced C — 목록 UX 다듬기 (debounce · prefetch · 전환 유지 · 오류 경계 재시도)

## 선택한 이유
전체적으로 UX와 관련된 부분으로 실무에서도 비슷한 작업들을 한 적이 있었기 때문에 현재 환경에서 이 작업들을 어떤식으로 하면 될지 궁금 했기 때문에 선택.

## 작업 내역

1. **검색어 debounce** — 검색 input을 controlled inputValue로 두고, `useDebouncedValue`(300ms)로 늦춘 값만 URL `q`에 커밋. 검색어의 경우는 replace로 처리 하여 히스토리에 안 쌓이게 처리.
2. **다음 페이지 prefetch** — 현재 페이지가 나오면 미리 다음 페이지에 해당하는 데이터를 prefetch
3. **목록 진입 전 prefetch** — 목록으로 가는 링크(홈 카테고리 chip + 헤더 "상품")를 `PrefetchCategoryLink`(client)로 바꿔 hover/focus 시 상품목록을 prefetch
4. **페이지 전환 중 목록 유지** — `productQueries.list`에 `placeholderData: keepPreviousData`를 사용하여 페이지 전환 중에 이전 목록을 유지.
5. **오류 재시도(세그먼트 경계)** — 보여줄 데이터가 없는 실패는 `throwOnError`로 render throw → 이로인해 `products/error.tsx` 세그먼트 경계가 **목록 자리만** 교체(헤더·필터 유지). 재시도는 `queryClient.resetQueries` + Next.js의 error.tsx에서 받을 수 있는 `reset`을 이용.

---

## 개선 전후 요청 흐름과 화면 차이 / 추가된 복잡도

### 1. 검색어 debounce

| | 전 | 후 |
| --- | --- | --- |
| 커밋 시점 | form submit(Enter/버튼) 시에만 | 타이핑 멈춘 뒤 300ms(자동) **+ Enter 제출 즉시** — 두 경로 공존 |
| 입력 컨트롤 | 비제어 `defaultValue` + `key={q}`(값 바뀌면 리마운트) | 제어 `value={inputValue}`(상시 마운트) |
| 요청 흐름 | Enter시에 요청 | 마지막 타이핑 후 1회 요청 |

- **대가:** 검색 반영이 마지막 타이핑 후 300ms **지연**된다(즉시성 희생). 입력 버퍼(`inputValue`)와 URL(`q`)이라는 **두 소스를 맞추는 동기화 로직**(외부 변경 감지용 `prevSearchTerm` + 커밋 가드)이 늘었다.
- **검증:** `src/components/commerce/ProductListFilters.test.tsx:46` (describe "ProductListFilters 검색어 debounce" — "입력 후 디바운스 시간이 지나면 setSearch 를 호출한다") + `src/hooks/useDebouncedValue.test.ts:18` (describe "useDebouncedValue" — 초기값 / 지연 내 유지 / 지연 후 반영 / 연속변경 마지막값, 4케이스).

### 2. 다음 페이지 prefetch (같은 화면 안)

- **전:** "다음" 클릭 → 그때 `page+1` 요청 → 로딩 → 표시.
- **후:** 현재 페이지가 로딩`page+1`을 백그라운드 prefetch(`ProductList.tsx:29-35`). 클릭 시 이미 캐시에 있어 **요청 없이 즉시** 표시.
- **대가:** 사용자가 "다음"을 안 눌러도 매 페이지 정착마다 `page+1`을 **미리 요청**한다 → 실제로 안 넘어가는 사용자에겐 데이터 낭비
- **검증:** `src/components/commerce/ProductList.test.tsx:141` (describe "ProductList" — "현재 페이지가 정착하면 다음 페이지를 미리 prefetch 한다"): page 1 렌더 후 **클릭 없이** mock이 `page===2`로 호출되는지 확인.

### 3. 목록 진입 전 prefetch (다른 화면 → 목록)

- **전:** 홈에서 카테고리 클릭 → `/products` 도착 후 목록 조회 시작.
- **후:** 홈 chip에 hover/focus만 해도 목적지 목록을 브라우저 QueryClient에 미리 채운다(`PrefetchCategoryLink.tsx:27-31`).
- **대가:** hover/focus마다 목적지 목록을 미리 요청하니 **클릭 안 하면 낭비**
- **검증:** `src/components/commerce/PrefetchCategoryLink.test.tsx:24` (hover: "hover 시 목록 초기조건을 목록 페이지와 '같은 queryKey' 로 prefetch 한다") / `:41` (focus: "focus 시에도 prefetch 한다(키보드 사용자)").

### 4. 페이지 전환 중 목록 유지

- **전:** 페이지를 바꾸면 `queryKey`가 바뀌어 새 쿼리가 `pending` → 목록이 사라지고 "불러오는 중…"으로 교체 → 깜빡임.
- **후:** `placeholderData: keepPreviousData`로 전환 중 **이전 페이지 결과를 그대로 반환** → 목록은 남고 `isPlaceholderData`일 때만 흐리게(opacity 0.6, `.updating`) 표시(`ProductList.tsx:44-49`). 새 데이터가 오면 자연스럽게 교체.
- **대가:** 전환 중 화면에 **이전 페이지의 옛 목록**이 잠깐 보이고(신선도 대신 연속성 선택), `keepPreviousData`로 `isPending`이 false가 돼 **로딩 분기를 "첫 로드만 로딩 / 전환은 흐림"으로 재조정**해야 했다.
- **검증:** `src/components/commerce/ProductList.test.tsx:111` (describe "ProductList" — "페이지 전환 중 이전 목록을 유지한다(keepPreviousData)").

### 5. 전체 새로고침 없는 오류 재시도

- **전:** `isError` 시 목록 컴포넌트 안에서 에러 텍스트 + "다시 시도" 버튼(`refetch()`).
- **후:** `throwOnError`로 에러를 던져서 `error.tsx`에 위임. 목록 컴포넌트(`ProductList.tsx`)에는 에러 분기가 없다 — 에러면 애초에 렌더되지 않는다.
- **대가:** 에러 처리가 컴포넌트 밖으로 흩어진다 — `layout`/`page` 분리 + `throwOnError` + `error.tsx` + `resetQueries`가 맞물려야 동작해 흐름을 따라가기 어려움
- **검증:** 에러 경계 진입은 `src/components/commerce/ProductList.test.tsx:97` (describe "ProductList" — "보여줄 데이터가 없는 조회 실패 시 throw 해서 에러 경계로 넘어간다").

---

## 현재 query key·캐시 정책과 충돌하는가 — 충돌 없음

5개 개선 모두 **같은 정규화-키 팩토리(`productQueries.list` → `normalizeProductListQuery`)를 공유**하므로 새로운/어긋난 query key를 만들지 않는다.

캐시 정책과도 부딪히지 않는다:

- **staleTime 60초** — advanced B에서 추가한 staleTime 60초로 인하여 다음 페이지·진입 전 prefetch로 데운 데이터를 60초 fresh로 봐 재요청을 하지 않음.

