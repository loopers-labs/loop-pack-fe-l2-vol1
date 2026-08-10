# docs/rules 문서 인덱스

`AGENTS.md`가 작업 상황을 이 문서로 연결하면, 여기서 필요한 규칙 family 또는 root leaf만 선택해 읽습니다. 도구가 강제하는 규칙은 설정 파일을 source of truth로 두고, `docs/rules` 문서는 그 규칙의 의도와 적용 기준을 설명합니다.

## Decision table

| 확인할 주제                                 | 문서                                               |
| ------------------------------------------- | -------------------------------------------------- |
| TypeScript, React, 런타임 경계, 파일/export | [`conventions/README.md`](conventions/README.md)   |
| 테스트 환경과 완료 검증                     | [`testing/README.md`](testing/README.md)           |
| FSD 레이어, import, domain/API 경계         | [`architecture/README.md`](architecture/README.md) |
| 커밋과 pull request                         | [`git/README.md`](git/README.md)                   |
| ESLint, Prettier, TypeScript 설정 의도      | [`lint-and-format.md`](lint-and-format.md)         |
| UI 접근성 체크리스트                        | [`accessibility.md`](accessibility.md)             |
| OpenCode `/audit` 운영                      | [`audit.md`](audit.md)                             |

## Source of truth map

| 영역                         | Source of truth                                                          |
| ---------------------------- | ------------------------------------------------------------------------ |
| TypeScript, ESLint, Prettier | `tsconfig*.json`, `eslint.config.mjs`, `.prettierrc`                     |
| React, Next, 패키지 연결     | `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `postcss.config.mjs` |
| 테스트와 검증 명령           | `package.json`, `vitest.config.ts`, `playwright.config.ts`               |
| 커밋과 hook                  | `commitlint.config.cjs`, `.husky/*`                                      |
| 규칙 의도와 리뷰 기준        | `docs/rules/**`                                                          |

## 운영 원칙

- 항상 먼저 읽히는 `AGENTS.md`는 짧은 최상위 계약과 문서 라우터로 유지한다.
- 상세 규칙은 관련 family leaf에 추가하고, `AGENTS.md`나 router에 길게 복제하지 않는다.
- OpenCode 전용 커맨드와 에이전트는 `.opencode/commands`, `.opencode/agents`에 둔다.
- OpenCode가 아닌 환경에서는 `.opencode/agents/*.md`의 감사 기준을 필요한 범위에서 직접 적용한다.
- 같은 규칙을 여러 문서에 길게 복제하지 않는다. 중복이 필요하면 원문 문서로 링크한다.
