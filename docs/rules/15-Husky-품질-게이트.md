# 15 — Husky·품질 게이트

## When to read

커밋 전 hook, lint-staged, ESLint/Prettier/TypeScript 설정, 커밋 메시지, 품질 게이트, `pnpm check`를 다룰 때 읽는다.

## Source of truth

- Husky: `.husky/*`
- lint-staged: `package.json`
- lint/format/type/build: `package.json`, `eslint.config.mjs`, `tsconfig*.json`, `next.config.ts`
- 커밋 메시지 검증: `commitlint.config.cjs`
- commit-msg hook: `.husky/commit-msg`
- pre-commit hook: `.husky/pre-commit`

## Rules

### 1. 실행 명령

```bash
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm typecheck
pnpm build
pnpm commitlint --edit <commit-msg-file>
```

### 2. Prettier는 포맷만 담당한다

`.prettierrc` 기준:

- semicolon 없음
- single quote 사용
- trailing comma 사용
- print width 80
- 마크다운 파일은 `proseWrap: preserve`로 작성자가 의도한 줄바꿈을 유지한다. 한국어처럼 공백 없이 연속된 문자열이 많은 문서에서 80자 기준으로 어색하게 끊어지는 것을 막기 위함이다.

Prettier는 포맷만 담당한다. 코드 품질 판단은 ESLint와 TypeScript가 담당한다.

### 3. TypeScript는 런타임에 남지 않는 문법을 금지한다

`tsconfig.json` 기준:

- `target`: `es2023`
- `moduleResolution`: `bundler`
- `verbatimModuleSyntax`: true
- `moduleDetection`: force
- `noEmit`: true
- `noUnusedLocals`: true
- `noUnusedParameters`: true
- `erasableSyntaxOnly`: true
- `noFallthroughCasesInSwitch`: true

사용하지 않는 코드, 런타임에 남는 TypeScript-only 문법, switch fallthrough는 허용하지 않는다.

### 4. ESLint 우회 금지

ESLint는 inline config를 허용하지 않는다.

- `eslint-disable`로 규칙을 끄지 않는다.
- 사용하지 않는 disable 지시문은 error로 처리된다.
- 규칙이 잘못되었다고 느껴지면 코드로 우회하지 말고 설정 변경의 근거를 문서화한다.

### 5. ESLint TypeScript 규칙

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
- `@typescript-eslint/no-extraneous-class`는 의도적으로 끈다. [`13-피처-구조-패턴.md`](13-피처-구조-패턴.md)의 FSD `lib` namespace class가 static method만 소유하는 구조를 허용하기 위한 설정이며, standalone export 제한과 함께 유지한다.

### 6. ESLint React 규칙

- React recommended rules를 사용한다.
- JSX runtime 설정을 사용한다.
- React Hooks recommended latest rules를 사용한다.
- React Compiler lint 규칙을 포함하기 위해 `eslint-plugin-react-hooks`의 `recommended-latest` 구성을 사용한다.
- `react-hooks/exhaustive-deps`는 error다.
- Next.js flat config(`core-web-vitals`, `typescript`)를 baseline으로 사용한다.
- JSX boolean prop은 `disabled={true}`가 아니라 `disabled`처럼 작성한다.
- 불필요한 JSX 중괄호를 사용하지 않는다.
- `target="_blank"` 링크는 보안 속성을 함께 둔다.
- children이 없는 컴포넌트는 self-closing 형태로 작성한다.
- React 컴포넌트 선언은 function declaration을 사용한다.
- `React.Suspense` import와 `React.Suspense` JSX는 금지하고 [`04-상태-관리.md`](04-상태-관리.md)에 정의된 `@suspensive/react`의 `Suspense`를 사용한다.
- `react-error-boundary` 도입은 금지하고 `@suspensive/react`의 `ErrorBoundary`를 사용한다.
- `useSuspenseQuery`, `useSuspenseQueries`, `useSuspenseInfiniteQuery` import는 금지하고 `@suspensive/react-query`의 `SuspenseQuery`, `SuspenseQueries`, `SuspenseInfiniteQuery` 컴포넌트를 사용한다. `package.json`에서는 TanStack Query v5에 맞춰 `@suspensive/react-query`를 `@suspensive/react-query-5` alias로 설치한다.
- JSX children에서 inline logical/ternary 조건 렌더링과 `.map()` 목록 렌더링을 제한한다. 조건은 `Show`, 목록은 `For`를 사용한다.

### 7. 접근성 정적 규칙

- `eslint-plugin-jsx-a11y` recommended 설정을 사용한다.
- 정적 분석이 잡는 접근성 문제는 모두 수정한다.
- 색 대비, 실제 키보드 흐름, 스크린 리더 문맥처럼 정적 분석이 놓치는 부분은 수동으로 확인한다.

### 8. 일반 JavaScript/TypeScript 품질

- 모든 제어문은 중괄호를 사용한다.
- `==`, `!=` 대신 `===`, `!==`를 사용한다.
- `console.log`는 금지한다. `console.warn`, `console.error`만 허용한다.
- `debugger`는 금지한다.
- 불필요한 `else` after return은 제거한다.
- comma operator는 금지한다.
- `var`는 금지한다.
- object shorthand, `const`, template literal을 우선한다.
- import/export 순서는 `simple-import-sort`를 따른다.
- `src` 내부 default export는 금지한다. Next 라우트 파일과 도구 설정 파일처럼 외부 도구가 요구하는 entry point만 예외로 한다.
- FSD slice/entity root에는 `index.ts` Public API를 만들지 않고 실제 파일 경로를 직접 import한다. 폴더로 승격한 컴포넌트 내부의 선택적 `index.ts` 공개 경계에서는 필요한 named export만 명시하고 `export *`는 금지한다.
- FSD `lib` segment에서 export되는 유틸리티는 namespace class의 static method로 묶는다. lint는 `lib` segment의 exported standalone function/arrow function을 제한하고, 세부 그룹명과 책임은 리뷰에서 확인한다. 단, React custom hook은 React 규약상 `use[A-Z0-9]...` 형태의 standalone function API가 필요하므로 이 제한에서 예외로 둔다.
- `tailwindcss/no-custom-classname`은 Tailwind v4의 합법적인 임의 문법과 레거시 클래스 사용을 검토 대상으로 남기기 위해 `warn`으로 운용한다. warning은 품질 게이트를 막지 않지만 리뷰에서 확인하며, whitelist 추가에는 Tailwind 유틸리티로 대체할 수 없는 구체적인 근거가 필요하다.

### 9. 커밋 전에는 lint-staged를 통과한다

- 변경된 TS/TSX 파일: ESLint 자동 수정 후 Prettier 적용
- 변경된 JS/JSON/CSS/MD 파일: Prettier 적용
- 검사를 통과하지 못하면 커밋되지 않는다.

| 파일                         | 실행                                |
| ---------------------------- | ----------------------------------- |
| `*.{ts,tsx}`                 | `eslint --fix` → `prettier --write` |
| `*.{js,cjs,mjs,json,css,md}` | `prettier --write`                  |

### 10. 커밋 메시지는 Conventional Commits 형식을 따른다

```txt
type: 한국어 설명
```

- 설명은 한국어로 작성한다.
- scope를 사용하지 않으며 `type(scope)` 형식은 허용하지 않는다.

허용하는 type:

- `feat`: 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 포맷, 세미콜론, 공백 등 동작 없는 스타일 변경
- `refactor`: 동작 변경 없는 구조 개선
- `test`: 테스트 추가/수정
- `chore`: 빌드, 패키지, 설정, 기타 작업
- `ci`: CI/CD 설정 변경

예시:

```txt
chore: commitlint 게이트 추가
docs: 8주차 테스트 전략 문서화
```

Git hook:

- `.husky/pre-commit`: staged 파일에 대해 lint-staged를 실행한다.
- `.husky/commit-msg`: 커밋 메시지를 commitlint로 검증한다.
- 두 hook 모두 `pnpm`을 우선 사용하고, 없으면 Corepack의 `pnpm`을 사용한다. 둘 다 없으면 실패하도록 둔다.

### 11. `pnpm check`는 최종 관문이다

- `pnpm check`는 테스트, lint, 타입 검사, 프로덕션 빌드를 순서대로 실행하며 네 단계가 모두 통과해야 완료된다.
- CI(GitHub Actions)도 pull request와 `main` push에서 같은 `pnpm check`를 실행한다.
- `pnpm test:e2e`는 의도적으로 `pnpm check`에 포함하지 않고 CI에서 `pnpm check` 다음 별도 단계로 실행한다.

| 단계             | 목적                   |
| ---------------- | ---------------------- |
| `pnpm test`      | 자동화된 테스트 통과   |
| `pnpm lint`      | 정적 분석 통과         |
| `pnpm typecheck` | TypeScript 컴파일 통과 |
| `pnpm build`     | 프로덕션 빌드 통과     |

### 12. 변경 유형별 기준

| 변경 유형        | 필수 검증                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| 문서만 변경      | `pnpm format:check`, 문서 링크와 경로 확인                                                                           |
| TypeScript/React | `pnpm lint`, `pnpm typecheck`, 관련 테스트, 최종 `pnpm build`                                                        |
| UI/CSS           | `pnpm lint`, `pnpm typecheck`, `pnpm build`, 주요 viewport와 키보드 흐름, [`17-접근성.md`](17-접근성.md)             |
| 설정             | 영향받는 명령을 직접 실행. ESLint/Prettier/TypeScript 설정은 각각 `pnpm lint`, `pnpm format:check`, `pnpm typecheck` |

### 13. 실패는 억지로 우회하지 않는다

- 품질 게이트 실패 시 `--no-verify`로 커밋하지 않는다.
- hook 실패는 메시지나 설정을 고쳐 해결한다.
- 형식을 맞추기 위해 의미 없는 type을 붙이지 않는다.
- scope를 추가해 변경 범위를 표현하지 않는다. 변경 범위는 한국어 설명에 드러낸다.
- 실패하는 검증을 삭제하거나 약화하지 않는다.
- 우회가 필요해 보이면 먼저 코드 구조와 타입 설계를 다시 검토한다.
- 검증을 실행하지 못했다면 최종 보고에 명령, 실패 이유, 남은 리스크를 적는다.

| ✅ 올바른 예             | ❌ 잘못된 예                    |
| ------------------------ | ------------------------------- |
| lint 오류를 수정 후 커밋 | `git commit --no-verify`        |
| 타입 오류를 해결 후 머지 | `// @ts-expect-error` 없이 우회 |
| 규칙 예외를 문서로 기록  | 입으로만 "이번만 예외"          |

### 14. 로컬와 CI가 동일하다

- 로컬에서 통과하지 못한 코드는 CI에서도 통과하지 않는다고 가정한다.
- CI 전용 설정과 로컬 설정의 차이가 생기면 즉시 동기화한다.

## Verification

- 커밋 전 로컬에서 `pnpm check`가 통과하는지 확인한다.
- CI가 통과하는지 확인한다.
- `--no-verify` 사용 기록이 없는지 확인한다.
- 변경한 설정이 담당하는 `pnpm lint`, `pnpm format:check`, `pnpm typecheck`를 직접 실행한다.

```bash
pnpm check
pnpm commitlint --edit <commit-msg-file>
```
