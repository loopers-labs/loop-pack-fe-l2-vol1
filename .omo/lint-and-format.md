# 린트와 포맷 규칙

이 문서는 현재 저장소에 적용된 ESLint, Prettier, TypeScript 규칙의 의도를 설명합니다. 실제 강제 규칙의 source of truth는 `eslint.config.mjs`, `.prettierrc`, `tsconfig*.json`입니다.

## 실행 명령

```bash
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm typecheck
pnpm build
```

## Prettier

`.prettierrc` 기준:

- semicolon 없음
- single quote 사용
- trailing comma 사용
- print width 80

Prettier는 포맷만 담당합니다. 코드 품질 판단은 ESLint와 TypeScript가 담당합니다.

## TypeScript

`tsconfig.app.json`, `tsconfig.node.json` 기준:

- `target`: `es2023`
- `moduleResolution`: `bundler`
- `verbatimModuleSyntax`: true
- `moduleDetection`: force
- `noEmit`: true
- `noUnusedLocals`: true
- `noUnusedParameters`: true
- `erasableSyntaxOnly`: true
- `noFallthroughCasesInSwitch`: true

사용하지 않는 코드, 런타임에 남는 TypeScript-only 문법, switch fallthrough는 허용하지 않습니다.

## ESLint 핵심 규칙

### 우회 금지

ESLint는 inline config를 허용하지 않습니다.

- `eslint-disable`로 규칙을 끄지 않는다.
- 사용하지 않는 disable 지시문은 error로 처리된다.
- 규칙이 잘못되었다고 느껴지면 코드로 우회하지 말고 설정 변경의 근거를 문서화한다.

### TypeScript

- strict type-aware rules를 사용한다.
- `@typescript-eslint/no-explicit-any`: `any` 금지
- `@typescript-eslint/ban-ts-comment`: `@ts-check`, `@ts-expect-error`, `@ts-ignore`, `@ts-nocheck` 금지
- `@typescript-eslint/consistent-type-imports`: 타입 import는 `import type` 사용
- unused import는 error
- unused variable은 error. 단, 의도적으로 미사용인 값은 `_` prefix를 사용한다.

### React

- React recommended rules를 사용한다.
- JSX runtime 설정을 사용한다.
- React Hooks recommended latest rules를 사용한다.
- `react-hooks/exhaustive-deps`는 error다.
- Vite React Refresh 규칙을 따른다.
- JSX boolean prop은 `disabled={true}`가 아니라 `disabled`처럼 작성한다.
- 불필요한 JSX 중괄호를 사용하지 않는다.
- `target="_blank"` 링크는 보안 속성을 함께 둔다.
- children이 없는 컴포넌트는 self-closing 형태로 작성한다.

### 접근성

- `eslint-plugin-jsx-a11y` recommended 설정을 사용한다.
- 정적 분석이 잡는 접근성 문제는 모두 수정한다.
- 색 대비, 실제 키보드 흐름, 스크린 리더 문맥처럼 정적 분석이 놓치는 부분은 수동으로 확인한다.

### 일반 JavaScript/TypeScript 품질

- 모든 제어문은 중괄호를 사용한다.
- `==`, `!=` 대신 `===`, `!==`를 사용한다.
- `console.log`는 금지한다. `console.warn`, `console.error`만 허용한다.
- `debugger`는 금지한다.
- 불필요한 `else` after return은 제거한다.
- comma operator는 금지한다.
- `var`는 금지한다.
- object shorthand, `const`, template literal을 우선한다.
- import/export 순서는 `simple-import-sort`를 따른다.

## lint-staged와 Git hook

커밋 전 lint-staged가 실행됩니다.

- `*.{ts,tsx}`: ESLint 자동 수정 후 Prettier 적용
- `*.{js,cjs,mjs,json,css,md}`: Prettier 적용

`--no-verify`로 우회하지 않습니다. hook 실패는 코드나 설정을 고쳐 해결합니다.
