# 데모 페이지 개선 — Dialog 영역 스펙

## 목표

시작 페이지 Dialog 영역을 데모 쇼케이스로 재구성한다. Select 영역(`260710-demo-page-select.spec.md`)과 짝을 이룬다.

## 비범위

- Dialog 컴포넌트 자체의 기능 변경 (compound·이중 API·Portal·스크롤락·중첩 스택은 완성돼 있음)
- 포커스 트랩·ARIA — 과제 명시 범위 밖

## 확정 목표

Dialog 데모 4종. 스타일은 Select 영역과 같은 톤(캡션 + 카드).

1. **기본 컨텐츠** — uncontrolled. Trigger → Overlay + Content(Title·Description·본문·Close). Base UI 메인 데모 구조
2. **Form** — Radix 'Close after asynchronous form submission' 패턴. controlled + `onSubmit`에서 비동기 저장 후 `setOpen(false)`, 저장 중 제출 버튼 비활성(중복 제출 방지), 저장 결과를 데모 아래 표시
3. **Nested** — 중첩 2단. 위 Dialog가 열린 상태에서 ESC/오버레이는 최상단만 닫힘(dialogStack 동작 확인)
4. **Close confirmation** — Base UI 예시 차용. 작성 중 텍스트가 있으면 닫기 시도(ESC·오버레이·닫기 버튼)를 `onOpenChange`에서 가로채 확인 Dialog를 중첩으로 띄움. [계속 작성] / [버리기]

## 조사 결과

- Radix Dialog Examples: async form 제출 후 닫기(controlled + preventDefault + 완료 후 setOpen(false)), scrollable overlay, custom portal container
- Base UI Dialog Examples: State, Nested dialogs, **Close confirmation**(textarea 입력 있으면 닫기 시 확인), scroll 변형들
- 기존 `DialogDemo.tsx`: uncontrolled/controlled 2개, 무스타일 — 전면 재작성 대상
- Dialog 컴포넌트: controlled 가로채기 가능 — ESC/오버레이도 `requestOpenChange → onOpenChange`로 흐르므로 사용처가 `open`을 유지하면 닫기가 거부된다 (`Dialog.tsx`)

## 결정 사항

- D1: 기존 controlled 단독 데모는 제거 — Form·Close confirmation이 controlled 사용법을 실전 맥락으로 보여줌
- D2: Form 데모의 비동기 저장은 setTimeout 흉내 — mock API 추가는 과함
- D3: 문구는 커머스 맥락(배송 안내·리뷰 작성·장바구니·문의)으로

## 완료 조건

- [x] Dialog 영역에 4개 데모가 Select 영역과 같은 톤으로 렌더된다
- [x] 기본: 열기 → Title/Description/본문 표시, ESC·오버레이·닫기 버튼으로 닫힘
- [x] Form: 제출 → 저장 중 버튼 비활성 → 완료 후 자동 닫힘 + 결과 표시
- [x] Nested: 2단 중첩에서 ESC가 최상단만 닫는다
- [x] Close confirmation: 내용 있을 때 ESC/오버레이/닫기 → 확인 Dialog, [버리기]만 실제로 닫힘
- [x] 기존 테스트 통과, `pnpm build` · `pnpm lint` 통과

## 태스크

- T1: DialogDemo.tsx 전면 재작성 (4종) — fulfills: 1~5
- T2: page.tsx Dialog 섹션 헤더 정리 — fulfills: 1
- T3: 브라우저 검증 (4종 시나리오) — fulfills: 2~5
