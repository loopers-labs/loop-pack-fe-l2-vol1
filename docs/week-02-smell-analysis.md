# 2주차 — Bad Code Smell 판별표

`src/market/` 파일 기준, 강의 11전략 전수 검토.

## 판별 결과

| # | 전략 | 파일 | 해당 여부 | 위치 / 근거 |
|---|---|---|---|---|
| ① | 변화의 경계 | `CheckoutPage.tsx` | ✅ | `isTermsOpen` 모달 상태가 결제 흐름과 무관하게 CheckoutPage에 존재 |
| ② | 구현 vs 조합 | `OrderLineRow.tsx` | ✅ | `type` 분기로 product/coupon/shipping 등 구현이 한 컴포넌트에 혼합 (파일 내 주석 참고) |
| ③ | God Component | `CheckoutPage.tsx` | 경계 | state 9개, 비즈니스 계산 3종 — 크지만 체크아웃 페이지 특성상 허용 범위. 모달 상태만 분리 |
| ④ | 성급한 추상화 | `OrderLineRow.tsx` | ✅ | product·subtotal·shipping·coupon·point를 단일 컴포넌트로 추상화. 타입 추가 시마다 분기 증가 |
| ⑤ | props 개수·이름 | `OrderLineRow.tsx` | ✅ | 8개 props, 타입별로 유효한 조합이 다름. type이 undefined여도 컴파일 통과 |
| ⑥ | boolean 폭발 | `OrderStatusTag.tsx` | ✅ | `isPaid isPreparing isShipped isDelivered isCancelled` — 5개 boolean. 동시에 여러 개 true 가능 |
| ⑦ | 파생 상태 | `CheckoutPage.tsx` | ✅ | `const [finalPrice] = useState(...)` — 쿠폰/적립금 변경 시 재계산 안 됨 (버그) |
| ⑧ | 확장은 위임으로 | — | 해당 없음 | style prop 폭발 없음. 모든 스타일은 CSS 클래스로 처리됨 |
| ⑨ | Context 전에 composition | — | 해당 없음 | Context 미사용. `onSelectAddress` 드릴링은 3단계(Section→Form→Field)로 허용 범위 |
| ⑩ | children vs slot | `CheckoutPage.tsx` | ✅ | 모달 구조가 CheckoutPage 내부에 인라인. 모달 자체 slot으로 추출 가능 |
| ⑪ | Drilling vs Context | — | 해당 없음 | `onSelectAddress` 3단계 드릴링, 중간 컴포넌트 모두 값을 사용함. Context 불필요 |

## 수정 대상 요약

| 파일 | 수정 내용 | 전략 |
|---|---|---|
| `OrderStatusTag.tsx` | 5 boolean → `status: OrderStatus` | ⑥ |
| `CheckoutPage.tsx` | `useState(finalPrice)` → 렌더 중 계산 | ⑦ |
| `CheckoutPage.tsx` | `!` non-null assertion 2개 제거 | ③ (ESLint) |
| `CheckoutPage.tsx` | `isTermsOpen` 상태 + 모달 → `TermsModal` 컴포넌트 추출 | ①⑩ |
| `OrderLineRow.tsx` | type 분기 → children 슬롯 패턴 | ②④⑤ |

## 수정 안 하는 것

- `DeliverySection → AddressForm → AddressField` prop drilling: 3단계, 중간 컴포넌트 모두 사용 → ⑨⑪ 해당 없음
- `CheckoutPage` 전체 분해: state 9개는 체크아웃 도메인 특성상 정상. God Component 경계에 해당하지만 과잉 분리가 더 나쁨
- `Price.tsx` member VIP 계산: 현재 코드에서 이 컴포넌트만 호출하므로 분리 실익 없음
