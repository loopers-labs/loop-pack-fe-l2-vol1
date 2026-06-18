# 프론트엔드 컨벤션

컴포넌트 새로 짜거나 리팩토링할 때 펼쳐보는 용도

## 파일 내부 순서

TODO: 순서가 없으면 코드를 읽을 때 어디에 뭐가 있는지 계속 찾아야 하므로 항상 이 순서로 작성

```tsx
// 1. 타입
interface TodoItemProps {
  id: string;
  text: string;
  isDone: boolean;
  onToggle: (id: string) => void; // 밖에서 받는 콜백은 on*
}

// 2. 컴포넌트 바깥 상수 (렌더마다 새로 만들 필요 없는 값)
const MAX_TEXT_LENGTH = 100;

// 3. 컴포넌트
export function TodoItem({ id, text, isDone, onToggle }: TodoItemProps) {
  // 훅
  const [isEditing, setIsEditing] = useState(false);

  // 파생값 — 훅에서 가져온 원본 데이터를 가공해서 만든 값
  // useState 없이 그냥 계산만 함. 원본이 바뀌면 자동으로 같이 바뀜
  const isLongText = text.length > MAX_TEXT_LENGTH;

  // 핸들러 내부 구현은 handle*
  const handleToggle = () => {
    onToggle(id); // 처리 후 부모 콜백 호출
  };

  // early return — 렌더링 할 수 없는 상태는 여기서 차단
  if (!text) return null;

  // 렌더링
  return (
    <li>
      <input type="checkbox" checked={isDone} onChange={handleToggle} />
      <span>{isLongText ? text.slice(0, MAX_TEXT_LENGTH) + '...' : text}</span>
    </li>
  );
}
```

## 네이밍

컴포넌트 이름은 PascalCase, 기능 기준으로 지을 것 (화면 이름 X)

이벤트는 `on` / `handle` 구분
부모한테 prop으로 콜백을 받고 내부에서 호출하는 구조가 많은데 이 경우 이름이 같으면 "이게 받은 건지 내가 만든 건지" 코드만 봐서는 모름

```tsx
// on / handle 구분
function TodoItem({ onDelete }) {
  // onDelete = 부모한테 받은 것
  const handleDelete = () => {
    // handleDelete = 내가 만든 것
    if (!confirm('삭제할까요?')) return;
    onDelete(); // 확인 후 부모 콜백 호출
  };
  return <button onClick={handleDelete}>삭제</button>;
}
```

boolean은 `is` / `has` / `should` 붙이기!
`loading`은 타입을 모름. `isLoading`은 읽는 순간 true/false인 거 앎

커스텀 훅은 `use` 접두사 camelCase 형태 `useProducts`, `useCartState`

리스트 key에 배열 인덱스 쓰지 말 것
목록 순서가 바뀌거나 중간 항목이 삭제되면 React가 어떤 게 어떤 건지 헷갈려서 UI가 엉뚱하게 업데이트 됨
`item.id`처럼 항목 자체를 식별하는 값을 사용할 것

## 분리 기준

150줄 넘거나 props 5~7개 넘으면 쪼개기 (하나의 컴포넌트가 너무 많은 작업을 하고 있지 않도록 할 것)
props는 시그니처에서 구조분해

## 폴더 구조

타입별(`components/`, `hooks/`, `utils/`)로 묶지 않음(기능 하나 수정할 때 폴더 세 군데 왔다 갔다 해야 함)
기능별(`features/cart/`)로 묶을 것

공용 UI만 `components/` 같은 공유 폴더로 분리

## 테스트

props 줬을 때 기대한 결과가 나오는지, 클릭 등의 입력에 핸들러가 잘 호출되는지 확인할 것
테스트가 어려울 경우 컴포넌트가 일을 너무 많이 한다는 신호이므로 쪼갤 것

## 접근성

네이티브 요소를 감쌀 때 `onBlur`, `onKeyDown` 같은 이벤트 prop 그대로 forward
클릭 동작엔 키보드도 (Enter/Space), 닫기엔 Esc, 목록 이동엔 화살표
이미지엔 `alt`, 폼 입력엔 라벨

## 린트가 자동으로 막는 것들

무조건 error 레벨로 간주, commit 불가

| 금지                       | 이유                                                  |
| -------------------------- | ----------------------------------------------------- |
| `dangerouslySetInnerHTML`  | XSS                                                   |
| `any`                      | 타입 안전성 붕괴                                      |
| `@ts-ignore`               | 침묵 금지. `@ts-expect-error` + 이유 10자 이상만 허용 |
| `eslint-disable` 설명 없이 | 왜 끄는지 주석 필수                                   |
| 빈 `catch {}`              | 에러 삼키는 거 금지                                   |
| 처리 안 된 Promise         | `no-floating-promises`                                |
| 없는 패키지 import         | AI 환각 방지                                          |
| 조건부 hook / deps 누락    | `rules-of-hooks`, `exhaustive-deps`                   |
