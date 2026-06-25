<!-- 이 파일이 정본(canonical)입니다. CLAUDE.md는 @import로 참조합니다. -->

# AGENTS.md

## 프로젝트 개요

React 19 + Vite + TypeScript 프론트엔드. 1차 하네스(ESLint · Prettier · husky)로 커밋 게이트를 강제한다.

## 문서 역할

| 문서                             | 역할                    | 대상      |
| -------------------------------- | ----------------------- | --------- |
| [AGENTS.md](AGENTS.md)           | 워크플로, 프로젝트 요약 | AI        |
| [README.md](README.md)           | 프로젝트 소개           | 사람      |
| [CONVENTIONS.md](CONVENTIONS.md) | 코드 컨벤션             | AI / 사람 |

## Boundaries

- ⚠️ **Ask first**:
  - 새 외부 의존성 추가
  - tsconfig, vite 등 환경설정 변경
- 🚫 **Never**:
  - `.env` · API 키 등 시크릿 커밋, 환경별 값 하드코딩
  - `@ts-ignore` · `eslint-disable`로 린터·타입 검사 침묵
  - 존재하지 않는 패키지 · API import (환각 금지)

## 1차 하네스

커밋 전 자동으로 아래가 돌아간다. `--no-verify` 우회 금지.

- `pnpm lint` — ESLint
- `pnpm format:check` — Prettier
- `pnpm typecheck` — TypeScript strict

## 작업 방식

- 수정 전 대상 파일을 먼저 읽을 것
- 한 번에 대규모로 바꾸지 말 것 — 작게 나눠서
- 요청받지 않은 기능 · 리팩터링 추가 금지

## GitHub 규칙

커밋 형식: `{type}: {내용}`
타입: `feat` · `fix` · `refactor` · `chore` · `docs`
메시지는 한국어로 작성

## 명령어

> 패키지 매니저: **pnpm** 전용 (npm · yarn 금지)

| 명령어              | 설명                 |
| ------------------- | -------------------- |
| `pnpm dev`          | 개발 서버 실행       |
| `pnpm build`        | 타입 체크 후 번들    |
| `pnpm preview`      | 빌드 결과 미리보기   |
| `pnpm lint`         | ESLint 실행          |
| `pnpm lint:fix`     | ESLint 자동 수정     |
| `pnpm format`       | Prettier 포맷        |
| `pnpm format:check` | Prettier 검사        |
| `pnpm typecheck`    | TypeScript 타입 체크 |

## 코드 규칙

@CONVENTIONS.md
