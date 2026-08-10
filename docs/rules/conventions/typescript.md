# TypeScript 컨벤션

## When to read

TypeScript 타입을 설계하거나 import, assertion, 미사용 값 처리 기준을 확인할 때 읽는다.

## Source of truth

실제 컴파일러 규칙은 `tsconfig*.json`, 정적 규칙은 `eslint.config.mjs`가 우선한다.

## Rules

- `any`, `as any`, 타입 주석 우회(`@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`)를 사용하지 않는다.
- 타입은 구현을 설명해야 한다. 불명확한 union, 과도한 optional, 의미 없는 `Record<string, unknown>` 남용을 피한다.
- 배열 타입은 `string[]`나 `Foo[]` 대신 `Array<string>`, `Array<Foo>`처럼 제네릭 표기를 사용한다. 불변 배열은 `ReadonlyArray<Foo>`를 사용한다.
- 객체 리터럴의 타입을 맞추기 위해 `as`로 밀어 넣지 않는다. 값이 타입 계약을 만족하는지 확인할 때는 `satisfies`를 우선한다.
- UI 상태가 여러 필드를 함께 바꾸는 상태 기계라면 단순 string union보다 discriminated union을 우선한다. 예: `{ status: 'success'; data: Data } | { status: 'error'; error: Error }`.
- 타입만 사용하는 import는 `import type`을 사용한다.
- 사용하지 않는 변수와 매개변수는 제거한다. 의도적으로 사용하지 않는 매개변수는 `_name` 형태로 표시한다.

## Verification

```bash
pnpm lint
pnpm typecheck
```
