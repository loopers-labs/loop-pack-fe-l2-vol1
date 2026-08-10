# 런타임 입력 경계

## When to read

서버 응답, route/search params, form payload, Web Storage, 환경 변수 등 런타임 입력을 다룰 때 읽는다.

## Source of truth

Zod 버전과 production dependency 여부는 `package.json`과 `pnpm-lock.yaml`이 우선한다. 도메인별 DTO와 model 배치는 [`../architecture/domain-and-api-boundaries.md`](../architecture/domain-and-api-boundaries.md)를 따른다.

## Rules

- 외부에서 들어오는 데이터는 신뢰하지 않는다. 서버 응답, route/search params, form payload, localStorage/sessionStorage, 환경 변수처럼 런타임에 깨질 수 있는 값은 경계에서 Zod schema로 검증한다.
- Zod는 런타임 검증 라이브러리이므로 `dependencies`에 둔다. 기본 import는 공식 문서와 맞춰 `import * as z from 'zod'`를 사용한다.
- 검증 실패를 즉시 예외로 처리해도 되는 경계에서는 `schema.parse(input)`을 사용한다. 사용자 피드백이나 분기 처리가 필요한 흐름에서는 `schema.safeParse(input)`으로 성공/실패를 명시적으로 나눈다.
- schema에서 파생되는 타입은 `z.infer<typeof Schema>`로 만든다. schema와 별도의 수동 타입을 중복 선언하지 않는다.

## Verification

- 외부 입력이 type assertion 없이 schema를 통과한 뒤 사용되는지 확인한다.
- 사용자 피드백이 필요한 흐름이 `safeParse`의 실패 분기를 명시적으로 처리하는지 확인한다.

```bash
pnpm lint
pnpm typecheck
```
