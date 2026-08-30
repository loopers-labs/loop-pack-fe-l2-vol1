# 9주차 인증 범위와 E2E 검증 정책

## 1단계 인증 정책

### 보호 경로

보호 경로는 주문서(`/order`)와 주문 내역(`/orders`)으로 정했다. 두 화면은 주문 생성과 주문 조회처럼 사용자 세션이 필요한 기능을 다룬다.

장바구니(`/cart`)와 위시리스트(`/wishlist`)는 보호하지 않는다. 두 화면은 브라우저에 저장된 로컬 사용자 상태를 확인하는 public-ish 화면으로 보고, 실제 주문을 시작하는 시점부터 인증을 요구한다.

현재 구현하지 않은 마이페이지는 보호 경로 판단 대상에서 제외했다. 이후 마이페이지가 추가되면 계정 정보 화면이므로 보호 경로에 포함한다.

### 복원 경로

미로그인 사용자가 보호 경로에 접근하면 `/login`으로 보낸다. 원래 가려던 경로는 `redirectTo` query string에 담는다.

예를 들어 `/orders?page=1`에 접근하면 `/login?redirectTo=%2Forders%3Fpage%3D1`로 이동한다. 로그인에 성공하면 `redirectTo` 값을 읽어 원래 경로로 돌아간다.

`redirectTo`는 내부 경로만 허용한다. 외부 URL이나 프로토콜이 들어오면 기본값인 `/`로 정규화해, 로그인 후 외부 주소로 튕겨 나가는 일을 막는다.

### proxy 역할

`proxy.ts`는 보호 경로 진입 전 세션 쿠키가 있는지만 확인한다. 여기서 세션 서명까지 검증하지 않는다.

proxy는 Edge 런타임에서 실행된다. 세션 서명 검증에 쓰는 `readSessionToken`은 `node:crypto`에 의존하므로 proxy에서 직접 가져오지 않는다.

실제 세션 신뢰 판단은 Node 런타임에서 한다.

- `(commerce-auth)/layout.tsx`: 보호 route group 진입 시 `readSessionToken`으로 사용자 정보를 복원하고 Header 초기 HTML에 반영한다.
- `/api/auth/me`, `/api/orders`: API 요청마다 `readSessionToken`으로 세션을 다시 검증한다.

이 구조에서는 위조되거나 만료된 쿠키가 proxy를 통과할 수 있다. 대신 보호 layout과 API에서 다시 검증하므로 인증 신뢰 판단은 proxy에 두지 않는다.

## 서버 세션과 초기 HTML

`/order`, `/orders`는 `(commerce-auth)` route group으로 분리했다. 이 layout에서만 쿠키를 읽고 세션 query cache를 hydrate한다.

이렇게 하면 JavaScript가 실행되기 전에도 Header에 로그인 사용자의 이름이 들어간 HTML을 내려보낼 수 있다. 실제로 JavaScript를 끈 E2E에서 `/order`, `/orders`에 진입했을 때 `루퍼1님`이 보이는지 확인한다.

공통 `(commerce)` layout에서는 쿠키를 읽지 않는다. 모든 commerce 페이지를 동적으로 만들면 7주차에서 잡아둔 정적 렌더링 범위를 다시 깨뜨릴 수 있기 때문이다. 그래서 세션 초기 HTML이 반드시 필요한 `/order`, `/orders`만 동적 경계로 올렸다.

## 세션 상태 관리

세션은 요청마다 달라지는 서버 상태다. 그래서 장바구니나 위시리스트처럼 Zustand에 저장하지 않고, React Query의 server state로 관리한다.

반대로 장바구니와 위시리스트는 현재 계정 서버 상태가 아니라 브라우저에 남는 로컬 사용자 상태다. 이 둘은 Zustand persist로 유지한다.

## 401 처리 기준

`/api/auth/me`는 로그인하지 않은 상태와 세션 만료를 같은 401로 돌려준다. 그래서 모든 401을 세션 만료로 보지 않는다.

401 해석 기준은 요청의 목적에 둔다.

- `/api/auth/me` 401: Header의 선택적 세션 확인 실패로 보고 `{ user: null }`로 처리한다.
- 보호 기능 API 401: 보호 화면에 들어온 뒤 발생한 인증 실패이므로 세션 만료 또는 유효하지 않은 세션으로 본다.

보호 기능 API의 401은 `parseApiError`에서 `AuthRequiredError`로 변환한다. 화면마다 401 분기를 직접 만들지 않고, `(commerce-auth)` route group의 `AuthRequiredModalBoundary`에서 한 번만 처리한다.

세션이 만료되면 현재 화면은 유지하고 모달로 다음 행동을 알려준다. 모달의 로그인하기 링크는 현재 경로를 `redirectTo`에 담아 로그인 후 원래 경로로 돌아올 수 있게 한다.

## 로그아웃 정책

로그아웃에 성공하면 세션 query cache를 `{ user: null }`로 갱신해 Header의 로그인 상태를 바로 바꾼다.

장바구니와 위시리스트는 로그아웃해도 지우지 않는다. 현재 구현에서 두 상태는 계정에 묶인 서버 데이터가 아니라 브라우저에 저장되는 로컬 상태다. 비로그인 사용자도 상품을 담거나 찜할 수 있으므로, 로그아웃이 로컬 장바구니와 위시리스트를 삭제하는 것은 더 큰 데이터 손실로 판단했다.

나중에 장바구니나 위시리스트가 서버 계정 데이터로 바뀌면 이 정책도 바뀐다. 그때는 로그아웃 시 React Query cache와 계정 기반 store를 함께 정리해야 한다.

## 2단계 이벤트 스키마

### 이벤트 이름 규칙

이벤트 이름은 시드 로그(`fixtures/events-30d.jsonl`)와 맞춰 `snake_case`를 사용한다. 이미 시드 로그에 있는 이벤트는 이름을 새로 만들지 않고 그대로 쓴다.

이름은 나중에 집계할 행동 단위로 정한다. 모든 클릭을 `button_click`으로 묶지 않고, 상품 목록 진입, 장바구니 담기, 로그인 성공, 주문 완료처럼 분석할 수 있는 단위로 나눈다.

### 공통 프로퍼티

모든 이벤트에는 `setCommonProperties()`로 공통 값을 붙인다.

| property    | 설명                               |
| ----------- | ---------------------------------- |
| `sessionId` | 브라우저 기준 익명 세션 식별자     |
| `device`    | `mobile`, `tablet`, `desktop`      |
| `path`      | 이벤트가 발생한 현재 경로          |
| `ts`        | 이벤트 발생 시각의 ISO 8601 문자열 |

`userId`는 공통 프로퍼티에 넣지 않는다. 로그인 성공 시 `identify(user.id)`로 사용자 식별을 시작하고, 로그아웃 성공 시 `reset()`으로 식별 상태를 끊는다.

### 시드 로그 매핑

시드 로그와 이름이 같은 이벤트는 그대로 사용한다. 현재 앱에 없는 상품 상세 화면만 제외한다.

| 요구사항        | 시드 로그 이름           | 우리 앱 계측 여부 | 이벤트 props                                     |
| --------------- | ------------------------ | ----------------- | ------------------------------------------------ |
| 목록 진입       | `product_list_view`      | 계측              | `q`, `category`, `sort`, `page`                  |
| 상세 진입       | `product_detail_view`    | 제외              | 상품 상세 페이지가 없음                          |
| 담기            | `cart_add`               | 계측              | `productId`, `quantity`                          |
| 위시리스트 추가 | `wishlist_add`           | 계측              | `productId`                                      |
| 카테고리 변경   | `category_filter_change` | 계측              | `category`                                       |
| 정렬 변경       | `sort_change`            | 계측              | `sort`                                           |
| 페이지 변경     | `page_change`            | 계측              | `page`                                           |
| 로그인 시작     | `login_start`            | 계측              | `redirectTo`                                     |
| 로그인 성공     | `login_success`          | 계측              | `redirectTo`                                     |
| 로그인 실패     | `login_fail`             | 계측              | `reason`                                         |
| 주문 시작       | `order_start`            | 계측              | `items`, `itemCount`, `totalQuantity`            |
| 주문 완료       | `order_complete`         | 계측              | `orderId`, `items`, `itemCount`, `totalQuantity` |

시드 로그의 주문 이벤트는 단일 상품 주문 기준이라 `productId`를 사용한다. 현재 앱은 여러 상품을 선택해 주문할 수 있으므로 `items: [{ productId, quantity }]` 형태로 상품과 수량을 함께 남긴다. `itemCount`와 `totalQuantity`는 주문 규모를 빠르게 집계하기 위한 요약값이다.

주문 이벤트에는 금액을 넣지 않는다. 현재 주문 API 응답에는 금액이 없고, 클라이언트에서 상품 가격을 다시 계산해 넣으면 계측 설계가 주문 금액 계산 책임까지 갖게 된다. 이번 단계에서는 주문 흐름과 수량을 세는 데 필요한 값만 남긴다.

### 계측 호출 위치

계측 코드는 화면 로직에 직접 흩뿌리지 않는다. `src/analytics/commerceEvents.ts`에 이벤트별 얇은 함수를 두고, 화면에서는 그 함수를 호출한다.

`commerceEvents.ts`는 이벤트 이름과 payload 계약만 안다. `_pages`, `entities`, store, query를 import하지 않는다. 필요한 값은 호출하는 쪽에서 계산해 넘긴다.

컴포넌트는 `track()`을 직접 호출하지 않고 `trackCartAdd`, `trackLoginSuccess`처럼 의도가 드러나는 함수를 호출한다. 이벤트 이름 문자열과 payload 구조를 한 파일에 모아, 화면 로직이 분석 스키마 변경에 직접 흔들리지 않게 한다.

| 이벤트                   | 호출 위치                        |
| ------------------------ | -------------------------------- |
| `product_list_view`      | 상품 목록 client 진입 effect     |
| `category_filter_change` | 카테고리 변경 handler            |
| `sort_change`            | 정렬 변경 handler                |
| `page_change`            | 페이지 변경 handler              |
| `cart_add`               | 상품 카드 담기 action 직후       |
| `wishlist_add`           | 상품 카드 위시리스트 action 직후 |
| `login_start`            | 로그인 페이지 진입 effect        |
| `login_success`          | 로그인 mutation 성공             |
| `login_fail`             | 로그인 mutation 실패             |
| `order_start`            | 주문서 페이지 진입 effect        |
| `order_complete`         | 주문 생성 mutation 성공          |

### 초기화와 식별

`initAnalytics()`는 앱 최상단 client provider에서 한 번 호출한다. 이 위치에서 초기화하면 페이지 진입 직후 발생하는 이벤트도 queue에 쌓였다가 provider 초기화 뒤 순서대로 전송된다.

`setCommonProperties()`도 같은 provider에서 설정한다. `sessionId`, `device`, `path`, `ts`는 이벤트 발생 시점마다 평가한다.

로그인 성공 시점에는 `identify(user.id)`를 호출한다. 로그아웃 성공 시점에는 `reset()`을 호출한다. 이렇게 해야 로그인 전 익명 행동과 로그인 후 사용자 행동을 연결하고, 로그아웃 뒤 다음 행동이 이전 사용자에게 붙지 않는다.

### 예상 이벤트 순서

로그인부터 주문까지 한 번 통과하면 이벤트는 다음 순서로 남는다.

1. `/login` 진입: `login_start`
2. 로그인 성공: `identify(user.id)` → `login_success`
3. 상품 목록 진입: `product_list_view`
4. 상품 담기: `cart_add`
5. 주문서 진입: `order_start`
6. 주문 완료: `order_complete`
7. 로그아웃 성공: `reset()`

## 검증 방식

보호 경로 동작은 production build 위에서 확인한다. 빌드가 통과하는 것과 `pnpm start`로 띄운 앱의 proxy, cookie, redirect 동작이 맞는 것은 다른 문제이기 때문이다.

현재 E2E는 Playwright `webServer`가 `pnpm start`로 앱을 띄운 상태에서 실행한다.

- 미로그인으로 `/order`, `/orders`에 들어가면 `/login?redirectTo=...`로 이동한다.
- 로그인 후 원래 보호 경로로 돌아온다.
- JavaScript를 꺼도 보호 route group의 Header 초기 HTML에 사용자 이름이 보인다.
- 세션이 만료되거나 유효하지 않으면 현재 화면을 유지하고 세션 만료 모달을 보여준다.

정적 렌더링 범위는 `pnpm build`의 route 목록으로 확인한다. `/order`, `/orders`는 세션을 읽기 때문에 dynamic이고, `/cart`, `/wishlist`는 공통 commerce layout에서 쿠키를 읽지 않으므로 static 범위를 유지한다.
