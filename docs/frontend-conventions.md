# Frontend Conventions

React 19 + Vite + TypeScript 프로젝트에서 컴포넌트를 작성하거나 리팩토링할 때 따르는 기준이다.  
스타일과 포맷은 Prettier와 ESLint가 담당하므로 이 문서에는 구조, 네이밍, 분리 기준만 적는다.

## 기본 원칙

- 기존 코드의 구조와 네이밍을 우선 따른다.
- 새 라이브러리는 임의로 추가하지 않는다. 필요하면 먼저 이유를 설명하고 확인받는다.
- 한 컴포넌트는 한 가지 책임만 가진다.
- 렌더링에 필요한 값은 `state` 또는 props에서 직접 계산한다.
- 파생값을 별도 `state`로 복사하지 않는다.
- `useEffect`는 외부 시스템 동기화에만 사용한다. props/state 변화에 맞춰 값을 복사하는 용도로 쓰지 않는다.

## 파일 내부 순서

파일은 아래 순서를 유지한다.

1. import
2. 타입과 interface
3. 컴포넌트 바깥 상수
4. 컴포넌트
5. 훅 호출
6. 파생값 계산
7. 이벤트 핸들러
8. early return
9. JSX

```tsx
interface TodoItemProps {
  id: string;
  text: string;
  isDone: boolean;
  onToggle: (id: string) => void;
}

const MAX_TEXT_LENGTH = 100;

export function TodoItem({ id, text, isDone, onToggle }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  const isLongText = text.length > MAX_TEXT_LENGTH;

  const handleToggle = () => {
    onToggle(id);
  };

  if (!text) return null;

  return (
    <li>
      <input type="checkbox" checked={isDone} onChange={handleToggle} />
      <span>{isLongText ? `${text.slice(0, MAX_TEXT_LENGTH)}...` : text}</span>
    </li>
  );
}
```

## 네이밍

- 컴포넌트 이름은 `PascalCase`로 작성한다.
- 컴포넌트 이름은 화면 위치보다 기능과 역할을 기준으로 짓는다.
- 부모에게 받은 이벤트 prop은 `on{Event}`로 작성한다.
- 컴포넌트 내부에서 구현한 이벤트 핸들러는 `handle{Event}`로 작성한다.
- boolean 값은 `is`, `has`, `should`, `can` 중 하나로 시작한다.
- 커스텀 훅은 `use`로 시작하고 camelCase로 작성한다.

```tsx
function TodoItem({ onDelete }: { onDelete: () => void }) {
  const handleDelete = () => {
    if (!confirm('삭제할까요?')) return;
    onDelete();
  };

  return <button onClick={handleDelete}>삭제</button>;
}
```

## Props

- Props 타입은 컴포넌트 위에 `ComponentNameProps`로 정의한다.
- Props는 함수 시그니처에서 구조분해한다.
- Props가 7개를 넘으면 분리 또는 합성 패턴을 검토한다.
- 콜백 prop은 구체적인 이벤트 이름으로 작성한다.

```tsx
interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onSelect: (productId: string) => void;
}

export function ProductCard({
  product,
  isSelected,
  onSelect,
}: ProductCardProps) {
  // ...
}
```

## State와 파생값

- 서버 응답, 사용자 입력, UI 상태처럼 원본이 되는 값만 state로 둔다.
- props/state에서 계산할 수 있는 값은 렌더 중에 계산한다.
- `useMemo`는 계산 비용이 크거나 참조 안정성이 실제로 필요할 때만 사용한다.

```tsx
const [items, setItems] = useState<Item[]>([]);

const isEmpty = items.length === 0;
const selectedItems = items.filter(item => item.isSelected);
```

## 렌더링

- 렌더링할 수 없는 상태는 early return으로 먼저 처리한다.
- 복잡한 조건식을 JSX 안에 길게 넣지 않는다. 위에서 변수로 분리한다.
- 리스트 key에 배열 인덱스를 쓰지 않는다.
- key는 `item.id`처럼 항목 자체를 안정적으로 식별하는 값을 사용한다.

```tsx
if (items.length === 0) {
  return <EmptyState />;
}

return items.map(item => <ItemRow key={item.id} item={item} />);
```

## 컴포넌트 분리 기준

아래 중 하나라도 해당하면 분리를 검토한다.

- 컴포넌트가 150줄을 넘는다.
- Props가 7개를 넘는다.
- JSX 조건 분기가 많아 한눈에 흐름이 보이지 않는다.
- 테스트를 작성하기 어렵다.
- 데이터 가공, 이벤트 처리, 렌더링 책임이 한 파일에 과하게 섞여 있다.

분리할 때는 기능 단위로 쪼갠다. 단순히 줄 수를 줄이기 위한 무의미한 래퍼 컴포넌트는 만들지 않는다.

## 폴더 구조

- 기본은 기능별 폴더 구조를 사용한다.
- `components`, `hooks`, `utils`처럼 타입별로 흩어놓지 않는다.
- 공용 UI만 공유 폴더에 둔다.

```txt
src/
  features/
    cart/
      CartPage.tsx
      CartItem.tsx
      useCart.ts
      cartUtils.ts
  components/
    Button.tsx
    Modal.tsx
```

## 접근성

- 클릭 가능한 요소는 가능한 한 `button`, `a`, `input` 같은 네이티브 요소를 사용한다.
- 커스텀 인터랙션이 필요하면 키보드 동작도 함께 구현한다.
- 클릭 동작은 Enter/Space를 지원한다.
- 닫기 동작은 Esc를 지원한다.
- 이미지에는 의미 있는 `alt`를 작성한다.
- 폼 입력에는 연결된 label을 제공한다.
- 래퍼 컴포넌트는 `onBlur`, `onKeyDown`, `aria-*` 같은 접근성 관련 prop을 막지 않고 전달한다.

## 테스트 기준

- Props를 주면 기대한 UI가 렌더링되는지 확인한다.
- 사용자가 클릭, 입력, 제출했을 때 올바른 핸들러가 호출되는지 확인한다.
- 복잡한 로직은 컴포넌트 밖의 순수 함수로 분리해 테스트한다.
- 테스트가 지나치게 어렵다면 컴포넌트 책임이 큰지 먼저 확인한다.

## 금지 규칙

아래 항목은 사용하지 않는다.

| 금지                       | 대안 또는 이유                           |
| -------------------------- | ---------------------------------------- |
| `dangerouslySetInnerHTML`  | XSS 위험. 반드시 필요한 경우 별도 검토   |
| `any`                      | 타입을 구체화하거나 `unknown` 후 좁히기  |
| `@ts-ignore`               | `@ts-expect-error`와 10자 이상 이유 사용 |
| 설명 없는 `eslint-disable` | 끄는 이유를 주석으로 남기기              |
| 빈 `catch {}`              | 에러 처리 또는 명시적 무시 이유 작성     |
| 처리하지 않은 Promise      | `await`, `void`, 명시적 에러 처리        |
| 없는 패키지 import         | `package.json` 확인 후 사용              |
| 조건부 hook 호출           | hook은 항상 컴포넌트 최상위에서 호출     |

## 작업 전 체크리스트

코드를 작성하기 전에 아래를 확인한다.

- 기존에 같은 역할을 하는 컴포넌트나 훅이 있는가?
- 새 상태가 정말 필요한가, 아니면 props/state에서 계산할 수 있는가?
- `useEffect` 없이 더 단순하게 만들 수 있는가?
- 컴포넌트 이름과 props 이름만 보고 역할을 이해할 수 있는가?
- 접근성 기본 동작을 네이티브 요소로 해결할 수 있는가?

## 작업 후 체크리스트

작업이 끝나면 아래를 확인한다.

- `pnpm lint` 통과
- `pnpm typecheck` 통과
- 필요한 경우 `pnpm build` 통과
- 컴포넌트가 150줄 또는 props 7개 기준을 넘지 않는지 확인
- 리스트 key에 인덱스를 쓰지 않았는지 확인
- 새 라이브러리나 새 패턴을 도입했다면 이유가 명확한지 확인
