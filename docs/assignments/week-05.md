# 5주차 — 상태관리 아키텍처: 원본이 있는 곳에 상태를 둔다

> 홈과 상품 목록을 만들며 서버·URL·클라이언트 상태의 경계를 직접 정합니다.

## 왜 이 과제를 하는가

- 서버에서 온 데이터는 내가 소유하는 값이 아니라 원본의 스냅샷입니다.
- 공유·새로고침·뒤로 가기가 필요한 검색 조건의 원본은 URL입니다.
- 여러 페이지에서 함께 써야 하는 비로그인 장바구니·위시리스트만 전역 클라이언트 상태로 둡니다.
- 한 화면에서만 쓰는 열림 여부·입력 중 초안 같은 일시적 UI 상태는 React 로컬 상태로 둡니다.
- 도구를 먼저 고르지 않고 Source of Truth를 먼저 찾는 것이 이번 주의 기준입니다.

TanStack Query는 서버 데이터의 조회 상태와 캐시 수명을 맡습니다. `queryOptions`는 query key, queryFn, staleTime처럼 같은 조회를 설명하는 설정을 한곳에 모아 재사용하는 방식입니다. nuqs는 검색·카테고리·정렬·페이지처럼 공유하거나 새로고침·앞뒤 이동으로 복원해야 하는 조건을 타입이 있는 URL 상태로 다룹니다. Zustand는 여러 페이지에서 함께 쓰는 비로그인 사용자의 로컬 장바구니·위시리스트를 맡으며, 컴포넌트는 필요한 값과 action만 selector로 선택해 구독합니다. 모달 열림 여부나 제출 전 입력 초안처럼 한 화면·컴포넌트 수명에 머무는 상태는 React 로컬 상태로 둡니다.

이 설명은 책임을 나누는 기준입니다. 연결된 완성 코드나 정답 구조는 제공하지 않으므로, 아래 계약을 바탕으로 직접 설계하고 구현합니다.

## 제공되는 것

- `GET /api/home`
- `GET /api/products`
- `@tanstack/react-query`, `nuqs`, `zustand`
- 상품 mock 데이터와 30장의 로컬 상품 사진 (`public/images/products/p1.jpg` ~ `p30.jpg`)
- `src/examples/week-05-layout/`의 선택 가능한 정적 레이아웃 예시

제공된 레이아웃은 UI 구현 시간을 줄이기 위한 예시입니다. 그대로 복사해도, 원하는 형태로 바꿔도, 사용하지 않아도 됩니다. 기존 레이아웃을 유지하거나 4주차까지 만든 컴포넌트를 재사용해도 됩니다. 제공된 파일 구조와 컴포넌트 경계는 평가 대상이나 권장 정답이 아닙니다.

상품 사진은 과제 저장소에 포함되어 있으며 앱 실행 중 외부 이미지 서버로 요청하지 않습니다. 로컬 파일 목록은 `docs/assets/week-05-product-images.md`에 기록되어 있습니다.

## 실행 환경

- Node.js 24.17.0 (`.nvmrc`, 지원 범위 `>=22.12.0`)
- pnpm 10.15.1 (`package.json`의 `packageManager`)

의존성을 설치한 뒤 개발 중에는 `pnpm test`로 전체 테스트를 확인합니다. 제출 전에는 `pnpm check`를 실행해 테스트, lint, 타입 검사, 프로덕션 빌드가 모두 통과하는지 확인합니다.

## 기본 과제

1. `상태 · 소유자 · 수명 · 공유 범위 · 선택 이유` 표를 먼저 작성합니다.
2. TanStack Query v5의 `queryOptions`로 홈·목록 쿼리 팩토리를 만듭니다.
3. query key, queryFn, staleTime을 함께 두고 캐시 정책의 근거를 기록합니다.
4. nuqs의 `NuqsAdapter`, `useQueryStates`, parser로 검색·카테고리·정렬·페이지를 URL 상태로 관리하고, `history: "push"`로 각 변경을 앞뒤 이동에서 복원합니다.
5. 홈에서 배너·카테고리·인기 상품·신상품을 표시합니다.
6. 목록에서 검색·카테고리·정렬·페이지네이션을 제공합니다.
7. Zustand로 비로그인 장바구니·위시리스트의 담기/빼기와 헤더 개수를 관리합니다.
8. Header는 개수만, 상품 버튼은 해당 상품 상태와 필요한 action만 selector로 구독합니다.
9. 홈과 목록의 로딩·에러·빈 상태를 구분합니다.
10. URL 공유·새로고침·앞뒤 이동과 클라이언트 페이지 이동 중 store 일관성을 검증합니다.

기본 과제의 장바구니·위시리스트는 비로그인 사용자의 로컬 익명 상태입니다. 새로고침 후 초기화되어도 됩니다. 상세 장바구니 페이지, 상품 수량, 합계 금액은 구현 범위에서 제외합니다.

로그인과 서버 동기화가 추가되면 서버가 사용자 위시리스트의 원본을 소유합니다. 이때 로컬 익명 상태를 계정 데이터에 합칠지, 버릴지, 충돌을 어떻게 처리할지 정한 뒤 Zustand의 역할을 서버 상태의 임시 입력 또는 UI 상태로 다시 제한해야 합니다.

## Advanced — 선택

Advanced는 필수가 아닙니다. 기본 과제를 먼저 완성한 뒤, 여유가 있다면 A~D 중 원하는 항목을 선택합니다. 선택한 이유와 추가한 복잡도, 검증 결과를 함께 기록합니다.

### A. 상태 영속화

- Zustand `persist`로 장바구니와 위시리스트를 복원합니다.
- Next.js hydration 불일치 없이 처리합니다.
- 잘못되거나 오래된 저장값의 복구 전략을 둡니다.
- 저장 데이터의 `version`과 `migrate`를 적용합니다.

### B. App Router 서버 프리패치

- 요청마다 분리된 QueryClient를 생성합니다.
- 클라이언트 조회와 동일한 queryOptions 쿼리 팩토리를 Server Component의 `prefetchQuery`에 재사용합니다.
- `dehydrate`와 `HydrationBoundary`로 캐시를 전달합니다.
- 클라이언트에서 초기 요청이 중복되지 않는지 확인합니다.
- 모든 데이터를 무조건 prefetch하지 않고 적용 대상을 선택한 근거를 기록합니다.

### C. 사용자 경험 개선

아래 항목 중 1개 이상을 선택해 적용합니다.

- 검색어 debounce
- 다음 페이지 prefetch
- 상품 목록으로 이동하기 전 prefetch
- 페이지 변경 중 기존 목록 유지
- 전체 페이지 새로고침 없는 오류 재시도 경험

### D. 테스트

- Zustand action과 selector
- Header 개수 파생
- nuqs URL 조건과 query key 일치
- 홈과 목록의 store 상태 동기화

## API 계약

### `GET /api/home`

- 기본: banner, categories, popularProducts, newProducts
- `scenario=empty`: 상품 배열만 비움
- `scenario=error`: `{ "message": "홈 데이터를 불러오지 못했습니다." }`, HTTP 500
- `scenario`는 생략하거나 `empty | error`만 사용할 수 있으며, 다른 값은 `{ "message": "요청 조건을 확인해주세요." }`, HTTP 400

### `GET /api/products`

`q`, `category`, `sort`, `page`, `pageSize`, 검증용 `scenario`를 지원합니다.

- q: 앞뒤 공백 제거, 상품명·브랜드의 대소문자 구분 없는 부분 검색
- category: `all | casual | fashion | goods | home | digital`
- sort: `latest | popular | price-asc | price-desc`
- sort 생략: 4주차 fixture 순서를 유지
- 화면의 nuqs 기본값은 `latest`로 두고 API 요청에 `sort=latest`를 명시합니다. sort 생략 동작은 4주차 호환용입니다.
- page: 1부터 시작
- pageSize: 1~24, 기본 12
- page가 마지막 페이지를 초과하면 빈 products와 실제 totalCount를 반환
- 잘못된 category·sort·page·pageSize: `{ "message": "요청 조건을 확인해주세요." }`, HTTP 400
- 응답: products, categories, totalCount, page, pageSize
- `scenario=empty`: products는 비우고 totalCount는 0으로 반환하며 categories·page·pageSize는 유지
- `scenario=error`: `{ "message": "상품 목록을 불러오지 못했습니다." }`, HTTP 500
- TypeScript 계약: `src/types/commerce.ts`

`scenario`는 mock API 검증 전용 제어값입니다. 학습자가 관리하는 URL 상태와 `ProductListQuery`에는 포함하지 않으며 서버에서는 `MockApiScenario`로 구분합니다. 두 API는 요청값을 먼저 검증합니다. 잘못된 요청은 지연 없이 400으로 끝나므로 `scenario=error&page=0`도 500보다 400이 우선합니다. 검증을 통과한 기본·empty·error 요청은 모두 500ms 고정 지연 후 각 응답을 반환합니다.

### 제공 fixture 규칙

- p1은 원본 상품 번호 `1340400`의 `[11월 20일 예약배송] Winter Rocky Pants 2color 윈터 로키팬츠 OG`이며 가격은 79,000원입니다. 숫자 사이즈는 p1에만 있고, p2는 `freeShipping: false`와 빈 사이즈를 명시적으로 유지합니다.
- 상품명이나 이미지에서 확인할 수 있는 브랜드만 p11 `인스테드`, p16·p17·p19·p20 `스탠리`, p18 `렉슨`, p21 `메이커스`, p23 `위키오`, p25 `신지마운트`, p30 `신지루프`로 표시하며 나머지는 `Loopers Select`를 사용합니다.
- `originalPrice`는 할인 표시 분기를 연습하기 위한 결정적 mock merchandising 값입니다. 원본 fixture에서 가져온 가격이 아니며 p4=158000, p7=498000, p10=109000, p11=58000, p16=89000, p18=279000, p21=29000, p23=49900, p27=499000, p30=7900을 사용합니다.
- 인기순은 `reviewCount` 내림차순 뒤 `rating` 내림차순입니다. p22와 p30은 모두 리뷰 689개로 두어 평점이 높은 p22가 먼저 오는 분기를 확인할 수 있습니다.

## 새 주차 코드 동기화

- `package.json` 충돌 시 기존 설정을 보존하면서 `@tanstack/react-query`, `nuqs`, `zustand` 의존성을 유지한 뒤 `pnpm install`로 lockfile을 다시 생성합니다.
- `src/app/api/products/route.ts` 충돌 시 p1/p2의 ID, `freeShipping`·`sizes` override와 전체 응답 필드 형태는 4주차와 호환되게 유지합니다. 5주차에는 참고 fixture와 사진의 의미를 맞추기 위해 이름·가격·브랜드·이미지 값이 의도적으로 바뀝니다. 본인이 추가한 UI 코드는 덮어쓰지 않습니다.
- `src/examples/week-05-layout/`은 자동 적용되지 않습니다. 필요한 부분만 옮겨 쓰거나 기존 레이아웃을 유지합니다.

## 기록할 설계 근거

- TanStack Query·nuqs·Zustand의 책임을 나눈 기준
- staleTime과 gcTime 정책
- store 데이터 형태와 selector 경계
- 전역으로 올리지 않은 상태와 이유
- 로그인·서버 동기화가 생기면 위시리스트 소유권이 어떻게 달라지는지
- 새로고침·URL 공유·앞뒤 이동·페이지 이동 검증 결과

## ✅ Checklist

**상태 설계**

- [ ] 구현 전에 `상태 · 소유자 · 수명 · 공유 범위 · 선택 이유` 표를 작성했는가
- [ ] 서버·URL·클라이언트·로컬 상태를 나눈 기준을 설명할 수 있는가
- [ ] 계산 가능한 값을 별도 상태로 중복 저장하지 않았는가
- [ ] 같은 데이터를 여러 저장소에 복사하지 않았는가

**TanStack Query**

- [ ] `QueryClientProvider`를 구성했는가
- [ ] `queryOptions`로 query key·queryFn·staleTime을 함께 정의했는가
- [ ] 목록 조건이 query key와 API 요청에 모두 반영되는가
- [ ] staleTime과 gcTime의 근거를 기록했는가
- [ ] 서버 응답을 Zustand에 복사하지 않았는가
- [ ] 로딩·에러·빈 상태를 구분했는가

**nuqs / URL 상태**

- [ ] App Router용 `NuqsAdapter`를 구성했는가
- [ ] `useQueryStates`와 parser로 검색·카테고리·정렬·페이지를 관리하는가
- [ ] 검색·카테고리·정렬 변경 시 page가 1로 돌아가는가
- [ ] 기본 정렬도 API 요청에 `sort=latest`로 명시하는가
- [ ] URL 공유·새로고침·뒤로 가기·앞으로 가기 후 같은 조건이 복원되는가
- [ ] `scenario`를 사용자 URL 상태나 `ProductListQuery`에 넣지 않았는가

**Zustand**

- [ ] 장바구니·위시리스트의 담기·빼기를 구현했는가
- [ ] store 데이터 형태와 선택 이유를 설명할 수 있는가
- [ ] 헤더 개수를 별도 저장하지 않고 파생했는가
- [ ] Header와 상품 버튼이 필요한 값과 action만 selector로 구독하는가
- [ ] 홈과 목록의 같은 상품 상태가 일치하는가
- [ ] 클라이언트 페이지 이동 중 상태와 헤더 개수가 유지되는가

**홈 / 목록**

- [ ] 홈에 배너·카테고리·인기 상품·신상품이 표시되는가
- [ ] 목록의 검색·카테고리·정렬·페이지네이션이 동작하는가
- [ ] 홈과 목록 모두 로딩·에러·빈 상태를 구분하는가
- [ ] 제공 레이아웃을 사용했더라도 상태와 컴포넌트 경계는 직접 설계했는가

**Advanced를 선택한 경우에만**

- [ ] 기본 과제를 먼저 완성했는가
- [ ] 선택한 항목과 선택 이유를 기록했는가
- [ ] 추가한 복잡도와 검증 결과를 설명할 수 있는가
- [ ] A 선택 시 persist·hydration·version·migration을 검증했는가
- [ ] B 선택 시 요청별 QueryClient·prefetch·hydration·중복 요청을 검증했는가
- [ ] C 선택 시 요청 흐름과 사용자 경험의 개선을 검증했는가
- [ ] D 선택 시 핵심 상태 계약을 자동화 테스트로 보호했는가

**공통**

- [ ] 변경마다 “왜 이렇게 설계했는가” 한 줄 근거가 있는가
- [ ] 개발 중 `pnpm test`와 제출 전 `pnpm check`가 통과하는가
- [ ] AI로 생성한 부분을 표기하고 직접 검토했는가
