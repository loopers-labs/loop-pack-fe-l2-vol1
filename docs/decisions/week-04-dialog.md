# Dialog 설계 결정

## 왜 Compound 패턴인가

Dialog는 Trigger·Overlay·Content·Title·Description·Close가 하나의 흐름으로 묶인다.
Context로 `open`/`onOpenChange`를 공유하면 prop drilling 없이 각 조각이 독립적으로 역할을 수행한다.
사용처는 필요한 조각만 골라 조립할 수 있어 유연성이 높다.

## Controlled / Uncontrolled 이중 API

`open` prop 유무로 자동 판별한다.

- `open` prop 없음 → Dialog 내부 `useState`로 관리 (uncontrolled)
- `open` prop 있음 → 외부 상태를 그대로 사용 (controlled)

controlled가 필요한 경우: 타이머 자동 닫기, 서버 응답 후 닫기 등 외부에서 열림/닫힘을 제어해야 할 때.

## Content / Overlay를 Portal로 렌더하는 이유

부모의 `overflow: hidden`이나 `z-index` 스택에 영향을 받지 않으려면
`document.body`에 직접 마운트해야 한다.
`createPortal`을 사용한다.

## Esc·오버레이 클릭 닫기 + 스크롤 잠금

Content가 마운트될 때 `document`에 `keydown` 리스너를 붙이고,
`document.body.style.overflow = 'hidden'`으로 배경 스크롤을 잠근다.
언마운트 시 둘 다 정리(cleanup)한다.

## 구현 순서

의존성 순서대로 작성한다. 아래껀 위에 걸 필요로 한다.

1. **Context + useDialogContext** — 모든 서브컴포넌트가 의존하는 기반
2. **Dialog 루트** — Context Provider + controlled/uncontrolled 판별
3. **Dialog.Trigger** — `onOpenChange(true)` 호출하는 버튼
4. **Dialog.Close** — `onOpenChange(false)` 호출 (Trigger와 대칭)
5. **Dialog.Title** — `<h2>` 래퍼
6. **Dialog.Description** — `<p>` 래퍼
7. **Dialog.Overlay** — Portal + 클릭 시 닫기
8. **Dialog.Content** — Portal + Esc 키 + 스크롤 잠금 (가장 복잡)
9. **마지막에 서브컴포넌트 붙이기** — `Dialog.Trigger = DialogTrigger` 등

## 레퍼런스

### Radix UI Dialog
- 서브컴포넌트: `Root / Trigger / Portal / Overlay / Content / Title / Description / Close`
- controlled/uncontrolled 둘 다 지원 — controlled는 `open`+`onOpenChange`, uncontrolled는 `defaultOpen`
- Portal·Overlay 분리 구조, Esc 자동 지원 (`onEscapeKeyDown`으로 커스텀 가능)

### Headless UI Dialog
- 서브컴포넌트: `Dialog / DialogPanel / DialogBackdrop / DialogTitle / Description / CloseButton`
- **완전한 controlled 전용** — `open` + `onClose` 필수, uncontrolled 없음
- Portal에 자동 렌더, DialogPanel 외부 클릭 시 닫힘

### 우리 구현과의 차이
- Radix의 `defaultOpen` 대신 `open` prop 유무로 controlled/uncontrolled 판별 (Radix보다 단순)
- Headless UI와 달리 uncontrolled도 지원
- Portal을 별도 서브컴포넌트로 분리하지 않고 Overlay·Content 내부에서 처리
