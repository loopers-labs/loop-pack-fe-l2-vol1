# 9주차 — E2E 범위 설계 (week09-e2e-scope)

## A. 이벤트 스키마

### 이름 규칙

시드 로그(`fixtures/events-30d.jsonl`)에 이미 정의된 이벤트 이름을 그대로 쓴다. 새 규칙을 만들지 않는다 — 계측 스키마는 혼자 정하는 게 아니라 팀(여기서는 로그를 만든 쪽)이 이미 합의해둔 걸 따르는 것이라고 판단했다.

- 형식: `snake_case`, `{도메인}_{동작}` (예: `product_list_view`, `cart_add`)
- 계측한 8개 지점 전부 시드 로그의 이름과 동일하다 — 이름 매핑표가 따로 필요 없다.

### 공통 프로퍼티

`setCommonProperties()`(`src/shared/analytics/common-properties.ts`)로 모든 이벤트에 공통으로 붙인다.

| 필드 | 계산 방법 | 비고 |
| --- | --- | --- |
| `sessionId` | 브라우저 탭당 1회 `crypto.randomUUID()`로 생성, `sessionStorage`에 저장 | 로그인 여부와 무관. `entities/session`의 인증 세션과는 다른 개념(둘 다 "세션"이라 이름이 겹치지만 별개) |
| `device` | 화면 너비 기준 `mobile`(≤767px) / `tablet`(≤1023px) / `desktop`(그 이상) | 이벤트 발생 시점마다 재계산 |
| `ts` | `new Date().toISOString()` | 이벤트 발생 시점마다 재계산 |

`userId`는 공통 프로퍼티에 넣지 않았다. `identify(userId)`를 호출해도 지금 등록된 `consoleProvider`는 그 값을 어디 저장해두지 않아서(실제 분석 도구, 예를 들어 GA4·Amplitude는 내부적으로 기억해뒀다가 이후 이벤트에 자동으로 붙여주지만, `consoleProvider.identify()`는 콘솔에 찍기만 함) 자동으로 이후 이벤트에 붙지 않는다. 그래서 로그인 이후 이벤트인 `login_success`·`order_start`·`order_complete`에는 그 시점에 아는 `user.id`를 **이벤트 프로퍼티에 직접 넣었다**.

### `initAnalytics()` 호출 위치

`src/app/providers.tsx`에서 `src/shared/analytics/init-analytics.ts`를 부수효과로 import — 앱이 로드되는 가장 이른 시점에 `registerProviders()` → `setCommonProperties()` → `initAnalytics()` 순으로 실행된다. 초기화가 늦어질수록 그 사이 발생한 `track()` 호출이 큐(최대 100개, 초과분은 오래된 것부터 버려짐)에 쌓이는 시간이 길어지므로, 가능한 한 이르게 실행되도록 했다.

### `identify()` / `reset()` 호출 위치

- `identify(user.id)` — 로그인 mutation 성공 시(`src/features/auth-login/model/useLoginForm.ts`)
- `reset()` — 로그아웃 mutation 성공 시(`src/features/auth-logout/model/useLogout.ts`)

### 계측 코드는 화면이 직접 호출

컴포넌트·훅이 `track()`을 직접 부른다. 별도 래퍼를 두지 않았다 — `src/analytics/logger.ts` 자체 주석("화면 코드는 `track()`만 부른다")이 이미 이 설계를 의도하고 있고, `track()` 자체가 이미 프로바이더(어느 분석 도구로 보낼지)를 가리는 추상화라 한 겹 더 감싸는 건 지금 스코프엔 과했다.

### 계측 지점 매핑표

| 이벤트 | 시드 로그 정의 | 우리 구현 위치 | 일치 여부 / 조정 |
| --- | --- | --- | --- |
| `product_list_view` | 목록 화면 진입 | `ProductListPage` 마운트 시 (`src/_pages/product-list/ui/ProductListPage.tsx`) | 이름·프로퍼티(`category`,`sort`,`page`) 동일. 필터 변경마다는 다시 안 보냄 — 그건 `category_filter_change` 등 별개 이벤트 영역 |
| `product_detail_view` | 상세 화면 진입 | — | **제외.** 상세 페이지(`/products/[id]`) 자체가 코드베이스에 없음 |
| `cart_add` | 장바구니 담기 | `ProductCard` 담기 클릭 (`src/widgets/product-card/index.tsx`) | 이름 동일. `quantity`는 항상 `1` — `cartStore`가 상품 id만 저장하고 수량 개념이 없음 |
| `login_start` | 로그인 화면 진입 | `LoginForm` 마운트 시 (`src/features/auth-login/ui/LoginForm.tsx`) | 이름 동일. `from`은 `redirect` 쿼리 파라미터 값(없으면 `'direct'`) — 어느 보호 경로를 시도하다 왔는지를 나타냄 |
| `login_success` | 로그인 성공 | `useLoginForm` mutation `onSuccess` | 이름 동일. `userId` 직접 첨부(위 "공통 프로퍼티" 참고) |
| `login_fail` | 로그인 실패 | `useLoginForm` mutation `onError` | 이름 동일. `reason`은 API가 실패 사유를 세분화해서 주지 않아 상태 코드 기준으로 분류(`401`→`INVALID_CREDENTIALS`, `400`→`INVALID_REQUEST`, 그 외→`UNKNOWN_ERROR`) — 시드 로그의 `INVALID_CREDENTIALS`와 형식(SCREAMING_SNAKE_CASE)을 맞춤 |
| `order_start` | 주문서 화면 진입 | `CheckoutPage` 마운트 시 (`src/_pages/checkout/ui/CheckoutPage.tsx`) | 이름 동일. `productId`(단수) → **`productIds`(배열)**로 조정 — 우리 주문서는 장바구니 전체(여러 상품)를 한 번에 주문함. `userId` 직접 첨부 |
| `order_complete` | 주문 완료 | `useCheckoutSubmit` mutation `onSuccess` | 이름 동일. `productIds` 배열로 조정(위와 같은 이유). **`totalPrice`는 생략** — 이후 `cartStore`에 상품 상세정보를 저장하도록 개선하면서 화면(주문서)에는 총 주문 금액을 계산해 보여주게 됐지만, 계측 이벤트에까지 넣는 건 과제가 요구한 8개 지점에 포함되지 않는 프로퍼티라 스코프를 늘리지 않기로 함. `userId` 직접 첨부 |

### 예시 흐름 — 로그인부터 주문까지 한 번 통과했을 때

비로그인 상태로 상품 목록에 들어가 담고, 로그인해서 주문서로 이동해 주문을 완료하는 시나리오라면 이 순서로 이벤트가 남는다.

1. `product_list_view` — `/products` 진입 (`category`, `sort`, `page`)
2. `cart_add` — 담기 클릭 (`productId`, `quantity: 1`)
3. `login_start` — `/login` 진입, 보호 경로(`/orders/new`)에서 튕겨온 경우 `from`이 그 경로 (그 외엔 헤더의 "장바구니 N" 클릭 등으로 직접 옴)
4. `login_success` — 로그인 폼 제출 성공 (`from`, `userId`) — 이 직전에 `identify(userId)`가 먼저 불림
5. `order_start` — `/orders/new` 진입 (`productIds`, `userId`)
6. `order_complete` — 주문하기 클릭 성공 (`productIds`, `userId`)

로그인에 실패하면 4번 대신 `login_fail`(`reason`)이 남고, 5·6번으로 이어지지 않는다(로그인 못 했으니 보호 경로에 못 들어감). 로그아웃하면 `reset()`이 불려서 이후 이벤트에는 `identify()`로 붙였던 사용자 정보가 더는 안 남는다.

### 계측하지 않은 것 (시드 로그엔 있지만 이번엔 제외)

`category_filter_change`, `sort_change`, `page_change`, `wishlist_add`, `client_error` — 과제가 요구한 8개 지점(목록 진입·상세 진입·담기·로그인 시작/성공/실패·주문 시작/완료) 밖이라 이번엔 계측하지 않았다.

---

## B. 시드 로그 분석

(3단계에서 작성)

## C. 붙일 곳과 안 붙일 곳

(3단계에서 작성)
