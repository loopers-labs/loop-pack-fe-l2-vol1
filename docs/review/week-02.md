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
- **실제 버그**: VIP 할인이 `Price` 컴포넌트 안에서만 적용되어 "최종 결제 금액" 섹션엔 반영되지만 결제하기 버튼·주문 완료 화면엔 적용 안 됨
- **고칠 방향**: VIP 할인 계산을 `finalPrice`에 포함 → `Price.tsx`는 표시만 담당, `member` prop 제거

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

검토 파일: 5개 / 냄새 발견: 9건 / 해당 없음: 7건

### ① 변화의 경계
- **위치**: `CheckoutPage.tsx` — 배송지·쿠폰·적립금·결제수단·약관 등 바뀌는 이유 다수 ✓
- **위치**: `OrderLineRow.tsx` — 새 type이 추가되면 내부 분기도 함께 수정해야 함 ✓
- `Price.tsx` — 금액 표시 + VIP 할인 계산 두 가지 책임 — 보류

### ② 구현 vs 조합
- **위치**: `OrderLineRow.tsx` vs `Price.tsx` — 같은 금액 표시인데 다른 구현 ✓

### ③ God Component
- **위치**: `CheckoutPage.tsx` — `useState` 10개 ✓

### ④ 성급한 추상화
- **해당 없음** — 모든 컴포넌트 분리 이유 명확

### ⑤ props는 적게
- **위치**: `OrderStatusTag.tsx` — boolean props 5개 ✓
- **위치**: `OrderLineRow.tsx` — props 8개 ✓
- **위치**: `DeliveryMemo.tsx` — props 없음 → Uncontrolled ✓

### ⑥ boolean 폭발
- **위치**: `OrderStatusTag.tsx` — boolean 5개, 동시에 true 불가 ✓

### ⑦ 파생 상태
- **위치**: `CheckoutPage.tsx` — `finalPrice` 계산 가능한 값을 `useState`에 담음 ✓

### ⑧ 확장은 위임으로
- **위치**: `OrderStatusTag.tsx` — if문 5개, 새 상태 생기면 내부 수정 ✓
- **위치**: `OrderLineRow.tsx` — type별 분기, 새 type 생기면 내부 수정 ✓

### ⑨ Context 전에 composition
- **해당 없음** — `DeliverySection`, `AddressForm`이 각각 자신의 state를 가져 합성으로 풀기 어려움

### ⑩ children vs slot
- **해당 없음** — 각 컴포넌트가 한 곳에서만 쓰이거나 UI가 동일

### ⑪ Drilling vs Context
- **위치**: `CheckoutPage.tsx` — `onSelectAddress`가 `DeliverySection`(통과) → `AddressForm`(통과) → `AddressField`(사용) ✓

---

## 비교 및 재검토

### 일치
9건 중 8건 일치. 전략 분류와 위치 모두 동일.

### 내가 놓친 것
- **① `OrderLineRow`** — 새 type이 생길 때 내부를 고쳐야 하는 구조라 ①에도 해당됨. ⑧로만 잡았는데 ①도 맞음.
- **⑤ `DeliveryMemo` Uncontrolled** — ⑤(props 없음) 항목으로 분류되는 케이스인데 추가 발견으로 따로 뺐음.
