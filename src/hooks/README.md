# src/hooks

## 왜 훅이 `useSelect` 하나뿐인가

`Dialog`(`src/components/ui/dialog/index.tsx`)는 상태 로직을 custom hook으로 빼지 않고
Context + `useDialogContext`로 처리한다. Select와 Dialog는 겉보기엔 둘 다 "열림/닫힘"을
다루지만 풀어야 하는 문제가 다르다:

- **Select**: 마크업이 완전히 다른 3개 컴포넌트(Text/Size/Thumbnail)가 똑같은 동작(열림/닫힘·
  키보드 탐색·바깥 클릭·선택)을 공유해야 한다 → "하나의 동작, 여러 생김새"라 헤드리스 훅이
  맞는 도구다.
- **Dialog**: 마크업은 하나(compound 컴포넌트)지만 여러 조각(Trigger/Overlay/Content/Close)이
  상태 일부씩만 구독한다 → "여러 조각, 같은 상태" 문제라 Context가 맞는 도구다. 훅으로 한 번
  더 감싸면 `useContext(DialogContext)` 호출에 이름만 바꿔 다는 것과 다르지 않다.

## 바깥 클릭 감지(outside-click)를 별도 훅으로 안 뽑은 이유

`useSelect.ts`의 `containerRef` + `mousedown` 리스너는 select 도메인과 무관한 범용 패턴이라
`useOutsideClick`으로 분리할 수 있어 보인다. 하지만:

- 현재 이 저장소에서 실제 사용처는 `useSelect` 하나뿐이다.
- Dialog는 두 번째 후보처럼 보이지만 실제로는 필요 없다 — Dialog는 이미 `Dialog.Overlay`라는
  전체 화면 스크림 엘리먼트가 있어서 "오버레이 클릭 = 바깥 클릭"이 그 자체로 해결되어 있다
  (위치 계산 없이 CSS로 전체를 덮는 방식). 즉 Dialog는 outside-click 훅이 필요한 두 번째
  소비처가 아니다.

사용처가 하나뿐인 로직을 미리 분리하는 건 과설계(YAGNI)라 지금은 `useSelect` 안에 인라인으로
둔다. 정말 이 패턴이 필요한 두 번째 소비처가 생기면 그때 추출한다.
