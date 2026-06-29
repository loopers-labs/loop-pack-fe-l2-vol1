# CLAUDE.md

## 프로젝트 개요

React 19 + Vite + TypeScript 프론트엔드 프로젝트.
1차 하네스(ESLint · Prettier · husky + lint-staged)로 커밋 게이트를 강제한다 — lint/format 미통과 시 커밋 불가.

## 코드

- 타입 침묵 금지: `as` / `eslint-disable` 쓰지 말 것. 타입으로 설명하라.
- 파생 가능한 값은 계산한다. `useState` + `useEffect`로 동기화하지 말 것.
- 기존 유틸·컴포넌트를 재사용한다. 비슷한 것을 새로 만들지 말 것.
- 에러는 명시적으로 처리한다. 빈 `catch {}` 금지.
- hook은 모든 호출을 마친 뒤 early return (조건부·early return 뒤 hook 금지).
- 요청받지 않은 기능·리팩터링을 추가하지 말 것. 시킨 범위만.
- 존재하지 않는 패키지·API를 지어내지 말 것. import는 실재하는 것만.

## 작업 방식

- 수정 전, 대상 파일을 먼저 읽을 것.
- 한 번에 대규모로 바꾸지 말 것. 작게 나눠서.

## 검증

- 코드·설정 변경 후 관련 검증(`pnpm lint` / `pnpm format:check` / `pnpm typecheck`)을 실행한다.

## 커밋

- `--no-verify` 금지. lint/format 게이트를 통과한 뒤에만 커밋한다.
- 커밋 메시지는 한국어로 작성한다.

## 환경

- 패키지 매니저: **pnpm** (npm/yarn 쓰지 말 것).
- Lint: ESLint flat config — typescript-eslint `recommended-type-checked` + `react-hooks` (핵심 규칙 `error`). TypeScript는 `strict`.
- Format: **Prettier 전담** (`semi: true`, `singleQuote`). ESLint에 포맷 룰을 넣지 말 것.

## 컴포넌트 설계 원칙

- 컴포넌트의 Props가 5개를 넘으면 설계를 재검토
- children을 적극 활용해 합성(Composition) 우선
- Props Drilling이 3단계 이상이면 Context 또는 상태 관리 도입 검토
- 공통 컴포넌트는 비즈니스 로직을 포함하지 않음

## 상태 분류 기준

- 서버에서 오는 데이터 → 서버 상태 (추후 TanStack Query)
- UI 전용 (모달 열림, 탭 선택) → 로컬 상태 (useState)
- URL에 반영되어야 하는 것 (필터, 페이지, 검색어) → URL 상태
- 여러 컴포넌트가 공유해야 하는 것 → Context 또는 전역 상태
