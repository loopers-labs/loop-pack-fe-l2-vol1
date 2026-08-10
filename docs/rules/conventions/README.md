# 컨벤션 문서

코드 작성 방식에 관한 규칙을 필요한 주제만 골라 읽기 위한 라우터입니다.

## Decision table

| 확인할 주제                          | 문서                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| TypeScript 타입과 import 규칙        | [`typescript.md`](typescript.md)                                                         |
| React, Hook, 렌더링, 스타일링        | [`react.md`](react.md)                                                                   |
| 외부 입력과 Zod 검증                 | [`runtime-boundaries.md`](runtime-boundaries.md)                                         |
| 파일명, export, co-location, AI 협업 | [`exports-and-files.md`](exports-and-files.md)                                           |
| FSD import와 `index.ts` 정책         | [`../architecture/imports-and-public-api.md`](../architecture/imports-and-public-api.md) |

## Source of truth map

| 영역                | Source of truth                                          |
| ------------------- | -------------------------------------------------------- |
| TypeScript          | `tsconfig*.json`, `eslint.config.mjs`                    |
| React와 패키지 연결 | `eslint.config.mjs`, `package.json`, `pnpm-lock.yaml`    |
| 포맷                | `.prettierrc`                                            |
| FSD 경계            | [`../architecture/README.md`](../architecture/README.md) |
