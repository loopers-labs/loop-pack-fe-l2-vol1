# 컴포넌트 컨벤션

## 파일 / 이름

- 커스텀 훅: `use` 접두사 + `camelCase`
- 파일명과 내보내기 이름 일치

## Server/Client Component 경계

- Client 경계는 최대한 하위(leaf 컴포넌트)로 — 상위를 Client로 선언하면 그 아래 트리 전체가 Client Component가 됨
- Server Component를 Client Component의 children/props로 전달해 Client 경계를 최소화하는 합성(Composition) 우선 고려
- 함수형 컴포넌트만 작성, `React.FC` 금지 — Server Component는 async 함수일 수 있어 `React.FC` 시그니처와 맞지 않음

## 작성 규칙

- named export 권장
- props는 `type` 별칭으로 정의, 선택적 props는 `?` + 컴포넌트 내부 기본값
- 한 컴포넌트 = 한 책임, 두 가지 이상을 하고 있다면 분리

## 데이터 조회 / 변경

- Client Component의 데이터 조회 훅은 `fetch`/`axios` 등 통신 구현에 직접 의존하지 않는다 — service 함수만 호출한다 (DIP). Server Component에서 직접 `fetch`하는 경우는 이 규칙 대상 아님
- mutation은 Server Actions을 우선 고려, 클라이언트 상태만 다루는 경우에 한해 이벤트 핸들러 유지
- 비동기/부수효과는 가능하면 Server Component/Server Action으로 처리, 클라이언트에서 불가피한 경우에만 `useEffect`로 분리

## 상태와 훅

- **파생값은 계산** — `useState` + `useEffect` 동기화 금지
- `useMemo` / `useCallback`은 실측 성능 문제 시에만
- 커스텀 훅은 단일 책임
- URL에 반영되어야 하는 값(필터, 페이지, 검색어)은 Next Router(`useSearchParams`, `useRouter`) 기반 URL 상태로 관리

## 상태 분류 기준

- 서버에서 오는 데이터 → Server Component에서 조회, Client에서 불가피한 경우 데이터 조회 훅(service 함수 경유)으로 조회
- UI 전용 상태(모달 열림, 탭 선택) → 로컬 상태(`useState`)
- 여러 컴포넌트가 공유해야 하는 상태 → Context 또는 전역 상태

## `useSyncExternalStore` 선택 기준

- React 외부 store 또는 변경 가능한 브라우저 API를 실제로 구독할 때만 사용
- 단순 마운트 판별 → `useState(false)` + 마운트 effect 사용
- 외부 store가 없는데 mount flag를 만들기 위한 빈 `subscribe` 함수 사용 금지
- SSR 지원 시 `getServerSnapshot`은 서버와 최초 클라이언트 hydration에서 정확히 같은 값 반환
- `getServerSnapshot` 생략 → 해당 영역을 의도적으로 클라이언트 전용 렌더링하고 Suspense fallback을 사용할 때만 검토
- 서버에서 외부 store 초기값을 제공할 수 있으면 동일한 값을 반환하는 `getServerSnapshot` 제공

## JSX / 렌더링

- 조건부 렌더링은 early return (훅 호출 이후)
- 복잡한 로직은 별도 함수로 분리

## 설계 원칙

- Props가 5개를 넘으면 설계를 재검토
- 하나의 상태를 표현하는 여러 boolean props는 enum/union으로 통합
- Props Drilling이 3단계 이상이면 Context 또는 상태 관리 도입 검토
- 공통 컴포넌트는 비즈니스 로직을 포함하지 않음

## key

- 고유 식별자 사용, 인덱스 / `Math.random()` / `Date.now()` 금지

## React 19 특화

- `use()`, `useActionState`, `useOptimistic`, `useTransition(async)`, ref 콜백 클린업 활용

## 로딩 / 에러 (App Router)

- 라우트 단위 로딩/에러는 App Router 파일 컨벤션 우선 사용: `loading.tsx` / `error.tsx` / `not-found.tsx`
- 라우트보다 좁은 범위(컴포넌트 단위)의 비동기/에러 처리에는 `<Suspense>` / `<ErrorBoundary>` 직접 사용
- 중첩 범위 최소화
