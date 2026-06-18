# Agent Instructions

이 문서는 이 저장소에서 AI 에이전트와 개발자가 작업할 때 반드시 지켜야 하는 최상위 계약입니다. 세부 규칙은 `.omo` 문서를 원문으로 삼고, 실행 가능한 도구 설정은 실제 설정 파일을 source of truth로 삼습니다.

## 반드시 먼저 읽을 문서

- 프로젝트 컨벤션: `.omo/conventions.md`
- 린트와 포맷 규칙: `.omo/lint-and-format.md`
- FSD 아키텍처 규칙: `.omo/fsd-architecture.md`
- 접근성 규칙: `.omo/accessibility.md`
- 검증 절차: `.omo/testing.md`
- 감사 방식: `.omo/audit.md`

## Source of Truth

- TypeScript 규칙은 `tsconfig*.json`을 우선한다.
- ESLint 규칙은 `eslint.config.mjs`를 우선한다.
- Prettier 규칙은 `.prettierrc`를 우선한다.
- `.omo/*` 문서는 설정 파일로 표현하기 어려운 의도, 아키텍처, 리뷰 기준을 설명한다.
- `.opencode/*` 문서는 OpenCode 전용 커맨드와 감사 에이전트 지침이다.

## 절대 규칙

- 본인이 설명할 수 없는 코드는 커밋하거나 제출하지 않는다.
- `any`, `as any`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `eslint-disable`로 문제를 숨기지 않는다.
- 실패하는 lint, typecheck, build를 우회하지 않는다.
- `--no-verify`로 Git hook을 우회하지 않는다.
- 빈 `catch` 블록을 두지 않는다. 에러는 처리하거나 명시적으로 전파한다.
- 새 기능은 FSD 경계를 따라 배치하고, `App.tsx`나 라우트 파일에 비즈니스 로직을 누적하지 않는다.
- UI 변경은 접근성 요구사항을 함께 만족해야 한다.

## 작업 완료 전 검증

작업 범위에 맞춰 최소한 다음을 실행한다.

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

문서만 변경한 경우에도 `pnpm format:check`는 실행한다. 검증을 실행하지 못했다면 이유와 남은 리스크를 명시한다.

## 감사 커맨드

FSD, 컨벤션, 접근성, 품질 게이트를 한 번에 점검하려면 OpenCode에서 `/audit` 커맨드를 사용한다.

예시:

```txt
/audit
/audit --changed
/audit --full
/audit src/features/cart
```
