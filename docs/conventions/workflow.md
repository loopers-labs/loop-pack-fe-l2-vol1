# 워크플로우 규칙

- 브랜치: `feat/JIRA-123-short-description` (예: `feat/PROJ-45-add-login`)
- 커밋: Conventional Commits (`feat: 로그인 기능 추가`)
- 새 기능은 새 브랜치 작업 후 PR 병합
- PR: 포크 → upstream `main`. 본문에 AI 사용 여부, 변경 사유 표기
- 체크: `pnpm format` 실행, lint/타입 검사 모두 통과
