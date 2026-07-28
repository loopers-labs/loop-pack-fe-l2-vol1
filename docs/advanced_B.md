# Advanced B — App Router 서버 프리패치

## 선택한 이유
staleTime도 다루어 보고 싶었으나 현재 과제에서 prefetch시 말고는 마땅히 staleTime을 사용할만한 시나리오가 떠오르지 않았기 때문에 선택

## 작업 내역

- **요청별 QueryClient 팩토리**(`lib/queryClient.ts`) — 서버는 요청마다 새 인스턴스, 브라우저는 싱글톤. 전역 default엔 `throwOnError`만(staleTime 없음).
- **목록 쿼리 `staleTime: 60s`** — `productQueries.list`의 `queryOptions`에 위치. 프리패치 데이터가 클라 mount 시 fresh로 인정돼 초기 중복 요청을 막는 전제.
- **prefetch를 Suspense 경계 안 async 서버 컴포넌트로 배치**: `app/products/page.tsx`는 async가 아니며 `searchParams`를 await 없이 `<Suspense>` 안 `ProductListSection`(신규 async 서버 컴포넌트)에 넘긴다. `ProductListSection`이 클라이언트와 **같은 쿼리 팩토리 `productQueries.list(query)`** 를 `prefetchQuery`로 채우고 `dehydrate` + `<HydrationBoundary>`로 캐시를 전달
- 서버·클라가 **같은 URL 파서·변환**을 쓰도록 `productListSearchParams.ts`(파서 + `resolveProductListQuery`)로 추출 → 같은 `queryKey` 보장.
- 서버 fetch용 절대 URL은 `getBaseUrl()`로 해결(기존 홈의 하드코딩 `localhost:3000`도 이걸로 정리).

---

## 추가된 복잡도

### 1. 요청마다 분리된 QueryClient를 만든다 (server) vs 싱글톤 (browser)

- **왜:** 서버에서 QueryClient를 모듈 전역으로 하나 두면 **여러 요청이 같은 캐시를 공유**해 사용자 A의 데이터가 B에게 샐 수 있다. 반대로 브라우저에서 렌더마다 새로 만들면 캐시가 매번 초기화된다.
- **어떻게:** `getQueryClient()`가 `environmentManager.isServer()`로 분기 — 서버는 `makeQueryClient()`로 매번 새로, 브라우저는 `browserQueryClient ??=`로 한 번만.
- **대가:** 서버 / 클라이언트 별로 관리하는 방식이 달라진다.
- **검증:** `src/lib/queryClient.server.test.ts:8` (요구1: 서버에서는 호출마다 새 QueryClient) + 브라우저 싱글톤 `src/lib/queryClient.client.test.tsx:47` ("브라우저에서는 싱글톤을 재사용한다").

### 2. 클라이언트와 같은 queryOptions 쿼리 팩토리를 Server Component의 prefetchQuery에서 재사용한다

- **왜:** dehydrate로 넘긴 서버 캐시가 클라에서 hit하려면 서버 prefetch와 클라 useQuery가 **같은 queryKey·queryFn**을 써야 한다. 팩토리 정의가 두 벌로 갈라지면 키가 어긋나 캐시 미스 → 클라가 새로 요청(=중복).
- **어떻게:** 쿼리 팩토리 `productQueries.list(query)`를 `queries/products.ts` 한 곳에 정의하고, 서버 `ProductListSection`의 `prefetchQuery(productQueries.list(query))`와 클라 `ProductList`의 `useQuery(productQueries.list(query))`가 **같은 팩토리를 import**해 쓴다 → 동일 queryKey·queryFn·캐시 정책(staleTime 포함)이 자동 보장된다.
- **대가:** 단일 정의된 queryOptions를 재사용 하게된 부분이므로 거의 없다고 예상
- **검증:** `src/lib/queryClient.client.test.tsx:95` (요구4: prefetch 된 조건으로 mount 해도 초기 중복 요청이 없다 — 같은 팩토리라 캐시 재사용)

### 3. dehydrate와 HydrationBoundary로 캐시를 클라이언트에 전달한다

- **왜:** 서버가 `prefetchQuery`로 채운 캐시는 **서버의 QueryClient 인스턴스 안에만** 있다. 이건 클라이언트로 자동으로 넘어가지 않으므로, 그냥 두면 클라의 `useQuery`는 **빈 캐시로 시작**해 결국 다시 요청한다 → prefetch가 무의미해진다. 서버 캐시를 클라가 이어받으려면 **직렬화해서 HTML에 실어 보내는** 경로가 필요하다.
- **어떻게:** `ProductListSection`(async 서버 컴포넌트)이 `prefetchQuery` 후 `dehydrate(queryClient)`로 캐시 스냅샷을 만들고, `<HydrationBoundary state={...}>`로 감싼 안쪽의 `ProductList`(클라)가 그 캐시를 물려받는다. Provider의 브라우저 QueryClient에 그대로 이식된다.
- **검증:** `src/lib/queryClient.client.test.tsx:83` (요구3: dehydrate + HydrationBoundary 가 서버 캐시를 클라이언트에 전달한다).

### 4. 클라이언트의 초기 중복 요청 여부를 확인한다 (staleTime 60초 co-locate가 전제)

- **왜:** TanStack Query 기본 `staleTime`은 `0`이다. 그러면 서버에서 prefetch해 넘긴 데이터도 **클라이언트 mount 순간 즉시 stale**로 간주돼 `useQuery`가 **곧바로 재요청**한다 → prefetch가 무의미해지고 초기 중복 요청이 생긴다.
- **어떻게:** **목록 쿼리 팩토리(`productQueries.list`)의 `queryOptions`에 `staleTime: 60s`(`LIST_STALE_TIME`)를 co-locate**해, prefetch한 데이터가 클라에서 **fresh**로 인정되게 한다.
- **대가:** `staleTime`을 `0`에서 `60s`로 올린 만큼 **그 60초 동안은 데이터를 fresh로 보고 자동 재요청을 하지 않는다** — 마운트·리페치 트리거가 와도 스킵된다. 그래서 서버의 상품 목록이 그 사이 바뀌어도 사용자는 **최대 60초까지 옛 데이터**를 보여줄 수 있다(초기 중복 요청 제거를 신선도와 맞바꾼 것).
- **검증:** `src/lib/queryClient.client.test.tsx:95` (요구4: 초기 중복 요청이 없다).

### 5. 모든 데이터를 무조건 prefetch하지 않고 적용 대상을 고른 근거를 기록한다

**prefetch 대상은 상품 목록만으로 정함.** 기준은 **"클라이언트가 useQuery로 다시 가져오는 데이터인가"**. 상품 목록은 사용자가 검색하거나 정렬을 바꾸는 등의 행동으로 다시 가져와야 하나, 홈에는 그런 행동이 없으므로 제외.
