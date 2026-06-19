# CLAUDE.md

**중요: 반드시 한글로 대답하시오.**

Loopers 프론트엔드 과제 레포. React 19 + Vite + TypeScript.

정확성 규칙(`any` · `==` · 빈 `catch` · `console.log` · React 훅/렌더 · 강타입)은 **ESLint·tsc 게이트가 기계적으로 강제**한다. 이 파일에는 **게이트가 못 잡는 것만** 적는다.

## 개발 명령어

```bash
pnpm dev          # 개발 서버
pnpm build        # 타입 빌드 + 번들
pnpm lint         # 전체 ESLint
pnpm typecheck    # 전체 타입 검사
pnpm format       # Prettier 정규화
```

## pnpm 전용

`npm` / `yarn`을 쓰지 않는다(lockfile 충돌). 설치는 `pnpm install`. lint 룰이 막지 못하는 규칙이다.

## 게이트를 끄지 마라

- `as` 타입 단언으로 타입 에러를 우회하지 않는다 — `any`/`@ts-ignore`와 달리 lint가 못 막는 빈틈이다. 타입은 좁히기 · 명시 타입 · 데이터 구조로 푼다.
- `--no-verify`로 git hook을 건너뛰지 않는다.
- 게이트가 막으면 **코드를 고친다 — 룰을 끄지 않는다**(eslint-disable·설정 약화 금지).
