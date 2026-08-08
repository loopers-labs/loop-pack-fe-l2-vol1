# 프로젝트 작업 지침

Next.js 16 + React 19 + TypeScript 학습용 레포. 전역 기본 스택(Vue)이 아니라 **React**다.

## 기술 스택 및 버전

- 프레임워크: Next.js 16.2.10 (App Router, 빌드 도구는 Next 16 기본값인 Turbopack)
- 런타임/UI: React 19.2.4 (`react`, `react-dom`)
- 언어: TypeScript 5.9 (strict, `tsconfig.json` 기준)
- 상태: TanStack Query 5(서버) / nuqs 2(URL) / Zustand 5(클라이언트)
- 패키지 매니저: **pnpm** (npm/yarn 사용 금지)
- 품질 도구: ESLint 9 + eslint-config-next, Prettier 3, Vitest 4, Husky + lint-staged
- 의존성은 임의로 추가/업그레이드하지 않는다. 필요 시 먼저 제안한다.

## 컴포넌트 작성 규칙

### 기반 규칙

- 1단계 하네스인 정적 분석 도구(ESLint, TypeScript)가 강제하는 규칙을 기반 규칙으로 따른다. 설정 파일(`eslint.config.mjs`·`tsconfig.json`)이 단일 출처이며, 도구가 잡아내는 항목은 여기서 중복 서술하지 않는다.
  - Hooks 규칙, 미사용 변수/파라미터, 타입 전용 `import type` 분리, 포맷팅·스타일 등.
- 도구 경고(`warn` 포함)도 무시하지 않는다.

### 컴포넌트 구조

- 함수형 컴포넌트 + Hooks만 사용. 클래스 컴포넌트 금지(단, `getDerivedStateFromError`가 클래스 컴포넌트에만 존재하는 React 구조적 제약으로 인해 에러 바운더리는 예외 — `react-error-boundary`의 `ErrorBoundary` 사용)
- 파생 가능한 값의 useState 사용 금지
- 컴포넌트 파일/함수명은 PascalCase, 1파일 1주요 컴포넌트(파일당 `export default` 1개).
- 기본 코드 분리 단위는 페이지 / 컴포넌트 / API
- 조건부 렌더링은 early return 패턴을 우선한다

### Hooks 사용 원칙

- **state**: 렌더에 쓰이는 값은 state. 파생값은 렌더 중 직접 계산 — effect로 state에 복사 금지
- **useEffect**: 외부 시스템 동기화 전용. props/state 변화에 반응하거나 파생값을 계산하는 용도 금지
- **ref**: 렌더와 무관한 값 전용 — 렌더 중 `ref.current` 읽기/쓰기 금지

### 네이밍

- 컴포넌트·상태·함수는 의미없는 이름은 사용하지않고, 역할이 직관적으로 드러나게 네이밍한다.
- 이벤트 핸들러 함수명에 `onXXX` 패턴을 쓰지 않는다(`onXXX`는 props 전달용으로 예약, 핸들러는 `handleXXX`).

### 타입

- props 타입은 명시적으로 선언하고, Props interface는 컴포넌트 파일 상단에 정의한다. 불필요한 곳은 추론에 위임.

### 비동기·에러 처리

- 비동기 로딩은 `Suspense`로, 에러는 `ErrorBoundary`로 처리한다.

### 리스트 렌더링 key

- 고유 식별자(id) 우선. 재정렬·삽입·삭제 없는 파생 배열 + 자체 상태 없는 항목인 경우에만 index 예외 허용(`react/no-array-index-key`: warn).

## 컴포넌트 설계 원칙

- 컴포넌트의 Props가 5개를 넘으면 설계를 재검토
- children을 적극 활용해 합성(Composition) 우선
- Props Drilling이 3단계 이상이면 Context 또는 상태 관리 도입 검토
- 공통 컴포넌트는 비즈니스 로직을 포함하지 않음

## 상태 분류 기준

- 서버에서 오는 데이터 → 서버 상태 (TanStack Query)
- UI 전용 (모달 열림, 탭 선택) → 로컬 상태 (useState)
- URL에 반영되어야 하는 것 (필터, 페이지, 검색어) → URL 상태 (nuqs)
- 여러 컴포넌트가 공유해야 하는 것 → Context 또는 전역 상태 (Zustand)

## 코드 리뷰 규칙

리뷰/작업 완료 전 점검:

- [ ] `pnpm check`(= `test` → `lint` → `typecheck` → `build`) 통과
- [ ] 변경 범위가 요청 범위를 벗어나지 않음 (요청한 것만 구현)
- [ ] 새 의존성 무단 추가 없음
- [ ] console.log, 디버깅 코드 없음
