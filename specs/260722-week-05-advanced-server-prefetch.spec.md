# 5주차 Advanced B + C 일부 — 서버 prefetch와 페이지 전환 스펙

## 목표

홈과 상품 목록의 첫 조회를 서버에서 시작해 브라우저 요청이 뒤늦게 이어지는 워터폴을 없앤다. 헤더와 데이터 대기 화면은 먼저 보여주고, 조회가 끝나면 실제 콘텐츠 HTML을 이어서 보낸다.

페이지를 바꿀 때 새 데이터가 캐시에 있으면 바로 보여준다. 캐시에 없으면 현재 목록을 유지한 채 새 페이지를 조회하고, 화면에 전환 중임을 표시한다.

기본 과제는 [260719-week-05-state-management.spec.md](260719-week-05-state-management.spec.md)에 정리되어 있다. 이 문서는 기본 스펙에서 제외했던 Advanced B 전체와 Advanced C의 "페이지 변경 중 기존 목록 유지"만 다룬다. 상태 소유권과 캐시 정책은 기본 스펙을 그대로 따른다.

## 비범위

- Advanced A(Zustand `persist`), Advanced D의 별도 상태 테스트
- Advanced C의 검색 debounce·다음 페이지 prefetch·목록 이동 전 prefetch
- 검색·카테고리·정렬 변경 중 기존 목록 유지
- pending 쿼리 dehydration과 `useSuspenseQuery`
- `staleTime`·`gcTime` 변경
- 오류 종류별 복구 화면과 새로고침 없는 재시도
- 상품 상세 등 새 화면
- 여러 도메인을 위한 범용 저장소 계층(repository)이나 DataSource 인터페이스
- Route Handler의 데이터 계산 로직이나 기존 목 데이터 모듈의 재구성

## 확정 목표

- 서버에서는 prefetch 경계마다 `QueryClient`를 새로 만들어 요청 사이에 캐시가 섞이지 않게 한다.
- 서버와 브라우저가 같은 `productQueries`의 `queryKey`, `queryFn`, 캐시 정책을 쓴다.
- 서버 prefetch도 기존 `getHome`, `getProducts`를 통해 `/api/home`, `/api/products`를 호출한다.
- 기존 Route Handler, 목 데이터와 계산 로직, 목 데이터 테스트는 현재 위치와 형태를 유지한다.
- 홈과 상품 목록의 데이터 영역은 하위 서버 컴포넌트에서 `await prefetchQuery`한다. 헤더와 대기 화면을 먼저 보내고, 조회가 끝나면 실제 콘텐츠 HTML을 보낸다.
- `HomeContent`와 `ProductList`는 `useQuery`와 hydration 캐시 읽기를 유지한다.
- 페이지 변경 때 `staleTime` 안의 캐시가 있으면 바로 보여준다. 캐시에 없으면 `placeholderData`로 현재 페이지를 유지하면서 새 페이지를 조회한다.
- 검색·카테고리·정렬이 바뀌면 이전 목록을 남기지 않고 기존 인라인 로딩 화면을 보여준다.
- 정상적인 첫 화면에서는 브라우저가 `/api/home`이나 `/api/products`를 다시 요청하지 않는다.
- 선택한 대상과 늘어난 복잡도, 검증 결과를 PR에 기록한다.

## 조사 결과

- 과제는 클라이언트 조회와 동일한 `queryOptions` 쿼리 팩토리를 Server Component의 `prefetchQuery`에 재사용하라고 요구한다 (`docs/assignments/week-05.md:67`). 연결된 완성 코드나 정답 구조는 제공하지 않는다고 명시한다 (`docs/assignments/week-05.md:15`).
- 현재 `apiClient`의 상대 경로 `/api/...`는 브라우저에서는 현재 origin을 기준으로 해석되지만 서버의 `fetch`에는 절대 URL이 필요하다 (`src/shared/api-client.ts:11`).
- `apiClient`가 서버에서만 `APP_ORIGIN`을 상대 경로 앞에 붙이고 브라우저에서는 지금처럼 상대 경로를 사용하면 호출부를 바꾸지 않고 `queryKey`와 조회 함수를 한 벌로 유지할 수 있다.
- [Next.js 공식 BFF 가이드](https://nextjs.org/docs/app/guides/backend-for-frontend#server-components)는 내부 HTTP 왕복 대신 서버 컴포넌트가 데이터 원본을 직접 조회하라고 권장한다. 이번 과제에서는 멘토가 제공한 API와 동일한 쿼리 팩토리를 그대로 사용하는 학습 목표를 우선하며 이 추가 왕복을 수용한다.
- TanStack Query는 캐시를 `queryKey`로 구분하므로 실행 환경 설정인 `APP_ORIGIN`은 `queryKey`에 넣지 않는다 ([TanStack Query Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)).
- 홈 prefetch 전에 Next.js `connection()`을 호출해 빌드 중 내부 API를 호출하지 않고 실제 요청이 들어온 뒤 조회하며, 프로덕션 빌드에서도 홈의 대기 화면과 스트리밍을 확인한다 ([Next.js connection](https://nextjs.org/docs/app/api-reference/functions/connection)).
- 두 API의 정상·빈 값·오류 응답에는 500ms 지연이 있다 (`docs/assignments/week-05.md:117`). 페이지 전체가 기다리면 헤더도 늦게 보인다.
- Next.js는 느린 데이터와 가까운 곳에 `Suspense`를 두고 준비된 화면부터 보내는 방식을 권장한다 ([Next.js Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data#with-suspense)).
- TanStack Query는 `Suspense` 안의 서버 컴포넌트에서 prefetch를 기다리면, 클라이언트 컴포넌트가 `useQuery`를 쓰더라도 준비된 콘텐츠를 스트리밍할 수 있다고 설명한다 ([TanStack Query Advanced SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr#streaming-with-server-components)).
- pending 쿼리 dehydration은 쿼리가 끝나기 전에 캐시를 보내거나 보조 쿼리를 일찍 시작할 때 유용하다. 지금은 각 경계에 필수 쿼리가 하나뿐이라 완료를 기다린 뒤 기본 `dehydrate`를 쓰는 편이 단순하다.
- 상품 목록에는 이미 목록만 감싼 `Suspense`와 대기 화면이 있다 (`src/app/products/page.tsx:31`). 이 안에 prefetch 서버 컴포넌트를 두면 경계를 더 만들 필요가 없다.
- `placeholderData`는 `queryKey`가 바뀌어도 이전 성공 데이터를 보여주다가 새 데이터로 바꿀 수 있다. `isPlaceholderData`로 이 상태를 구분한다 ([TanStack Query Paginated Queries](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries#better-paginated-queries-with-placeholderdata)).
- `placeholderData: keepPreviousData`를 그대로 쓰면 검색·카테고리·정렬을 바꿀 때도 이전 결과가 남는다. 이전 조건과 새 조건의 `q`, `category`, `sort`, `pageSize`가 같고 `page`만 달라졌을 때만 이전 데이터를 반환해야 한다.
- nuqs의 `shallow` 기본값은 `true`다. URL 조건을 바꿔도 서버 컴포넌트를 다시 실행하지 않고 브라우저 쿼리가 새 데이터를 조회한다 ([nuqs Options](https://nuqs.dev/docs/options)).
- `getQueryClient`는 서버에서 부를 때마다 새 `QueryClient`를 만든다 (`src/app/providers.tsx:22`). 현재는 `'use client'` 파일 안에 있어 서버 컴포넌트와 함께 쓰려면 옮겨야 한다.
- `conditionParsers`는 React hook과 같은 파일에 있다 (`src/features/products/search-params.ts`). 서버에서도 파서를 쓰려면 React에 의존하지 않는 파일로 분리해야 한다.
- nuqs의 `createLoader`는 같은 파서 맵으로 App Router의 `searchParams`를 읽는다. 서버용 파싱 규칙을 따로 만들 필요가 없다 ([nuqs Server-Side](https://nuqs.dev/docs/server-side)).

## 결정 사항

### D1. 서버도 기존 쿼리 팩토리로 API를 호출한다

- 기존 `src/app/api/home/route.ts`, `src/app/api/products/route.ts`, `src/app/api/_data/commerce.ts`, `src/app/api/_data/commerce.test.ts`는 옮기거나 재구성하지 않는다.
- `apiClient`는 서버에서 상대 경로를 받으면 환경변수 `APP_ORIGIN`을 기준으로 절대 URL을 만들고, 브라우저에서는 기존 상대 경로를 그대로 사용한다.
- `APP_ORIGIN`은 `http:` 또는 `https:` origin인지 검증한다. 누락되거나 잘못되면 서버 prefetch 실패로 처리하고 브라우저가 재조회한다.
- `getHome`, `getProducts`, `productQueries.home`, `productQueries.list`의 인자와 호출 방식은 바꾸지 않는다.
- 서버 prefetch 경계는 기존 쿼리 팩토리를 그대로 `prefetchQuery`에 넘긴다.
- 서버용 쿼리 팩토리, 서버 데이터 함수, DataSource 인터페이스는 만들지 않는다.

```ts
await queryClient.prefetchQuery(productQueries.home());

await queryClient.prefetchQuery(productQueries.list(conditions));
```

- hydration 뒤 브라우저가 다시 조회할 때도 같은 호출을 사용하며 `apiClient`가 상대 URL로 요청한다.
- `scenario`는 계속 목 API 검증 전용으로 두고 사용자 URL 상태, `ProductListQuery`, `queryKey`에는 넣지 않는다. 서버 prefetch도 이 값을 보내지 않는다.

### D2. 홈은 헤더와 대기 화면을 먼저 보낸다

- `HomePage`는 헤더를 바로 렌더링하고 홈 데이터 영역만 `Suspense`로 감싼다.
- `src/app/page.tsx`에 local async 컴포넌트 `HomePageInner`를 둔다. 기존 `src/features/products/HomeContent.tsx`는 이름과 위치를 그대로 둔다.
- `HomePageInner`는 `connection()`을 호출한 뒤 홈 쿼리의 prefetch가 끝날 때까지 기다린다. 그다음 기본 `dehydrate(queryClient)` 결과와 `HomeContent`를 반환한다.
- prefetch 경계만을 위한 별도 컴포넌트 파일은 만들지 않는다.

```tsx
<Suspense
  fallback={
    <p className="week05-status" role="status">
      홈을 불러오는 중입니다…
    </p>
  }
>
  <HomePageInner />
</Suspense>
```

- `HomeContent`는 기존 `useQuery`를 유지한다. 정상 흐름에서는 복원된 데이터가 `staleTime` 안에 있으므로 브라우저에서 다시 조회하지 않는다.
- 서버 prefetch가 실패하면 기본 dehydration이 실패한 쿼리를 제외한다. 브라우저가 기존 `/api/home` 쿼리로 다시 시도한다. 재시도가 성공하면 콘텐츠를, 실패하면 기존 인라인 오류 화면을 보여준다.

### D3. 상품 목록도 실제 콘텐츠를 스트리밍한다

- `src/app/products/page.tsx`의 기존 `Suspense` 안에 local async 컴포넌트 `ProductListContent`를 둔다.
- `ProductsPage`는 `Promise<SearchParams>`인 `searchParams`를 `ProductListContent`에 넘긴다. `ProductListContent`는 이를 공용 URL 파서로 읽고 목록 쿼리 prefetch를 기다린다.
- prefetch가 끝나면 기본 `dehydrate(queryClient)` 결과와 기존 `ProductList`를 반환한다.
- `ProductList`는 기존 `useQuery`와 인라인 로딩·오류 처리를 유지한다. 정상적인 첫 조회에서는 복원된 데이터를 바로 읽는다.
- prefetch 경계만을 위한 별도 컴포넌트 파일은 만들지 않는다.
- 서버 컴포넌트가 prefetch를 기다리므로 목록 대기 화면 뒤에 실제 상품 목록 HTML이 이어서 전송된다.
- pending 쿼리를 dehydration 대상에 넣는 설정, `useSuspenseQuery`, 별도 route error 화면은 추가하지 않는다.

### D4. 페이지가 바뀔 때만 이전 목록을 유지한다

- 목록 쿼리에 `placeholderData` 콜백을 추가한다.
- 이 콜백은 이전 쿼리와 현재 쿼리의 `q`, `category`, `sort`, `pageSize`가 같고 `page`만 다를 때 이전 데이터를 반환한다. 검색·카테고리·정렬이 달라지면 `undefined`를 반환한다.
- 대상 페이지의 `staleTime` 안 캐시가 있으면 그 데이터를 바로 보여주며 `isPlaceholderData`도 `false`다.
- 캐시에 없으면 이전 페이지 데이터를 보여주고 "새 페이지를 불러오는 중입니다." 문구를 표시한다.
- 목록 영역에 `aria-busy`는 쓰지 않는다. 이 속성은 live region의 중간 알림을 억제하는 용도인데 목록은 한 번에 통째로 교체되므로 억제할 중간 상태가 없다. 진행 상황은 `role="status"` 문구가 알린다.
- 이전 데이터를 보여주는 동안 페이지 번호는 URL의 새 값이 아니라 응답의 `data.page`를 사용한다. 상품과 페이지 번호가 한 번에 바뀌게 한다.
- `isPlaceholderData` 동안 이전·다음 버튼을 비활성화해 요청과 방문 기록이 연달아 쌓이지 않게 한다.
- 검색·카테고리·정렬을 바꾸면 이전 목록 대신 기존 인라인 로딩 화면을 보여준다.
- `useTransition`과 `startTransition`은 추가하지 않는다.

### D5. 서버와 브라우저가 같은 URL 조건을 쓴다

- `conditionParsers`와 `normalizeSearchQuery`를 `src/features/products/product-list-params.ts`로 옮긴다. 이 파일은 React hook을 import하지 않는다.
- 파서, `createLoader`, `SearchParams`는 `nuqs/server`에서 import하고, 같은 파일에서 `loadProductListConditions`를 만든다.
- `search-params.ts`의 클라이언트 hook과 `ProductListContent`가 같은 파서 맵을 쓴다.
- 서버는 파서 결과에 `pageSize: PRODUCT_PAGE_SIZE`를 더해 브라우저와 같은 조건으로 `productQueries.list`를 호출한다.
- 마지막 페이지를 넘긴 URL도 먼저 조회한다. 마지막 페이지는 응답의 `totalCount`를 받아야 계산할 수 있으므로 기존 클라이언트 clamp가 URL을 고친다.

### D6. QueryClient 생성 함수만 공유한다

- `makeQueryClient`와 `getQueryClient`를 `src/shared/get-query-client.ts`로 옮긴다. `Providers`와 서버 컴포넌트가 같은 함수를 쓴다.
- 서버에서는 호출할 때마다 새 `QueryClient`를 만들고, 브라우저에서는 기존처럼 하나를 재사용한다.
- 기본 `dehydrate`만 사용하며 pending 쿼리 설정은 추가하지 않는다.
- 각 prefetch 경계에서 `QueryClient`를 한 번만 만들므로 React `cache()`는 쓰지 않는다.

### D7. 현재 화면에 필요한 쿼리만 prefetch한다

- 홈에서는 홈 쿼리 하나, 목록에서는 현재 URL 조건의 목록 쿼리 하나만 prefetch한다.
- 다음 페이지와 아직 선택하지 않은 검색·필터 조합은 prefetch하지 않는다.
- 장바구니와 위시리스트는 브라우저 상태이므로 대상이 아니다.

## 작업

### T1. 기존 쿼리 팩토리의 서버 호출 지원

- 기존 Route Handler, 목 데이터와 계산 로직 및 해당 계약 테스트는 수정하지 않는다.
- `apiClient`가 서버에서는 `APP_ORIGIN`을 기준으로 절대 URL을 만들고 브라우저에서는 기존 상대 URL을 사용하게 한다.
- `APP_ORIGIN`의 누락, URL 형식, 프로토콜을 검증하고 환경별 주소를 코드에 하드코딩하지 않는다. 설정 오류도 서버 prefetch 실패로 처리한다.
- `getHome`, `getProducts`, `productQueries`의 공개 API와 `queryKey`는 변경하지 않는다.

### T2. 홈 데이터 경계

- `getQueryClient`를 `src/shared/get-query-client.ts`로 옮긴다.
- 헤더 아래의 홈 데이터 영역을 `Suspense`로 감싼다.
- `src/app/page.tsx`의 local async `HomePageInner`에서 `connection()`을 호출하고 `productQueries.home()`의 prefetch를 기다린 뒤 `HydrationBoundary`를 반환한다.
- 기존 `HomeContent.tsx`는 그대로 두고 `useQuery`와 로딩·오류 처리를 유지한다.

### T3. 상품 목록 데이터 경계

- React에 의존하지 않는 공용 파서 맵과 `loadProductListConditions`를 만든다.
- `ProductsPage`가 `Promise<SearchParams>`를 local async `ProductListContent`에 넘긴다. 이 컴포넌트에서 URL 조건을 읽고 `productQueries.list(conditions)`의 prefetch를 기다린 뒤 `HydrationBoundary`를 반환한다.
- 기존 `ProductList`의 `useQuery`와 인라인 로딩·오류 처리는 유지한다.

### T4. 페이지 변경 중 기존 목록 유지

- 목록 조건 중 `page`만 달라졌을 때 이전 데이터를 반환하는 `placeholderData` 콜백을 추가한다.
- `isPlaceholderData`로 상태 문구와 페이지 이동 버튼 비활성화를 제어한다.
- 이전 데이터를 보여주는 동안 응답의 `data.page`를 페이지 번호로 사용한다.

### T5. 검증과 기록

- 기존 테스트와 `apiClient`, 서버 URL 파싱, 페이지 전용 `placeholderData` 회귀 테스트를 실행한다.
- `pnpm check`를 실행한다.
- 홈과 목록에서 대기 화면 뒤에 실제 콘텐츠 HTML이 이어서 전송되는지 확인한다.
- 정상적인 첫 진입에서 브라우저가 `/api/home`, `/api/products`를 다시 요청하지 않는지 확인한다.
- 캐시가 없는 페이지로 이동할 때 기존 목록이 유지되는지 확인한다.
- 캐시가 있는 페이지로 돌아갈 때 바로 표시되는지 확인한다.
- 검색·카테고리·정렬 변경에는 기존 목록이 남지 않는지 확인한다.
- URL 조건, 앞뒤 이동, 오류 시 브라우저 재조회와 인라인 오류 화면을 확인한다.
- 선택한 대상과 추가한 복잡도, 검증 결과를 PR에 적는다.

## 완료 조건

### Advanced B — 서버 prefetch

- [x] B1. 서버에서 `QueryClient`를 prefetch 경계마다 새로 만든다.
- [x] B2. 서버와 브라우저가 같은 `productQueries`의 `queryKey`, `queryFn`, 캐시 정책을 쓴다.
- [x] B3. 서버 prefetch는 `productQueries.home()`, `productQueries.list(conditions)`을 그대로 사용한다.
- [x] B4. `apiClient`가 서버에서만 검증된 `APP_ORIGIN`으로 절대 URL을 만들며 환경별 호스트를 하드코딩하지 않는다.
- [x] B5. 기존 Route Handler, 목 데이터와 계산 로직, 목 데이터 테스트를 이동하거나 재구성하지 않는다.
- [x] B6. 홈 헤더와 대기 화면을 홈 데이터보다 먼저 보낸다.
- [x] B7. 홈 쿼리를 prefetch한 뒤 완성된 홈 콘텐츠 HTML을 스트리밍한다.
- [x] B8. 상품 목록 쿼리를 prefetch한 뒤 목록 대기 화면 다음에 실제 목록 HTML을 스트리밍한다.
- [x] B9. 홈과 상품 목록 모두 기본 `dehydrate`로 완료된 캐시만 전달한다.
- [x] B10. `HomeContent`와 `ProductList`는 `useQuery`로 복원된 캐시를 읽는다.
- [x] B11. 목록 조건을 브라우저와 같은 nuqs 파서로 읽는다.
- [x] B12. 정상적인 첫 진입에서 브라우저가 보낸 `/api/home`, `/api/products` 요청이 0건이다.
- [x] B13. 서버 prefetch가 실패하면 브라우저 쿼리로 다시 시도하고, 그 요청도 실패하면 기존 인라인 오류 화면을 보여준다.
- [x] B14. 기존 API 및 목 데이터 테스트가 통과한다.
- [x] B15. `apiClient`의 서버 절대 URL, 브라우저 상대 URL, 누락·잘못된 `APP_ORIGIN` 테스트가 통과한다.
- [x] B16. 서버 loader와 클라이언트 parser가 같은 조건, 기본값, `queryKey`를 만든다.
- [ ] B17. 선택한 대상과 추가한 복잡도, 검증 결과를 PR에 기록하고 `pnpm check`가 통과한다.

### Advanced C — 페이지 변경 중 기존 목록 유지

- [x] C1. 캐시가 없는 페이지로 이동하는 동안 기존 상품과 페이지 번호가 유지된다.
- [x] C2. `isPlaceholderData` 동안 `role="status"` 상태 문구가 보인다.
- [x] C3. `isPlaceholderData` 동안 이전·다음 버튼이 비활성화된다.
- [x] C4. `staleTime` 안의 캐시가 있는 페이지는 placeholder 없이 바로 표시된다.
- [x] C5. 검색·카테고리·정렬 변경은 기존 목록 유지 대상에 포함되지 않는다.
- [x] C6. `placeholderData`가 `page` 변경에만 이전 데이터를 반환하는 테스트가 통과한다.

## 런타임 검증

- [x] `APP_ORIGIN`을 설정한 프로덕션 빌드·실행 환경에서 아래 항목을 확인한다.
- [x] `/`를 새 탭에서 연다. 헤더와 홈 대기 화면이 먼저 보이고 약 500ms 뒤 홈 상품이 표시된다.
- [x] 홈 응답 스트림에서 헤더·대기 화면 HTML이 먼저, 홈 콘텐츠 HTML이 나중에 도착한다.
- [x] `/products?sort=popular&page=2`를 새 탭에서 연다. 목록 대기 화면이 먼저 보이고 약 500ms 뒤 2페이지 상품이 표시된다.
- [x] 상품 목록 응답 스트림에서 대기 화면 HTML이 먼저, 상품 목록 HTML이 나중에 도착한다.
- [x] 정상적인 첫 진입의 Network 탭에 브라우저가 보낸 `/api/home`, `/api/products` 요청이 없다.
- [x] hydration 오류나 React 콘솔 경고가 없다.
- [x] 서버 prefetch가 기존 `productQueries`의 `getHome`, `getProducts`를 통해 내부 `/api/home`, `/api/products`를 호출한다.
- [x] 캐시가 없는 다음 페이지를 누르면 현재 상품과 페이지 번호가 유지되고 "새 페이지를 불러오는 중입니다." 문구가 보인다.
- [x] 이전 데이터를 보여주는 동안 상태 문구에 `role="status"`가 적용되고 이전·다음 버튼을 다시 누를 수 없다.
- [x] 새 페이지가 준비되면 상품과 페이지 번호가 함께 바뀌고 버튼이 다시 활성화된다.
- [x] 1분 안에 이전 페이지로 돌아가면 캐시를 사용해 placeholder 없이 바로 표시된다.
- [x] 검색어·카테고리·정렬을 바꾸면 이전 목록 대신 목록의 인라인 로딩 화면이 표시된다.
- [x] 마지막 페이지를 넘긴 주소로 들어가면 기존 clamp가 마지막 페이지로 고친다.
- [x] 서버 prefetch만 실패하면 브라우저 재조회로 홈과 목록이 복구된다.
- [x] 서버와 브라우저 API가 모두 실패하면 홈과 목록의 기존 인라인 오류 화면이 표시된다.
- [x] 기존 API 및 목 데이터 테스트와 `pnpm check`가 통과한다.
