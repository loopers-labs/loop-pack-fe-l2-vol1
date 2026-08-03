# 5주차 상태 설계 표

> 구현 전에 Source of Truth를 먼저 찾고, 도구는 그 뒤에 고른다.

## 상태 · 소유자 · 수명 · 공유 범위 · 선택 이유

| 상태 | 소유자 | 수명 | 공유 범위 | 도구 | 선택 이유 |
|---|---|---|---|---|---|
| 홈 데이터 (banner, categories, popular, new) | 서버 | 캐시 (staleTime 동안) | 홈 페이지 | TanStack Query | 서버가 원본, 캐싱/로딩/에러 관리 필요 |
| 상품 목록 (products, totalCount) | 서버 | 캐시 (조건별 key) | 목록 페이지 | TanStack Query | 서버가 원본, 필터 조건마다 다른 캐시 |
| 검색어 (q) | URL | 세션 (탭 수명) | URL 공유 가능 | nuqs | 새로고침/공유/뒤로가기 복원 필요 |
| 카테고리 (category) | URL | 세션 | URL 공유 가능 | nuqs | 동일 |
| 정렬 (sort) | URL | 세션 | URL 공유 가능 | nuqs | 동일 |
| 페이지 (page) | URL | 세션 | URL 공유 가능 | nuqs | 동일 |
| 장바구니 (cart items) | 클라이언트 | 페이지 이동 유지, 새로고침 시 초기화 | 전역 (헤더 + 상품 버튼) | Zustand | 비로그인 로컬 상태, 여러 페이지에서 공유 |
| 위시리스트 (wishlist ids) | 클라이언트 | 동일 | 전역 (헤더 + 상품 버튼) | Zustand | 동일 |
| 모달 열림 여부 | 컴포넌트 | 컴포넌트 수명 | 해당 컴포넌트만 | useState | 한 화면에서만 쓰는 일시적 UI 상태 |

## 파생값 (별도 상태로 저장하지 않음)

| 값 | 계산 방식 |
|---|---|
| 장바구니 총 수량 | `Map.values()`의 quantity 합산 |
| 위시리스트 개수 | `store.ids.size` |
| 할인율 | `(originalPrice - price) / originalPrice` |
| 총 페이지 수 | `Math.ceil(totalCount / pageSize)` |

## 전역으로 올리지 않은 상태와 이유

- **모달 열림 여부**: 한 컴포넌트 안에서만 쓰이고, 다른 페이지나 컴포넌트와 공유할 필요 없음
- **검색 입력 중 초안**: 제출 전까지는 URL에 반영할 필요 없는 일시적 타이핑 상태 (debounce 적용 시)
- **서버 데이터**: TanStack Query 캐시가 관리하므로 Zustand에 복사하지 않음

## 캐시 전략 (staleTime / gcTime)

### 설계 기준

여러 브랜드가 입점해 이벤트·재고가 수시로 바뀌는 이커머스(무신사 등)를 참고.
핵심 패턴은 **stale-while-revalidate**: 캐시 데이터를 먼저 보여주고 백그라운드에서 최신으로 갱신.

### 결정

| query | staleTime | gcTime | 근거 |
|---|---|---|---|
| 홈 (`homeQueryOptions`) | 0 | 기본 5분 | 진입점이라 항상 최신 필요. 배너·이벤트가 바뀔 수 있음 |
| 상품 목록 (`productListQueryOptions`) | 0 | 기본 5분 | 입점 브랜드 이벤트·재고가 수시로 바뀌므로 항상 refetch. gcTime 유지로 뒤로가기 시 캐시 먼저 표시 |
| 상품 상세 (`productDetailQueryOptions`) | 0 | 기본 5분 | 입점 브랜드가 가격·재고를 수시로 변경하므로 항상 최신 필요 |

### 왜 목록 staleTime을 0으로?

- 필터 조건마다 query key가 다르므로, 카테고리 A → B → 다시 A 할 때 gcTime 내라면 캐시 데이터를 먼저 보여주고 뒤에서 갱신
- staleTime이 길면 필터 전환 후 오래된 결과를 보여줄 위험이 커짐
- 무신사·쿠팡 등 다품종 이커머스에서도 목록은 짧은 staleTime + gcTime 유지가 일반적

### 왜 상세도 staleTime 0인가?

입점 브랜드가 가격·재고를 수시로 변경할 수 있으므로 상세도 항상 최신이어야 한다.
이상적으로는 쿠팡처럼 **기본 정보(이름·이미지·설명)는 캐시하고, 가격·재고만 실시간 요청**으로 분리하고 싶었다.
하지만 현재 과제에서는 상세 전용 API가 없고 단일 응답에 모든 정보가 포함되어 있어 분리가 불가능하다.
따라서 무신사 방식(전체 refetch)을 채택했다. 향후 가격·재고 전용 API가 추가되면 쿠팡 방식으로 전환할 예정.

### staleTime: 0의 트레이드오프

staleTime: 0이 무조건 빠른 렌더링은 아니다.

| | staleTime: 0 | staleTime: 30초 |
|---|---|---|
| 캐시 즉시 표시 | O (gcTime 내) | O (동일) |
| 백그라운드 refetch | 항상 발생 | 30초 이내면 안 함 |
| 리렌더링 | 새 데이터 도착 시 한 번 더 발생 | 30초 이내면 없음 |
| 데이터 신선도 | 항상 최신 | 최대 30초 지연 |
| 네트워크 비용 | 높음 | 낮음 |

이커머스에서는 **잘못된 가격을 보여주는 리스크**가 리렌더링 한 번보다 크기 때문에 0을 선택했다.

### 참고: 업계 사례

- **무신사**: 목록·상세 뒤로가기 시 캐시 먼저 → 백그라운드 갱신 (stale-while-revalidate). 직접 판매 모델이라 실시간 정확성 중시
- **쿠팡**: 기본 정보와 가격·재고를 분리 요청. 기본 정보는 캐시, 가격·재고만 실시간. 셀러마다 가격이 달라 상세 진입 시 항상 최신 가격 fetch
- **토스**: staleTime 30초~2분, 금융 데이터는 0
- **Airbnb**: 검색 결과 캐시 거의 없음 (가격·가용일 실시간 변동)
- **지그재그**: 메타 플랫폼(여러 쇼핑몰 중개)이라 상품 원본이 각 입점 쇼핑몰에 있음. 일정 주기로 크롤링한 캐시 데이터를 보여주고 구매 시 해당 쇼핑몰로 이동. 데이터 자체가 스냅샷이라 프론트 캐시를 길게 잡아도 무방. 직접 판매 모델과는 다른 전략이 필요

### 우리 서비스의 선택

직접 판매하는 다브랜드 이커머스(무신사·쿠팡 모델)에 해당하므로 staleTime: 0 + gcTime 기본 5분을 채택했다.
지그재그처럼 중개 모델이라면 캐시를 더 길게 잡는 전략이 적합하다.

## Server Prefetch (dehydrate / hydrate)

### 개념

Java MVC로 비유하면:
- **dehydrate** = Controller에서 Model에 데이터를 담아 JSP로 넘기는 것 (`request.setAttribute`)
- **hydrate** = JSP에서 Model 데이터를 받아 화면을 렌더링하는 것 (`request.getAttribute`)

TanStack Query에서의 흐름:
1. **서버 (Server Component)**: `prefetchQuery()`로 API 호출 → QueryClient 캐시에 저장 → `dehydrate()`로 캐시를 JSON으로 직렬화
2. **전달**: Next.js가 HTML에 JSON 데이터를 심어서 브라우저로 전송
3. **클라이언트**: `HydrationBoundary`가 JSON을 받아 클라이언트 QueryClient 캐시에 복원
4. **결과**: 클라이언트의 `useQuery`가 실행될 때 이미 캐시에 데이터가 있으므로 API 호출 없이 즉시 렌더링

### 구현 패턴

```
page.tsx (Server Component)
├─ getQueryClient() — 요청마다 새 QueryClient 생성 (서버) / 싱글턴 반환 (클라이언트)
├─ prefetchQuery(queryOptions) — 서버에서 미리 API 호출
├─ dehydrate(queryClient) — 캐시를 직렬화
└─ HydrationBoundary state={dehydratedState}
     └─ ClientComponent — useQuery가 캐시에서 즉시 데이터 사용
```

### 적용 대상과 근거

| 페이지 | prefetch 대상 | 근거 |
|---|---|---|
| 홈 (`/`) | `homeQueryOptions()` | 진입점이라 초기 로딩 제거 효과가 가장 큼 |
| 상품 목록 (`/products`) | `productListQueryOptions(searchParams)` | URL의 필터 조건을 서버에서 읽어 해당 조건으로 prefetch |
| 상품 상세 (`/products/[id]`) | `productDetailQueryOptions(id)` | 동적 라우트의 id를 서버에서 읽어 해당 상품 prefetch |

모든 페이지에 적용한 이유: Next.js App Router를 사용하는 주된 목적이 서버에서 데이터를 미리 가져와 초기 로딩을 없애는 것. 특정 페이지만 제외할 이유가 없음.

### getQueryClient 전략

- **서버**: 요청마다 새 QueryClient 생성 (요청 간 캐시 공유 방지)
- **클라이언트**: 싱글턴 패턴으로 한 번만 생성 (SPA 탐색 중 캐시 유지)

### 중복 요청 방지 확인

서버에서 prefetch한 데이터가 HydrationBoundary를 통해 클라이언트 캐시에 복원되므로, 클라이언트의 useQuery는 캐시 히트로 처리. staleTime과 무관하게 초기 마운트 시 API 재요청 없음.

## Advanced 과제 선택: B (Server Prefetch) + C (UX 개선)

### 선택 이유

사용자 경험을 가장 우선하기 때문에 B와 C를 선택했다.
주변 5명에게 "이커머스를 이용할 때 가장 불편한 점"을 물었고, 3명이 **속도**를 가장 중요하게 꼽았다.
나머지 불편사항(복잡한 UI, 느린 검색 등)을 종합하면, 결국 **체감 속도를 높이는 것**이 사용자 만족도에 가장 큰 영향을 미친다는 결론에 도달했다.

- **B (Server Prefetch)**: 서버에서 데이터를 미리 가져와 초기 로딩 스피너를 제거 → 첫 화면이 즉시 보임
- **C (UX 개선)**: 다음 페이지 prefetch + 링크 hover 시 pre-navigation prefetch → 페이지 전환이 즉각적

### C: Prefetch 전략 상세

#### 1. 다음 페이지 prefetch (Next Page Prefetch)

상품 목록에서 현재 페이지 데이터가 로드되면, 다음 페이지 데이터를 백그라운드로 미리 가져온다.
사용자가 "다음" 버튼을 누르면 이미 캐시에 데이터가 있으므로 즉시 렌더링된다.

```
useEffect → data.page < totalPages → prefetchQuery(page + 1)
```

#### 2. Pre-navigation prefetch (Hover Prefetch)

사용자가 상품 목록 페이지로 이동할 가능성이 높은 링크에 hover하면 데이터를 미리 가져온다.

| 위치 | 링크 | prefetch 대상 |
|---|---|---|
| HeaderNav | "상품" | 기본 조건 상품 목록 (전체/최신순/1페이지) |
| HomeClient 배너 | "Shop Now" | 동일 |

마우스를 올리는 것만으로 네트워크 요청이 시작되므로, 클릭 후 페이지 전환 시 데이터가 이미 캐시에 있을 확률이 높다.

### 참고: 실무에서의 prefetch

- **무신사**: 상품 목록에서 스크롤하면 다음 페이지를 미리 로드 (무한 스크롤 + prefetch)
- **쿠팡**: 검색 결과 페이지에서 다음 페이지 데이터를 미리 가져옴
- **Next.js**: `<Link>` 컴포넌트가 viewport에 들어오면 자동으로 JS 번들을 prefetch하지만, 데이터 prefetch는 별도로 구현해야 함

## 로그인·서버 동기화가 생기면

위시리스트의 원본 소유자가 클라이언트 → 서버로 이동한다.
- 로그인 시 로컬 위시리스트를 서버에 merge할지, 버릴지 정책 결정 필요
- Zustand의 역할이 "원본 저장소"에서 "서버 상태의 낙관적 업데이트 버퍼"로 축소됨
- 장바구니도 동일한 전환 발생
