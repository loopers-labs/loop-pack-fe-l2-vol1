# React와 스타일링 컨벤션

## When to read

React 컴포넌트, Hook, 상태, 렌더링, Suspense, CSS를 작성하거나 변경할 때 읽는다.

## Source of truth

React와 JSX 정적 규칙은 `eslint.config.mjs`, 설치된 React 및 관련 패키지는 `package.json`과 `pnpm-lock.yaml`, 스타일 연결은 `postcss.config.mjs`가 우선한다.

## Rules

- 파생 가능한 값은 상태로 저장하지 말고 계산한다.
- `useEffect`는 외부 시스템과 동기화할 때만 사용한다. 렌더링 가능한 값을 맞추기 위한 동기화 effect를 만들지 않는다.
- 조건부 렌더링은 가능한 한 early return을 사용하되, React Hook 호출 순서는 항상 보존한다.
- 컴포넌트와 훅은 먼저 순수하고 예측 가능하게 작성하고, 수동 memoization을 기본값으로 삼지 않는다.
- `useMemo`, `useCallback`, `React.memo`는 기본 성능 습관으로 추가하지 않는다. 측정된 렌더링 병목이 있거나, memoized child/context value/custom hook 반환값처럼 참조 안정성이 실제 계약인 경우에만 사용하고 이유를 설명한다.
- React 컴포넌트는 `function ComponentName()` 선언을 기본으로 한다. 화살표 함수 컴포넌트는 HOC callback처럼 이름 없는 함수가 필요한 경우에만 사용한다.
- 재사용 가능한 컴포넌트는 명확한 props 타입을 가진다. props 타입은 인라인 객체 타입 대신 컴포넌트 위에 이름 있는 type alias로 분리한다. 예: `type ProductCardProps = { ... }`.
- 상태와 그 상태를 사용하는 로직이 함께 생기면 커스텀 훅으로 분리한다. 컴포넌트 본문에는 JSX를 이해하는 데 필요한 최소한의 분기와 이벤트 연결만 두고, 상태 전이, 파생값 계산, effect, 비동기 호출, 여러 핸들러가 엮인 로직은 `useFeatureName` 형태의 훅으로 이동한다.
- boolean prop이 늘어나 컴포넌트 상태 조합이 복잡해지면 컴포넌트 분리나 composition을 우선 검토한다.
- 이벤트 핸들러는 동작 의도가 드러나는 이름을 사용한다. 예: `handleSubmit`, `handleIncrement`.
- 조건부 렌더링은 JSX 안에서 `&&`, `||`, `??`, 중첩 ternary를 섞지 않는다. 조건을 화면에 드러내야 하면 `@ilokesto/utilinent`의 `Show`를 사용한다.
- 목록 렌더링은 JSX 안에서 직접 `.map()`을 펼치지 않고 `@ilokesto/utilinent`의 `For`를 사용한다. 렌더링되는 item에는 안정적인 key를 제공한다. index key는 순서가 절대 바뀌지 않는 정적 목록에만 허용한다.
- suspense boundary와 error boundary는 `@suspensive/react`의 `Suspense`, `ErrorBoundary`를 사용한다. `React.Suspense`, class 기반 error boundary, `react-error-boundary`를 새로 도입하지 않는다.
- TanStack Query의 suspense data fetching은 `@suspensive/react-query`의 `SuspenseQuery`, `SuspenseQueries`, `SuspenseInfiniteQuery` 컴포넌트를 우선 사용한다. 이 프로젝트는 TanStack Query v5를 쓰므로 `@suspensive/react-query` import를 `@suspensive/react-query-5` npm alias로 설치한다. `useSuspenseQuery`/`useSuspenseInfiniteQuery` 훅으로 suspense 발생 지점을 내부 컴포넌트에 숨기지 않는다.
- `dangerouslySetInnerHTML`은 기본적으로 금지한다. 꼭 필요하면 입력 신뢰 경계와 sanitizing 근거를 코드 리뷰에서 설명해야 한다.

### 스타일링

- 현재 프로젝트는 전역 CSS와 일반 CSS 파일을 사용한다.
- 색상, 폰트, 공통 토큰은 가능한 한 CSS custom properties로 표현한다.
- focus 스타일은 제거하지 않는다. 커스텀 interaction을 만들면 `:focus-visible`을 함께 설계한다.
- 반응형 처리는 컴포넌트/섹션 스타일 근처에 배치해 변경 맥락을 유지한다.
- inline style은 런타임 계산값처럼 CSS로 표현하기 어려운 경우에만 사용한다.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

UI 변경은 [`../accessibility.md`](../accessibility.md)의 수동 체크리스트도 확인한다.
