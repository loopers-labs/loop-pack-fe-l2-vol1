# 5주차 상태관리 아키텍처 과제 설계

## 1. 목적

5주차는 3주차에 소개한 서버 상태·클라이언트 상태·파생값 구분을 여러 페이지에 적용하는 과제다. 멘티는 4주차까지 만든 Next.js App Router 프로젝트를 이어서 홈과 상품 목록을 구현하고, 상태의 성격에 따라 TanStack Query, Zustand, URL Search Params, 컴포넌트 로컬 상태의 책임을 나눈다.

핵심 평가는 라이브러리 사용법이 아니라 다음 판단에 둔다.

- 어떤 상태를 누가 소유하는가
- 상태의 수명과 공유 범위는 어디까지인가
- 같은 데이터를 여러 저장소에 복사하지 않았는가
- 파생 가능한 값을 별도 상태로 저장하지 않았는가
- 선택한 구조를 본인의 말로 설명할 수 있는가

예상 작업 시간은 기본 8~10시간이다. Advanced는 기본 과제를 끝낸 멘티가 2~4시간 범위에서 선택한다.

## 2. 선행 과제와의 연결

- 1주차: 코드 품질 기준과 자동 검증 환경
- 2주차: 컴포넌트 경계, Props 계약, 합성
- 3주차: UI·Hook·Service·API 레이어와 상태 3분할
- 4주차: Next.js App Router 전환, Select와 Dialog 패턴
- 5주차: 여러 페이지에 걸친 상태의 소유권·수명·공유 범위 설계

멘티의 기존 구조와 컴포넌트를 보존하는 누적형 과제다. 5주차 스타터가 정답 폴더 구조나 완성된 상태관리 코드를 제공해서는 안 된다.

## 3. 기술 경계

- Next.js 16 App Router
- React 19
- TypeScript
- TanStack Query v5: API에서 조회한 서버 상태와 캐시 정책
- Zustand: 장바구니와 위시리스트 클라이언트 상태
- nuqs: 검색, 카테고리, 정렬, 페이지의 타입 안전한 URL 상태
- React 로컬 상태: 입력 중인 값이나 일시적인 UI 상태
- Next Route Handler: mock API
- 기존 전역 CSS 또는 일반 CSS/CSS Modules

MSW, Pages Router, styled-components, Emotion, Axios, 모노레포, 무한 스크롤은 도입하지 않는다.

## 4. 스타터 제공 범위

### 제공한다

- `@tanstack/react-query`, `nuqs`, `zustand` 의존성
- 홈과 상품 목록용 Next Route Handler
- 약 30개의 상품 mock 데이터
- 참고 fixture에서 선별해 한 번만 수집한 30개의 로컬 상품 이미지와 출처 기록
- API 요청·응답 타입
- 충돌 없는 예시 경로에 둔 홈·상품 목록 정적 JSX 골격과 최소 CSS
- 5주차 과제 문서와 API 계약

### 제공하지 않는다

- QueryClient Provider
- API fetcher, `queryOptions` 쿼리 팩토리, Custom Query Hook
- `NuqsAdapter`와 URL parser 구성
- Zustand store, action, selector
- 상태가 연결된 Header나 ProductCard
- 장바구니·위시리스트 페이지
- nuqs URL 상태와 Query 연결
- 정답 폴더 구조
- SSR prefetch와 hydration 구현

## 5. 최소 레이아웃 원칙

정적 레이아웃은 UI 작업 시간을 줄이고 결과 화면의 최소 기준을 맞추기 위한 예시다. 상태관리 아키텍처의 정답이 아니다.

레이아웃 파일 상단에 다음 취지의 주석을 둔다.

```tsx
/**
 * 5주차 과제를 빠르게 시작할 수 있도록 제공하는 최소 레이아웃 예시입니다.
 *
 * 이 구조는 상태관리 아키텍처의 정답이 아닙니다.
 * 그대로 사용하거나, 4주차까지 만든 컴포넌트와 레이아웃을 재사용하거나,
 * 과제 요구사항을 만족하는 범위에서 자유롭게 수정·교체해도 됩니다.
 *
 * 데이터 조회, Query 구성, 전역 상태와 이벤트 연결은 포함되어 있지 않습니다.
 */
```

과제 문서에도 다음을 명시한다.

> 제공된 레이아웃은 UI 구현 시간을 줄이기 위한 예시입니다. 기존 레이아웃을 유지하거나 4주차까지 만든 컴포넌트를 재사용해도 됩니다. 제공된 파일 구조와 컴포넌트 경계는 평가 대상이나 권장 정답이 아닙니다.

정적 골격은 기존 `src/app/**`를 덮어쓰지 않고 `src/examples/week-05-layout/`에 둔다. 멘티는 필요한 부분을 선택적으로 옮겨 쓰거나 기존 화면을 유지한다. 골격에는 홈의 배너·카테고리·상품 섹션과 목록의 검색·카테고리·정렬·상품 그리드·페이지네이션 자리를 둔다. 실제 데이터, 이벤트, 로딩·에러 분기는 연결하지 않는다. `여기에 Zustand 연결`처럼 구현 위치를 지시하는 주석도 넣지 않는다.

## 6. API 설계

API 구조와 네이밍은 4주차의 `src/app/api/products/route.ts`와 같은 결을 유지한다.

- App Router의 `route.ts`
- `NextResponse.json(...)`
- 단순한 camelCase 필드
- 불필요한 controller, repository, schema 계층 없음
- 별도 API 클라이언트나 Query 추상화 제공 없음
- 기존 `Product` 필드인 `id`, `name`, `price`, `originalPrice`, `image`, `freeShipping`, `sizes` 유지

### 상품 이미지 수집 원칙

- 런타임에 29CM CDN을 직접 요청하지 않는다.
- 참고 저장소의 상품 fixture에서 이미지 URL 30개를 선별하고 구현 시 한 번만 수집한다.
- 수집한 이미지는 `public/images/products/p1.jpg`부터 `p30.jpg`까지 로컬 정적 자산으로 제공한다.
- `public/images/products/SOURCES.md`에 상품 ID, 참고 저장소, 원본 상품 번호, 원본 상품명, 원본 URL을 기록한다.
- 크롤링·다운로드 스크립트는 멘티 과제나 애플리케이션 런타임에 포함하지 않는다.
- 4주차 lint 설정인 Next.js `core-web-vitals`와 TypeScript preset을 그대로 유지한다.

### `GET /api/home`

홈 화면의 배너, 카테고리, 인기 상품과 신상품을 반환한다.

```ts
type HomeResponse = {
  banner: {
    title: string;
    description: string;
    image: string;
  };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};
```

```ts
type CategoryId = "casual" | "fashion" | "goods" | "home" | "digital";

type Category = {
  id: CategoryId;
  name: string;
};
```

홈 데이터는 하나의 API로 제공한다. 여러 API를 호출하게 만드는 것이 이번 과제의 목적이 아니기 때문이다.

### `GET /api/products`

4주차의 기존 endpoint를 확장한다.

```text
/api/products?q=셔츠&category=fashion&sort=popular&page=1&pageSize=12
```

지원하는 query parameter는 다음과 같다.

- `q`: 상품명과 브랜드 검색
- `category`: `all` 또는 `CategoryId`, 기본값 `all`
- `sort`: `latest | popular | price-asc | price-desc`
- `page`: 1부터 시작, 기본값 1
- `pageSize`: 기본값 12
- `scenario`: 검증용 `error | empty`, 기본 UI에서는 사용하지 않음

응답은 4주차의 `{ products, totalCount }` 형태를 유지하며 현재 페이지 정보만 추가한다.

```ts
type ProductListResponse = {
  products: Product[];
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
};
```

`totalPages`는 `totalCount`와 `pageSize`로 계산 가능한 파생값이므로 응답에 중복하지 않는다.

### 상품 필드 확장

4주차 필드를 깨지 않고 목록 기능에 필요한 필드만 추가한다.

```ts
type Product = {
  id: string;
  brand: string;
  name: string;
  category: CategoryId;
  price: number;
  originalPrice: number | null;
  image: string;
  freeShipping: boolean;
  sizes: Array<{
    value: number;
    stock: number;
  }>;
  rating: number;
  reviewCount: number;
  createdAt: string;
};
```

홈과 목록에 같은 상품 ID를 일부 중복 노출해 장바구니와 위시리스트 상태의 페이지 간 일관성을 검증할 수 있게 한다.

### 응답 동작

- 약 30개 상품을 제공한다.
- 두 API의 정상 응답에 500ms의 고정 지연을 둔다.
- `q`는 앞뒤 공백을 제거하고 상품명·브랜드를 대소문자 구분 없이 부분 검색한다.
- `sort`를 생략하면 4주차 fixture 순서를 유지하고, `sort=latest`를 명시했을 때만 `createdAt` 내림차순으로 정렬한다.
- `latest`는 `createdAt` 내림차순, `popular`는 `reviewCount` 내림차순 후 `rating` 내림차순으로 정렬한다.
- `page < 1`, 지원하지 않는 `category`·`sort`, `1~24` 범위를 벗어난 `pageSize`는 `400`으로 응답한다.
- 필터 결과의 마지막 페이지를 초과한 양수 `page`는 빈 `products`를 반환한다.
- 두 API 모두 `scenario=error`에서 `{ message: string }` 형태의 고정된 `500` 응답을 반환한다.
- `/api/home?scenario=empty`는 `popularProducts`와 `newProducts`를 비우되 배너와 카테고리는 유지한다.
- `/api/products?scenario=empty`는 `products`를 비우되 카테고리와 페이지 정보는 유지한다.
- 랜덤 오류는 사용하지 않는다.
- 장바구니와 위시리스트 API는 제공하지 않는다.
- 4주차의 `p1`, `p2` 상품 ID, `freeShipping`·`sizes` override와 전체 응답 필드 형태는 호환되게 유지한다. 5주차에는 참고 fixture와 사진의 의미를 일치시키기 위해 이름·가격·브랜드·이미지 값이 의도적으로 바뀐다.
- 모든 상품은 원본 fixture에 브랜드와 정가 정보가 없으므로 공통 브랜드 `29CM 셀렉트`와 `originalPrice: null`을 사용한다.
- 카테고리는 이미지 의미에 따라 `casual`(p1-p5, p26), `fashion`(p6-p10, p27), `goods`(p11-p15, p28), `home`(p16-p20, p29), `digital`(p21-p25, p30)로 균등하게 나눈다.

## 7. 기본 요구사항

### 7.1 상태 분류

구현 전에 `상태 · 소유자 · 수명 · 공유 범위 · 선택 이유` 표를 README 또는 PR 본문에 작성한다.

분류 대상은 최소한 다음을 포함한다.

- 홈과 상품 목록 데이터
- 검색, 카테고리, 정렬, 페이지
- 장바구니 상품
- 위시리스트 상품
- 헤더에 표시하는 개수
- 입력 중인 검색어와 일시적인 UI 상태

### 7.2 TanStack Query

- QueryClient와 Provider를 직접 구성한다.
- 제공된 endpoint를 호출하는 API 함수를 작성한다.
- `queryOptions`로 query key, queryFn, staleTime을 함께 정의하는 도메인 쿼리 팩토리를 만든다.
- 홈과 상품 목록의 화면은 같은 쿼리 팩토리 정의를 재사용한다.
- 검색·필터·정렬·페이지 조건을 상품 목록 쿼리 팩토리의 입력과 query key에 반영한다.
- 선택한 staleTime과 gcTime 정책의 근거를 기록한다.
- 로딩·에러·빈 결과를 처리한다.
- API 응답을 Zustand에 복사하여 이중 관리하지 않는다.

### 7.3 홈 페이지

- `/`에서 배너, 카테고리, 인기 상품, 신상품을 표시한다.
- 카테고리를 선택하면 해당 조건의 `/products`로 이동한다.
- 상품을 장바구니에 담거나 뺄 수 있다.
- 상품을 위시리스트에 추가하거나 해제할 수 있다.
- 로딩·에러·빈 상태를 화면에 구분하여 표시한다.

### 7.4 상품 목록 페이지

- `/products`에서 상품 목록을 표시한다.
- 검색, 카테고리, 정렬, 페이지네이션을 제공한다.
- App Router용 `NuqsAdapter`를 직접 배치한다.
- `useQueryStates`와 parser를 사용해 검색·카테고리·정렬·페이지를 타입 안전한 URL 상태로 표현한다.
- `q`는 문자열, `category`는 기본값 `all`, `sort`는 기본값 `latest`의 허용값 parser, `page`는 기본값 1의 정수 parser를 사용한다.
- 검색·카테고리·정렬 조건을 변경하면 page를 1로 되돌린다.
- 새로고침, URL 공유, 뒤로 가기, 앞으로 가기 후 같은 조건을 복원한다.
- 홈과 동일하게 장바구니와 위시리스트를 토글할 수 있다.
- 로딩·에러·빈 상태를 화면에 구분하여 표시한다.

### 7.5 Zustand

- 장바구니와 위시리스트를 Zustand로 관리한다.
- 홈과 목록에서 동일한 상품 상태를 표시한다.
- 페이지 이동 중 상태를 유지한다.
- 기본 과제에서는 새로고침 후 장바구니와 위시리스트가 초기화되어도 된다.
- 공통 헤더에 장바구니와 위시리스트 개수를 표시한다.
- 개수는 별도 상태로 저장하지 않고 파생한다.
- 헤더는 파생된 개수만, 상품 버튼은 해당 상품의 포함 여부와 필요한 action만 selector로 구독한다.
- 전체 store를 통째로 구독하지 않는다.
- store를 하나로 합칠지 책임별로 나눌지는 멘티가 근거를 남기고 선택한다.

장바구니 수량 변경, 금액 계산, 별도 장바구니·위시리스트 페이지는 기본 범위에서 제외한다.

이번 과제의 장바구니와 위시리스트는 로그인 및 서버 동기화가 없는 로컬 클라이언트 상태로 가정한다. 로그인 사용자나 여러 기기 간 동기화가 요구되면 상태의 원본과 관리 도구가 달라질 수 있다. 제공 API가 조회 전용이고 이 두 상태의 원본은 Zustand이므로, 기본 과제에는 TanStack Query 낙관적 업데이트를 적용하지 않는다.

### 7.6 설계 근거와 검증

다음 내용을 README 또는 PR 본문에 기록한다.

- TanStack Query와 Zustand의 책임을 나눈 기준
- URL에 둔 상태와 store에 둔 상태의 차이
- store에 저장한 데이터 형태와 선택 이유
- 전역으로 올리지 않은 상태와 그 이유
- 로그인·서버 동기화 요구가 생긴다면 위시리스트의 소유권과 관리 도구가 어떻게 달라지는지
- 홈과 목록에 같은 상품이 있을 때 상태가 일치하는지 확인한 결과
- 목록 조건이 새로고침·뒤로 가기 후 URL에서 복원되는지 확인한 결과
- 장바구니와 위시리스트가 클라이언트 페이지 이동 중 유지되는지 확인한 결과

## 8. Advanced 요구사항

Advanced는 필수가 아니다. 기본 과제를 마친 뒤 A~D 중 하나의 트랙을 선택해 도전할 수 있다.

### A. 상태 영속화

- Zustand `persist`로 장바구니와 위시리스트를 복원한다.
- Next.js hydration 불일치 없이 처리한다.
- 잘못되거나 오래된 저장값의 복구 전략을 둔다.
- 저장 데이터의 `version`과 `migrate`를 적용한다.

### B. App Router 서버 프리패치

- Server Component에서 QueryClient로 데이터를 prefetch한다.
- 클라이언트 조회와 동일한 `queryOptions` 쿼리 팩토리를 `prefetchQuery`에 재사용한다.
- `dehydrate`와 `HydrationBoundary`를 구성한다.
- 요청 간 캐시가 섞이지 않도록 QueryClient의 수명을 설계한다.
- 클라이언트의 중복 요청 여부를 확인한다.
- 모든 데이터를 무조건 prefetch하지 않고 적용 대상을 선택한 근거를 작성한다.

### C. 사용자 경험 개선

- 검색어 debounce
- 다음 페이지 prefetch
- 상품 목록으로 이동하기 전 prefetch
- 페이지 변경 중 기존 목록 유지
- 전체 페이지 새로고침 없는 에러 재시도 경험

### D. 테스트

- Zustand action과 selector 테스트
- 헤더 개수 파생 테스트
- URL 조건과 query key 일치 테스트
- 홈과 목록이 동일한 store 상태를 표시하는 통합 테스트

## 9. 완료 기준

- 홈과 목록의 서버 상태가 TanStack Query로 관리된다.
- 홈과 목록의 query key, queryFn, 캐시 정책이 `queryOptions` 쿼리 팩토리로 함께 정의된다.
- 장바구니와 위시리스트가 Zustand로 관리된다.
- 같은 상품의 담기·찜 상태가 홈과 목록에서 일치한다.
- 헤더의 장바구니·위시리스트 개수가 즉시 갱신된다.
- 목록 조건이 nuqs parser를 통해 URL과 동기화되고 재방문 시 복원된다.
- Header와 상품 버튼이 Zustand selector로 필요한 상태만 구독한다.
- 로딩·에러·빈 상태가 구분된다.
- 상태 분류와 아키텍처 선택 근거가 기록되어 있다.
- 타입 오류와 lint 오류가 없다.
- AI로 생성한 부분을 표시하고 직접 검토했다.

## 10. 의도적으로 열어 두는 결정

다음은 정답을 제공하지 않고 멘티가 선택한다.

- 폴더 구조
- API 함수와 query hook의 경계
- 쿼리 팩토리 내부의 key 계층과 네이밍
- 장바구니와 위시리스트 store 통합 여부
- selector 구성 방식
- 공통 Header의 Client Component 경계
- 4주차 컴포넌트 재사용 방식
- 제공 레이아웃 유지·수정·교체 여부

어떤 선택이든 동작과 근거가 일치해야 한다.
