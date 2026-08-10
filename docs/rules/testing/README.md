# 테스트 문서

테스트 환경과 완료 검증을 필요한 주제만 골라 읽기 위한 라우터입니다.

## Decision table

| 확인할 주제                       | 문서                                 |
| --------------------------------- | ------------------------------------ |
| Node/DOM 프로젝트와 테스트 파일명 | [`vitest.md`](vitest.md)             |
| MSW 수명 주기와 실제 요청 경계    | [`msw.md`](msw.md)                   |
| production Chromium E2E           | [`playwright.md`](playwright.md)     |
| 명령, 변경 유형별 기준, 실패 보고 | [`verification.md`](verification.md) |

## Source of truth map

| 영역                      | Source of truth                            |
| ------------------------- | ------------------------------------------ |
| 테스트 script와 실행 순서 | `package.json`                             |
| Vitest 프로젝트           | `vitest.config.ts`                         |
| MSW 수명 주기             | `tests/setup/msw.ts`, `tests/setup/dom.ts` |
| E2E                       | `playwright.config.ts`, `e2e/`             |
| CI 단계                   | `.github/workflows/*`                      |
