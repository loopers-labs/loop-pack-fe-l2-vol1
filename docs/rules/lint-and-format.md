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
pnpm commitlint --edit <commit-msg-file>
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
- `@typescript-eslint/array-type`: 배열 타입은 `Array<T>`, 불변 배열은 `ReadonlyArray<T>` 표기 사용
- `@typescript-eslint/consistent-type-imports`: 타입 import는 `import type` 사용
- `@typescript-eslint/consistent-type-assertions`: 객체 리터럴 type assertion은 금지하고 `satisfies`를 우선 사용
- `@typescript-eslint/no-unnecessary-type-assertion`: 불필요한 type assertion 금지
- unused import는 error
- unused variable은 error. 단, 의도적으로 미사용인 값은 `_` prefix를 사용한다.
- Zod schema에서 파생되는 타입은 `z.infer<typeof Schema>`를 사용하고, schema와 같은 형태의 수동 타입을 중복 선언하지 않는다.
- 런타임 검증이 필요한 경계에서는 `any`나 type assertion으로 외부 데이터를 믿지 않고 Zod `parse`/`safeParse`로 좁힌다.

### React

- React recommended rules를 사용한다.
- JSX runtime 설정을 사용한다.
- React Hooks recommended latest rules를 사용한다.
- React Compiler는 `babel-plugin-react-compiler`와 `@rolldown/plugin-babel`을 통해 Vite 빌드에 연결한다. 설정의 source of truth는 `vite.config.ts`다.
- React Compiler lint 규칙을 포함하기 위해 `eslint-plugin-react-hooks`의 `recommended-latest` 구성을 사용한다.
- `react-hooks/exhaustive-deps`는 error다.
- Vite React Refresh 규칙을 따른다.
- JSX boolean prop은 `disabled={true}`가 아니라 `disabled`처럼 작성한다.
- 불필요한 JSX 중괄호를 사용하지 않는다.
- `target="_blank"` 링크는 보안 속성을 함께 둔다.
- children이 없는 컴포넌트는 self-closing 형태로 작성한다.
- React 컴포넌트 선언은 function declaration을 사용한다.
- `React.Suspense` import와 `React.Suspense` JSX는 금지하고 `@suspensive/react`의 `Suspense`를 사용한다.
- `react-error-boundary` 도입은 금지하고 `@suspensive/react`의 `ErrorBoundary`를 사용한다.
- `useSuspenseQuery`, `useSuspenseQueries`, `useSuspenseInfiniteQuery` import는 금지하고 `@suspensive/react-query`의 `SuspenseQuery`, `SuspenseQueries`, `SuspenseInfiniteQuery` 컴포넌트를 사용한다. `package.json`에서는 TanStack Query v5에 맞춰 `@suspensive/react-query`를 `@suspensive/react-query-5` alias로 설치한다.
- JSX children에서 inline logical/ternary 조건 렌더링과 `.map()` 목록 렌더링을 제한한다. 조건은 `Show`, 목록은 `For`를 사용한다.

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
- `src` 내부 default export는 금지한다. 도구 설정 파일처럼 외부 도구가 요구하는 entry point만 예외로 한다.
- FSD public API인 `index.ts`에서는 `export *`를 금지한다.
- FSD `lib` segment에서 export되는 유틸리티는 namespace class의 static method로 묶는다. lint는 `lib` segment의 exported standalone function/arrow function을 제한하고, 세부 그룹명과 책임은 리뷰에서 확인한다. 단, React custom hook은 React 규약상 `use[A-Z0-9]...` 형태의 standalone function API가 필요하므로 이 제한에서 예외로 둔다.

## lint-staged와 Git hook

커밋 전 lint-staged가 실행됩니다.

- `*.{ts,tsx}`: ESLint 자동 수정 후 Prettier 적용
- `*.{js,cjs,mjs,json,css,md}`: Prettier 적용

커밋 메시지는 commitlint가 검증합니다.

- 실제 규칙은 `commitlint.config.cjs`를 우선한다.
- commit-msg hook은 `.husky/commit-msg`를 우선한다.
- 메시지는 Conventional Commits 형식을 따른다.

`--no-verify`로 우회하지 않습니다. hook 실패는 코드, 설정, 커밋 메시지를 고쳐 해결합니다.
