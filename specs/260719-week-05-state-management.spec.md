# 5주차 상태관리 아키텍처 스펙

## 목표

홈과 상품 목록을 구현하며 서버·URL·클라이언트·로컬 상태의 원본을 구분한다.
각 컴포넌트는 TanStack Query 옵션, URL parser, Zustand selector를 경계로 필요한 상태만 구독한다.
기본 과제를 한 번에 구현하지 않고, 독립적으로 실행하고 검증할 수 있는 작업 묶음으로 진행한다.

## 비범위

- Zustand `persist`
- App Router 서버 prefetch와 `HydrationBoundary`
- 검색 debounce, 페이지 prefetch, 이전 목록 유지 등 Advanced 사용자 경험 개선
- 상세 상품·장바구니 페이지, 상품 수량, 합계 금액
- 로그인과 서버 장바구니·위시리스트 동기화
- FSD 수준의 폴더 확장과 미래 기능용 query·mutation 계층
- 전체 E2E 테스트 구축

## 확정 목표

- 상태 소유권과 수명, 공유 범위, 도구 선택의 근거를 구현 전에 기록한다.
- TanStack Query로 홈과 상품 목록의 서버 상태 및 정상·로딩·에러·빈 상태를 관리한다.
- nuqs로 확정된 검색·카테고리·정렬·페이지를 URL의 단일 원본으로 관리한다.
- Zustand로 익명 사용자의 장바구니·위시리스트 상품 ID만 관리한다.
- Header와 상품 카드는 필요한 값과 action만 selector로 구독한다.
- URL 공유·새로고침·앞뒤 이동과 홈·목록 사이 클라이언트 이동을 검증한다.
- Advanced는 구현하지 않고 기본 과제만 완료한다.

## 조사 결과

- 홈은 5주차 커머스 화면으로 교체하고, 기존 Select·Dialog 데모는 컴포넌트를 유지한 채 `/demos`에서 접근하게 한다
- 상품 목록 페이지는 아직 없으므로 `/products` 경로를 추가해야 한다.
- `QueryClientProvider`와 `NuqsAdapter`는 아직 구성되지 않았다 (`src/app/layout.tsx`).
- `@tanstack/react-query`, `nuqs`, `zustand`는 이미 설치되어 있어 의존성 추가가 필요 없다 (`package.json`).
- 홈·목록 API와 타입, 30개 상품 이미지가 제공되어 있으며 API 자체는 구현 범위가 아니다
  (`src/app/api/home/route.ts`, `src/app/api/products/route.ts`, `src/types/commerce.ts`).
- 목록 API는 `q`, `category`, `sort`, `page`, `pageSize`를 지원하며 화면 기본 정렬은 `latest`를 명시해야 한다.
- `scenario`는 mock API 검증용이며 사용자 URL 상태와 `ProductListQuery`에 포함하면 안 된다.
- 정적 레이아웃 예시의 JSX와 CSS는 시각적 기반으로 재사용할 수 있다. 실제 컴포넌트 경계는 데이터 조회와
  상태 구독 책임에 맞게 결정하며, 예제 구조를 그대로 따르거나 모든 태그를 컴포넌트로 나눌 필요는 없다
  (`src/examples/week-05-layout/`).
- 기존 테스트 환경에 Vitest, Testing Library, Playwright가 있어 새 테스트 의존성이 필요 없다.

## 상태 소유권

| 상태                          | 원본·소유자         | 수명                     | 공유 범위               | 도구                    | 선택 이유                                      |
| ----------------------------- | ------------------- | ------------------------ | ----------------------- | ----------------------- | ---------------------------------------------- |
| 홈 응답                       | 서버                | 캐시 정책까지            | 홈과 재방문             | TanStack Query          | 서버 응답 스냅샷과 조회 상태를 함께 관리       |
| 상품 목록 응답                | 서버                | 조건별 캐시 정책까지     | 목록과 동일 조건 재방문 | TanStack Query          | 조건별 캐시 식별과 오래된 응답 덮어쓰기 방지   |
| 확정 검색어                   | URL                 | 주소가 유지되는 동안     | 공유·새로고침·앞뒤 이동 | nuqs                    | 탐색 상태를 동일 URL로 재현해야 함             |
| 카테고리·정렬·페이지          | URL                 | 주소가 유지되는 동안     | 공유·새로고침·앞뒤 이동 | nuqs                    | 목록 결과를 결정하는 사용자 탐색 상태          |
| 입력 중 검색어                | 검색 input          | 컴포넌트가 유지되는 동안 | 검색 폼 내부            | uncontrolled input      | 제출 전 초안은 탐색 기록이 아님                |
| 장바구니 상품 ID              | 브라우저 메모리     | 앱을 새로고침하기 전     | 홈·목록·Header          | Zustand                 | 익명 사용자가 여러 화면에서 공유하는 상태      |
| 위시리스트 상품 ID            | 브라우저 메모리     | 앱을 새로고침하기 전     | 홈·목록·Header          | Zustand                 | 익명 사용자가 여러 화면에서 공유하는 상태      |
| 장바구니·위시리스트 개수      | 저장하지 않음       | 렌더 시 계산             | Header                  | Zustand selector 파생값 | ID 목록에서 계산 가능하므로 중복 저장하지 않음 |
| TanStack Query 로딩·에러 상태 | TanStack Query 캐시 | 조회 수명                | 해당 조회 화면          | TanStack Query          | 서버 조회 결과와 분리하면 상태가 어긋남        |

로그인이 추가되면 장바구니·위시리스트의 원본은 서버로 이동한다. 이 스펙에서는 익명 상태를
merge할지 discard할지 결정하지 않으며, 서버 동기화 도입 시 별도 정책으로 정한다.

이 표가 상태 소유권 기록의 정본이다. 별도 상태표를 만들지 않으며 구현 중 계약이 달라지면 이 표와 결정 근거를 함께 갱신한다.

## 결정 사항

### D1. 잘못된 URL과 페이지 초과

- category와 sort는 허용값만 받고, page는 1 이상의 안전한 정수만 받는다. 허용값을 벗어난 값은
  parser가 기본값으로 대체한다. 화면과 조회 조건은 이 시점에 이미 정상이다.
- **주소창에 남은 잘못된 값은 다시 쓰지 않는다.** 값 보정은 parser가 끝냈고, 주소를 고치려면
  렌더 이후 effect로 URL을 다시 써야 하는데 그 비용이 얻는 것보다 크다고 판단했다.
- 문법상 유효하지만 마지막 페이지를 초과한 page만 응답의 totalCount로 확인한 뒤 마지막 페이지로
  `history: "replace"` 한다. 총 개수를 받아야 알 수 있어 parser로는 판단할 수 없는 유일한 경우다.
- 보정으로 주소가 바뀌기 전까지는 목록 대신 이동 중 상태를 표시해 잘못된 페이지 화면이 노출되지 않게 한다.
- totalCount가 0이면 page 1에서 목록 빈 상태를 표시한다.

직접 입력하거나 오래된 공유 URL로 접근했을 때 요청한 page와 가장 가까운 유효 범위를 유지하도록 마지막
페이지로 clamp한다. 필터·검색·정렬 변경은 결과 집합이 달라지므로 기존처럼 page 1로 돌아간다.

주소창을 정리하지 않기로 한 근거는 조사 결과다. nuqs는 읽을 때 URL을 고치지 않으며, 이는 같은 키를
구독하는 컴포넌트끼리 충돌할 수 있어 의도적으로 앱에 맡긴 설계다(Discussion #942). 메인테이너는 같은
질문에 대해 클라이언트가 아니라 middleware에서 처리할 문제라고 답했고(#1139), 기본값을 URL에 심는
요청에는 "버그가 아니라 의도된 동작"이라고 못박았다(#761). 실제로 nuqs를 쓰는 저장소 중 잘못된 값을
감지해 주소를 다시 쓰는 코드를 가진 곳을 찾지 못했다(tablecn, openstatus, data-table-filters, nuqs 본체).
공유 링크 오염과 SEO 중복이 남는 문제인데, SEO는 nuqs 문서가 지정한 대로 `metadata.alternates.canonical`로
푸는 것이 정공법이고 `replaceState`는 크롤러에게 보이지 않아 도움이 되지 않는다.

### D2. 검색 확정과 URL history

- 입력 중 검색어는 URL이나 React state에 복사하지 않고 native uncontrolled input이 소유한다.
- input은 확정 q를 `defaultValue`로 받고 검색 폼은 확정 q를 `key`로 사용한다. 뒤로 가기와 앞으로 가기로
  q가 바뀌면 검색 폼이 다시 생성되어 해당 검색어로 복원된다.
- 검색 폼 제출 또는 Enter 시 `FormData`로 입력값을 읽고 앞뒤 공백을 제거한다.
- 확정 검색어와 page 1을 `useQueryStates` 한 번의 호출로 갱신하고 `history: "push"`를 사용한다.
- 빈 검색어를 제출하면 q를 URL에서 제거하고 page 1의 전체 목록으로 이동한다.
- category·sort·page 변경도 이전 결과로 돌아갈 수 있어야 하는 탐색 행위이므로 각 사용자 이벤트에서
  `history: "push"`를 사용한다. `NuqsAdapter` 전역 기본값으로 지정하지 않는다.
- 마지막 페이지 초과 보정은 사용자 탐색이 아니므로 `history: "replace"`를 사용한다 (D1).
- 실시간 검증이나 글자 수처럼 입력 중 렌더링 요구가 생기기 전에는 controlled `useState`와 동기화 `useEffect`를 추가하지 않는다.
- 타이핑만으로는 URL, history, query key를 변경하지 않는다.

### D3. 장바구니·위시리스트 계약

- store는 `cartProductIds: string[]`, `wishlistProductIds: string[]`만 저장한다.
- 상품 수가 작고 persist를 사용하지 않으므로 직렬화하기 쉽고 불변 갱신이 단순한 배열을 선택한다.
- `toggleCart(productId)`와 `toggleWishlist(productId)`는 ID가 없으면 추가하고 있으면 제거한다.
- 같은 ID는 중복 저장하지 않으며 Header는 각 배열의 length를 selector에서 파생한다.
- 상품 카드 버튼은 해당 ID의 포함 여부(`isInCart` 또는 `isWishlisted`)를 `aria-pressed`로 나타낸다.
- 상품 카드는 해당 상품의 포함 여부와 필요한 action만 selector로 구독한다.
- 새로고침하면 두 익명 상태가 초기화된다.

수량이 범위 밖이므로 장바구니 개수는 클릭 횟수가 아니라 서로 다른 상품 ID 개수다.

### D4. TanStack Query 캐시와 조회 계약

- 홈 key는 `["products", "home"]`, 목록 key는 `["products", "list", conditions]`로 두고 conditions는
  `{ q, category, sort, page, pageSize }`의 정규화된 전체 조건이다.
- 홈 응답도 결국 인기·신상품 목록이므로 두 조회를 `productQueries` 한 곳에 모으고 `products` prefix를 공유한다.
  화면 단위로 key를 나누면 상품 캐시가 어디에 있는지 흩어지고, prefix를 공유하면 나중에 상품 mutation이
  생겼을 때 `["products"]` 하나로 두 조회를 함께 무효화할 수 있다.
- 기본 조건은 `q=""`, `category="all"`, `sort="latest"`, `page=1`, `pageSize=12`다.
- 빈 q는 API 요청에서 생략할 수 있지만 나머지 기본 조건은 요청에 명시한다.
- list queryOptions는 조건을 전부 채운 객체로만 받고, 그 객체 하나를 query key와 요청이 함께 쓴다.
  기본값을 채우는 책임은 조회 계층이 아니라 조건의 원본인 URL parser에 둔다.
- 홈은 `staleTime: 5분`, `gcTime: 10분`으로 둔다. 배너·카테고리·인기·신상품을 묶은 단일 키이고 현재는
  고정 mock 원본을 사용하므로 초 단위 갱신이 필요한 정확성 요구가 없다. 상품을 둘러보다 돌아오는 동안에는
  fresh 데이터를 재사용하고, stale이 된 뒤에도 캐시가 남아 있으면 먼저 표시한 뒤 background refetch한다.
- 목록은 `staleTime: 1분`과 기본 `gcTime: 5분`을 사용한다. 검색·카테고리·정렬·페이지마다 키가 늘어나므로
  최근 조건은 재사용하되 사용하지 않는 조건별 캐시를 홈처럼 오래 보관하지 않는다.
- 분 단위는 500ms API 지연이 아니라 허용 가능한 오래됨과 재방문 시간을 기준으로 정했다. 현재 카드는 가격을
  표시하지만 재고·결제·서버 mutation이 없어 초 단위 정확성이 필요하지 않다. API 지연은 캐시 재사용의 효용만
  높인다.
- `refetchOnWindowFocus`는 기본값을 유지한다. fresh인 동안에는 포커스 복귀 요청이 없고, stale 이후에는
  background 갱신을 허용하는 편이 상품 데이터에 맞다.
- queryFn은 `response.ok`가 아니면 throw하고 성공 응답만 반환한다.
- 운영 환경에서 실시간 가격·재고, 결제, 서버 mutation이 추가되면 해당 데이터를 별도 쿼리로
  분리하고 `staleTime: 0~30초` 또는 명시적 무효화 정책을 다시 정한다.

### D5. URL parser와 API 조건

- q는 문자열, category는 `all | casual | fashion | goods | home | digital`, sort는
  `latest | popular | price-asc | price-desc`, page는 1 이상의 안전한 정수 parser를 사용한다.
- URL 기본값은 q 없음, category `all`, sort `latest`, page 1로 정규화한다.
- 사용자 URL과 `ProductListQuery`에는 `scenario`를 포함하지 않는다.
- URL parser 결과만 목록 조회 조건으로 사용하고 같은 조건을 별도 로컬 상태에 복사하지 않는다.

### D6. 상태별 화면과 검증 방법

- 홈 loading은 홈 콘텐츠 대신 로딩 상태를, error는 API 오류 메시지를 표시한다.
- 홈 empty는 배너·카테고리를 유지하고 인기 상품·신상품 섹션에 빈 상태를 표시한다.
- 목록 loading은 결과 영역에 로딩 상태를, error는 API 오류 메시지를 표시한다.
- 목록 empty는 totalCount 0과 빈 상태를 표시하고 페이지 이동을 노출하지 않는다.
- API가 반환한 로컬 `/images/products/` 경로만 사용하며 외부 이미지 서버를 추가하지 않는다.
- production query에 scenario를 추가하지 않는다. loading·error·empty를 재현할 땐 API의 `scenario`를
  직접 호출하거나 개발자 도구로 응답을 대체한다.
- loading·error·empty 화면은 렌더 테스트로 검증하지 않고 브라우저에서 확인한다. 이 분기들은 조회 상태를 그대로 그리는 배선이라, 렌더 테스트가 잡아주는 결함보다 문구·마크업 변경마다 따라 고치는 비용이 크다.
- URL history, 새 탭 직접 진입, 클라이언트 페이지 이동처럼 자동화하지 않은 동작은 브라우저에서 확인한다.
- 브라우저 검증은 PR에 시작 URL·행동·기대 결과·실제 결과를 짧게 기록하며, 같은 흐름을 자동화했다면 중복 기록하지 않는다.

### D7. 설계와 AI 사용 기록

- 상태·캐시·URL·store 경계를 바꾸는 커밋과 PR에는 선택 이유를 한 줄 이상 기록한다.
- AI 사용 내역은 PR 본문의 전용 섹션에 표시하고 직접 읽고 수정하고 검증한 범위를 함께 기록한다.

## 작업 묶음

### 0. 상태 소유권과 전체 스펙

- 상태표, 비범위, 캐시·URL·store 정책과 검증 시나리오를 확정한다.
- 산출물: 이 스펙 문서.
- fulfills: S1–S4, C1
- 커밋 후보: `chore: 5주차 상태 소유권과 구현 스펙 정리`

### 1. TanStack Query 기반 홈 화면

- 기존 Select·Dialog 데모를 `/demos` 경로로 옮기고 루트 경로를 커머스 홈으로 교체한다.
- 앱 수명 동안 안정적인 QueryClient와 `QueryClientProvider`를 구성한다.
- 실패 HTTP 응답을 throw하는 조회 경계를 만든다.
- home queryOptions에 query key, queryFn, staleTime을 함께 둔다.
- 배너·카테고리·인기 상품·신상품과 정상·로딩·에러·빈 상태를 연결한다.
- fulfills: Q1, Q2, Q4–Q6, V1, V3, V4, P1
- 커밋 후보: `feat: TanStack Query 기반 홈 데이터 조회와 상태 화면 구현`

### 2. 기본 상품 목록 조회

- `/products` 경로와 list queryOptions를 추가한다.
- 기본 조건 `sort=latest`, `page=1`, `pageSize=12`를 query key와 요청에 동일하게 반영한다.
- 목록과 정상·로딩·에러·빈 상태를 연결한다.
- fulfills: Q2–Q6, V2–V4
- 커밋 후보: `feat: 기본 상품 목록 조회와 상태 화면 구현`

### 3. URL 검색·필터·정렬

- App Router용 `NuqsAdapter`와 허용값 parser를 구성한다.
- uncontrolled 검색 input의 초안과 제출된 URL 검색어를 분리한다.
- 검색·카테고리·정렬 변경을 URL에 기록하고 page를 같은 갱신에서 1로 초기화한다.
- URL parser 결과를 list queryOptions의 유일한 조회 조건으로 전달한다.
- fulfills: U1–U4, U6
- 커밋 후보: `feat: 검색과 필터 조건을 URL 원본으로 연결`

### 4. URL 페이지네이션과 탐색

- totalCount와 pageSize로 페이지 이동 UI를 연결한다.
- 공유·새로고침·뒤로 가기·앞으로 가기에서 조건과 목록이 함께 복원되는지 검증한다.
- 잘못된 URL과 마지막 페이지 초과 정책을 적용한다 (D1).
- fulfills: U3, U5, V2
- 커밋 후보: `feat: URL 페이지네이션과 탐색 복원 구현`

### 5. 장바구니·위시리스트

- 상품 ID 중심의 Zustand store와 불변 action을 구현한다.
- Header는 개수만, 상품 카드는 해당 상품의 포함 여부와 필요한 action만 구독한다.
- 홈과 목록 사이를 이동해도 버튼 상태와 Header 개수가 일치하게 연결한다.
- fulfills: Z1–Z6
- 커밋 후보: `feat: 장바구니와 위시리스트 상태를 화면 간 연결`

### 6. 통합 검증과 제출 증거

- 빠른 조건 변경, 동일 조건 캐시 재사용, 잘못된 URL, 페이지 초과를 검증한다.
- 홈·목록·Header의 상태 일관성과 전체 store 구독 여부를 검증한다.
- 실제 검증 절차와 결과, 발견한 버그, 남은 위험을 스펙과 PR 본문에 기록한다.
- `pnpm check`를 통과한다.
- fulfills: 전체 완료 조건 재검증, C1–C3
- 커밋 후보: `chore: 5주차 상태 경계 검증 결과와 제출 증거 기록`

발견한 기능 결함은 6번 묶음에 섞지 않고 원래 책임 단위의 `fix:` 커밋으로 분리한다.

## 단위별 검증 원칙

- 각 구현 묶음은 화면에서 독립적으로 확인 가능한 상태로 끝낸다.
- 사용하지 않는 provider, query, store만 먼저 만드는 인프라 커밋은 만들지 않는다.
- 각 묶음에서 관련 검증과 `pnpm test`를 실행한다.
- 최종 묶음에서 `pnpm check`로 테스트·lint·타입·프로덕션 빌드를 모두 확인한다.
- 공통 컴포넌트와 selector 훅은 실제 중복이나 잘못된 구독을 줄일 때만 추출한다.

## 완료 조건 — 공식 기본 체크리스트 29항목

### 상태 설계

- [ ] S1. 구현 전에 `상태 · 소유자 · 수명 · 공유 범위 · 선택 이유` 표가 작성되어 있다.
- [ ] S2. 서버·URL·클라이언트·로컬 상태를 나눈 기준이 구현과 일치한다.
- [ ] S3. 계산 가능한 값을 별도 상태로 중복 저장하지 않는다.
- [ ] S4. 같은 데이터를 여러 저장소에 복사하지 않는다.

### TanStack Query

- [ ] Q1. 앱 수명 동안 안정적인 `QueryClientProvider`가 구성되어 있다.
- [ ] Q2. 홈·목록 `queryOptions`에 query key·queryFn·staleTime이 함께 정의되어 있다.
- [ ] Q3. 정규화된 목록 조건이 query key와 API 요청에 동일하게 반영된다.
- [ ] Q4. 홈 5분/10분과 목록 1분/기본 5분의 staleTime·gcTime 선택 근거가 구현·PR 기록과 일치한다.
- [ ] Q5. 서버 응답을 Zustand나 별도 로컬 상태에 복사하지 않는다.
- [ ] Q6. 홈·목록의 loading·error·empty 화면이 success 화면과 구분된다.

### nuqs / URL 상태

- [ ] U1. App Router용 `NuqsAdapter`가 URL hook 사용 범위를 감싼다.
- [ ] U2. `useQueryStates`와 허용값 parser로 검색·카테고리·정렬·페이지를 관리한다.
- [ ] U3. 검색·카테고리·정렬 변경과 page 1 초기화가 한 URL 갱신에서 처리된다.
- [ ] U4. 기본 정렬도 API 요청에 `sort=latest`로 명시된다.
- [ ] U5. URL 공유·새로고침·뒤로 가기·앞으로 가기 후 같은 조건과 목록이 복원된다.
- [ ] U6. `scenario`가 사용자 URL 상태나 `ProductListQuery`에 포함되지 않는다.

### Zustand

- [ ] Z1. 장바구니·위시리스트 버튼으로 상품 ID의 담기·빼기가 모두 동작한다.
- [ ] Z2. store는 중복 없는 상품 ID 배열만 저장하고 선택 이유가 기록되어 있다.
- [ ] Z3. Header 개수를 별도 저장하지 않고 ID 배열 길이에서 파생한다.
- [ ] Z4. Header와 상품 버튼이 필요한 값과 action만 selector로 구독한다.
- [ ] Z5. 홈과 목록에서 같은 상품의 버튼 상태와 Header 개수가 일치한다.
- [ ] Z6. 클라이언트 페이지 이동 중 상태가 유지되고 새로고침 후에는 초기화된다.

### 홈 / 목록

- [ ] V1. 홈에 배너·카테고리·인기 상품·신상품이 API 응답대로 표시된다.
- [ ] V2. 목록의 검색·카테고리·정렬·페이지네이션이 URL과 API 응답대로 동작한다.
- [ ] V3. 홈과 목록 모두 loading·error·empty 상태를 구분한다.
- [ ] V4. 예시의 JSX·CSS를 재사용하더라도 조회·구독 책임에 맞게 컴포넌트 경계를 결정하고 로컬 상품 이미지만 사용한다.

### 공통

- [ ] C1. 상태·캐시·URL·store 경계 변경에 “왜 이렇게 설계했는가” 근거가 기록되어 있다.
- [ ] C2. 개발 중 `pnpm test`, 제출 전 `pnpm check`가 통과한다.
- [ ] C3. AI 생성 부분을 PR에 표시하고 직접 검토·수정·검증한 범위를 기록한다.

## 프로젝트 보존 조건

- [ ] P1. `/`에는 5주차 커머스 홈이 표시되고 기존 Select·Dialog 데모는 `/demos`에서 계속 동작한다.

## 런타임 검증 시나리오

- [ ] 조건이 포함된 URL을 새 탭에서 열면 같은 조건과 목록이 표시된다.
- [ ] 검색·카테고리·정렬 변경 시 URL과 page 1이 한 번에 반영된다.
- [ ] 검색어를 타이핑만 하면 URL·history·네트워크 요청이 바뀌지 않는다.
- [ ] 여러 조건을 변경한 뒤 뒤로 가기와 앞으로 가기를 하면 URL·검색 폼·목록이 함께 복원된다.
- [ ] 잘못된 parameter는 기본값으로 읽혀 화면이 정상 동작하고, 마지막 페이지 초과 URL만 마지막 페이지로 `replace`된다.
- [ ] 홈과 같은 목록 조건으로 돌아오면 각각 5분/10분과 1분/기본 5분의 staleTime·gcTime 정책에 맞게
      캐시가 재사용된다.
- [ ] 홈과 목록의 loading·error·empty 상태가 각각 재현된다.
- [ ] 홈과 목록을 이동하며 장바구니·위시리스트 버튼과 Header 개수가 일치한다.
- [ ] 같은 상품 버튼을 두 번 누르면 추가 후 제거되고 Header 개수가 원래 값으로 돌아온다.
- [ ] 새로고침하면 장바구니·위시리스트가 초기화된다.
