# Week 2 Market Refactor PR Notes

## AI 사용 표기

- AI가 초안 작성과 리팩터링 후보 탐지를 도왔다.
- 최종 변경은 `src/market` 코드와 검증 결과를 기준으로 직접 선별했다.
- 새 의존성, Context, 범용 공통 컴포넌트는 추가하지 않았다.

## 리팩터링 근거

| 변경 | 근거 |
| --- | --- |
| `checkoutModel` 추가 | 결제 금액 계산이 UI 렌더링과 섞여 있어 배송비, 쿠폰, 포인트 변경 경로를 한 곳에서 검증하기 어려웠다. |
| `finalPrice` state 제거 | 파생값을 `useState` 초기값으로 고정해 사용자 조작 후 금액이 갱신되지 않는 버그를 만들 수 있었다. |
| `OrderLine` union 모델 추가 | `OrderLineRow`의 optional props 조합을 닫고, 상품/기본 금액/할인 라인을 타입으로 구분했다. |
| `OrderStatusTag`를 `status` prop으로 변경 | 주문 상태 하나를 boolean 5개로 표현하면 동시에 여러 상태가 참인 잘못된 조합을 막지 못한다. |
| `Price`에서 VIP 할인 제거 | 금액 표시 컴포넌트에 비즈니스 할인이 숨어 있어 최종 금액 모델과 화면 표시가 서로 다른 말을 할 수 있었다. |

## 셀프 리뷰 4단계

1. 냄새 판별: 11전략 표를 작성했고, 해당 없음 항목도 근거를 남겼다.
2. 범위 제한: 판별한 냄새인 파생 상태, boolean 폭발, optional props 교차, 계산 경계만 고쳤다.
3. 과잉 방지: Context, 공통 Button/Input, Storybook은 이번 범위에서 제외했다.
4. 검증: 계산 스모크, lint, build, dev 서버 응답을 확인했다.

## 검증 기록

| 검증 | 결과 |
| --- | --- |
| `node --experimental-strip-types scripts/checkoutModel.spec.ts` | 통과 |
| `pnpm lint` | 통과 |
| `pnpm build` | 통과 |
| `pnpm dev --host 127.0.0.1 --port 5173` | 서버 기동 확인 |
| `curl -s http://127.0.0.1:5173/` | Vite HTML 응답 확인 |
| Chrome/Safari DOM 자동 조작 | 브라우저 설정에서 Apple Events JavaScript가 꺼져 있어 자동 클릭 검증은 불가 |

## 멘토 질문

`OrderLineRow`를 컴포넌트 분리부터 보면 답이 흐려진다고 판단했다. 먼저 주문 금액 라인을 도메인 union으로 나누고, 그 다음 UI가 그 모델을 소비하게 하는 순서가 맞는지 묻는다.

> `OrderLineRow`가 상품, 배송비, 쿠폰, 적립금을 전부 `type`과 optional props로 처리하고 있었습니다. 이번에는 먼저 `ProductOrderLine`, `PaymentOrderLine`, `DiscountOrderLine`처럼 모델을 나누고 UI가 그 union을 소비하게 바꿨는데요. 실무에서는 이런 금액 라인 모델을 어디까지 닫아두시나요? 예를 들어 카드 즉시할인, 부분취소, 무료배송 쿠폰이 들어오면 같은 union을 확장하는지, 아니면 계산 모델과 표시 모델을 다시 분리하는지 기준이 궁금합니다.
