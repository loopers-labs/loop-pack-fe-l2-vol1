# React 19 스킬 가이드

이 프로젝트는 React 19 + TypeScript를 사용한다. 코드 생성 시 아래 규칙을 따른다.

## 컴포넌트 작성

- 함수형 컴포넌트만 사용, `React.FC` 사용하지 않음
- arrow function 형태로 작성 (`function` 선언 대신 `const` + 화살표 함수)
- named export 권장, default export 지양
- props 타입은 `type` 별칭으로 정의

```tsx
type ButtonProps = {
  label: string;
  variant?: 'primary' | 'secondary';
  onClick: () => void;
};

export const Button = ({ label, variant = 'primary', onClick }: ButtonProps) => {
  return (
    <button onClick={onClick}>
      {label}
    </button>
  );
};
```

## React 19 신규 기능

### `use()` 훅

- Context 읽기: `use(MyContext)` (`useContext` 대체 가능)
- Promise 읽기: `use(promise)` — 반드시 `<Suspense>`로 감쌀 것
- 조건문·루프 안에서도 호출 가능하나 의도가 명확할 때만

```tsx
import { use } from 'react';

const UserName = ({ userPromise }: { userPromise: Promise<User> }) => {
  const user = use(userPromise);
  return <span>{user.name}</span>;
};
```

### `useActionState`

- 폼 액션의 상태 관리에 사용
- `useFormState`를 대체

```tsx
import { useActionState } from 'react';

const LoginForm = () => {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  return (
    <form action={formAction}>
      {state.error && <p>{state.error}</p>}
      <button type="submit" disabled={isPending}>로그인</button>
    </form>
  );
};
```

### `useOptimistic`

- 서버 응답 전 UI를 낙관적으로 업데이트

```tsx
import { useOptimistic } from 'react';

const TodoList = ({ todos }: { todos: Todo[] }) => {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo],
  );
  // ...
};
```

### `useTransition`

- 비긴급 상태 업데이트를 트랜지션으로 감싸 UI 블로킹 방지
- async 함수 지원 (React 19부터)

```tsx
const [isPending, startTransition] = useTransition();

const handleSearch = (query: string) => {
  startTransition(async () => {
    const results = await fetchResults(query);
    setResults(results);
  });
};
```

### Server Actions (`"use server"`)

- 이 프로젝트는 Vite SPA이므로 Server Actions는 사용하지 않음
- 서버 통신은 TanStack Query + fetch 패턴 사용

## 상태 관리 원칙

- 파생 가능한 값은 계산한다 — `useState` + `useEffect` 동기화 금지
- `useMemo` / `useCallback`은 실제 성능 문제가 있을 때만
- 상태는 최소 단위로 분리

```tsx
// 금지 — 파생값을 상태로 관리
const [items, setItems] = useState<Item[]>([]);
const [count, setCount] = useState(0);
useEffect(() => setCount(items.length), [items]);

// 권장 — 계산으로 파생
const [items, setItems] = useState<Item[]>([]);
const count = items.length;
```

## Error Boundary + Suspense

- 비동기 데이터는 `<Suspense fallback={...}>`로 로딩 상태 처리
- 런타임 오류는 `<ErrorBoundary>`로 격리
- 중첩 범위를 최소화해 영향 범위를 좁게 유지

```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <Suspense fallback={<Skeleton />}>
    <UserProfile />
  </Suspense>
</ErrorBoundary>
```

## 이벤트 핸들러 네이밍

- props: `onSubmit`, `onClick`, `onChange`
- 내부 함수: `handleSubmit`, `handleClick`, `handleChange`

## key prop

- 배열 인덱스 대신 고유 식별자 사용
- `Math.random()`, `Date.now()` 금지

## ref 콜백 클린업 (React 19)

- ref 콜백에서 클린업 함수를 반환할 수 있음

```tsx
<input ref={(node) => {
  // setup
  return () => {
    // cleanup
  };
}} />
```
