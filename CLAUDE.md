# CLAUDE.md

이 파일은 이 레포에서 Claude Code (claude.ai/code) 가 코드를 다룰 때 따라야 할 지침이다.

세부 코딩 규칙은 `.claude/rules/` 로 분리돼 있다 — `code-quality.md`(항상 로드), `react.md`(`.ts/.tsx` 작업 시 로드).

## 절대 금지 (비협상)

이 규칙들은 어떤 형태로도 어겨서는 안 된다.

- **룰 우회 절대 금지**: `any` / `as` / `@ts-ignore` / `eslint-disable` (모든 변형 포함) — 어떤 형태로도 새로 추가하지 않는다. 기계가 잡았다면 코드를 고친다, 잠재우지 않는다.
- **git hook 스킵 절대 금지**: `--no-verify` / `--no-gpg-sign` 류 플래그, `HUSKY=0` 같은 환경변수, husky 파일 직접 비우기 등 **어떤 방법으로도** `pre-commit`/`pre-push` 를 우회하지 않는다. 훅이 실패하면 코드를 고친다 — 훅을 끄지 않는다.

## 스택

React 19 + Vite + TypeScript. **Next.js 는 없다** — Server Components, App Router, `useRouter` 등 Next 전용 구문을 끌어오지 말 것.

## 언어

문서·PR·커밋 메시지·응답 기본 언어는 **한국어**. 사용자가 명시적으로 영어를 요청하지 않는 한 한국어로 작성·응답.

## 자주 쓰는 커맨드

- `pnpm install` — 최초 셋업 (`prepare` 가 husky 도 설치)
- `pnpm dev` — Vite 개발 서버
- `pnpm build` — `tsc -b && vite build` (pre-push 훅이 같은 걸 돌린다)
- `pnpm lint` — `eslint .`
- `pnpm preview` — 빌드 산출물 미리보기

**테스트 러너 없음** — vitest/jest 등 호출 금지. pnpm 은 `packageManager` 로 버전 고정 — npm/yarn 사용 금지.

## Git 훅 (husky + lint-staged)

- `pre-commit` → `pnpm exec lint-staged` → 스테이지된 `*.{js,mjs,cjs,ts,mts,cts,jsx,tsx,css}` 에 `eslint --fix`.
- `pre-push` → `pnpm build` (타입체크 + 번들 통과해야 푸시 가능).

