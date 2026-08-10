# 검증 절차

작업 완료 전에는 변경 범위에 맞는 검증을 실행한다. 이 저장소의 기본 package manager는 `pnpm`이다.

## 기본 명령

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
- `pnpm test:e2e`: 프로덕션 빌드를 만든 뒤 Playwright가 `pnpm start`를
  준비하고 Chromium E2E를 실행한다.
- `pnpm format:check`: Prettier 포맷 위반 확인
- `pnpm lint`: ESLint 규칙 위반 확인
- `pnpm typecheck`: Next 단일 TypeScript 프로젝트 타입 검사
- `pnpm build`: Next production 빌드
- `pnpm check`: `pnpm test && pnpm lint && pnpm typecheck && pnpm build`를 이 순서로 실행한다. 앞 단계가 실패하면 뒤 단계는 실행하지 않는다.

## 변경 유형별 기준

### 문서만 변경

- `pnpm format:check`를 실행한다.
- 문서의 링크와 경로가 실제 파일과 일치하는지 확인한다.

### TypeScript/React 코드 변경

- `pnpm lint`
- `pnpm typecheck`
- 관련 테스트가 있다면 해당 테스트
- 최종적으로 `pnpm build`

### UI/CSS 변경

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- 브라우저에서 주요 viewport와 키보드 흐름 확인
- 접근성 체크리스트(`docs/rules/accessibility.md`) 확인

### 설정 변경

- 변경한 설정이 영향을 주는 명령을 직접 실행한다.
- ESLint/Prettier/TypeScript 설정 변경은 각각 `pnpm lint`, `pnpm format:check`, `pnpm typecheck`로 검증한다.

## 테스트 파일과 범위

`vitest.config.ts`의 `test.projects`가 Vitest 실행 환경의 source of truth다.

- `*.test.ts`와 `*.test.tsx`는 `node` 프로젝트에서 실행한다. `*.dom.test.tsx`는
  제외하므로 기존 순수 로직 테스트에 jsdom 비용을 더하지 않는다.
- `*.dom.test.tsx`는 `dom` 프로젝트에서만 실행한다. jsdom URL은
  `http://localhost:3000`이며 `tests/setup/dom.ts`가 jest-dom matcher, Testing
  Library cleanup, MSW 서버 수명 주기를 명시적으로 연결한다. Vitest globals는
  사용하지 않는다.
- DOM API 경계 테스트의 MSW handler는 각 테스트가 `server.use`로 등록한다.
  처리되지 않은 요청은 실패하고, handler는 매 테스트 뒤 초기화된다.
- 프로덕션 앱의 사용자 흐름은 `e2e/`의 Playwright 테스트로 검증한다.
  `playwright.config.ts`는 Chromium과 `http://localhost:3000`만 사용하며
  `webServer.url` 준비 완료를 기다린다.
- `package.json`의 `test`, `test:watch`, `test:e2e`, `check`를 테스트 명령의
  source of truth로 삼는다. `test:e2e`는 의도적으로 `test`와 `check`에 포함하지
  않고 CI에서 `pnpm check` 다음 별도 단계로 실행한다.

테스트가 없는 영역이 있더라도 lint/type/build 검증을 생략하지 않는다.

## 실패 처리

- 실패 원인을 읽고 root cause를 고친다.
- 실패하는 검증을 삭제하거나 약화하지 않는다.
- 우회가 필요해 보이면 먼저 코드 구조와 타입 설계를 다시 검토한다.
- 검증을 실행하지 못했다면 최종 보고에 명령, 실패 이유, 남은 리스크를 적는다.
