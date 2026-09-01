# 9주차 2단계 — 이벤트 계측 스펙

## 목표

스타터 로거(`src/analytics/`) 위에 이벤트 계측을 설계·구현한다.

1. 목록 진입 · 담기 · 로그인 시작/성공/실패 · 주문 시작/완료를 계측한다. 상세 화면은 없으므로 `product_detail_view`는 제외한다.
2. 로그인 · 로그아웃 · 세션 만료 · 로그인 상태 방문에 `identify()`와 `reset()`을 연결한다.
3. `setCommonProperties`는 첫 `track`보다 먼저, `registerProviders`는 `initAnalytics`보다 먼저 실행한다.
4. `docs/rfc/week09-e2e-scope.md`를 만들고 A절에 이름 규칙 · 공통 프로퍼티 · 시드 매핑 · 예상 시퀀스를 작성한다.

## 비범위

- 실제 분석 도구 연동(`consoleProvider`로 충분)
- 로거(`src/analytics/` 기존 파일) 수정·재구현
- 3단계 작업(RFC B·C절, 시드 로그 분석)
- E2E, 신규 이벤트(`cart_view` 등), 필터·정렬 변경 계측
- 오류 관측 도구(Sentry 등) 연동

## 확정 목표

- 이름은 시드 스키마에 맞춰 `{대상}_{일어난 일}` 형태의 snake_case로 짓는다. 이벤트 이름은 집계 단위로, 세부 값은 props로 둔다.
- 공통 프로퍼티에는 이벤트 내용이 아니라 모든 이벤트를 나눠 볼 수 있는 맥락을 담는다.
- 문서만 읽어도 로그인부터 주문까지 남는 이벤트와 순서를 알 수 있어야 한다.

## 조사 결과

- **상품 상세 화면이 없다.** 라우트는 `/` · `/products` · `/cart` · `/login` · `/my` · `/orders` · `/orders/new`뿐이다. 과제에서 허용하는 제외 사례다.
- **`ProductsPage`와 `LoginPage`는 서버 컴포넌트다.** 진입 이벤트는 데이터를 가진 클라이언트 자식에 둬야 한다. `ProductList`는 category · sort · page를 가지고 있고 `LoginForm`과 함께 `use client`를 사용한다.
- `CartToggleButton`은 추가와 해제를 함께 처리하는 토글이다.
- `OrderNewPage`는 마운트 직후 draft를 복원 중이라 상품 props를 알 수 없다. `useOrderDraft`가 `ready`가 되어야 productIds와 totalPrice를 얻는다.
- 주문 완료 지점은 `OrderForm`의 `createOrder` mutation `onSuccess`다. 응답에서 `order.id`도 얻을 수 있다.
- **루트 `Providers`는 커머스 레이아웃의 `SessionProvider` 바깥에 있다.** 따라서 `Providers`에서는 세션을 읽을 수 없다.
- **세션 만료는 `(commerce)/error.tsx`에서 처리한다.** 401이면 `clearUser()`를 호출한 뒤 로그인 화면으로 보낸다. 명시적 로그아웃 외에도 인증 정보가 사라지는 지점이다.
- `ApiError`에는 `status`만 있고 서버 응답에는 `errorCode`가 없다. 시드 로그는 실패 이유를 `props.reason`에 담는다.

## 결정 사항

- **D1 계측 경계: 타입이 있는 이벤트 함수 한 겹을 둔다.** `src/analytics/events.ts`에 아래 props 표를 유니온 타입으로 정의하고 `trackEvent()`로만 계측한다. 스키마를 컴파일러가 검사하고 RFC A절과 코드의 계약을 맞추기 쉽다(컨벤션 6).
- **D2 공통 프로퍼티는 `sessionId` · `ts` · `device`다.** `ts`는 `new Date().toISOString()`으로 만들고 `device`는 `'mobile' | 'tablet' | 'desktop'` 유니온으로 제한한다. `userId`는 `identify`가 담당하므로 공통 프로퍼티에서 뺀다. `consoleProvider`는 신원을 이벤트에 합치지 않으므로 RFC에 userId가 보이지 않는 이유도 적는다. 로거는 공통 프로퍼티를 이벤트별 props와 병합해 전달하므로, `window.__analytics`에서는 공통값도 `properties` 안에 들어간다 — 시드 JSONL의 최상위 필드 구조와 다른 개발용 출력 형식이며 RFC에 함께 적는다.
- **D3 sessionId는 탭 단위로 유지한다.** 첫 `track`에서 `sessionStorage`의 `analytics_session_id`를 읽고 없으면 `crypto.randomUUID()`로 만든다. 탭 복제나 `window.open`에서는 저장값이 복사될 수 있다. 이번 범위에서는 이 제약을 받아들인다.
- **D4 device는 viewport 폭으로 나눈다.** mobile은 768px 미만, tablet은 1024px 미만, 나머지는 desktop이다. 시드의 세 분류를 재현하기 위한 기준이며 이벤트가 발생할 때 계산한다. 경계값은 단위 테스트로 고정한다.
- **D5 부트스트랩은 `events.ts`의 lazy 셋업과 `CommerceAnalytics` 하나로 구성한다.** `registerProviders`와 `setCommonProperties`는 `events.ts` 안에서 첫 계측 호출(`trackEvent` · `startAnalytics`) 직전에 lazy로 한 번 실행한다. 모든 track이 `trackEvent`를 거치므로 "setCommonProperties < 첫 track"이 호출 경로로 보장되고, 서버 컴포넌트가 순수 헬퍼만 import할 때는 부수효과가 없다. `initAnalytics()`는 커머스 레이아웃에 두는 `CommerceAnalytics`(클라이언트)의 effect에서 호출하되, logger를 직접 import하지 않고 `events.ts`의 `startAnalytics()`를 쓴다 — 이 함수가 `ensureAnalyticsSetup()`을 먼저 호출해 register → init 순서를 함수 안에서 보장한다. 계측 지점이 전부 (commerce) 안이므로 루트 `Providers`는 수정하지 않는다. (commerce) 밖에서 계측하게 되면 그때 위로 올린다.
- **D6 현재 인증 흐름에서 클라이언트가 관찰하는 신원 전환 지점을 모두 처리한다.** (proxy가 만료 쿠키를 먼저 차단하는 경로는 클라이언트에 신원이 세워진 적이 없어 대상이 아니다.)
  - 로그인 상태 방문: 커머스 레이아웃이 `initialUser?.id`를 props로 `CommerceAnalytics`에 전달하고, `CommerceAnalytics`가 커머스 콘텐츠를 감싼다. `initialUserId`가 있으면 `useLayoutEffect`에서 `identify()`한다. 동일한 커밋에서는 `identify()`가 페이지뷰의 `useEffect`보다 먼저 호출되고, 페이지가 이후 커밋에서 마운트되면 `identify()`가 이미 호출된 상태다. 초기화 전 호출도 로거 큐에 순서대로 쌓이므로, 두 경우 모두 provider에는 `identify`가 최초 페이지뷰보다 먼저 전달된다.
  - 로그인 성공: `LoginForm`의 `onSuccess`에서 `identify(user.id)`를 호출한 뒤 `login_success`를 보낸다.
  - 로그아웃: `LogoutButton`의 `onSuccess`에서 `reset()`한다.
  - 세션 만료: `(commerce)/error.tsx`가 `clearUser()`하는 만료 분기에서 `reset()`한다.
- **D7 `cart_add`는 상품이 추가될 때만 보낸다.** 해제할 때는 보내지 않는다. 토글로 새로 담는 수량은 항상 1이므로 props는 `{ productId, quantity: 1 }`이다.
- **D8 상세 화면이 없으므로 `product_detail_view`는 제외한다.** 제외 사실은 RFC A절에 적는다.
- **D9 신규 이벤트는 추가하지 않는다.** 이벤트는 집계할 질문이 생겼을 때만 추가한다. 이벤트 이름은 모두 시드와 같고 주문 props만 D12처럼 바꾼다.
- **D10 페이지뷰는 마운트 시 useEffect로 보낸다.** `product_list_view`는 진입 당시 nuqs 값을 가진 `ProductList`에서, `login_start`는 `LoginForm`에서 보낸다. 화면을 나갔다 돌아오면 새로 마운트되므로 다시 기록된다.
- **D11 `login_fail`은 로그인 퍼널의 실패 결과를 기록한다.** 원인 진단용 오류 로그가 아니라 로그인에서 막힌 비율을 세는 이벤트다. `props.reason`은 `ApiError.status`로 분류한다 — 401은 `INVALID_CREDENTIALS`, 400은 `INVALID_REQUEST`, 500은 `SERVER_ERROR`, 그 밖의 오류는 `UNKNOWN`. 메시지 문자열과 사용자 입력값은 수집하지 않는다(컨벤션 5). 400·500·예상하지 못한 오류의 예외·스택 수집은 오류 관측 도구의 영역이다.
- **D12 주문 이벤트는 상품별로 나누지 않고, 각 계측 시점의 주문 전체를 이벤트 한 건으로 표현한다.** 시드는 단일 상품 주문이라 `productId` 하나만 담지만, 앱은 여러 상품을 한 주문으로 처리한다. 상품마다 이벤트를 보내면 주문 관련 이벤트 수가 부풀고, 첫 상품만 보내면 실제 주문 내용이 누락되므로 `productIds` 배열을 쓴다.
  - `order_start`: 주문서에서 `useOrderDraft`가 처음 `ready`가 되면 `{ productIds }`를 한 번 보낸다. 주문서 진입 이벤트이므로 나갔다 다시 들어오면 다시 기록된다.
  - `order_complete`: `createOrder`가 성공하면 `{ orderId, productIds, totalPrice }`를 한 번 보낸다. `orderId`와 `productIds`는 응답의 `order`에서, `totalPrice`는 주문 응답에 금액이 없으므로 제출한 주문서의 계산값에서 가져온다. `orderId`로 완료 이벤트의 중복을 구분할 수 있다.
  - `productIds`는 주문에 포함된 상품 종류를 나타낸다. 총수량 분석은 이번 범위에 없으므로 `quantity`와 `itemCount`는 수집하지 않는다.
  - RFC 매핑 표에는 이벤트의 집계 단위는 유지하고 props만 다중 상품 모델에 맞춘 이유를 적는다.
- **D13 `from`은 로그인 화면에 들어온 출처다.** `next`는 로그인 뒤 목적지이므로 `from` 계산에 쓰지 않는다. `LoginFrom`은 `'cart' | 'my' | 'orders' | 'direct'`로 제한한다. 장바구니 로그인 CTA는 `cart`, 마이페이지 CTA는 `my`, 주문 보호 경로와 주문 화면의 세션 만료는 `orders`를 로그인 URL에 함께 싣는다. `/login` 직접 진입이나 알 수 없는 값은 `direct`로 처리한다. `LoginForm`은 검증한 같은 값을 `login_start`와 `login_success`에 쓴다.

### 이벤트 props 표 (RFC A절에 수록)

| 이벤트              | props                                                                | 시드 대비                         |
| ------------------- | -------------------------------------------------------------------- | --------------------------------- |
| `product_list_view` | `{ category: CategoryId \| 'all'; sort: ProductSort; page: number }` | 동일                              |
| `cart_add`          | `{ productId: string; quantity: number }`                            | 동일                              |
| `login_start`       | `{ from: LoginFrom }`                                                | 키 동일 · 값 확장(D13)            |
| `login_success`     | `{ from: LoginFrom }`                                                | 키 동일 · 값 확장(D13)            |
| `login_fail`        | `{ reason: LoginFailReason }`                                        | 키 동일 · 값 확장(D11)            |
| `order_start`       | `{ productIds: string[] }`                                           | **변경** (다중 상품, D12)         |
| `order_complete`    | `{ orderId: string; productIds: string[]; totalPrice: number }`      | **변경** (다중 상품·orderId, D12) |

### 대표 시퀀스

- 해피패스: `product_list_view` → `cart_add` → 미로그인 주문 진입 → `login_start` → `identify` → `login_success` → `order_start` → `order_complete`
- 실패 분기: `login_start` → `login_fail` → `identify` → `login_success`
- 로그인 상태 재방문: `identify` → `product_list_view` → …
- `identify`와 `reset`은 `window.__analytics`에 쌓이지 않고 콘솔에서만 확인된다는 점도 RFC에 적는다.

## 완료 조건

- [ ] `docs/rfc/week09-e2e-scope.md` A절에 이름 규칙 · 공통 프로퍼티(형식 포함) · 매핑 표(주문 props 변경 이유 포함) · 위 대표 시퀀스가 있다
- [ ] `pnpm start`에서 대표 시퀀스 3종을 재현했을 때 7개 이벤트 유형이 각각 정해진 순서로 `window.__analytics`에서 확인된다
- [ ] 첫 화면 진입 이벤트를 포함한 **모든** track 이벤트에 sessionId · ts · device가 붙어 있다
- [ ] 로그인 성공 시 identify→login_success 순서, 로그아웃·세션 만료 시 reset, 로그인 상태 방문 시 첫 track 전 identify가 콘솔에서 확인된다
- [ ] 담기 해제 시 cart_add가 찍히지 않는다
- [ ] 정의에 없는 이벤트 이름·틀린 props는 컴파일 에러가 난다
- [ ] reason 매핑 · device 경계값(767/768, 1023/1024) · from 검증과 기본값 · sessionId 재사용이 단위 테스트로 고정된다
- [ ] `src/analytics/` 기존 파일(logger·provider·consoleProvider) 무수정
- [ ] `pnpm check` 통과

## 태스크

- T1: RFC 파일 생성, A절 작성 (props 표 · 매핑 · 대표 시퀀스 포함) — fulfills: 조건 1
- T2: `src/analytics/events.ts` — props 표의 유니온 타입 + `trackEvent()` + 계측 헬퍼(device · reason 매핑 · from 검증 · sessionId) — fulfills: 조건 6
- T3: 부트스트랩 배선 — `events.ts`의 lazy 셋업(첫 계측 호출 직전 1회) + 커머스 레이아웃에 `CommerceAnalytics`(startAnalytics + 초기 identify) 배치 — fulfills: 조건 3, 4
- T4: 7지점 계측(ProductList · CartToggleButton · LoginForm · OrderNew ready · OrderForm) + 로그인 출처 전달 + LoginForm identify · LogoutButton reset · error.tsx 만료 reset — fulfills: 조건 2, 4, 5
- T5: 헬퍼 단위 테스트(기존 Vitest 환경) — fulfills: 조건 7
- T6: `pnpm check` 통과 후 `pnpm start`로 대표 시퀀스 3종 재현, `window.__analytics`·콘솔을 RFC와 대조, 기존 logger.ts·provider.ts·consoleProvider.ts 무수정 확인 — fulfills: 조건 1, 2, 4, 8, 9
