# React 19 컴포넌트 컨벤션

## 파일 및 컴포넌트 이름

- 컴포넌트 파일과 폴더는 `PascalCase` 사용
- 훅 커스텀 함수는 `use` 접두사의 `camelCase` 사용
- 컴포넌트 파일명과 기본 내보내기 이름 일치

## 컴포넌트 작성 방식

- 함수형 컴포넌트만 사용
- 기본 내보내기(`default export`) 대신 명명 내보내기(`named export`) 권장
- `React.FC`는 기본 props 타입과 children 처리 때문에 일반적으로 사용하지 않음
- 한 컴포넌트가 한 가지 일을 한다 — 책임이 두 개 이상이면 분리

## 타입 정의

- 컴포넌트 props는 `type` 별칭으로 정의
- props 구조는 가능한 한 명확하게 작성
- 선택적 props에는 `?`를 사용하고 기본값은 컴포넌트 내부에서 설정

## 상태와 훅

- 상태는 최소 단위로 분리하고, 하나의 컴포넌트가 너무 많은 상태를 가지지 않도록 함
- **파생 가능한 값은 계산한다** — `useState` + `useEffect`로 동기화하지 않는다 (최중요)
- `useMemo` / `useCallback`은 실제 성능 문제가 있을 때만 사용
- 커스텀 훅은 단일 책임을 가지도록 작성

```tsx
// 금지 — 파생값을 상태로 관리
const [items, setItems] = useState<Item[]>([]);
const [count, setCount] = useState(0);
useEffect(() => setCount(items.length), [items]);

// 권장 — 계산으로 파생
const [items, setItems] = useState<Item[]>([]);
const count = items.length;
```

## 렌더링과 JSX

- 하나의 컴포넌트는 하나의 책임 영역만 가지도록 분리
- 조건부 렌더링은 early return으로 — 단, 모든 훅 호출이 끝난 뒤에서만
- JSX 안에서 복잡한 로직은 별도의 함수로 분리
- 비동기 로직과 부수 효과는 `useEffect`로 분리

## Props와 이벤트

- 이벤트 핸들러 이름은 `onSubmit`, `onClick` 등으로 명명
- 컴포넌트 내부 함수는 `handleSubmit`, `handleClick` 등으로 명명
- 필요한 경우 destructuring으로 props를 명확히 전달

## React 19 특화

- React 19의 새로운 렌더링 기능을 고려해 컴포넌트는 선언형으로 작성
- 여러 상태를 가진 대형 컴포넌트는 하위 컴포넌트로 분리
- 필요 시 `useId`, `useSyncExternalStore`, `useTransition` 등 최신 훅을 적절히 사용
- 이 프로젝트는 Vite SPA이므로 Server Actions(`"use server"`)는 사용하지 않음

### `useActionState`

- 폼 액션의 상태 관리에 사용 (`useFormState` 대체)

```tsx
import { useActionState } from 'react';

const [state, formAction, isPending] = useActionState(submitAction, initialState);

<form action={formAction}>
  {state.error && <p>{state.error}</p>}
  <button type="submit" disabled={isPending}>
    제출
  </button>
</form>;
```

### `useOptimistic`

- 서버 응답 전 UI를 낙관적으로 업데이트

```tsx/
import { useOptimistic } from 'react';

const [optimisticTodos, addOptimistic] = useOptimistic(
  todos,
  (state, newTodo: Todo) => [...state, newTodo],
);
```

### `useTransition` (async 지원)

- React 19부터 async 함수를 트랜지션으로 감쌀 수 있음

```tsx
const [isPending, startTransition] = useTransition();

function handleSearch(query: string) {
  startTransition(async () => {
    const results = await fetchResults(query);
    setResults(results);
  });
}
```

### ref 콜백 클린업

- React 19에서 ref 콜백이 클린업 함수를 반환할 수 있음

```tsx
<input
  ref={(node) => {
    // setup
    return () => {
      // cleanup
    };
  }}
/>
```

## 리스트와 key prop

- `key`에는 배열 인덱스 대신 고유한 식별자(id 등) 사용
- `key`는 형제 간 고유하면 충분하며 전역 유일할 필요 없음
- 렌더링 중 생성한 값(`Math.random()`, `Date.now()`)을 `key`로 사용 금지

## React 19 `use()` 훅

- Context는 `useContext` 대신 `use(Context)` 사용 가능
- Promise를 `use(promise)`로 읽을 때는 반드시 `<Suspense>`로 감쌀 것
- `use()`는 조건문·루프 안에서도 호출 가능하나, 의도가 명확할 때만 사용

## Error Boundary와 Suspense

- 비동기 데이터 로딩은 `<Suspense fallback={...}>`으로 로딩 상태 처리
- 예측 불가 런타임 오류는 `<ErrorBoundary>`로 격리해 전체 트리 crash 방지
- `<Suspense>`와 `<ErrorBoundary>`는 중첩 범위를 최소화해 영향 범위를 좁게 유지

## 문서화

- 컴포넌트가 제공하는 props, 책임, 주요 동작을 주석 또는 문서로 간단히 정리
- 재사용 가능한 컴포넌트는 사용 예시를 함께 기록
