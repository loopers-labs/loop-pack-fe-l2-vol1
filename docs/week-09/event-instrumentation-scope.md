# 9주차 2단계 — 이벤트 계측 범위와 구현 결정

이 문서는 2단계에서 계측할 화면과 행동, 이벤트 계약과 구현 위치를 확정한 기록이다.

## TL;DR

- 이번 계측은 GA4나 Datadog을 실제로 연동하는 작업이 아니라 사용자 행동 이벤트 스키마를 설계하는 작업이다.
- 상품 목록·장바구니·위시리스트·로그인·로그아웃·주문 흐름을 계측하고, 상품 상세 진입은 화면이 없어 제외한다.
- 로그인 유도부터 주문 완료까지는 `flow_id`로 연결하고, `entry_point`·`return_path`·`product_id`로 유입 경로와 상품을 구분한다.
- 모든 이벤트에는 `sessionId`·`device`·`ts`를 붙이고, 로그인 이후에는 `userId`를 선택적으로 붙인다. PC 전용 과제이므로 `device`는 `desktop`으로 고정한다.
- 분석 이벤트는 실제 상태 전환 경계에서 기록하며, 초기화·인증 식별·로그아웃 초기화 위치와 시드 로그 매핑을 문서에 고정한다.

## 목차

- [이벤트 이름 규칙](#이벤트-이름-규칙)
- [결정 계측군](#결정-계측군)
- [이벤트별 프로퍼티 결정](#이벤트별-프로퍼티-결정)
- [모든 이벤트에 붙일 공통 프로퍼티 결정](#모든-이벤트에-붙일-공통-프로퍼티-결정)
- [주문 흐름](#주문-흐름)
- [상품 상세 진입 제외 근거](#상품-상세-진입-제외-근거)
- [위시리스트 토글 계측](#위시리스트-토글-계측)
- [개발자 관점에서 유용한 계측](#개발자-관점에서-유용한-계측)
- [계측 구현 결정안](#계측-구현-결정안)
  - [`initAnalytics()` 호출 위치](#initanalytics-호출-위치)
  - [화면 컴포넌트에서 `track()`을 직접 호출할지 여부](#화면-컴포넌트에서-track을-직접-호출할지-여부)
  - [로그인 성공 시 `identify()`를 호출할 위치](#로그인-성공-시-identify를-호출할-위치)
  - [로그아웃 성공 시 `reset()`을 호출할 위치](#로그아웃-성공-시-reset을-호출할-위치)
  - [시드 로그 이벤트와 이름이 다를 경우의 매핑](#시드-로그-이벤트와-이름이-다를-경우의-매핑)
- [확정 기록](#확정-기록)

## 이벤트 이름 규칙

이벤트 이름은 참고 자료의 기준을 따라 `그룹/오브젝트_행동(동사)` 순서로 작성한다.

- 그룹 또는 오브젝트를 먼저 쓰고, 사용자의 행동을 동사로 뒤에 쓴다.
  - 예: `wishlist_add`, `order_complete`
- 단어 사이는 밑줄(`_`)로 연결하는 소문자 스네이크 케이스를 사용한다.
  - `wishlistAdd`, `Wishlist_Add`, `wishlist-add`는 사용하지 않는다.
- 사용자가 행동을 시작했는지, 실제로 완료했는지 구분할 수 있도록 시점을 드러내는 동사를
  사용한다.
  - 예: `view`, `start`, `add`, `remove`, `success`, `failure`, `complete`
- 구현 요소의 이름보다 분석하려는 행동을 우선한다. 예를 들어 주문 버튼을 눌렀다는
  사실보다 주문 요청을 시작했다는 의미가 중요하면 `button_click` 대신 `order_start`를
  사용한다.
- 같은 의미의 행동에는 화면이나 버튼 위치에 따라 다른 이름을 만들지 않는다. 세부 위치나
  변형 정보는 이벤트 프로퍼티로 구분한다.

현재 계측군에 규칙을 적용한 최종 이벤트명은 다음과 같다.

| 행동               | 최종 이벤트명            |
| ------------------ | ------------------------ |
| 상품 목록 진입     | `product_list_view`      |
| 카테고리 변경      | `category_filter_change` |
| 정렬 변경          | `sort_change`            |
| 페이지 변경        | `page_change`            |
| 상품 담기          | `cart_add`               |
| 장바구니 상품 삭제 | `cart_remove`            |
| 위시리스트 진입    | `wishlist_view`          |
| 위시리스트 추가    | `wishlist_add`           |
| 위시리스트 삭제    | `wishlist_remove`        |
| 로그인 시작        | `login_start`            |
| 로그인 성공        | `login_success`          |
| 로그인 실패        | `login_fail`             |
| 로그아웃           | `logout_complete`        |
| 주문 시작          | `order_start`            |
| 주문 완료          | `order_complete`         |

`상품 삭제`는 상품 자체를 삭제하는 의미가 아니라 장바구니에서 상품을 제거하는 행동이므로
`cart_remove`로 구분한다. `cart_add`만 기록할 때보다 담은 뒤 제거한 흐름을 확인할 수 있어
장바구니 이탈 원인을 분석하는 계측군으로 포함한다.

참고 자료: [GA4 이벤트 설계 이해하기: 이름과 매개변수를 정하는 규칙](https://kim-gpt.tistory.com/entry/ga4-event-design-naming)

위 자료는 이벤트 이름 규칙을 참고하기 위한 것이며, 이번 과제에서 GA4를 실제로 연동한다는
뜻은 아니다. 계측 대상은 특정 도구에 종속되지 않는 사용자 행동 이벤트로 설계한다.

## 결정 계측군

아래 행동을 2단계에서 계측하기로 결정한다. `상품 상세 진입`은 현재 화면과 이동 경로가 없어
계측군에서 제외한다.

| 대상               | 이벤트명                 | 페이지 추가 필요 여부 | 계측 시점                                                                                                           | 계측 여부 |
| ------------------ | ------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------- | --------- |
| 상품 목록 진입     | `product_list_view`      | 필요 없음             | 목록 조회가 성공해 상품 목록이 실제 표시된 시점                                                                     | 포함      |
| 카테고리 변경      | `category_filter_change` | 필요 없음             | 사용자가 카테고리 필터를 직접 변경한 시점                                                                           | 포함      |
| 정렬 변경          | `sort_change`            | 필요 없음             | 사용자가 정렬 조건을 직접 변경한 시점                                                                               | 포함      |
| 페이지 변경        | `page_change`            | 필요 없음             | 사용자가 페이지를 직접 변경한 시점                                                                                  | 포함      |
| 상품 상세 진입     | —                        | 필요 없음             | 현재 상세 화면과 이동 경로가 없어 계측하지 않음                                                                     | 제외      |
| 상품 담기          | `cart_add`               | 필요 없음             | `[담기]` 버튼으로 장바구니 store에 상품이 추가된 시점. 장바구니 화면의 수량 증가는 기록하지 않는다                  | 포함      |
| 장바구니 상품 삭제 | `cart_remove`            | 필요 없음             | 개별 `[삭제]` 또는 `[전체 비우기]`로 장바구니 store에서 상품이 제거된 시점. 전체 비우기는 담긴 항목 수만큼 기록한다 | 포함      |
| 위시리스트 진입    | `wishlist_view`          | 필요 없음             | 위시리스트 목록이 실제 표시된 시점, 페이지 진입당 한 번                                                             | 포함      |
| 위시리스트 추가    | `wishlist_add`           | 필요 없음             | `toggle` 전 상태가 미찜이면 상태 변경 직후                                                                          | 포함      |
| 위시리스트 삭제    | `wishlist_remove`        | 필요 없음             | `toggle` 전 상태가 찜이면 상태 변경 직후                                                                            | 포함      |
| 로그인 시작        | `login_start`            | 필요 없음             | 로그인 화면이 실제 표시된 시점                                                                                      | 포함      |
| 로그인 성공        | `login_success`          | 필요 없음             | 로그인 API가 성공 응답을 반환한 시점                                                                                | 포함      |
| 로그인 실패        | `login_fail`             | 필요 없음             | 로그인 API가 401 또는 400으로 실패한 시점                                                                           | 포함      |
| 로그아웃           | `logout_complete`        | 필요 없음             | 로그아웃 API가 성공한 시점에 `reset()` 호출                                                                         | 포함      |
| 주문 시작          | `order_start`            | 필요 없음             | `[주문하기]` 버튼으로 주문 요청을 시작한 시점                                                                       | 포함      |
| 주문 완료          | `order_complete`         | 필요 없음             | 주문 API 성공 후 이벤트를 기록하고 `/orders`로 이동                                                                 | 포함      |

`cart_remove`는 상품 자체를 삭제하는 이벤트가 아니라 장바구니에서 상품을 제거하는 행동이다.
`cart_add`와 함께 기록해 담은 뒤 제거한 흐름과 장바구니 이탈 원인을 확인한다.

## 이벤트별 프로퍼티 결정

로그인 유도부터 주문 완료까지의 흐름은 `flow_id`로 연결한다. `flow_id`는 로그인으로 유도한
행동에서 생성해 페이지 이동 뒤에도 전달하고, 주문 완료 또는 흐름 만료 후 폐기한다.

| 이벤트명                 | 프로퍼티                                                                | 호출 예시                                                                                                                |
| ------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `product_list_view`      | `page`, `category`, `sort`                                              | `track('product_list_view', { page: 1, category: 'living', sort: 'popular' })`                                           |
| `category_filter_change` | 변경한 `category`                                                       | `track('category_filter_change', { category: 'living' })`                                                                |
| `sort_change`            | 변경한 `sort`                                                           | `track('sort_change', { sort: 'popular' })`                                                                              |
| `page_change`            | 변경한 `page`                                                           | `track('page_change', { page: 2 })`                                                                                      |
| `cart_add`               | `product_id`, `quantity`                                                | `track('cart_add', { product_id: 'p1', quantity: 1 })`                                                                   |
| `cart_remove`            | `product_id`                                                            | `track('cart_remove', { product_id: 'p1' })`                                                                             |
| `wishlist_view`          | `entry_point`                                                           | `track('wishlist_view', { entry_point: 'mypage_wishlist' })`                                                             |
| `wishlist_add`           | `product_id`                                                            | `track('wishlist_add', { product_id: 'p1' })`                                                                            |
| `wishlist_remove`        | `product_id`                                                            | `track('wishlist_remove', { product_id: 'p1' })`                                                                         |
| `login_start`            | `flow_id`, `entry_point`, `return_path`, 상품 카드 유도 시 `product_id` | `track('login_start', { flow_id: 'f123', entry_point: 'product_wishlist', return_path: '/products', product_id: 'p1' })` |
| `login_success`          | 로그인 유도 흐름이면 `flow_id`                                          | `track('login_success', { flow_id: 'f123' })`                                                                            |
| `login_fail`             | 로그인 유도 흐름이면 `flow_id`                                          | `track('login_fail', { flow_id: 'f123' })`                                                                               |
| `logout_complete`        | 없음                                                                    | `track('logout_complete')`                                                                                               |
| `order_start`            | 로그인 유도 흐름이면 `flow_id`, 주문 대상 `product_ids`                 | `track('order_start', { flow_id: 'f123', product_ids: ['p1'] })`                                                         |
| `order_complete`         | 로그인 유도 흐름이면 `flow_id`, `order_id`, 주문 대상 `product_ids`     | `track('order_complete', { flow_id: 'f123', order_id: 'o1', product_ids: ['p1'] })`                                      |

`login_start`의 `entry_point`는 `header_wishlist`, `header_cart`, `header_login`,
`product_wishlist`, `product_cart`, `protected_route` 중 하나로 제한한다. `wishlist_view`의
`entry_point`는 `header_wishlist`, `mypage_wishlist`, `direct` 중 하나로 제한한다. 헤더와
마이페이지가 같은 `/wishlist`로 이동하므로 출발점 정보를 링크 이동 뒤까지 전달하고, 목록이
실제로 표시된 시점에 한 번 기록한다. `return_path`는 `toSafeReturnPath()`를 거친 내부 경로만
기록하고, `product_id`는 상품 카드에서 유도된 경우에만 포함한다.

## 모든 이벤트에 붙일 공통 프로퍼티 결정

시드 로그와 집계 호환성을 유지하기 위해 공통 프로퍼티 키는 기존 로그 이름을 따른다.

| 프로퍼티    | 필수 여부 | 의미                                          |
| ----------- | --------- | --------------------------------------------- |
| `sessionId` | 필수      | 브라우저 세션을 연결하는 식별자               |
| `device`    | 필수      | 현재 PC 전용 과제에서는 `desktop` 고정        |
| `ts`        | 필수      | 이벤트가 발생한 ISO 8601 UTC 시각             |
| `userId`    | 선택      | 로그인 이후 이벤트에만 포함되는 사용자 식별자 |

`flow_id`는 모든 이벤트에 무조건 붙는 값이 아니므로 공통 프로퍼티가 아니라 로그인·주문 퍼널의
이벤트별 프로퍼티로 관리한다. 이벤트명은 소문자 스네이크 케이스를 사용하지만, 공통 프로퍼티는
시드 로그의 `sessionId`·`userId` 키를 유지해 별도 이름 매핑을 만들지 않는다. 현재 과제는 PC
화면만 대상으로 하므로 viewport 분류 로직은 추가하지 않고 `device: 'desktop'`을 기록한다.

공통 프로퍼티는 `setCommonProperties()`로 등록하고, 각 `track()` 호출에는 이벤트별 프로퍼티만
전달한다. 아래 값은 호출 형태를 보여주기 위한 예시다.

```ts
setCommonProperties(() => ({
  sessionId: 's_0a3f',
  device: 'desktop',
  ts: new Date().toISOString(),
  // 로그인 상태일 때만 userId를 추가한다.
  // userId: 'u3',
}))

track('login_start', {
  flow_id: 'f123',
  entry_point: 'product_cart',
  return_path: '/products',
  product_id: 'p1',
})

track('login_success', { flow_id: 'f123' })
track('order_start', { flow_id: 'f123', product_ids: ['p1'] })
track('order_complete', {
  flow_id: 'f123',
  order_id: 'o1',
  product_ids: ['p1'],
})
```

이 흐름에서 `login_start`의 `flow_id`·`entry_point`·`return_path`·`product_id`가 이후
`login_success`와 주문 이벤트의 같은 `flow_id`로 이어진다. 로그인 실패 시에는
`login_fail`만 기록하고 `order_complete`는 기록하지 않는다.

## 주문 흐름

주문 완료 페이지를 별도로 만들지 않는 현재 흐름에서는 주문 성공 콜백 안에서 완료 이벤트를
기록한다.

```text
[주문하기] 클릭
  ↓
주문 시작 이벤트
  ↓
POST /api/orders
  ↓
201 성공 응답
  ↓
주문 완료 이벤트
  ↓
장바구니 비우기
  ↓
/orders 이동
```

주문 요청이 실패하면 주문 완료 이벤트는 기록하지 않는다.

## 상품 상세 진입 제외 근거

현재 앱에는 상품 상세 페이지와 목록에서 상세로 이동하는 경로가 없다. 따라서 상세 페이지를
이벤트 계측만을 위해 새로 만들지 않고, 2단계 계측 대상에서 제외한다. 3단계 RFC에서도 이
제외 사실을 명시한다.

## 위시리스트 토글 계측

위시리스트 UI 구현의 `toggle` action은 유지한다. 다만 분석 이벤트는 토글이라는 구현 동작이
아니라 상태 전이를 기록해야 하므로, 클릭 전 `isWishlisted` 값에 따라 이벤트를 나눈다.

```text
isWishlisted === false → wishlist_add
isWishlisted === true  → wishlist_remove
```

두 이벤트에는 같은 `product_id`를 넣어 위시리스트에 추가한 상품이 주문까지 이어졌는지 비교할
수 있게 한다. `wishlist_view`는 위시리스트 화면이 실제 목록을 표시한 시점에 페이지 진입당
한 번 기록하며, 렌더링마다 반복하지 않는다.

## 개발자 관점에서 유용한 계측

이번 과제의 사용자 행동 이벤트도 개발자에게는 핵심 흐름의 고장 지점을 찾는 자료가 된다.
이벤트 자체가 사용자 화면을 바꾸는 것은 아니지만, 반복되는 실패나 이탈을 확인해 다음과
같은 개선의 근거로 사용할 수 있다.

| 계측 지점                            | 개발자가 확인할 질문                               | 사용자 편의성으로 이어지는 개선     |
| ------------------------------------ | -------------------------------------------------- | ----------------------------------- |
| `login_start` → `login_success/fail` | 로그인 요청 중 어느 단계에서 막히는가?             | 오류 메시지와 재시도 흐름 개선      |
| `cart_add`                           | 담기 성공과 피드백이 일관되게 끝나는가?            | 담기 결과 안내와 장바구니 이동 개선 |
| `cart_remove`                        | 상품 삭제와 이후 장바구니 상태가 일치하는가?       | 삭제 피드백과 되돌리기 동선 개선    |
| `order_start` → `order_complete`     | 주문 요청이 시작된 뒤 완료되지 않는 구간이 있는가? | 중복 클릭 방지, 로딩·실패 복구 개선 |
| `wishlist_add/remove`                | 토글 전이와 실제 상태 변경이 일치하는가?           | 찜 상태 유지와 구매 연결 동선 개선  |

이벤트는 렌더링이 아니라 실제 상태 전환 경계에서 기록한다. 분석 전송이 화면 이동이나 주문
처리를 막아서는 안 되며, 중복 전송과 개인정보 수집을 피한다.

다음 기술 관측 항목은 실서비스에서 개발자에게 유용하지만, 이번 2단계 사용자 행동 계측의
필수 구현 범위에는 포함하지 않는다.

- 클라이언트 예외와 API 4xx·5xx 오류
- API 응답 시간, 네트워크 실패·취소, 주문 요청의 지연
- Web Vitals와 라우트 전환 성능

이 항목들은 Datadog APM/RUM 같은 기술 관측 도구의 영역으로 별도 설계한다. 사용자 행동
이벤트와 섞지 않고, 오류 코드·요청 경로·성능 측정값 같은 기술 메타데이터로 관리한다.

## 계측 구현 결정안

### `initAnalytics()` 호출 위치

`initAnalytics()`는 앱 전역 Client Provider 아래의 `AnalyticsInitializer`에서 한 번 호출한다.
`app/layout.tsx`가 모든 라우트를 `Providers`로 감싸고 있으므로 라우트마다 초기화하지 않는다.
초기화 전에 발생한 이벤트는 logger의 큐에 쌓였다가 초기화 완료 후 전송된다. 실제 분석 SDK는
붙이지 않고 멘토가 제공한 `consoleProvider`만 등록한다. 따라서 브라우저 콘솔과
`window.__analytics`에서 이벤트 이름과 프로퍼티를 확인할 수 있다.

```tsx
// _app/providers/Providers.tsx 또는 별도 AnalyticsInitializer
useEffect(() => {
  registerProviders([consoleProvider])

  setCommonProperties(getCommonEventProperties)

  void initAnalytics()
}, [])
```

`getCommonEventProperties`는 `sessionStorage`에 보관한 탭 단위 `sessionId`, PC 환경을 나타내는
`device: 'desktop'`, 이벤트 발생 시점의 `ts`, 로그인 상태일 때의 `userId`를 반환한다. 화면별로
provider를 등록하거나 `initAnalytics()`를 반복 호출하지 않는다.

### 화면 컴포넌트에서 `track()`을 직접 호출할지 여부

`track()`은 실제 상태 전환을 알고 있는 feature 또는 페이지 경계에서 직접 호출한다. 이벤트명과
`entry_point`처럼 값이 제한된 타입은 앱 이벤트 스키마에서 관리하고,
`src/analytics/logger.ts`는 provider 전송과 큐 처리만 담당하게 한다.

```ts
addToCart(product)
track('cart_add', {
  product_id: product.id,
  quantity: 1,
})
```

렌더링마다 기록하지 않고, 장바구니 store 변경·위시리스트 토글·API 성공 응답처럼 행동이 실제로
완료된 경계에서 호출한다. 분석 전송이 화면 이동이나 주문 처리를 막지 않게 한다.

### 로그인 성공 시 `identify()`를 호출할 위치

`useLogin` mutation의 `onSuccess`에서 API가 반환한 사용자 ID로 `identify()`를 호출한다. 이후
성공 이벤트를 기록하고, 세션 캐시를 갱신한 뒤 로그인 화면에서 복원 경로로 이동한다.

```ts
onSuccess: ({ user }) => {
  identify(user.id)
  track('login_success', { flow_id: flowId })

  queryClient.setQueryData(sessionQueries.me().queryKey, user)
  window.location.replace(returnPath)
}
```

`flowId`가 없는 직접 로그인이라면 `flow_id`를 생략한다. 로그인 실패에서는 `identify()`를 호출하지
않고 `login_fail`만 기록한다.

### 로그아웃 성공 시 `reset()`을 호출할 위치

`useLogout` mutation의 `onSuccess`에서 로그아웃 API가 성공한 뒤 `logout_complete`를 먼저
기록하고 `reset()`을 호출한 다음 홈으로 이동한다. 이벤트를 먼저 기록해야 로그아웃 직전의
`userId`가 포함된다. 요청이 실패했을 때는 실제 세션이 남아 있을 수 있으므로 둘 다 호출하지 않는다.

```ts
onSuccess: () => {
  track('logout_complete')
  reset()
  window.location.assign('/')
}
```

### 시드 로그 이벤트와 이름이 다를 경우의 매핑

시드 로그와 이름이 같은 이벤트는 그대로 사용해 3단계 집계 비용을 줄인다. 시드에 없는 앱 확장
이벤트, 발생 시점이 다른 이벤트, 시드에만 있는 이벤트는 매핑 표에 의미 차이를 남긴다.

| 앱 이벤트                | 시드 로그                 | 매핑 결정                                                              |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------- |
| `product_list_view`      | 같은 이름, 발생 범위 다름 | 시드는 목록 진입, 앱은 조건 변경을 포함해 조회 결과가 실제 표시된 시점 |
| `category_filter_change` | 동일                      | 사용자가 카테고리 필터를 직접 변경한 시점                              |
| `sort_change`            | 동일                      | 사용자가 정렬 조건을 직접 변경한 시점                                  |
| `page_change`            | 동일                      | 사용자가 페이지를 직접 변경한 시점                                     |
| `cart_add`               | 동일                      | 그대로 사용                                                            |
| `wishlist_add`           | 동일                      | 그대로 사용                                                            |
| `login_start`            | 동일                      | 로그인 화면이 실제 표시된 시점으로 기록                                |
| `login_success`          | 동일                      | 그대로 사용                                                            |
| `login_fail`             | 동일                      | 그대로 사용                                                            |
| `order_complete`         | 동일                      | 주문 API 성공 후 기록                                                  |
| `cart_remove`            | 없음                      | 장바구니 상품 삭제를 위한 앱 확장 이벤트                               |
| `wishlist_view`          | 없음                      | 위시리스트 진입 경로 분석을 위한 앱 확장 이벤트                        |
| `wishlist_remove`        | 없음                      | 위시리스트 토글 해제를 위한 앱 확장 이벤트                             |
| `logout_complete`        | 없음                      | 로그아웃 성공을 위한 앱 확장 이벤트                                    |
| `order_start`            | 같은 이름, 의미가 다름    | 시드의 주문서 진입을 현재 앱의 주문 요청 시작으로 매핑                 |
| `product_detail_view`    | 시드에만 존재             | 현재 상세 화면이 없어 계측하지 않음                                    |

`product_detail_view`는 화면 자체가 없어 시드에만 남는다. 목록 조건 변경 세 이벤트는 사용자가
직접 조작한 구매 의도와 조회 성공 결과를 구분하기 위해 시드와 같은 이름으로 계측한다.

### 3단계 집계 정의를 검토하며 뒤집은 것

**처음 정한 것**: 조건이 바뀌면 새 목록이 표시되므로 카테고리·정렬·페이지 변경을
`product_list_view` 하나에 흡수하고, 바뀐 조건은 프로퍼티로 구분했다.

**3단계에서 뒤집은 것**: 구매 의도를 보인 사용자가 다음 행동으로 넘어가지 않은 비율을 보려면
사용자의 직접 조작과 앞·뒤 이동·URL 복원을 구분해야 한다. 결과값인 `page`·`category`·`sort`만으로는
변경 원인을 알 수 없어, 직접 조작을 `category_filter_change`·`sort_change`·`page_change`로 나누고
조회 성공 결과는 `product_list_view`로 유지한다. 조건 변경 후 목록이 표시되지 않은 경우는 사용자
행동 이탈이 아니라 조회 실패·지연에 가까우므로 이번 행동 이탈률에서 제외한다.

## 확정 기록

| 항목             | 결정                                                         | 근거                                                                                               |
| ---------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| 2단계 계측군     | 상품 목록·담기·장바구니 삭제·위시리스트·인증·주문 계측       | 핵심 탐색·인증·구매 흐름과 장바구니 이탈을 함께 확인                                               |
| 상품 상세 진입   | 계측하지 않음                                                | 현재 상세 화면과 이동 경로가 없음                                                                  |
| 목록 조건 변경   | `category_filter_change`·`sort_change`·`page_change`로 분리  | 직접 조작을 앞·뒤 이동과 URL 복원에서 구분하고, 조회 성공 결과인 `product_list_view`와 연결해 본다 |
| 위시리스트 퍼널  | `wishlist_view`·`wishlist_add`·`wishlist_remove` 계측        | 토글 구현을 유지하면서 상태 전이를 구분해 구매 전환을 분석                                         |
| 위시리스트 유입  | `wishlist_view.entry_point`로 헤더·마이페이지·직접 진입 구분 | 두 진입점이 같은 `/wishlist` 경로를 사용함                                                         |
| 로그인-주문 연결 | `flow_id`·`entry_point`·`return_path`·`product_id` 활용      | 로그인 유도 행동부터 주문 완료까지 같은 흐름으로 연결                                              |
| 공통 프로퍼티    | `sessionId`·`device`·`ts` 필수, `userId` 선택                | 시드 로그 키와 호환하고 로그인 전후 사용자를 구분                                                  |
| 주문 완료        | 주문 성공 콜백에서 기록한 뒤 `/orders`로 이동                | 별도 주문 완료 페이지 없이 현재 주문 흐름을 유지                                                   |
| 분석 Provider    | 멘토 제공 `consoleProvider`만 앱 전역에서 한 번 등록         | 실제 도구 없이 콘솔과 메모리 버퍼로 이벤트 계약 검증                                               |
| 디바이스 값      | `desktop` 고정                                               | 이번 과제는 PC 화면만 대상으로 하며 반응형 계측은 범위 밖                                          |

---

_이 문서는 제가 쓴 2단계 계측 설계 기록입니다. 처음에는 `category_filter_change`·`sort_change`·`page_change`를 `product_list_view`에 합쳤습니다. 3단계 집계 기준을 검토하면서 직접 조작과 앞·뒤 이동·URL 복원을 구분하기 위해 세 이벤트를 다시 분리하기로 결정했고, AI가 대화에서 확인한 결정과 변경 경위를 문서에 반영했습니다. `cart_add`·`cart_remove`의 발생 시점과 `device` 예시가 구현과 어긋난 것은 나중에 AI가 코드와 대조해 짚었고, 문서를 코드에 맞추기로 한 것은 제 판단입니다._
