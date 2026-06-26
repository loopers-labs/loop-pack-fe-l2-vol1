# Agent Instructions

이 문서는 이 저장소에서 AI 에이전트와 개발자가 작업할 때 반드시 먼저 읽는 최상위 계약입니다.

목표는 단순히 ESLint, Prettier, Git hook을 붙이는 것이 아니라, AI가 쉽게 우회하거나 망가뜨리는 지점을 코드 규칙과 문서 규칙으로 차단하는 것입니다.

- 실행 가능한 규칙의 source of truth는 설정 파일입니다.
- 규칙의 의도와 판단 기준은 `docs/rules/*` 문서에 둡니다.
- 이 문서는 상황별로 어떤 규칙 문서를 읽어야 하는지 안내합니다.
- 설명할 수 없는 코드는 AI가 생성했더라도 제출하지 않습니다.

## 설계 축

1. **코드 품질 하네스**: ESLint, TypeScript, Prettier, lint-staged가 코드와 포맷의 1차 방어선을 담당한다.
2. **작업 방식 하네스**: AGENTS.md와 `docs/rules/*` 문서가 AI 에이전트의 판단 기준과 금지 행동을 설명한다.
3. **감사 하네스**: `.opencode/commands/audit.md`와 감사 에이전트가 변경 범위를 read-only로 점검한다.
4. **커밋 하네스**: commitlint와 Husky `commit-msg` hook이 커밋 메시지 형식을 검증한다.

## 상황별 참조 문서

모든 작업에서 `docs/rules` 문서를 전부 먼저 읽을 필요는 없다. 아래 상황에 해당할 때 필요한 문서를 참조한다.

- 코드 작성 방식, React/TypeScript 스타일, export 기준이 필요하면 `docs/rules/conventions.md`를 본다.
- ESLint, Prettier, TypeScript 규칙의 의도나 금지 패턴을 확인해야 하면 `docs/rules/lint-and-format.md`를 본다.
- 커밋 메시지 형식과 Git hook 게이트를 확인해야 하면 `docs/rules/commit-and-pr.md`를 본다.
- 기능 배치, FSD 레이어, slice public API, `index.ts` export 기준이 필요하면 `docs/rules/fsd-architecture.md`를 본다.
- UI, form, interaction, loading/error/empty state를 바꾸면 `docs/rules/accessibility.md`를 본다.
- 작업 완료 전 어떤 명령으로 검증할지 판단해야 하면 `docs/rules/testing.md`를 본다.
- 변경 범위를 감사하거나 리뷰 기준을 맞춰야 하면 `docs/rules/audit.md`를 본다.

## Source of Truth

- TypeScript 규칙은 `tsconfig*.json`을 우선한다.
- ESLint 규칙은 `eslint.config.mjs`를 우선한다.
- Prettier 규칙은 `.prettierrc`를 우선한다.
- React Compiler 설치와 Vite 연결은 `package.json`, `pnpm-lock.yaml`, `vite.config.ts`를 우선한다.
- 커밋 메시지 형식은 `commitlint.config.cjs`를 우선한다.
- Git hook 실행 방식은 `.husky/*`를 우선한다.
- `docs/rules/*` 문서는 설정 파일로 표현하기 어려운 의도, 아키텍처, 리뷰 기준을 설명한다.
- `.opencode/*` 문서는 OpenCode 전용 커맨드와 감사 에이전트 지침이다.

## 절대 규칙

- 본인이 설명할 수 없는 코드는 커밋하거나 제출하지 않는다.
- `any`, `as any`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `eslint-disable`로 문제를 숨기지 않는다.
- 실패하는 lint, typecheck, build를 우회하지 않는다.
- commitlint가 거부하는 커밋 메시지를 억지로 통과시키지 않는다.
- `--no-verify`로 Git hook을 우회하지 않는다.
- 빈 `catch` 블록을 두지 않는다. 에러는 처리하거나 명시적으로 전파한다.
- 새 기능은 FSD 경계를 따라 배치하고, `App.tsx`나 라우트 파일에 비즈니스 로직을 누적하지 않는다.
- UI 변경은 접근성 요구사항을 함께 만족해야 한다.
- React 컴포넌트 최적화는 React Compiler가 기본 전제다. `useMemo`, `useCallback`, `React.memo`는 측정된 병목이나 참조 안정성이 실제 API 계약인 경우에만 사용한다.

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
