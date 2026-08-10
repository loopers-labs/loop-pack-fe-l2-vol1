# 작업 완료 검증

## When to read

작업을 시작할 때 필요한 검증 범위를 정하고, 완료 전에 명령과 수동 확인 항목을 점검하며, 실패나 미실행 항목을 보고할 때 읽는다.

## Source of truth

이 저장소의 기본 package manager는 `pnpm`이다. 실제 script와 실행 순서는 `package.json`이 우선한다.

## Rules

### 기본 명령

```bash
pnpm test
pnpm test:watch
pnpm test:e2e
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm check
```

각 명령의 의미:

- `pnpm test`: `vitest run`으로 Vitest 테스트를 한 번 실행하고 종료한다.
- `pnpm test:watch`: `vitest`를 watch 모드로 실행해 로컬 개발 중 변경을 감시한다.
- `pnpm test:e2e`: 프로덕션 빌드를 만든 뒤 Playwright가 `pnpm start`를 준비하고 Chromium E2E를 실행한다.
- `pnpm format:check`: Prettier 포맷 위반 확인
- `pnpm lint`: ESLint 규칙 위반 확인
- `pnpm typecheck`: Next 단일 TypeScript 프로젝트 타입 검사
- `pnpm build`: Next production 빌드
- `pnpm check`: `pnpm test && pnpm lint && pnpm typecheck && pnpm build`를 이 순서로 실행한다. 앞 단계가 실패하면 뒤 단계는 실행하지 않는다.

`package.json`의 `test`, `test:watch`, `test:e2e`, `check`를 테스트 명령의 source of truth로 삼는다. `test:e2e`는 의도적으로 `test`와 `check`에 포함하지 않고 CI에서 `pnpm check` 다음 별도 단계로 실행한다.

### 변경 유형별 기준

| 변경 유형        | 필수 검증                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 문서만 변경      | `pnpm format:check`, 문서 링크와 경로 확인                                                                             |
| TypeScript/React | `pnpm lint`, `pnpm typecheck`, 관련 테스트, 최종 `pnpm build`                                                          |
| UI/CSS           | `pnpm lint`, `pnpm typecheck`, `pnpm build`, 주요 viewport와 키보드 흐름, [`../accessibility.md`](../accessibility.md) |
| 설정             | 영향받는 명령을 직접 실행. ESLint/Prettier/TypeScript 설정은 각각 `pnpm lint`, `pnpm format:check`, `pnpm typecheck`   |

테스트가 없는 영역이 있더라도 lint/type/build 검증을 생략하지 않는다.

### 실패 처리

- 실패 원인을 읽고 root cause를 고친다.
- 실패하는 검증을 삭제하거나 약화하지 않는다.
- 우회가 필요해 보이면 먼저 코드 구조와 타입 설계를 다시 검토한다.
- 검증을 실행하지 못했다면 최종 보고에 명령, 실패 이유, 남은 리스크를 적는다.

## Verification

작업 범위에 맞는 좁은 검증부터 실행한 뒤 필요한 전체 gate를 실행한다. 문서만 변경한 경우에도 `pnpm format:check`와 링크 검증을 생략하지 않는다.
