## 📌 이번 PR 요약

- 주차: 2주차 — 컴포넌트 설계 & Props 전략
- 무엇을 / 왜:
  - `src/market` 체크아웃 화면의 Bad Code Smell을 11전략 기준으로 판별했다.
  - 결제 금액 계산을 `checkoutModel`로 분리해 파생 상태가 첫 렌더 값에 고정되는 문제를 제거했다.
  - 주문 금액 라인을 `OrderLine` union 모델로 나누고 `OrderLineRow`가 그 모델을 소비하게 바꿨다.
  - 주문 상태 표시는 boolean props 5개 대신 `status: OrderStatus` 하나로 닫았다.

## 📚 이번 주 학습

- 학습 주제:
  - Props 설계, discriminated union, 파생 상태 제거, Context 도입 기준
- 배운 것 / 새로 적용한 것:
  - 컴포넌트를 바로 쪼개기 전에 모델을 먼저 나눠야 하는 경우가 있었다.
  - `OrderLineRow` 문제는 UI props 문제가 아니라 주문 금액 라인 모델이 없는 문제였다.
  - `Price`처럼 “공통 표시 컴포넌트”처럼 보여도 비즈니스 할인 로직이 숨어 있으면 계산 모델과 화면 표시가 서로 달라질 수 있다.

## 🤔 고민한 점 / 막혔던 부분

- `OrderLineRow`를 `Item`, `Fee`, `Discount` 컴포넌트로 바로 나눌지 고민했다. 이번에는 UI 분리보다 모델 부재가 먼저라고 보고 `ProductOrderLine`, `PaymentOrderLine`, `DiscountOrderLine` union을 먼저 만들었다.
- Context는 쓰지 않았다. 현재 문제는 props 전달 깊이가 아니라 계산 경계와 props 계약이 흐려진 데 있었다.
- 화면 자동 조작 검증은 시도했지만 Chrome/Safari 모두 Apple Events JavaScript 실행이 꺼져 있어 DOM 자동 클릭까지는 하지 못했다. 대신 계산 스모크, lint, build, dev 서버 응답을 확인했다.

## 🙋 피드백 받고 싶은 부분

- `OrderLine` 모델을 `checkoutModel` 안에 둔 판단이 적절한지 궁금합니다. 카드 즉시할인, 부분취소, 무료배송 쿠폰이 추가되면 같은 union을 확장하는 게 맞을까요, 아니면 계산 모델과 표시 모델을 더 분리해야 할까요?
- `OrderLineRow`를 하나의 renderer로 유지한 판단이 적절한지 보고 싶습니다. 지금은 모델이 닫혀 있어 컴포넌트 하나로도 읽힌다고 봤는데, 언제 `OrderSummary.Item`, `OrderSummary.Discount`처럼 의미 단위 컴포넌트로 나누는 게 나은지 기준이 궁금합니다.
- `Price`에서 VIP 할인 로직을 제거한 판단이 맞는지 봐주세요. 표시 컴포넌트가 비즈니스 규칙을 몰라야 한다는 쪽으로 정리했습니다.

## 검증

- `node --experimental-strip-types scripts/checkoutModel.spec.ts`
- `pnpm lint`
- `pnpm build`
- `pnpm dev --host 127.0.0.1 --port 5173`
- `curl -s http://127.0.0.1:5173/`

## AI 사용 표기

- AI가 냄새 후보 탐지, 문서 초안, 리팩터링 초안 작성에 참여했다.
- 최종 적용 범위는 11전략 판별표와 검증 결과를 기준으로 직접 선별했다.
