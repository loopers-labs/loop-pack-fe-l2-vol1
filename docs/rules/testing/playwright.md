# Playwright E2E

## When to read

실제 사용자 흐름, production artifact, Chromium E2E 또는 CI의 E2E 단계를 변경할 때 읽는다.

## Source of truth

E2E 명령은 `package.json`의 `test:e2e`, 브라우저와 서버 설정은 `playwright.config.ts`, 테스트는 `e2e/`, CI 순서는 `.github/workflows/*`가 우선한다.

## Rules

- `pnpm test:e2e`는 `pnpm build && playwright test`다.
- Playwright는 `e2e/`에서 테스트를 찾고 Chromium만 사용한다.
- `webServer`는 `pnpm start`로 production artifact를 제공하고 `http://localhost:3000` 응답 준비를 기다린다.
- 사용자 흐름은 role/name 같은 공개 접근성 계약으로 검증한다.
- E2E는 의도적으로 `pnpm test`와 `pnpm check`에 포함하지 않는다.
- GitHub Actions는 조건부 Chromium 설치와 `pnpm check`를 유지하고, 그 뒤 별도 `pnpm test:e2e` 단계로 실행한다.
- 프로덕션 빌드, 서버 시작, 브라우저 설치·실행은 빠른 로컬 Vitest 반복보다 비용이 크므로 명령을 분리하되, CI에서는 `check` 다음에 실행해 배포 형태의 smoke contract를 놓치지 않는다.

## Verification

```bash
pnpm test:e2e
```

production build가 성공하고, `pnpm start` 준비 완료 뒤 Chromium 테스트가 실행되는지 확인한다.
