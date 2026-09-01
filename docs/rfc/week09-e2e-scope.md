# 9주차 E2E 범위 RFC

## A. 이벤트 스키마

### 이름 규칙

시드 로그(`fixtures/events-30d.jsonl`)의 스키마를 따른다.

- `{대상}_{일어난 일}` 형태의 snake_case. 대상은 화면·컨트롤·도메인 객체·플로우 등 그때그때 자연스러운 단위다.
- 이벤트 이름은 집계 단위, 세부 값은 props로 둔다. 카테고리 변경을 `category_living_click`이 아니라 `props.category`로 담는 방식이다. 이름이 너무 크면(`button_click`) 아무것도 셀 수 없고, 너무 잘게 나누면 전체를 세려고 이름을 다 알아야 한다.
- 새 이벤트는 집계할 질문이 생겼을 때만 추가한다.

### 공통 프로퍼티

모든 이벤트에 붙는 값은 이벤트의 내용이 아니라 맥락 — 어떤 이벤트든 잘라 볼 수 있는 집계 축이다.

| 키 | 형식 | 생성 |
| --- | --- | --- |
| `sessionId` | string | 탭 단위. `sessionStorage`의 `analytics_session_id`, 없으면 `crypto.randomUUID()`로 생성. 탭 복제·`window.open`에서는 저장값이 복사되어 세션이 이어질 수 있다 |
| `ts` | ISO 8601 string | 이벤트 발생 시점의 `new Date().toISOString()` |
| `device` | `mobile` \| `tablet` \| `desktop` | viewport 폭 기준: 768px 미만 mobile, 1024px 미만 tablet, 나머지 desktop |

- **이벤트에 `userId`가 없다.** 신원은 `identify()` 채널이 담당하고, 이벤트에 신원을 붙이는 것은 분석 도구(provider)의 일이다. 개발용 `consoleProvider`는 신원을 이벤트에 합치지 않으므로 이번 로그에서는 userId가 보이지 않는다. 시드의 userId는 실제 도구가 붙인 결과물이다.
- `identify`와 `reset`은 `window.__analytics`에 쌓이지 않고 콘솔로만 확인된다.
- **출력 형식**: 로거가 공통 프로퍼티를 이벤트별 props와 병합해 전달하므로, `window.__analytics`에서는 공통값도 `properties` 안에 들어간다. 시드 JSONL의 최상위 필드 구조와 다른 개발용 출력 형식이다.

### 계측 지점과 시드 매핑

| 이벤트 | 발생 시점 | props | 시드 대비 |
| --- | --- | --- | --- |
| `product_list_view` | 목록 화면 진입 | `{ category: CategoryId \| 'all'; sort: ProductSort; page: number }` | 동일 |
| `cart_add` | 장바구니에 상품 추가(해제는 계측 안 함) | `{ productId: string; quantity: number }` | 동일 |
| `login_start` | 로그인 화면 진입 | `{ from: LoginFrom }` | 키 동일 · 값 확장 |
| `login_success` | 로그인 성공 | `{ from: LoginFrom }` | 키 동일 · 값 확장 |
| `login_fail` | 로그인 실패 | `{ reason: LoginFailReason }` | 키 동일 · 값 확장 |
| `order_start` | 주문서 진입 — draft가 처음 준비 완료된 시점에 1회 | `{ productIds: string[] }` | 변경 (다중 상품) |
| `order_complete` | 주문 생성 성공 | `{ orderId: string; productIds: string[]; totalPrice: number }` | 변경 (다중 상품 · orderId 추가) |

**제외** — `product_detail_view`: 이 앱에는 상품 상세 화면이 없다. 없는 화면의 이벤트는 계측하지 않고, 그 경로는 E2E 후보에서도 자연히 빠진다.

**주문 props 변경 사유** — 시드는 단일 상품 주문이라 `productId` 하나로 충분하지만, 이 앱은 여러 상품을 한 주문으로 처리한다. 상품마다 이벤트를 쪼개 보내면 이벤트 수가 주문 수와 어긋나 집계가 부푼다. 시드가 지키는 집계 단위(이벤트 1건 = 그 시점의 주문 전체)를 보존하고 props만 `productIds` 배열로 바꾼다. `orderId`와 `productIds`는 응답의 `order`에서 가져오고(orderId는 완료 이벤트의 중복 구분용), `totalPrice`는 주문 응답에 금액이 없어 제출한 주문서의 계산값을 쓴다. 총수량 분석은 범위에 없어 `quantity` 합계나 `itemCount`는 수집하지 않는다.

**값 확장 사유** — 시드의 `from`은 `cart`만, `reason`은 `INVALID_CREDENTIALS`만 관측된다. 이 앱은 `from`을 `cart | my | orders | direct`(로그인 화면에 들어온 출처), `reason`을 `INVALID_CREDENTIALS | INVALID_REQUEST | SERVER_ERROR | UNKNOWN`(HTTP status 기반 분류)으로 정의한다. 키와 의미는 시드와 같고 값의 범위만 넓어진다.

**생성 규칙** — `from`은 로그인 URL의 `from` 파라미터만 검증해 쓰고, `next`(로그인 뒤 목적지)는 쓰지 않는다. `cart | my | orders` 밖의 값이나 파라미터 없음은 `direct`다. `reason`은 HTTP status로 분류한다: 401은 `INVALID_CREDENTIALS`, 400은 `INVALID_REQUEST`, 500은 `SERVER_ERROR`, 그 밖은 `UNKNOWN`. 메시지 문자열과 사용자 입력값은 수집하지 않는다.

### 대표 시퀀스

문서만 읽고 이벤트 순서를 예측할 수 있어야 한다. 아래가 그 기준이다.

- **해피패스**: `product_list_view` → `cart_add` → (미로그인 주문 진입) → `login_start` → `identify` → `login_success` → `order_start` → `order_complete`
- **로그인 실패 후 재시도**: `login_start` → `login_fail` → `identify` → `login_success`
- **로그인 상태 재방문**: `identify` → `product_list_view` → …

## B. 시드 로그 분석

3단계에서 작성한다.

## C. 붙일 곳과 안 붙일 곳

3단계에서 작성한다.
