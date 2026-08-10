# Vitest 프로젝트와 파일 규칙

## When to read

단위 테스트나 DOM 테스트를 추가하고 파일명을 정하거나, Node/jsdom 실행 환경을 변경할 때 읽는다.

## Source of truth

`vitest.config.ts`의 `test.projects`가 Vitest 실행 환경의 source of truth다. 명령은 `package.json`의 `test`와 `test:watch`가 우선한다.

## Rules

Stage 0은 테스트 환경을 Node 단위 테스트, jsdom DOM 테스트, production Playwright E2E로 분리한다. 프로덕션 동작은 바꾸지 않는다.

- `*.test.ts`와 `*.test.tsx`는 `node` 프로젝트에서 실행한다. `*.dom.test.tsx`는 제외하므로 기존 순수 로직 테스트에 jsdom 비용을 더하지 않는다.
- `*.dom.test.tsx`는 `dom` 프로젝트에서만 실행한다. 두 패턴은 겹치지 않는다.
- DOM 프로젝트의 jsdom URL은 `http://localhost:3000`이다.
- Node와 DOM 프로젝트는 MSW 수명 주기를 사용한다. DOM에서만 `@testing-library/jest-dom/vitest` matcher와 Testing Library `cleanup`을 연결한다.
- Vitest globals는 사용하지 않는다.
- jsdom은 위치 URL을 제공하지만 Node의 `Request`가 상대 URL을 거부한다. DOM setup은 `Request` 입력만 `window.location` 기준으로 해석해 실제 브라우저의 상대 URL 동작을 재현한다. ky, fetch, `apiClient`, `ProductRepository`는 교체하지 않는다.
- DOM API 경계와 사용자 상호작용은 구현 세부사항 대신 role/name과 공개 callback 또는 schema를 통과한 결과로 검증한다.
- 프로덕션 앱의 사용자 흐름은 `e2e/`의 Playwright 테스트로 검증한다.

## Verification

```bash
pnpm test
pnpm test:watch
```

`pnpm test`는 `vitest run`으로 한 번 실행하고 종료한다. `pnpm test:watch`는 `vitest`를 watch 모드로 실행한다.
