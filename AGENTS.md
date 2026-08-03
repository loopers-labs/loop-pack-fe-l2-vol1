# Agent Instructions

이 문서는 이 저장소에서 AI 에이전트와 개발자가 작업할 때 항상 먼저 읽는 최상위 계약입니다. 상세 규칙을 반복하지 않고, 상황에 맞는 `docs/rules/*` 문서로 안내하는 라우터 역할만 합니다.

- 실행 가능한 규칙의 source of truth는 설정 파일입니다.
- 규칙의 의도와 판단 기준은 `docs/rules/*` 문서에 둡니다.
- 이 문서는 상황별로 어떤 규칙 문서를 읽어야 하는지 안내합니다.
- 설명할 수 없는 코드는 AI가 생성했더라도 제출하지 않습니다.

## 상황별 참조 문서

모든 작업에서 `docs/rules` 문서를 전부 먼저 읽을 필요는 없다. 아래 상황에 해당할 때 필요한 문서를 참조한다.

- 코드 작성 방식, React/TypeScript 스타일, export 기준, 런타임 입력 검증 기준이 필요하면 `docs/rules/conventions.md`를 본다.
- ESLint, Prettier, TypeScript 규칙의 의도나 금지 패턴을 확인해야 하면 `docs/rules/lint-and-format.md`를 본다.
- 커밋 메시지 형식과 Git hook 게이트를 확인해야 하면 `docs/rules/commit-and-pr.md`를 본다.
- 기능 배치, FSD 레이어, slice public API, `index.ts` export 기준이 필요하면 `docs/rules/fsd-architecture.md`를 본다. 이 저장소는 slice/entity root에 배럴 익스포트(`index.ts`)를 사용하지 않고 직접 파일 경로로 import한다. 단, 폴더로 승격한 컴포넌트 내부에서는 필요한 named export만 `index.ts`로 공개할 수 있다.
- UI, form, interaction, loading/error/empty state를 바꾸면 `docs/rules/accessibility.md`를 본다.
- 작업 완료 전 어떤 명령으로 검증할지 판단해야 하면 `docs/rules/testing.md`를 본다.
- 변경 범위를 감사하거나 리뷰 기준을 맞춰야 하면 `docs/rules/audit.md`를 본다. OpenCode가 아닌 환경에서는 해당 문서와 `.opencode/agents/*.md`의 기준을 직접 적용한다.

## Source of Truth

- TypeScript 규칙은 `tsconfig*.json`을 우선한다.
- ESLint 규칙은 `eslint.config.mjs`를 우선한다.
- Prettier 규칙은 `.prettierrc`를 우선한다.
- React, Next, Tailwind 연결은 `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `postcss.config.mjs`를 우선한다.
- 커밋 메시지 형식은 `commitlint.config.cjs`를 우선한다.
- Git hook 실행 방식은 `.husky/*`를 우선한다.
- `docs/rules/*` 문서는 설정 파일로 표현하기 어려운 의도, 아키텍처, 리뷰 기준을 설명한다.
- `.opencode/*` 문서는 OpenCode 전용 커맨드와 감사 에이전트 지침이다. 다른 에이전트는 필요할 때 기준만 수동으로 적용한다.

## 절대 규칙

- 본인이 설명할 수 없는 코드는 커밋하거나 제출하지 않는다.
- `any`, `as any`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `eslint-disable`로 문제를 숨기지 않는다.
- 실패하는 lint, typecheck, build를 우회하지 않는다.
- commitlint가 거부하는 커밋 메시지를 억지로 통과시키지 않는다.
- `--no-verify`로 Git hook을 우회하지 않는다.
- 빈 `catch` 블록을 두지 않는다. 에러는 처리하거나 명시적으로 전파한다.
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

`/audit` 커맨드와 `.opencode/*` 문서는 OpenCode 전용이다. OpenCode를 쓰지 않는 에이전트는 `docs/rules/audit.md`와 `.opencode/agents/*.md`의 기준을 읽고 필요한 항목을 직접 점검한다.

OpenCode에서는 FSD, 컨벤션, 접근성, 품질 게이트를 한 번에 점검하려면 `/audit` 커맨드를 사용한다.

예시:

```txt
/audit
/audit --changed
/audit --full
/audit src/features/cart
```
