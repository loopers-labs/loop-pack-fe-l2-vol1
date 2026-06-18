## Stack

React 19 + Vite + TypeScript

## Commands

- `pnpm dev` — dev server
- `pnpm build` — tsc -b && vite build
- `pnpm lint` — ESLint (스타일 규칙은 전부 여기서 강제됨 스타일을 이 파일에 적지 말 것)
- `pnpm typecheck` — tsc --noEmit
- `pnpm format` — Prettier

## Component

- 파일 하나에 export 하나 (작은 헬퍼 co-location만 허용)
- Props interface는 파일 상단에 정의, 시그니처에서 구조분해 (본문 말고)
- 파일 내부 순서: 타입 → 상수 → 컴포넌트 안에서 훅 → 파생값 → 핸들러 → early return → JSX
- 이벤트 네이밍: 밖에서 받는 prop은 `on{Event}`, 내부 구현은 `handle{Event}`
- boolean prop/state는 `is` / `has` / `should` 접두사
- 조건부 렌더링은 early return 우선
- 컴포넌트 ~150줄, props 7개를 넘으면 분리 신호 (쪼개거나 합성 패턴)
- 세부 규칙·예시는 필요할 때 읽기: docs/frontend-conventions.md

## 작업 방식

- 코드 짜기 전에 접근 방식을 한 줄로 먼저 확인받고 시작
- 생성한 코드는 "왜 이렇게 짰는가"를 설명할 수 있어야 함, 설명 못 하면 다시 짜기

## Commits

- 형식: `<타입>(<스코프>): <제목>` — Conventional Commits
- 언어: 한국어 (타입·스코프는 영문 유지)
- 제목: 50자 이내, 마침표 없음, 명령형 동사로 시작
- 본문: **왜 바꿨는가** 필수, 자명해 보여도 이유 한 줄은 반드시 있어야 함
- 타입: `feat` / `fix` / `refactor` / `style` / `docs` / `test` / `chore`

## Never

- lint / typecheck 통과 안 한 코드 커밋
- `--no-verify`로 git hook 우회
- 스타일·포맷 규칙을 이 파일에 추가 (무조건 린터가 주인)
- `.env` / 시크릿 / 키 커밋
- 한 PR에 목적 두 개 이상 섞기
- 못 보던 라이브러리 임의 추가, 필요하다면 먼저 묻기
