# 프로젝트 가이드

## 개요

React 19 + Vite + TypeScript 기반 학습용 프론트엔드 과제 레포

## 명령어

- 개발 서버: `pnpm install && pnpm dev`
- 빌드: `pnpm build`
- 포맷: `pnpm format`

## 디렉토리 구조

- `src/`: 애플리케이션 코드
- `docs/assignments/`: 주차별 과제 지시
- `docs/conventions/`: 코드 컨벤션 및 워크플로우 규칙
- `.claude/skills/`: 기술별 스킬 가이드 (React 19)

## 컨벤션

- 코드: [docs/conventions/code-conventions.md](docs/conventions/code-conventions.md)
- 컴포넌트: arrow function 사용, `React.FC` 금지, named export 권장
- 커밋: Conventional Commits 한글 작성 — [docs/conventions/commit-conventions.md](docs/conventions/commit-conventions.md)

## Gotchas

- `any` / `@ts-ignore` 방치
- React hook 의존성 누락
- 파생 가능한 값을 `useState` + `useEffect`로 동기화 (계산으로 파생할 것)

## 워크플로우

- PR: 포크 → upstream `main`. 본문에 AI 사용 여부·변경 사유 기재
- PR 전 `pnpm format`, lint, 타입 검사 통과

## 보안

- `.env` 커밋, API 키 하드코딩, 비밀값/토큰 절대 금지
- 민감 정보가 포함된 로그/에러 메시지 금지
