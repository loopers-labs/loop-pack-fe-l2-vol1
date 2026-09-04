# 9주차 2단계 이벤트 계측 설계

## 1. 목표와 범위

기존 `src/analytics/` 로거와 `consoleProvider`를 사용해 로그인부터 주문까지의 최소 필수 행동을 계측한다. 실제 외부 분석 SDK나 새로운 의존성은 추가하지 않는다.

계측할 이벤트는 다음 일곱 개다.

- `product_list_view`
- `cart_add`
- `login_start`
- `login_success`
- `login_fail`
- `order_start`
- `order_complete`

현재 앱에는 상품 상세 화면이 없으므로 필수 목록의 `product_detail_view`는 구현하지 않는다. 시드 로그에는 있지만 과제의 최소 필수 행동이 아닌 `category_filter_change`, `sort_change`, `page_change`, `wishlist_add`, `client_error`도 이번 단계에서는 구현하지 않는다. 이 제외 사실과 이유는 3단계 RFC의 이벤트 스키마 절에 기록한다.

## 2. 이벤트 이름과 발생 시점

이벤트 이름은 시드 로그의 snake_case 이름을 그대로 사용한다.

| 이벤트 | 발생 시점 | 이벤트 프로퍼티 |
| --- | --- | --- |
| `product_list_view` | 현재 URL 조건의 상품 목록 화면에 진입했을 때 | `category`, `sort`, `page` |
| `cart_add` | 상품이 장바구니에 없던 상태에서 담긴 직후 | `productId`, `quantity: 1` |
| `login_start` | 로그인 화면에 진입했을 때 | `from` |
| `login_success` | 로그인 API 성공 응답을 받은 뒤 | `from` |
| `login_fail` | 로그인 API가 실패한 뒤 | `reason`, `status` |
| `order_start` | 유효한 장바구니로 주문 요청을 보내기 직전 | `productIds`, `itemCount` |
| `order_complete` | 주문 API 성공 응답을 받은 뒤 | `orderId`, `productIds`, `itemCount` |

목록 진입 이벤트는 같은 URL 조건을 한 번의 화면 진입으로 본다. 데이터 갱신이나 React 재렌더만으로 중복 전송하지 않는다. URL의 category, sort, page가 바뀌어 새 목록 조건으로 진입하면 새 이벤트로 기록한다.

`login_start`와 `login_success`의 `from`은 안전하게 정규화한 내부 복귀 경로를 기준으로 다음처럼 기록한다.

- `/checkout` 계열: `cart`
- `/orders` 계열: `orders`
- 그 외 또는 복귀 경로 없음: `direct`

`login_fail.reason`은 개인정보나 서버 원문을 넣지 않고 다음 값으로 정규화한다.

- 400: `INVALID_REQUEST`
- 401: `INVALID_CREDENTIALS`
- 500 이상: `SERVER_ERROR`
- 그 밖의 오류: `UNKNOWN`

## 3. 공통 프로퍼티

모든 `track()` 이벤트에는 `setCommonProperties()`를 통해 다음 값을 붙인다.

| 프로퍼티 | 생성 규칙 |
| --- | --- |
| `sessionId` | 탭의 `sessionStorage`에 `loopers.analytics.session-id` 키로 생성·유지 |
| `ts` | 이벤트 발생 시점의 ISO 8601 UTC 문자열 |
| `device` | viewport 폭 `<768`: `mobile`, `<1024`: `tablet`, 나머지 `desktop` |

`sessionStorage`를 사용하므로 같은 탭에서 로그인부터 주문까지 하나의 분석 세션으로 묶이고, 탭을 닫으면 새 분석 세션이 시작된다. 브라우저 API를 사용할 수 없는 환경에서는 예외를 던지지 않는 안전한 기본값을 사용한다.

로그인 사용자는 공통 프로퍼티의 `userId`로 중복 저장하지 않는다. 로그인 성공 후 `identify(userId)`를 호출해 이후 이벤트를 사용자와 연결하고, 로그아웃 성공 후 `reset()`을 호출해 연결을 끊는다.

## 4. 시드 로그 매핑

이벤트 이름은 시드 로그와 동일하다. 다만 현재 앱의 데이터 구조 차이 때문에 주문 프로퍼티는 다음처럼 매핑한다.

| 시드 로그 | 현재 앱 | 이유 |
| --- | --- | --- |
| `order_start.productId` | `order_start.productIds`, `itemCount` | 현재 장바구니는 여러 상품을 한 주문으로 보낼 수 있음 |
| `order_complete.productId` | `order_complete.productIds`, `itemCount` | 완료 이벤트도 주문 요청의 전체 상품을 나타냄 |
| `order_complete.totalPrice` | 미수집 | 제공 주문 API 응답에 금액이 없으며 임의 계산하지 않음 |

`cart_add.quantity`는 현재 수량 기능이 없으므로 항상 `1`이다.

## 5. 코드 경계와 초기화

`src/analytics/events.ts`가 UI와 범용 logger 사이의 타입 있는 계측 경계를 맡는다. 화면 컴포넌트는 raw 이벤트 이름으로 `track()`을 직접 호출하지 않고 다음 의미 기반 함수를 사용한다.

```text
trackProductListView()
trackCartAdd()
trackLoginStart()
trackLoginSuccess()
trackLoginFail()
trackOrderStart()
trackOrderComplete()
identifyUser()
resetUser()
```

이 경계가 이벤트 이름과 프로퍼티 변환을 소유한다. 기존 `logger.ts`는 큐, 공통 프로퍼티 병합, provider 오류 격리만 계속 담당한다.

루트 `Providers` 안에 작은 `AnalyticsInitializer`를 둔다. 이 컴포넌트는 `consoleProvider`를 등록하고 공통 프로퍼티 getter를 설정한 뒤 `initAnalytics()`를 한 번 호출한다. 초기화보다 먼저 발생한 이벤트는 기존 큐에 남았다가 순서대로 전송되어야 한다.

초기화 경쟁으로 공통 프로퍼티가 빠지지 않도록 typed event 경계도 client analytics 설정을 멱등하게 보장한다. 앱 루트 초기화와 먼저 발생한 화면 이벤트 중 어느 쪽이 앞서도 같은 provider와 공통 프로퍼티 설정을 사용한다.

의존 방향은 화면·feature에서 `src/analytics`를 향한다. `src/analytics`는 feature나 widget을 import하지 않는다.

## 6. 인증과 주문 호출 순서

로그인 성공 흐름은 다음 순서다.

```text
login_start
로그인 요청
login_success
identify(userId)
private 상태 정리
안전한 복귀 경로 이동 및 서버 UI 갱신
```

로그인 실패 흐름은 `login_start → 로그인 요청 → login_fail`이며 `identify()`와 이동·refresh를 호출하지 않는다. 동기 이중 제출은 하나의 요청과 하나의 결과 이벤트만 만든다. 화면 이탈로 취소된 요청은 성공·실패 이벤트와 후속 이동을 만들지 않는다.

로그아웃은 API가 성공한 뒤 `reset()`을 호출한다. 실패한 로그아웃에서는 사용자 연결과 기존 클라이언트 상태를 유지한다. 최소 이벤트 목록에 없는 `logout_success`는 추가하지 않는다.

주문 흐름은 다음 순서다.

```text
order_start
주문 요청
order_complete
제출한 장바구니 항목 정리
/orders 이동
```

빈 장바구니, 중복 제출, 실패·취소 요청은 `order_complete`를 만들지 않는다. `order_start`는 실제 네트워크 주문 요청 하나와 일대일 대응한다.

## 7. 검증

자동화 검증은 다음을 포함한다.

- 공통 프로퍼티의 세션 유지, 시각, device 분류
- 초기화 전 큐 이벤트의 공통 프로퍼티와 순서 보존
- typed event 함수의 정확한 이벤트 이름과 프로퍼티
- 같은 URL 조건에서 목록 진입 이벤트 중복 방지
- 장바구니 추가에서만 `cart_add` 전송
- 로그인 시작·성공·실패와 `identify()` 순서
- 로그인 중복 제출과 이탈·취소에서 중복 또는 늦은 결과 이벤트 방지
- 주문 요청·성공과 실패·취소 분기
- 성공한 로그아웃에서만 `reset()` 호출
- `consoleProvider`가 브라우저 관찰용 버퍼에 이벤트를 순서대로 남김
- 변경 파일 ESLint·Prettier, 전체 Vitest, TypeScript 검사

각 구현 Task가 끝나면 일반 리뷰와 적대적 리뷰를 차례로 진행하고 발견 사항을 수정·재검증한다.

## 8. 3단계 RFC로 넘길 내용

3단계에서 `docs/rfc/week09-e2e-scope.md`를 만들 때 이 문서의 이벤트 표, 공통 프로퍼티, 시드 매핑, 제외 이벤트를 A절에 옮긴다. RFC는 E2E 코드보다 먼저 별도 커밋한다.
