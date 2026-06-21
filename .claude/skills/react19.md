# React 19 스킬 가이드

React 19 + TypeScript + Vite SPA. Server Actions 미사용.

## 컴포넌트

- 함수형만, `React.FC` 금지, arrow function, named export 권장
- props는 `type` 별칭으로 정의

```tsx
type ButtonProps = {
  label: string;
  variant?: 'primary' | 'secondary';
  onClick: () => void;
};

export const Button = ({ label, variant = 'primary', onClick }: ButtonProps) => (
  <button onClick={onClick}>{label}</button>
);
```

## 상태 관리

- 파생값은 계산 — `useState` + `useEffect` 동기화 금지
- `useMemo` / `useCallback`은 실측 성능 문제 시에만
- 상태는 최소 단위로 분리

```tsx
// 금지
const [items, setItems] = useState<Item[]>([]);
const [count, setCount] = useState(0);
useEffect(() => setCount(items.length), [items]);

// 권장
const [items, setItems] = useState<Item[]>([]);
const count = items.length;
```

## React 19 API

### `use()`

```tsx
const user = use(userPromise); // Promise — <Suspense> 필수
const value = use(MyContext); // useContext 대체
```

### `useActionState`

```tsx
const [state, formAction, isPending] = useActionState(loginAction, initialState);
```

### `useOptimistic`

```tsx
const [optimistic, addOptimistic] = useOptimistic(todos, (s, t: Todo) => [...s, t]);
```

### `useTransition` (async 지원)

```tsx
const [isPending, startTransition] = useTransition();
startTransition(async () => {
  /* ... */
});
```

### ref 콜백 클린업

```tsx
<input
  ref={(node) => {
    /* setup */ return () => {
      /* cleanup */
    };
  }}
/>
```

## Error Boundary + Suspense

- 비동기: `<Suspense fallback={...}>`, 런타임 오류: `<ErrorBoundary>`
- 중첩 범위 최소화

## 네이밍 / key

- props 이벤트: `onX`, 내부 핸들러: `handleX`
- key: 고유 식별자 사용, 인덱스 / `Math.random()` / `Date.now()` 금지
