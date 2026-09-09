# Agent Instructions

이 파일은 항상 자동으로 읽히는 최상위 계약입니다. 이 문서를 읽은 뒤에는 **반드시** 아래 Decision table에 따라 현재 작업 유형에 맞는 rule leaf를 추가로 읽고, 응답 시작 전에 어떤 rule 파일들을 읽었는지 명시합니다.

## 필수 절차

1. `AGENTS.md`를 읽는다. (이 파일)
2. 수행하는 작업 유형에 해당하는 rule leaf들을 **모두** 읽는다.
3. 응답 시작 시 다음 형식으로 읽은 rule 파일을 명시한다:
   > "Loaded rules: `docs/rules/01-네이밍-규칙.md`, `docs/rules/...`"
4. 읽은 rule에 위배되는 제안이나 코드는 절대보내지 않는다.

## Decision table

| 작업 유형                                                      | 반드시 읽을 rule leaf                                                                                          |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| TypeScript 타입 설계, import, assertion                        | `docs/rules/01-네이밍-규칙.md`, `docs/rules/15-Husky-품질-게이트.md`                                           |
| React 컴포넌트, Hook, 렌더링, lifecycle                        | `docs/rules/01-네이밍-규칙.md`, `docs/rules/03-컴포넌트-라이프사이클.md`, `docs/rules/15-Husky-품질-게이트.md` |
| Suspense, Error boundary, 로딩/에러 상태                       | `docs/rules/03-컴포넌트-라이프사이클.md`, `docs/rules/04-상태-관리.md`                                         |
| 상태 관리, store, selector, persist                            | `docs/rules/04-상태-관리.md`, `docs/rules/12-셀렉터-패턴.md`                                                   |
| API client, Route Handler, query key, fetch, DTO, domain model | `docs/rules/05-API-패턴.md`                                                                                    |
| 폼, 입력, 검색, debounce                                       | `docs/rules/06-폼-패턴.md`, `docs/rules/17-접근성.md`                                                          |
| 네비게이션, 라우트 전환, prefetch, URL 상태                    | `docs/rules/07-네비게이션-패턴.md`, `docs/rules/04-상태-관리.md`                                               |
| 모달, 다이얼로그, 드롭다운, 토스트                             | `docs/rules/08-모달-토스트.md`, `docs/rules/17-접근성.md`                                                      |
| 로깅, 에러 추적, 디버깅 출력                                   | `docs/rules/09-로깅-패턴.md`                                                                                   |
| 성능 최적화, 이미지, 캐시                                      | `docs/rules/10-최적화-패턴.md`, `docs/rules/03-컴포넌트-라이프사이클.md`                                       |
| 테스트 작성                                                    | `docs/rules/11-테스트-패턴.md`                                                                                 |
| 새 폴더, 파일 구조, FSD slice                                  | `docs/rules/02-디렉토리-구조.md`, `docs/rules/13-피처-구조-패턴.md`                                            |
| 주석, 문서화, AI 생성 표기                                     | `docs/rules/14-주석-정책.md`                                                                                   |
| 일반 UI 스타일, 비특화 interaction, CSS                        | `docs/rules/17-접근성.md`, `docs/rules/03-컴포넌트-라이프사이클.md`                                            |
| 커밋                                                           | `docs/rules/15-Husky-품질-게이트.md`                                                                           |
| PR 작성                                                        | `docs/rules/16-PR-컨벤션.md`, `docs/rules/15-Husky-품질-게이트.md`                                             |
| 검증/품질 게이트                                               | `docs/rules/15-Husky-품질-게이트.md`, `docs/rules/11-테스트-패턴.md`                                           |
| 감사                                                           | `docs/rules/18-감사.md`                                                                                        |

## Source of truth map

| 영역                         | Source of truth                                                          |
| ---------------------------- | ------------------------------------------------------------------------ |
| TypeScript, ESLint, Prettier | `tsconfig*.json`, `eslint.config.mjs`, `.prettierrc`                     |
| React, Next, 패키지 연결     | `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `postcss.config.mjs` |
| 테스트와 검증 명령           | `package.json`, `vitest.config.ts`, `playwright.config.ts`               |
| 커밋과 hook                  | `commitlint.config.cjs`, `.husky/*`                                      |
| 규칙 의도와 리뷰 기준        | `docs/rules/**`                                                          |

## 운영 원칙

- 실행 가능한 규칙은 저장소 설정 파일을 source of truth로 삼고, 규칙의 의도와 판단 기준은 `docs/rules/**`를 따릅니다.
- 작업을 시작할 때 이 문서의 Decision table에 따라 필요한 rule leaf를 **모두** 읽으며, 모든 규칙 문서를 한꺼번에 읽지 않습니다.
- 설명할 수 없는 코드는 AI가 생성했더라도 제출하지 않습니다.
- 작업 완료 전에는 `docs/rules/15-Husky-품질-게이트.md`에서 변경 유형에 맞는 검증을 확인하고, 미실행 항목과 남은 위험을 보고합니다.
