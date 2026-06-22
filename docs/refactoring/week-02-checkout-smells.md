# Week 02 Checkout Code Smell Notes

## 화면 조작 확인

체크아웃 화면을 직접 조작하면서 다음 동작 이슈를 확인했다.

- 쿠폰 적용 후 최종 금액이 기대값과 다르게 표시된다.
- 도서산간 배송지 변경이나 적립금 입력이 최종 금액에 즉시 반영되지 않을 수 있다.
- 결제 화면은 `Price` 컴포넌트를 거쳐 VIP 할인을 적용하지만, 주문 완료 화면은 `finalPrice.toLocaleString()`을 직접 사용해 금액 표시 기준이 다르다.
- 적립금에 음수를 입력하면 할인값이 음수가 되어 금액 정책이 깨질 수 있다.

## 11전략 판별표

| 전략                             | 적용 여부          | 위치                                             | 왜 냄새인가 / 해당 없음 근거                                                                                                                                                                                                                                 | 고칠 방향                                                                                                                         |
| -------------------------------- | ------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 1. 변화의 경계                   | 적용               | `CheckoutPage`                                   | 가격 정책 변경과 화면 UI 변경이 같은 컴포넌트를 수정하게 된다. 배송비, 쿠폰, 포인트, 최종 금액 계산과 쿠폰 UI, 적립금 UI, 결제수단, 약관 모달, 최근 주문 표시가 한 파일에 섞여 있다.                                                                         | 가격 계산 정책을 별도 함수나 모듈로 분리하고, UI 섹션은 역할 단위로 나눈다.                                                       |
| 2. 구현 vs 조합                  | 적용               | `CheckoutPage`                                   | `DeliverySection`, `DeliveryMemo` 같은 조합 컴포넌트를 배치하다가 쿠폰 섹션에서는 `input`, `button`, 조건부 렌더링을 직접 구현한다. 높은 수준의 조합과 낮은 수준의 구현이 한 컴포넌트에 섞여 추상화 레벨이 맞지 않는다.                                      | 섹션 단위 컴포넌트 경계를 맞추고, 페이지는 조합 역할에 가깝게 정리한다.                                                           |
| 3. God Component                 | 적용               | `CheckoutPage`                                   | 배송지 선택, 쿠폰 적용, 적립금 입력, 결제수단 선택, 약관 모달, 주문 완료 상태, 금액 계산, 주문 상품/결제 금액/최근 주문 UI 렌더링을 모두 담당한다.                                                                                                           | 상태와 계산, 섹션 UI를 역할 기준으로 나눈다.                                                                                      |
| 4. 성급한 추상화                 | 부분 적용          | `OrderLineRow`, `Price`, `DeliverySection` 계열  | `OrderLineRow`가 상품 행, 배송비 행, 쿠폰 할인 행, 포인트 할인 행을 모두 표현하려 하면서 `type`, `thumbnail`, `option`, `quantity`, `isDiscount`, `couponCode` 같은 조건부 props가 늘어난다. `Price`는 단순 가격 표시처럼 보이지만 VIP 할인 정책도 포함한다. | 서로 다른 도메인 행을 하나의 추상화에 억지로 넣지 않고 역할별 컴포넌트나 계산 함수로 분리한다. 단, 불필요한 공통화는 하지 않는다. |
| 5. props는 적게, 이름은 역할대로 | 적용               | `OrderLineRow`, `Price`, `OrderStatusTag`        | `OrderLineRow`는 특정 `type`에서만 의미 있는 props가 많다. `Price`는 이름만 보면 가격 표시 컴포넌트 같지만 VIP 할인 정책도 수행한다. `OrderStatusTag`는 boolean props가 많고 `isPreparing`만으로는 무엇을 준비 중인지 알기 어렵다.                           | props를 역할 중심으로 줄이고, 컴포넌트 이름과 책임을 일치시킨다.                                                                  |
| 6. boolean 폭발 -> enum          | 적용               | `OrderStatusTag`                                 | 주문 상태를 5개의 boolean props로 표현한다. 동시에 참이면 안 되는 상태 조합을 타입이 막아주지 못한다.                                                                                                                                                        | 주문 상태를 하나의 enum 또는 string union 값으로 표현한다.                                                                        |
| 7. 파생 상태 + key               | 적용               | `CheckoutPage`                                   | `finalPrice`는 `itemTotal`, `shippingFee`, `couponDiscount`, `pointDiscount`에서 계산 가능한 값인데 `useState` 초기값으로만 저장한다. 쿠폰, 적립금, 배송지 변경 후 다시 계산되지 않는 버그가 생긴다.                                                         | `finalPrice`를 렌더 중 계산값으로 바꾸고, 원본 상태만 보관한다.                                                                   |
| 8. 확장은 위임으로               | 부분 적용          | `OrderLineRow`                                   | 새로운 행 유형이나 표시 정책이 추가될 때마다 `OrderLineRow` props와 내부 분기가 계속 늘어날 가능성이 높다.                                                                                                                                                   | 행 유형별 컴포넌트로 책임을 위임하거나, 공통 행은 순수한 레이아웃 역할만 맡긴다.                                                  |
| 9. Context 전에 composition      | 해당 없음          | -                                                | 현재 코드에는 React Context를 도입한 부분이 없다. 문제는 Context 사용이 아니라 `CheckoutPage`가 너무 많은 책임을 직접 들고 있는 점이다.                                                                                                                      | Context보다 먼저 컴포넌트 경계와 composition을 정리한다.                                                                          |
| 10. children vs slot             | 해당 없음에 가까움 | `OrderLineRow`                                   | `children`이나 slot API가 필요한 확장 지점이 명확하지 않다. `OrderLineRow`의 문제는 slot 부재가 아니라 서로 다른 역할의 행을 하나의 컴포넌트에 합친 점이다.                                                                                                  | slot을 추가하기보다 `ProductOrderLine`, `SummaryAmountLine`, `DiscountAmountLine`처럼 역할별로 나눈다.                            |
| 11. Drilling vs Context          | 해당 없음에 가까움 | `DeliverySection -> AddressForm -> AddressField` | `addresses`, `selectedAddressId`, `onSelectAddress`가 전달되지만 깊이가 얕고 배송지 선택 영역 안으로 범위가 제한된다. 여러 먼 컴포넌트가 같은 상태를 공유하는 구조가 아니다.                                                                                 | Context를 도입하지 않고 배송지 선택 컴포넌트 경계만 검토한다.                                                                     |

## 상세 근거

### 1. 변화의 경계

`CheckoutPage` 안에 배송비, 쿠폰, 포인트, 최종 결제 금액 계산이 함께 들어 있다.

```tsx
const itemTotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);

let shippingFee = 3000;
if (itemTotal >= 50000) shippingFee = 0;
if (address.isRemote) shippingFee += 3000;

const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
const pointDiscount = usePoint ? Math.min(pointInput, member.point, itemTotal) : 0;

const [finalPrice] = useState(itemTotal + shippingFee - couponDiscount - pointDiscount);
```

이 구조에서는 무료배송 기준, 도서산간 추가비, 쿠폰 적용 기준, 포인트 최대 사용 정책이 바뀔 때마다 `CheckoutPage`를 수정해야 한다. 반면 쿠폰 UI, 적립금 UI, 결제수단, 약관 모달, 최근 주문 표시 변경도 같은 파일을 수정하게 된다. 가격 정책 변경과 화면 UI 변경이 같은 컴포넌트를 건드리므로 변화의 경계가 분리되어 있지 않다.

### 2. 구현 vs 조합

`CheckoutPage`는 어떤 영역에서는 하위 컴포넌트를 조합하지만, 다른 영역에서는 낮은 수준의 UI 구현을 직접 알고 있다.

```tsx
<DeliverySection
  addresses={addresses}
  selectedAddressId={selectedAddressId}
  onSelectAddress={setSelectedAddressId}
/>
<DeliveryMemo memo={memo} onChangeMemo={setMemo} />
```

위와 같이 배송 영역은 컴포넌트 조합으로 배치한다. 반면 쿠폰, 적립금, 결제수단 영역은 페이지가 직접 `input`, `button`, `checkbox`, `radio`, 조건부 렌더링, 이벤트 핸들러를 다룬다. 페이지 안에서 조합 수준과 구현 수준이 섞이기 때문에 읽는 사람이 현재 코드가 어떤 추상화 레벨을 다루는지 계속 전환해야 한다.

### 3. God Component

`CheckoutPage`는 하나의 책임보다 훨씬 많은 일을 담당한다.

1. 배송지 선택 상태 관리
2. 쿠폰 입력과 적용 로직
3. 적립금 사용 여부와 금액 계산
4. 결제수단 선택
5. 약관 모달 열림/닫힘
6. 주문 완료 상태 전환
7. 상품 금액, 배송비, 할인, 최종 금액 계산
8. 주문 상품, 결제 금액, 최근 주문 UI 렌더링

이 책임들은 서로 다른 이유로 변경된다. 예를 들어 가격 정책 변경과 약관 모달 UI 변경은 독립적인 변경 이유인데 같은 컴포넌트를 수정하게 된다. 따라서 `CheckoutPage`는 God Component 냄새가 있다.

### 4. 성급한 추상화

`OrderLineRow`는 여러 종류의 행을 하나의 공통 컴포넌트로 표현하려고 한다.

```tsx
<OrderLineRow
  type="product"
  title={item.name}
  thumbnail={item.thumbnail}
  option={item.option}
  quantity={item.quantity}
  price={item.price * item.quantity}
/>
```

상품 행, 배송비 행, 쿠폰 할인 행, 포인트 할인 행은 필요한 데이터와 표시 규칙이 다르다. 그런데 하나의 `OrderLineRow`가 모든 행을 표현하려 하면서 `type`, `thumbnail`, `option`, `quantity`, `isDiscount`, `couponCode`처럼 특정 행에서만 의미 있는 props가 늘어난다. 새 행 유형이 추가될수록 내부 분기가 늘어나는 방향이므로 공통화의 이점보다 조건부 복잡도가 커질 수 있다.

### 5. Props는 적게, 이름은 역할대로

`OrderLineRow`는 props가 많고, 상당수가 특정 `type`에서만 의미가 있다. `thumbnail`, `option`, `quantity`는 상품 행에서만 자연스럽고, `couponCode`는 쿠폰 행에서만 의미가 있다. `isDiscount`도 쿠폰 할인 행이나 포인트 할인 행에서만 자연스럽다.

```tsx
<OrderLineRow
  type="product"
  title={item.name}
  thumbnail={item.thumbnail}
  option={item.option}
  quantity={item.quantity}
  price={item.price * item.quantity}
/>
```

`Price`도 이름과 책임이 어긋나 있다. 이름만 보면 가격 포맷을 담당하는 컴포넌트처럼 보이지만, `member.grade === "VIP"`일 때 10% 할인을 적용하는 정책도 포함한다. 가격 표시인지, 회원 등급 할인 정책인지 역할이 분명하지 않다.

`OrderStatusTag`는 boolean props를 여러 개 받는다. 특히 `isPreparing`은 prop 이름만 보고 무엇을 준비 중인지 알기 어렵다. props 이름은 구현 상태보다 역할과 의미를 드러내야 한다.

### 6. boolean 폭발 -> enum

`OrderStatusTag`는 주문 상태를 5개의 boolean props로 표현한다.

```tsx
<OrderStatusTag
  isPaid={isPaid}
  isPreparing={isPreparing}
  isShipping={isShipping}
  isDelivered={isDelivered}
  isCanceled={isCanceled}
/>
```

이 방식은 동시에 참이면 안 되는 상태 조합을 타입이 막아주지 못한다. 예를 들어 `isPreparing`과 `isDelivered`가 동시에 `true`가 되는 값을 타입 차원에서 막을 수 없다.

주문 상태는 여러 boolean보다 하나의 enum 또는 string union 값으로 표현하는 편이 안전하다.

```ts
type OrderStatus = "paid" | "preparing" | "shipping" | "delivered" | "canceled";
```

이렇게 표현하면 주문 상태는 한 번에 하나만 선택될 수 있고, 상태 추가나 표시 문구 변경도 한 곳에서 다루기 쉬워진다.

### 7. 파생 상태

`finalPrice`는 `itemTotal`, `shippingFee`, `couponDiscount`, `pointDiscount`에서 계산 가능한 값이다. 그런데 `useState` 초기값으로만 저장되어 이후 원본 값이 바뀌어도 다시 계산되지 않는다.

```tsx
const [finalPrice] = useState(itemTotal + shippingFee - couponDiscount - pointDiscount);
```

이 때문에 쿠폰 적용, 적립금 입력, 배송지 변경 후 최종 금액이 화면에 즉시 반영되지 않는 버그가 생긴다. `finalPrice`는 상태로 보관하지 않고 렌더 중 계산해야 한다.

### 8. 확장은 위임으로

`OrderLineRow`는 앞으로 요구사항이 추가될수록 props와 내부 분기가 계속 늘어날 가능성이 높다.

- 상품 행 때문에 `thumbnail`, `option`, `quantity`가 필요하다.
- 쿠폰 행 때문에 `couponCode`가 필요하다.
- 할인 표시 때문에 `isDiscount`가 필요하다.
- 배송비 행은 상품 행과 전혀 다른 표시 규칙이 필요할 수 있다.

이 구조는 새 행 유형이 추가될 때 `OrderLineRow`가 계속 수정되는 방향으로 확장된다. 공통 행 컴포넌트가 모든 도메인 차이를 직접 아는 대신, 상품 행, 배송비 행, 할인 행처럼 역할별 컴포넌트에 표시 책임을 위임하는 편이 더 적절하다.

## 주요 리팩토링 후보

1. `CheckoutPage`의 가격 계산 로직을 분리한다.
   - 배송비, 쿠폰, 포인트, 최종 금액 계산은 UI 변경과 다른 이유로 바뀐다.
   - 계산 정책을 분리하면 정책 변경 시 UI 컴포넌트를 덜 건드릴 수 있다.

2. `finalPrice` 파생 상태를 제거한다.
   - `finalPrice`는 다른 값에서 계산 가능하므로 상태로 저장하지 않는다.
   - 쿠폰, 적립금, 배송지 변경이 최종 금액에 즉시 반영되도록 렌더 중 계산한다.

3. `OrderStatusTag`의 boolean props를 단일 상태 값으로 정리한다.
   - 여러 boolean으로 표현하면 불가능한 상태 조합이 생긴다.
   - 하나의 주문 상태 값으로 표현해 타입이 조합을 제한하게 만든다.

4. `OrderLineRow`의 책임을 줄인다.
   - 상품 행, 배송비 행, 할인 행은 필요한 정보와 표시 규칙이 다르다.
   - 하나의 컴포넌트에 모든 행을 넣기보다 역할별 행으로 나누거나, 공통 컴포넌트는 레이아웃만 맡긴다.

5. `CheckoutPage`의 섹션 책임을 분리한다.
   - 쿠폰, 적립금, 결제수단, 약관 모달, 최근 주문 UI가 한 컴포넌트에 섞여 있다.
   - 단, 냄새가 확인된 부분만 나누고 성급한 공통 추상화는 만들지 않는다.

## 현재 리팩토링에서 보류한 것

- Context 도입은 우선순위에서 제외한다.
  - 상태 공유 범위가 체크아웃 화면 내부에 머물고 drilling 깊이가 낮아, 현재 단계에서는 Context를 도입할 근거가 약하다.
  - 먼저 컴포넌트 경계와 책임 분리로 해결 가능한지 확인한다.
- slot/children API 도입은 우선순위에서 제외한다.
  - 현재 확인한 문제는 구조 주입 지점이 부족한 것보다, 역할이 다른 UI를 하나의 컴포넌트에 합친 데 가깝다.
  - 따라서 slot을 추가하기보다 역할별 컴포넌트 분리가 더 직접적인 해결 방향이다.
- 모든 섹션을 무조건 공통 컴포넌트로 만들지 않는다.
  - 세 번째 중복이 확인되기 전까지는 역할별 컴포넌트와 명확한 계산 함수 분리를 우선한다.
- `Price`는 이름과 책임을 먼저 검토한다.
  - 단순 포맷 컴포넌트인지, 할인 정책을 포함한 도메인 계산인지 경계를 먼저 정해야 한다.

## 셀프 리뷰 기준

- 동작: 쿠폰 적용, 적립금 입력, 도서산간 배송지 선택, 결제수단 변경, 약관 모달, 주문 완료 화면을 직접 확인한다.
- 의존성: 새 유틸이나 컴포넌트를 만들기 전에 기존 구현을 먼저 확인한다.
- 타입/린트 침묵: 새 `any`, `as`, `@ts-ignore`, `eslint-disable`를 추가하지 않는다.
- 표면적: 사용자 입력을 검증 없이 위험한 렌더링 API에 넘기지 않는다.
