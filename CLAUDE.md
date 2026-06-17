# 프로젝트 작업 지침

React 19 + TypeScript + Vite 학습용 레포. 전역 기본 스택(Vue)이 아니라 **React**다.

## 기술 스택 및 버전

- 런타임/UI: React 19 (`react`, `react-dom`)
- 언어: TypeScript ~6.0 (strict, `tsconfig.app.json` 기준)
- 빌드: Vite 8
- 패키지 매니저: **pnpm** (npm/yarn 사용 금지)
- 품질 도구: ESLint 10 + typescript-eslint 8, Prettier 3.8, Husky + lint-staged
- 의존성은 임의로 추가/업그레이드하지 않는다. 필요 시 먼저 제안한다.

## 컴포넌트 작성 규칙

### 기반 규칙

- 1단계 하네스인 정적 분석 도구(ESLint, TypeScript)가 강제하는 규칙을 기반 규칙으로 따른다. 설정 파일(`eslint.config.js`·`tsconfig.app.json`·`.prettierrc.json`)이 단일 출처이며, 도구가 잡아내는 항목은 여기서 중복 서술하지 않는다.
  - Hooks 규칙, 미사용 변수/파라미터, 타입 전용 `import type` 분리, 포맷팅·스타일 등.
- 도구 경고(`warn` 포함)도 무시하지 않는다.

### 컴포넌트 구조

- 함수형 컴포넌트 + Hooks만 사용. 클래스 컴포넌트 금지.
- 컴포넌트 파일/함수명은 PascalCase, 1파일 1주요 컴포넌트(파일당 `export default` 1개).
- 기본 코드 분리 단위는 페이지 / 컴포넌트 / API.
- 조건부 렌더링은 early return 패턴을 우선한다.

### 네이밍

- 컴포넌트·상태·함수는 각 역할이 직관적으로 드러나게 네이밍한다.
- 이벤트 핸들러 함수명에 `onXXX` 패턴을 쓰지 않는다(`onXXX`는 props 전달용으로 예약, 핸들러는 `handleXXX`).

### 타입

- props 타입은 명시적으로 선언하고, Props interface는 컴포넌트 파일 상단에 정의한다. 불필요한 곳은 추론에 위임.
- 타입 단언(`as`) 지양 → 타입 가드·제네릭·정확한 타입 정의 사용. `any` 대신 `unknown` 후 좁히기.

### 비동기·에러 처리

- 비동기 로딩은 `Suspense`로, 에러는 `ErrorBoundary`로 처리한다.

## 코드 리뷰 규칙

리뷰/작업 완료 전 점검:

- [ ] `pnpm lint`, `pnpm build`(= `tsc -b && vite build`) 통과
- [ ] 변경 범위가 요청 범위를 벗어나지 않음 (요청한 것만 구현)
- [ ] 새 의존성 무단 추가 없음
