# docs/rules 문서 인덱스

`docs/rules`는 이 저장소의 프로젝트 규칙 원문을 보관하는 디렉터리입니다. 도구가 강제하는 규칙은 설정 파일을 source of truth로 두고, `docs/rules` 문서는 그 규칙의 의도와 적용 기준을 설명합니다.

## 문서 목록

- `conventions.md`: 코드 작성 원칙, React/TypeScript 컨벤션, 스타일 작성 기준
- `lint-and-format.md`: ESLint, Prettier, TypeScript 설정 요약과 금지 패턴
- `commit-and-pr.md`: commitlint, Git hook, PR 설명 기준
- `fsd-architecture.md`: FSD 레이어, 슬라이스, 세그먼트, import 경계
- `accessibility.md`: UI 변경 시 접근성 체크리스트
- `testing.md`: 작업 완료 전 검증 명령과 수동 확인 기준
- `audit.md`: `/audit` 커맨드와 감사 에이전트 운영 방식

## 운영 원칙

- `AGENTS.md`는 짧은 최상위 계약으로 유지한다.
- 상세 규칙은 `docs/rules/*`에 추가한다.
- OpenCode 전용 커맨드와 에이전트는 `.opencode/commands`, `.opencode/agents`에 둔다.
- 같은 규칙을 여러 문서에 길게 복제하지 않는다. 중복이 필요하면 원문 문서로 링크한다.
