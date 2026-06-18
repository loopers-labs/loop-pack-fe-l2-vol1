# CLAUDE.md

> 팀 AI 협업 규칙. 스타일/포맷은 여기 적지 않는다 — ESLint·Prettier가 기계적으로 강제한다.
> (타 에이전트는 같은 내용을 `AGENTS.md` 심볼릭 링크로 읽는다.)

## 변경을 끝내기 전 (필수)

- `pnpm lint` 통과 — 자동수정은 `pnpm lint:fix`
- `pnpm format` 으로 Prettier 적용
- 커밋 게이트(husky + lint-staged)가 lint/포맷 실패를 막는다. `--no-verify`로 우회하지 않는다.

## 비자명한 규칙 (코드만 봐선 모르는 것)

- 파생 가능한 값은 **계산**한다 — `useState` + `useEffect`로 상태를 동기화하지 않는다.
- `any` / `as` / `@ts-ignore` / `eslint-disable` 금지 — 전부 "기계가 경고하려던 자리"다.
- 비슷한 유틸/컴포넌트를 새로 만들지 말고 **기존 것을 재사용**한다.
- 조건부 렌더링은 early return으로 — 단, **모든 hook 호출 뒤에서**.
