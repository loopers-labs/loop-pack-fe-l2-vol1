# 5주차 상태 설계

> 기준: [`docs/assignments/week-05.md`](../assignments/week-05.md)  
> 세부 판단 과정: [`docs/week-05/decisions.md`](./decisions.md)

상태 관리 도구를 먼저 정하지 않고, 값의 원본이 어디에 있는지와 얼마나 오래 유지되어야 하는지를 기준으로 경계를 나눴다.

## 상태 경계표

| 상태                                             | 소유자(Source of Truth)                            | 수명                                           | 공유 범위                          | 선택 이유                                                                                                                         |
| ------------------------------------------------ | -------------------------------------------------- | ---------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 홈 데이터(배너·카테고리·인기·신상품)             | 서버 API                                           | `staleTime` 1분                                | 홈 화면·서버/클라이언트 Query 캐시 | 서버 원본의 스냅샷이며 신상품·인기상품의 최신 노출이 중요하다. TanStack Query로 조회하고 서버 prefetch 결과를 hydrate한다.        |
| 상품 목록 데이터(products·categories·totalCount) | 서버 API                                           | `staleTime` 5분·조건별 캐시                    | 상품 목록 화면                     | 검색 조건마다 서버에서 다시 계산되는 스냅샷이다. 조건 전체를 query key에 넣어 분리하고, 같은 조건으로 돌아오면 캐시를 재사용한다. |
| 검색어 `q`                                       | URL                                                | URL 히스토리·공유된 주소가 유지되는 동안       | 상품 목록의 필터·조회              | 새로고침·URL 공유·앞뒤 이동으로 복원해야 한다. 300ms debounce가 끝난 검색어만 `push`해 검색 단위로 히스토리를 남긴다.             |
| 카테고리·정렬·페이지                             | URL                                                | URL 히스토리·공유된 주소가 유지되는 동안       | 상품 목록의 필터·페이지네이션·조회 | 변경을 뒤로/앞으로 이동으로 복원해야 하므로 nuqs의 `history: 'push'`를 사용한다.                                                  |
| 페이지 크기                                      | 코드 상수 `PRODUCT_PAGE_SIZE`                      | 배포된 코드가 바뀔 때까지                      | 상품 목록의 조회·스켈레톤 개수     | 화면에 변경 UI가 없어 사용자가 소유하는 상태가 아니다. URL에 두면 임의 값으로 API 400을 만드는 표면만 늘어난다.                   |
| 비로그인 장바구니 상품 ID                        | 브라우저 `localStorage`와 Zustand store            | 명시적으로 제거하거나 저장소를 초기화할 때까지 | 홈·상품 목록·헤더                  | 서버 원본이 없는 익명 사용자 상태이며 여러 화면이 함께 사용한다. `persist`로 새로고침 후에도 복원한다.                            |
| 비로그인 위시리스트 상품 ID                      | 브라우저 `localStorage`와 Zustand store            | 명시적으로 제거하거나 저장소를 초기화할 때까지 | 홈·상품 목록·헤더                  | 장바구니와 독립된 도메인이지만 현재 자료구조와 동작이 같아 공통 store 팩토리를 재사용한다.                                        |
| 헤더의 장바구니·위시리스트 개수                  | 저장하지 않음(상품 ID 배열에서 파생)               | 렌더링 동안 계산                               | 헤더                               | 원본 배열과 어긋날 수 있는 중복 상태를 만들지 않고 selector에서 `ids.length`로 계산한다.                                          |
| 전체 페이지 수                                   | 저장하지 않음(`totalCount`와 페이지 크기에서 파생) | 렌더링 동안 계산                               | 상품 목록 페이지네이션             | 서버 응답과 상수로 계산할 수 있으므로 별도 상태로 두지 않는다.                                                                    |

---

## 도구별 책임

### TanStack Query: 서버 상태의 조회와 캐시

서버 응답을 컴포넌트나 Zustand에 복사하지 않고 TanStack Query 캐시에서 직접 소비한다. 조회 계층은 다음처럼 나눴다.

```text
api(fetch·직렬화) → queries(query key·queryFn·캐시 정책) → service(소비 훅)
```

- 홈은 Server Component에서 `homeQueries.detail()`을 `prefetchQuery`하고, `dehydrate`와 `HydrationBoundary`로 같은 캐시를 클라이언트에 전달한다. 클라이언트의 `useSuspenseHomeQuery`도 동일한 queryOptions를 사용한다.
- 상품 목록은 URL 조건 전체를 `productQueryKeys.list(params)`에 포함한다. 조건이 바뀌면 다른 캐시로 조회하고, `placeholderData: keepPreviousData`로 새 요청 중에도 이전 목록을 유지한다.
- `QueryClientProvider`와 `NuqsAdapter`만 Client Provider로 분리해 루트 layout의 Server Component 경계를 유지한다.

### nuqs: 공유하고 복원할 조회 조건

`productListParsers`를 URL 상태와 API 요청의 단일 정의로 사용한다.

```text
URL → useQueryStates → React Query query key → API serializer → GET /api/products
```

- 기본값: `q=''`, `category='all'`, `sort='latest'`, `page=1` (`pageSize`는 URL 상태가 아니라 상수 `PRODUCT_PAGE_SIZE=12`이며 API 직렬화 단계에서만 붙는다)
- 검색·카테고리·정렬을 바꾸면 `page`를 1로 되돌린다.
- `q`는 300ms debounce가 끝난 확정 검색어를 `push`해 글자마다가 아니라 검색 단위로 히스토리에 쌓는다.
- 카테고리·정렬·페이지는 한 번의 명시적 변경이므로 `push`로 히스토리에 쌓는다.
- `scenario`는 mock API 검증 값일 뿐 사용자 조회 조건이 아니므로 parser와 `ProductListQuery`에 넣지 않는다.

기본값 처리도 소비 목적에 따라 나눴다.

- `useQueryStates(productListParsers)`: 기본 `clearOnDefault: true`로 주소창에서 기본값을 생략한다.
- `createSerializer(productListParsers, { clearOnDefault: false })`: API에는 `sort=latest`를 포함한 기본값을 명시한다.

홈에서 카테고리를 선택할 때는 `/products?category=...`로 새로 진입해 나머지 조건을 기본값으로 시작한다. 목록 안에서 카테고리를 변경할 때는 기존 검색어와 정렬을 유지하고 페이지만 1로 되돌린다.

### Zustand: 서버 원본이 없는 공유 클라이언트 상태

장바구니와 위시리스트는 독립된 store로 두되, 현재 두 도메인이 모두 `상품 ID 집합 + toggle` 구조이므로 `createCollectionStore` 팩토리로 공통 구현한다.

- 저장 형태: `{ ids: string[] }`
- action: `toggle(id)`
- 저장 키: `cart`, `wishlist`
- `partialize`: 직렬화 가능한 `ids`만 저장
- `version: 1`과 `migrate`: 저장 스키마 변경에 대비
- `merge`: 복원할 때 저장값을 검증하고 손상된 값은 빈 배열로 복구

컴포넌트는 필요한 조각만 selector로 구독한다.

- Header: 각 store의 `ids.length`
- 상품 버튼: 해당 `productId`의 포함 여부와 `toggle` action

Zustand 훅이 hydration 시 초기 상태를 server snapshot으로 제공하므로, 소비처에서는 `getState()`로 직접 렌더링하지 않고 selector 훅을 사용한다. 별도의 hydration 완료 상태는 두지 않는다.

## 캐시 수명 정책

### 홈: `staleTime` 1분

홈은 사용자가 처음 접하는 화면이고 신상품·인기상품의 최신 노출이 중요하다. 목록보다 빠르게 stale 상태로 전환해 재방문·창 포커스 등의 refetch 조건에서 최신 데이터를 다시 확인한다.

### 상품 목록: `staleTime` 5분

상품 목록은 검색·카테고리·정렬·페이지 조합마다 query key가 달라진다. 같은 조건으로 돌아왔을 때 캐시를 재사용해 불필요한 요청을 줄이는 것을 우선했다. 향후 목록에 재고나 할인가격처럼 신선도가 중요한 정보가 추가되면 실제 변경 빈도와 오래된 정보의 위험을 기준으로 더 짧게 조정한다.

### 공통: 기본 `gcTime` 5분

별도 설정 없이 기본값을 유지한다. `staleTime`은 데이터를 오래된 것으로 판단하는 시점이고, `gcTime`은 구독자가 없는 inactive 캐시를 제거하는 시점이므로 역할이 다르다.

## 로딩·에러·빈 상태의 경계

| 화면      | 로딩                                                                | 에러                                       | 빈 상태                                        |
| --------- | ------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------- |
| 홈        | 서버 prefetch와 `useSuspenseQuery`, 라우트 `loading.tsx`            | 루트 `error.tsx`                           | 인기·신상품처럼 비어 있는 큐레이션 섹션을 숨김 |
| 상품 목록 | 최초 조회는 skeleton, 조건 변경은 이전 목록 유지와 `aria-busy` 표시 | 목록 영역에서 메시지와 `refetch` 버튼 제공 | `검색 결과가 없습니다.`를 명시적으로 표시      |

홈은 화면 전체가 하나의 홈 응답에 의존하므로 Suspense/ErrorBoundary로 라우트 경계에 위임했다. 상품 목록은 필터 변경 중 기존 결과를 유지해야 하므로 `useQuery + keepPreviousData`를 사용하고 목록 영역 안에서 상태를 구분한다.

## 전역 또는 별도 상태로 만들지 않은 값

- 서버 응답: TanStack Query 캐시에 있으므로 Zustand에 복사하지 않는다.
- 검색 조건: 공유·복원 대상이므로 React 로컬 상태나 Zustand가 아니라 URL에 둔다.
- 헤더 개수와 전체 페이지 수: 기존 원본으로 계산할 수 있어 저장하지 않는다.
- 필터 변경 함수와 페이지 이동 함수: 라우트 전용 훅이 URL 상태 변경 규칙만 캡슐화하며 별도 상태를 소유하지 않는다.
- QueryClient 인스턴스: `useState`는 도메인 값을 저장하려는 목적이 아니라 Client Provider 생애 동안 인스턴스를 한 번만 생성하기 위해 사용한다.

## 로그인·서버 동기화가 추가될 때

로그인 후 위시리스트의 원본은 브라우저가 아니라 서버로 이동한다. 이때 서버 위시리스트는 TanStack Query로 조회하고 mutation 성공 후 관련 query를 갱신한다. 현재 Zustand 위시리스트는 로그인 전 임시 입력으로만 제한하며, 로그인 시 익명 목록을 서버 데이터와 합칠지, 버릴지, 충돌 시 어느 쪽을 우선할지 정책을 먼저 정해야 한다.

장바구니도 서버 동기화 요구가 생기면 같은 기준으로 소유권을 다시 판단한다. 수량처럼 도메인 규칙이 추가되면 현재 공통 컬렉션 팩토리에서 장바구니 store만 분리한다.

## 검증 결과와 남은 확인

### 확인한 내용

- 홈 서버 prefetch 결과가 SSR HTML에 포함되고, hydration 후 클라이언트의 초기 `/api/home` 중복 요청이 발생하지 않는 것을 확인했다.
- 홈에서 목록으로 이동한 뒤 카테고리·정렬을 변경하고 뒤로/앞으로 이동했을 때 URL과 필터 값이 복원되는 것을 확인했다.
- Zustand selector 훅으로 읽을 때 persisted 값 때문에 hydration 불일치가 발생하지 않는 것을 확인했다. 렌더 중 `getState()`로 직접 읽는 방식은 불일치를 일으켜 사용하지 않는다.
- 상품 목록은 조건 변경 시 `keepPreviousData`로 기존 목록을 유지하고, 최초 로딩·에러·빈 상태를 별도 UI로 구분한다.

### 남은 확인 또는 재검토 조건

- 배포 환경에서는 서버 prefetch가 사용할 API base URL 환경 설정을 명시해야 한다.
- 상품 목록의 서버 prefetch는 URL별 조건과 비용을 비교한 뒤 필요할 때만 도입한다.
- 재고·할인가격이 목록에 추가되면 목록 `staleTime` 5분을 다시 검토한다.
- `hydration-demo`는 설계 검증용 라우트이므로 학습 근거를 남긴 뒤 제거할 수 있다.

---

_이 문서는 과제 명세, 현재 구현, `decisions.md`의 검증 기록을 함께 대조해 정리했다. 문서 구성과 문장 정리는 AI(Codex)의 도움을 받았고, 상태 경계와 정책 값은 구현된 코드 및 사용자가 확정한 판단을 기준으로 작성했다._
