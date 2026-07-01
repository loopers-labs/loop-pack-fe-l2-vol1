# React 컴포넌트 컨벤션

## 파일 / 이름

- 컴포넌트: `PascalCase`, 커스텀 훅: `use` 접두사 `camelCase`
- 파일명과 내보내기 이름 일치

## 작성 규칙

- 함수형 컴포넌트만, `React.FC` 금지, named export 권장
- props는 `type` 별칭, 선택적 props는 `?` + 내부 기본값
- 한 컴포넌트 = 한 책임, 두 개 이상이면 분리

## 상태와 훅

- **파생값은 계산** — `useState` + `useEffect` 동기화 금지
- `useMemo` / `useCallback`은 실측 성능 문제 시에만
- 커스텀 훅은 단일 책임

## JSX / 렌더링

- 조건부 렌더링은 early return (훅 호출 이후)
- 복잡한 로직은 별도 함수로 분리
- 비동기/부수효과는 `useEffect`로 분리

## 설계 원칙

- Props가 5개를 넘으면 설계를 재검토
- 하나의 상태를 표현하는 여러 boolean props는 enum/union으로 통합한다
- children을 적극 활용해 합성(Composition) 우선
- Props Drilling이 3단계 이상이면 Context 또는 상태 관리 도입 검토
- 공통 컴포넌트는 비즈니스 로직을 포함하지 않음

## 상태 분류 기준

- 서버에서 오는 데이터 → 서버 상태 (추후 TanStack Query)
- UI 전용 (모달 열림, 탭 선택) → 로컬 상태 (`useState`)
- URL에 반영되어야 하는 것 (필터, 페이지, 검색어) → URL 상태
- 여러 컴포넌트가 공유해야 하는 것 → Context 또는 전역 상태

## key

- 고유 식별자 사용, 인덱스 / `Math.random()` / `Date.now()` 금지

## React 19 특화

- `use()`, `useActionState`, `useOptimistic`, `useTransition(async)`, ref 콜백 클린업
- Vite SPA — Server Actions 미사용

## Error Boundary + Suspense

- 비동기: `<Suspense>`, 런타임 오류: `<ErrorBoundary>`
- 중첩 범위 최소화
