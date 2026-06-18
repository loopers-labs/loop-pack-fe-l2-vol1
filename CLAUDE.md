# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Loopers 프론트엔드 과정(TypeScript · React · Next.js)의 과제 제출 레포입니다.
현재 스택: React 19 + Vite + TypeScript. 4주차부터 Next.js로 전환 예정.
패키지 매니저는 **pnpm** 전용 — `npm`/`yarn` 사용 금지.

## 주요 명령어

```bash
pnpm install       # 의존성 설치
pnpm dev           # 개발 서버 (Vite HMR)
pnpm build         # tsc -b && vite build
pnpm preview       # 빌드 결과물 미리보기
```

## 코드 규칙

### ESLint (flat config, `eslint.config.js`)

- `react-hooks/rules-of-hooks`: **error** — Hook 규칙 위반은 커밋 불가
- `react-hooks/exhaustive-deps`: **error** — 의존성 배열 누락은 커밋 불가
- `typescript-eslint` recommended + `eslint-plugin-react` flat recommended 적용
- 새 `any` / `as` / `@ts-ignore` / `eslint-disable` 추가 금지 — 경고를 우회하지 말 것

### Husky pre-commit 게이트

`pnpm exec lint-staged` 실행 — lint/prettier 미통과 시 커밋 차단.
`--no-verify` 우회 금지.

## 코드 품질 기준

- **파생 가능한 값은 계산한다** — `useState` + `useEffect` 동기화 대신 파생값으로 처리
- 이름에 의도가 드러나야 한다 (`data` / `temp` / `flag` 지양)
- 한 함수/컴포넌트는 한 가지 책임
- 조건부 렌더링은 early return으로 (단, 모든 hook 호출 이후에)
- `catch(e) {}` 빈 catch 금지 — 에러를 명시적으로 처리
- 기존 유틸 재사용 — 유사한 코드 중복 생성 금지
- any 타입 사용 금지 — 명시적 타입 정의

## React 컴포넌트 타입 규칙

```tsx
// ❌ React.FC 사용 금지
const Component: React.FC<Props> = ({ name }) => ...

// ✅ Props 타입 직접 정의
const Component = ({ name }: Props) => ...
```

## Never Do

- 의도 없는 네이밍 금지 (`data`, `temp`, `doStuff`, `Comp`, `Card1`)
- 컴포넌트: PascalCase + 역할이 드러나는 이름 / 함수: 동사+목적어 / 상수: UPPER_SNAKE_CASE
- boolean: `is/has/should/can` 접두사 사용, 이중 부정 금지 (`notDisabled` ❌)
- 한 컴포넌트에 API 호출 + 비즈니스 로직 + UI 렌더링 혼재 금지
- 삼항 연산자 3중 중첩 금지
