# Week 2 Market Refactor Audit

## 목표

`src/market` 체크아웃 화면은 일부러 뭉쳐진 코드다. 이번 리팩터링의 목표는 예쁘게 쪼개는 것이 아니라, 잘못된 상태 모델과 흐려진 컴포넌트 계약을 먼저 드러낸 뒤 필요한 부분만 고치는 것이다.

## 판별 표

| 전략 | 적용 | 위치 | 왜 냄새인가 | 고칠 방향 |
| --- | --- | --- | --- | --- |
| ① 변화의 경계 | 적용 | `CheckoutPage.tsx` | 배송지, 쿠폰, 포인트, 결제수단, 약관, 최근 주문, 금액 계산이 한 컴포넌트에서 같이 바뀐다. | 계산 모델과 화면 섹션을 분리한다. 단순 파일 쪼개기가 아니라 변경 이유 기준으로 나눈다. |
| ② 구현 vs 조합 | 적용 | `OrderLineRow.tsx` | `type`별 렌더링 세부 구현을 한 컴포넌트가 모두 안다. 새 금액 라인이 늘면 내부 분기가 늘어난다. | 먼저 주문 금액 라인을 union 모델로 나누고, UI는 그 모델을 소비하게 한다. |
| ③ God Component | 적용 | `CheckoutPage.tsx` | 페이지가 폼 상태, 정책 계산, 모달, 목록 렌더링을 모두 가진다. 읽는 사람이 한 번에 잡아야 할 이유가 너무 많다. | 도메인 계산과 반복 렌더링 계약부터 밖으로 뺀다. |
| ④ 성급한 추상화 | 해당 없음 | `src/market` | 아직 3곳 이상 반복된 범용 UI는 없다. 공통 Button/Input을 만들면 과제 의도와 멀어진다. | 새 공통 컴포넌트는 만들지 않는다. |
| ⑤ props는 적게, 이름은 역할대로 | 적용 | `OrderLineRow.tsx` | `thumbnail`, `option`, `quantity`, `couponCode`, `isDiscount`가 `type`에 따라 의미가 생기거나 사라진다. | optional props 묶음 대신 discriminated union으로 유효 조합을 막는다. |
| ⑥ boolean 폭발 → enum | 적용 | `OrderStatusTag.tsx` | 주문 상태 하나를 boolean 5개로 표현한다. 동시에 여러 상태가 true여도 타입이 막지 못한다. | `status: OrderStatus` 하나를 받게 한다. |
| ⑦ 파생 상태 + key | 적용 | `CheckoutPage.tsx` | `finalPrice`를 `useState` 초기값으로 고정해 배송지, 쿠폰, 포인트 변경을 반영하지 못한다. | 최종 금액은 렌더 중 계산되는 주문 요약 모델에서 가져온다. |
| ⑧ 확장은 위임으로 | 적용 | `OrderLineRow.tsx` | 금액 라인 종류가 늘 때마다 컴포넌트 내부가 도메인 규칙을 더 많이 알게 된다. | 라인 모델을 확장하고 렌더러는 exhaustiveness check로 새 케이스 누락을 드러낸다. |
| ⑨ Context 전에 composition | 해당 없음 | `CheckoutPage.tsx` | 현재 전달 단계가 깊지 않다. Context를 쓰면 의존성이 숨고 과제의 핵심인 계약 설계가 흐려진다. | Context는 도입하지 않는다. 명시 props를 유지한다. |
| ⑩ children vs slot | 일부 적용 | `OrderLineRow.tsx` | 현재 문제는 slot 부재보다 모델 부재가 먼저다. 곧바로 slot을 열면 호출부가 규칙을 떠안는다. | 이번 범위에서는 모델링과 union 계약을 우선한다. |
| ⑪ Drilling vs Context | 해당 없음 | `DeliverySection → AddressForm → AddressField` | 2단계 전달이고 중간 컴포넌트도 선택 UI를 구성한다. Context로 숨길 근거가 약하다. | 유지한다. 필요하면 이름만 정리한다. |

## 리팩터링 계획

1. `OrderStatusTag`는 boolean props를 없애고 `status: OrderStatus`로 바꾼다.
2. 주문 금액 계산은 `checkoutModel`로 분리한다. `itemTotal`, `shippingFee`, `couponDiscount`, `pointDiscount`, `finalPrice`를 한 모델에서 계산한다.
3. `OrderLineRow`는 교차 optional props를 discriminated union으로 바꾼다. 먼저 모델을 나누고, 렌더 분기는 exhaustiveness check로 막는다.
4. `CheckoutPage`는 위 모델을 소비하도록 줄인다. Context는 쓰지 않는다.
5. `Price`의 VIP 할인은 공통 표시 컴포넌트에 숨어 있는 비즈니스 로직이다. 최종 금액 모델과 중복 할인 가능성이 있으므로 표시만 하게 바꾼다.

## 화면 조작에서 확인할 증상

- 도서산간 주소를 선택하면 배송비가 3,000원 추가되어야 한다.
- 쿠폰 적용 후 최종 금액과 결제 버튼 금액이 같이 바뀌어야 한다.
- 적립금 입력 후 주문 완료 화면의 결제 금액도 같은 값을 보여야 한다.
- 현재 코드는 `finalPrice`가 첫 렌더 값에 묶여 있어 위 흐름을 배신할 수 있다.

## 멘토에게 가져갈 질문

`OrderLineRow` 문제를 컴포넌트 분리부터 보면 답이 흐려진다. 먼저 주문 금액 라인을 도메인 모델로 어떻게 찢을지 묻는 것이 맞다.

> `OrderLineRow`가 상품, 배송비, 쿠폰, 적립금을 전부 `type`과 optional props로 처리하고 있습니다. 멘토님이라면 먼저 주문 금액 라인을 어떤 union 모델로 나누고, 그 모델을 TypeScript에서 어떤 패턴으로 닫으시나요? 모델을 나눈 뒤에도 UI 컴포넌트는 하나로 둘지, `Item/Fee/Discount`처럼 의미 단위로 나눌지는 어디서 결정하시는지 궁금합니다.

## 고치지 않을 것

- 범용 Button/Input 컴포넌트는 만들지 않는다. 아직 반복과 확장 압력이 없다.
- Context는 쓰지 않는다. 현재 문제는 전달 깊이가 아니라 모델과 props 계약이다.
- Storybook은 이번 리팩터링의 직접 검증 수단이 아니다. 공통 컴포넌트화가 끝난 뒤에 붙이는 것이 순서다.
