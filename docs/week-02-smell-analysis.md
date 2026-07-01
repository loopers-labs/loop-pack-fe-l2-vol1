# 2주차 — Bad Code Smell 판별표

`src/market/` 전체 파일 기준, 강의 11전략 전수 검토.

검토 파일: `CheckoutPage.tsx` · `OrderLineRow.tsx` · `OrderStatusTag.tsx` · `Price.tsx` · `DeliveryMemo.tsx` · `data.ts` · `types.ts`

## 판별 결과

| # | 전략 | 파일 | 판단 | 위치 / 근거 |
|---|---|---|---|---|
| ① | 변화의 경계 | `CheckoutPage.tsx` | **해당** | `isTermsOpen` 모달 상태가 결제 흐름과 독립적으로 바뀜 → `TermsModal`로 분리 |
| ② | 구현 vs 조합 | `OrderLineRow.tsx` | **해당** | `type` prop으로 product/coupon/shipping 등 구현이 한 컴포넌트에 혼합 → children 슬롯으로 교체 |
| ③ | God Component | `CheckoutPage.tsx` | **해당 없음** | state 9개는 체크아웃 도메인 특성상 정상 범위. 하나의 화면에서 배송·쿠폰·적립금·결제를 한꺼번에 처리하는 것이 이 컴포넌트의 역할. 억지로 분리하면 과잉 리팩토링 |
| ④ | 성급한 추상화 | `OrderLineRow.tsx` | **해당** | product·subtotal·shipping·coupon·point 5가지를 하나로 묶음. 파일 내 주석("새 줄 타입이 생길 때마다 분기 증가")이 직접 가리킴 |
| ⑤ | props 적게·역할대로 | `OrderLineRow.tsx` | **해당** | 8개 props 중 `thumbnail·option·quantity`는 type='product'일 때만, `couponCode`는 type='coupon'일 때만 유효. 타입별 유효 조합이 타입 시스템에 표현 안 됨 |
| ⑥ | boolean 폭발 | `OrderStatusTag.tsx` | **해당** | `isPaid isPreparing isShipped isDelivered isCancelled` 5개 boolean. 동시에 여러 개 true 가능. `OrderStatus` union으로 교체 |
| ⑦ | 파생 상태 + key | `CheckoutPage.tsx` | **해당** | `const [finalPrice] = useState(...)` — 쿠폰·적립금 변경 시 재계산 안 됨(버그). key 리셋이 필요한 컴포넌트는 없음 |
| ⑧ | 확장은 위임으로 | — | **해당 없음** | style prop 폭발 없음. 스타일은 모두 CSS 클래스로 처리됨 |
| ⑨ | Context 전에 composition | — | **해당 없음** | Context 미사용. `onSelectAddress` 드릴링은 3단계(Section→Form→Field)로 허용 범위. 중간 컴포넌트 모두 값을 직접 사용함 |
| ⑩ | children vs slot | `CheckoutPage.tsx` | **해당** | 모달 구조가 CheckoutPage 안에 인라인 → `TermsModal`이 열림 상태와 JSX를 직접 소유 |
| ⑪ | Drilling vs Context | — | **해당 없음** | `onSelectAddress`가 3단계 통과. 중간 `DeliverySection`·`AddressForm` 모두 이 값을 사용하거나 전달 역할이 명확함. Context 도입 실익 없음 |

## 파일별 추가 검토

| 파일 | 냄새 여부 | 근거 |
|---|---|---|
| `Price.tsx` | 해당 없음 | VIP 할인 계산이 단순하고 이 컴포넌트만 사용. 분리 실익 없음 |
| `DeliveryMemo.tsx` | 해당 없음 | 자신의 `memo` state만 소유하는 단순 textarea. 경계·계약·합성 모두 정상 |
| `data.ts` | 해당 없음 | 상수 데이터 파일. 컴포넌트 패턴 전략 적용 대상 아님 |
| `types.ts` | 해당 없음 | 타입 정의만 존재 |

## 수정 대상 요약

| 파일 | 수정 내용 | 전략 |
|---|---|---|
| `OrderStatusTag.tsx` | 5 boolean → `status: OrderStatus` + `STATUS_CONFIG` 맵 | ⑥ |
| `OrderLineRow.tsx` | type 분기 제거 → `children` 슬롯 패턴 | ②④⑤ |
| `CheckoutPage.tsx` | `useState(finalPrice)` → 렌더 중 계산 (버그 복구) | ⑦ |
| `CheckoutPage.tsx` | `!` 2개 → `find()` + null 체크 | ESLint |
| `CheckoutPage.tsx` | `isTermsOpen` + 모달 인라인 → `TermsModal` 컴포넌트 | ①⑩ |

## 수정 안 하는 것 (판단 근거)

- `CheckoutPage` state 9개 분해: 도메인 특성상 정상 범위, 과잉 분리가 더 나쁨 (③ 해당 없음)
- `DeliverySection → AddressForm → AddressField` drilling: 3단계, 중간 컴포넌트 모두 사용 (⑪ 해당 없음)
- `Price.tsx` member VIP 계산 분리: 현재 구조에서 분리 실익 없음
