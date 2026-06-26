# 2주차 — 컴포넌트 설계 냄새 판별

## 내 판별 결과

---

### ① 변화의 경계
- **위치**: CheckoutPage.tsx
- **왜 냄새인가**: 배송지, 쿠폰, 적립금, 결제수단 등 다양한 로직을 가지고 있어서 이 파일에서 수정할 일이 많아질 수 있다.
- **고칠 방향**: 각자의 책임에 맞게 분리한다.

---

### ② 구현 vs 조합
- **위치**: CheckoutPage.tsx — 결제금액 section
- **왜 냄새인가**: 상품 금액·배송비는 `OrderLineRow`, 최종 결제 금액은 `Price`로 처리 — 같은 금액 표시인데 구현 방식이 다름
- **고칠 방향**: 하나의 방식으로 통일

---

### ③ God Component
- **위치**: CheckoutPage.tsx
- **왜 냄새인가**: `useState`가 많고 배송지 관리, 쿠폰, 결제수단, 약관 등 하는 일이 많다.
- **고칠 방향**: 배송지 관리, 약관 등 분리

---

### ④ 성급한 추상화
- **해당 없음** — 주소 관련 컴포넌트는 각각의 state를 갖고 있고, `OrderLineRow`는 복잡하고 재사용성이 있기 때문에 분리가 합리적이다.

---

### ⑤ props는 적게, 이름은 역할대로
- **위치**: `OrderStatusTag.tsx`, `OrderLineRow.tsx`
- **왜 냄새인가**:
  - `OrderStatusTag` — boolean props 5개를 받고 if문으로 label과 color를 지정
  - `OrderLineRow` — 8개의 props를 받고 있음
- **고칠 방향**:
  - `OrderStatusTag` — color 변형은 cva, label은 맵 객체, boolean 5개를 union type으로 변경
  - `OrderLineRow` — Composition 패턴 또는 컴포넌트 분리 검토

---

### ⑥ boolean 폭발 → enum
- **위치**: `OrderStatusTag.tsx`
- **왜 냄새인가**: `is~` boolean props들이 동시에 true일 수 없다.
- **고칠 방향**: union type으로 수정

---

### ⑦ 파생 상태
- **위치**: CheckoutPage.tsx — `finalPrice`
- **왜 냄새인가**: 이미 있는 값들로 계산이 가능하므로 `useState`를 사용할 필요가 없다.
- **실제 버그**: 쿠폰·적립금을 바꿔도 `finalPrice`가 갱신되지 않아 세 군데 모두 틀린 금액이 표시됨
  - 최종 결제 금액 섹션 (`<Price amount={finalPrice} />`)
  - 결제하기 버튼 (`{finalPrice.toLocaleString()}원 결제하기`)
  - 주문 완료 화면 (`결제 금액 {finalPrice.toLocaleString()}원`)
- **고칠 방향**: `const finalPrice = itemTotal + shippingFee - couponDiscount - pointDiscount`

---

### ⑧ 확장은 위임으로
- **위치**: `OrderStatusTag.tsx`, `OrderLineRow.tsx`
- **왜 냄새인가**: 새 타입이 생길 때 내부를 고쳐야 하는 구조
- **고칠 방향**:
  - `OrderStatusTag` — if문 대신 status + cva로 수정
  - `OrderLineRow` — 새 타입 추가 계획이 아직 확정되지 않아 보류

---

### ⑨ Context 전에 composition
- **위치**: CheckoutPage.tsx — `DeliverySection → AddressForm → AddressField` (onSelectAddress)
- **왜 냄새인가**: drilling이 있지만 중간 컴포넌트들이 연관된 state를 가지고 있어서 합성으로 풀기 어렵다.
- **고칠 방향**: 보류

---

### ⑩ children vs slot
- **위치**: `DeliveryMemo.tsx`
- **해당 없음** — 배송 메모라는 역할이 명확해서 UI 고정이 문제없음

---

### ⑪ Drilling vs Context
- **위치**: CheckoutPage.tsx — `DeliverySection → AddressForm → AddressField` (onSelectAddress)
- **왜 냄새인가**: `onSelectAddress`를 `DeliverySection`, `AddressForm`은 직접 사용하지 않고 `AddressField`로 전달만 함
- **고칠 방향**: ⑨번으로 넘어가서 합성으로 풀 수 있는지 고민 → 보류

---

### 추가 발견

**DeliveryMemo Uncontrolled**
- **위치**: `DeliveryMemo.tsx`
- **왜 냄새인가**: props가 없어 Uncontrolled — 메모 값이 `CheckoutPage`에 올라오지 않음
- **고칠 방향**: `value`, `onChange`를 props로 받아 Controlled로 변경

**submit 핸들러 없음**
- **위치**: `CheckoutPage.tsx` — 결제하기 버튼
- **왜 냄새인가**: `onClick={() => setPlaced(true)}`만 있고 주소·메모·쿠폰·결제수단 등 주문 데이터를 수집하는 구조가 없음
- **고칠 방향**: `handleSubmit`을 만들어 주문 데이터를 모은 뒤 `setPlaced(true)` 호출

---

## 스킬 판별 결과 (`/component-review`)

---

## 비교 및 재검토

-
