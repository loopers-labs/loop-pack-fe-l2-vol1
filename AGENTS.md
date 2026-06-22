<!-- 이 파일이 정본(canonical)입니다. CLAUDE.md는 이 파일로의 심링크. -->
<!-- 읽는 도구: Claude Code (CLAUDE.md → 심링크), Codex (AGENTS.md). 수정은 이 파일에서. -->

# AGENTS.md

## 프로젝트 개요

- React 기반 감성 인테리어 큐레이션 커머스 서비스

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
  - `.env` · API 키 등 시크릿 커밋, 환경별 값 하드코딩 (환경변수로)

## 워크플로

- **구현 전 `/specify`**: 먼저 스펙을 합의해 `specs/`에 기록한 뒤 시작한다.
- **구현 후 `/self-review`**: 변경 내용에 대해 자체 검증한 뒤 사람 리뷰나 PR로 넘긴다.

## GitHub 규칙

- 커밋 형식은 `{type}: {내용}`
  - 타입: `feat` · `fix` · `refactor` · `test` · `chore`
  - 메시지는 자세하게 왜 이 변경이 필요했는지 무엇을 했는지 기록

## 코드 규칙

- 코드 작성은 @CONVENTIONS.md 를 따른다.

## 명령어

> 패키지 매니저는 **pnpm** 전용

| 명령어         | 설명                                      |
| -------------- | ----------------------------------------- |
| `pnpm dev`     | 개발 서버 실행                            |
| `pnpm preview` | 빌드 결과 미리보기                        |
| `pnpm build`   | 타입 체크(`tsc -b`) 후 번들(`vite build`) |
