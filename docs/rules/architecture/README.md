# 아키텍처 문서

FSD 배치와 모듈 경계 규칙을 필요한 주제만 골라 읽기 위한 라우터입니다.

## Decision table

| 확인할 주제                                         | 문서                                                           |
| --------------------------------------------------- | -------------------------------------------------------------- |
| `views`를 포함한 레이어, slice, segment, Next route | [`fsd-layers.md`](fsd-layers.md)                               |
| import 방향, co-location, 폴더 승격, 직접 import    | [`imports-and-public-api.md`](imports-and-public-api.md)       |
| Zod DTO, domain model, Repository, Service          | [`domain-and-api-boundaries.md`](domain-and-api-boundaries.md) |

## Source of truth map

| 영역                     | Source of truth             |
| ------------------------ | --------------------------- |
| 경로 alias와 컴파일 경계 | `tsconfig*.json`            |
| import/export 정적 규칙  | `eslint.config.mjs`         |
| Next App Router 연결     | `src/app`, `next.config.ts` |
| 저장소 FSD 판단 기준     | 이 디렉터리의 세 leaf 문서  |
