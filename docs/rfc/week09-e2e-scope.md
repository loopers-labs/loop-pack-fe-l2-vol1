# RFC — 9주차 인증과 E2E 범위

- 작성 시작: 2026-09-04
- 브랜치: `feat/week-09` (베이스 `39114daa` = 8주차 tip + 9주차 스타터)
- 원칙: **E2E는 붙일 근거를 먼저 만들고, 그 근거대로만 만든다.** 이 문서는 구현보다 먼저 커밋한다 — 절마다 "정한 시점"이 커밋 시각으로 남도록, 절이 채워질 때마다 따로 커밋한다.

> 8주차 리뷰에서 "커밋 9개가 24분 안에 올라가 '정하고 썼다'와 '쓰고 나눴다'를 구별할 수 없다"는 지적을 받았다. 이번 주는 결정 → (시간) → 구현 순서가 히스토리에 보이게 한다.

---

## 0. 1단계 결정 — 인증 (구현 전에 정한 것)

과제 문서는 1단계 결정을 PR 본문에 쓰라고 한다. PR 본문은 이 절을 가리킨다. 여기 먼저 적는 이유는 위와 같다 — 구현 커밋보다 앞선 시각이 필요하다.

### D1. 세션 상태는 서버 상태다 → TanStack Query

5주차부터 써온 클라이언트 상태(zustand)를 그대로 쓰지 않는다. 세션은 서버가 소유하고 요청마다 값이 달라질 수 있다(만료·로그아웃). "서버에서 오는 데이터 → 서버 상태"라는 상태 분류 기준 그대로다.

- `/api/auth/me`를 `authQueries.me()`로 조회한다.
- **초기 HTML 조건**: 서버(RSC)에서 `readSessionToken(cookie)`로 사용자를 읽어 `HydrationBoundary`로 내려준다. JS 실행 전 헤더에 로그인 상태가 있어야 하므로 클라이언트 fetch로만 채우면 조건을 못 지킨다.
- 쿠키를 읽는 위치는 `(commerce)` 레이아웃. 이 트리는 이미 동적이다(홈 `force-dynamic`, `/products`는 searchParams) — build 출력의 ○/ƒ 표가 바뀌지 않는지 구현 후 확인해 여기에 적는다.
  - **구현 후 기록(2026-09-04)**: `pnpm build` Route 표에서 ○(정적)는 구현 전과 같이 `/_not-found`·`/dialog-demo`·`/performance-lab/inp`·`/select-demo` 4개, 나머지는 전부 ƒ. `(commerce)` 아래에 정적이던 라우트가 없었으므로 `cookies()` 읽기로 정적 생성 범위가 줄지 않았다. 7주차 기준(LCP 측정 조건) 변동 없음.
  - **구현에서 배운 것**: 헤더의 보호 경로 링크(`/checkout`·`/orders`)는 `prefetch={false}`. 로그인 전에 prefetch하면 proxy의 리다이렉트 응답이 라우터 캐시에 남아, 로그인 후 `router.replace('/checkout')`가 캐시를 타고 다시 로그인 화면으로 간다(실브라우저 재현). 로그인 성공 시 `router.refresh()`도 같은 이유로 붙였다.

### D2. proxy는 쿠키 존재만 확인한다

- `src/proxy.ts`(Next 16: `middleware.ts`는 deprecated). Edge 런타임이라 `node:crypto`를 쓰는 `auth.ts`를 import할 수 없다 → 서명 검증 불가. 쿠키 이름은 `auth-cookies.ts`에서만 가져온다.
- 존재만 확인하면 "쿠키는 있는데 만료된" 요청은 통과한다. 그 경우는 페이지·API의 실제 검증에서 401이 나고 D5로 흘러간다. 즉 **proxy = 미로그인 차단, D5 = 만료 처리**로 역할을 가른다. 이 구분이 "같은 401을 미로그인과 만료 중 무엇으로 볼지"의 기준이 된다.

### D3. 보호 경로 = 주문서 · 주문 내역만

| 경로 | 보호 | 이유 |
| --- | --- | --- |
| `/checkout` (주문서) | ✅ | 주문 API가 세션을 요구한다. 과제 필수 |
| `/orders` (주문 내역) | ✅ | 사용자별 데이터. 과제 필수 |
| 장바구니 · 위시리스트 | ❌ | 메모리 zustand의 익명 로컬 상태. 로그인 전에도 담을 수 있어야 하고, 서버에 없는 데이터를 로그인으로 가릴 이유가 없다 |
| 마이페이지 | 만들지 않음 | 헤더의 로그인 상태·로그아웃이 그 역할을 한다. 보호할 화면을 늘리면 E2E 후보만 늘어난다 |

주문서·주문 내역은 지금 없으므로 **만든다**. 주문 API가 `{productId, quantity}`를 받는데 현재 카트에는 quantity가 없다 → 주문서에서 수량 1로 보낸다(카트 모델 변경은 이번 주 범위 밖).

### D4. 복원 파라미터는 `next`, 검증은 "우리 경로처럼 보이는가"

- `/login?next=<원래 경로>`. proxy가 붙이고 로그인 성공 후 그 값으로 `router.replace`.
- 허용 조건: `/`로 시작 · `//`로 시작하지 않음 · 백슬래시 없음 · 스킴(`:`) 없음. 하나라도 어긋나면 `/`로. `new URL(next, origin).origin === origin` 같은 파싱 기반 검증은 `\\evil.com` 류를 브라우저마다 다르게 해석하므로 문자열 규칙으로 막는다.

### D5. 401은 한 곳에서 — api 레이어가 분류하고, `(commerce)` 레이아웃의 경계가 보여준다

- `shared/api`에 `UnauthorizedError`(401 전용)를 추가한다. `HttpError(401)`을 화면마다 `status === 401`로 검사하지 않는다.
- 만료 판정 기준: **proxy가 통과시킨 요청(쿠키 있음)에서 온 401 = 만료.** 쿠키가 없으면 proxy가 이미 로그인으로 보냈으므로 그 401은 화면까지 오지 않는다.
- 표시 위치: `(commerce)` 레이아웃 한 곳의 경계가 "세션이 만료됐어요 — 다시 로그인" + `/login?next=<현재 경로>` 링크를 보여준다. 화면마다 처리하지 않는다.
- 401은 **retry 0**. 재시도해도 같은 답이다(`query-client`의 retry 정책에 분기 추가).

### D6. 로그아웃해도 장바구니 · 위시리스트는 남긴다

**결정: 남긴다.**

- 카트는 세션의 소유물이 아니라 **브라우저 탭의 소유물**이다. 로그인 전에도 담을 수 있고(D3에서 보호하지 않기로 한 이유와 같다), 서버에도 계정에도 묶여 있지 않다. 소유권이 다른 상태를 로그아웃이 건드리면 상태 분류 기준("서버 상태 / 로컬 상태")을 코드가 스스로 어기는 것이다.
- 요즘 커머스의 일반적인 흐름과도 맞다 — **로그인 없이 담고, 주문하러 갈 때 로그인을 유도한다.** 이 앱도 그 구조다: 담기는 열려 있고 `/checkout`이 보호 경로다. 로그아웃이 카트를 지우면 "둘러보다 담고 → 로그인 → 마음 바꿔 로그아웃 → 계속 둘러보기"에서 담은 게 사라진다.
- 공용 기기 우려는 이미 "메모리 전용 · 새로고침이면 비워진다"는 현재 계약(8주차 E2E가 고정)이 맡고 있다. 로그아웃에 같은 역할을 중복시키지 않는다.
- 남기지 않은 것과의 경계: 로그아웃 `onSuccess`에서는 **세션에서 파생된 것만** 정리한다 — 세션 query 무효화 · analytics `reset()`. 카트·위시리스트 스토어는 건드리지 않는다. 코드 위치가 곧 이 구분을 보여준다.

기각한 선택지: 지운다(주문 주체가 바뀌는데 주문 재료가 남는다). 주문서는 진입 시점에 세션을 다시 확인하므로, 카트가 남아 있어도 **다른 계정으로 주문이 나가는 건 그 계정 사용자가 주문서에서 확인하고 누른 것**이다. 재료가 남는 것과 주문이 나가는 것은 다르다.

---

## A. 이벤트 스키마 (2단계 — 계측 코드보다 먼저)

### 이름 규칙 — 시드 로그 스키마를 그대로 쓴다

`snake_case`, `<대상>_<행위>` 순서(`product_list_view`, `cart_add`, `login_success`). 새 이름을 만들지 않는 이유: 이 스키마는 팀이 이미 합의해 30일치 로그가 쌓여 있는 것이고, 3단계에서 그 로그로 경로를 세운다. 이름이 같아야 "내 앱의 이 화면 = 로그의 이 이벤트"가 매핑 표 없이 성립한다.

| 계측 지점 (과제 지정) | 이벤트 | props | 내 앱에서 부르는 자리 |
| --- | --- | --- | --- |
| 목록 진입 | `product_list_view` | `category`·`sort`·`page` | `ProductsPage` 마운트·필터 변경 시(현재 URL 조건) |
| 상세 진입 | `product_detail_view` | — | **없음 — 상세 화면이 없다.** 계측하지 않고 이 사실을 기록한다 |
| 담기 | `cart_add` | `productId`·`quantity`(항상 1) | `AddToCartButton` 담기(빼기는 보내지 않음 — 시드에 `cart_remove`가 없다) |
| 로그인 시작 | `login_start` | `from`(= `next` 경로 또는 `direct`) | `/login` 진입 |
| 로그인 성공 | `login_success` | `from` | 로그인 mutation `onSuccess` (+ `identify(user.id)`) |
| 로그인 실패 | `login_fail` | `reason`(`INVALID_CREDENTIALS` \| `SERVER_ERROR`) | 로그인 mutation `onError` |
| 주문 시작 | `order_start` | `itemCount` | `/checkout` 진입(담은 상품이 있을 때) |
| 주문 완료 | `order_complete` | `orderId`·`itemCount` | 주문 mutation `onSuccess` |

시드에 있지만 이 앱에서 보내지 않는 것: `product_detail_view`(화면 없음), `wishlist_add`·`category_filter_change`·`sort_change`·`page_change`(과제 지정 지점 아님 — 목록 진입 이벤트의 props로 조건이 실린다), `client_error`(오류 계측은 이번 범위 밖).

**매핑 표**: 이름 차이 없음. props 차이 — 시드의 `order_start.productId`·`order_complete.totalPrice`는 보내지 않는다(카트에 수량·금액이 없고 주문 API 응답에 금액이 없다). 대신 `itemCount`·`orderId`를 보낸다. 집계 시 `order_*` 이벤트 **수**는 호환되고 금액 집계는 불가 — 이 차이를 표로 남기는 것이 매핑의 목적이다.

### 공통 프로퍼티 — `setCommonProperties()`

시드 로그의 최상위 필드와 같은 이름을 쓴다(집계 스크립트가 그대로 읽을 수 있게).

| 필드 | 값 | 이유 |
| --- | --- | --- |
| `sessionId` | 탭 단위 랜덤 id, `sessionStorage`에 보관 | 시드의 세션 정의("같은 세션의 이벤트는 같은 값")와 맞춘다. 탭을 닫으면 끝나는 것이 이 앱의 카트 수명과 같다 |
| `device` | 뷰포트 폭으로 `mobile`(<768) / `tablet`(<1024) / `desktop` | 시드의 세 값. UA 파싱보다 단순하고 결정적이다 |
| `ts` | `new Date().toISOString()` | 이벤트 발생 시점에 평가된다(`setCommonProperties`가 함수를 받는 이유) |

`userId`는 공통 프로퍼티가 아니라 `identify()`로 보낸다 — 로그인 전 이벤트에 붙지 않아야 시드와 같은 모양이 된다.

### 어디서 부르나

- `initAnalytics()` — 루트 레이아웃의 클라이언트 컴포넌트 `AnalyticsProvider` 1곳. 그 전에 발생한 `track()`은 로거의 큐가 잡는다. 이 위치면 첫 화면의 `product_list_view`가 큐 → 초기화 후 전송 순서로 나가는 것을 볼 수 있다.
- `identify(user.id)` — 로그인 mutation `onSuccess`. `reset()` — 로그아웃 mutation `onSuccess` (D6의 "세션에서 파생된 것만 정리"와 같은 자리).
- **컴포넌트가 `track()`을 직접 부르지 않는다.** `shared/analytics/events.ts`에 이벤트 이름·props를 타입으로 고정한 함수 한 겹(`trackCartAdd(productId)` 식)을 두고 features·pages의 model(훅·mutation 콜백)이 부른다. 이유: (1) 이름 오타·props 누락을 타입이 막는다 (2) 화면 코드에 문자열 리터럴이 흩어지지 않아 스키마를 바꿀 때 한 파일만 고친다 (3) `src/analytics/`(스타터)는 그대로 두고 shared가 그 위에 얹힌다 — FSD에서 shared는 도메인을 모르는데, 이벤트 이름은 도메인이다. 그래서 이벤트 함수는 `shared`가 아니라 **`entities/analytics`**… 가 아니라 각 슬라이스에 두는 게 맞지 않나 검토했다 → 이벤트 목록이 8개뿐이고 팀 스키마(외부 계약)라 한 파일이 낫다. `shared/analytics/events.ts`로 두고 "스키마 = 외부 계약"임을 주석으로 남긴다.

## B. 시드 로그 분석

`[3단계 — 재료: pnpm analyze:events]`

## C. 붙일 곳과 안 붙일 곳

`[3단계]`
