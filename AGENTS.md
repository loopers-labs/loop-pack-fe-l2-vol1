# Agent Instructions

이 파일은 항상 자동으로 읽히는 최상위 계약입니다. 자동 컨텍스트를 최소화하기 위해 공통 계약과 규칙 라우팅만 둡니다.

- 실행 가능한 규칙은 저장소 설정 파일을 source of truth로 삼고, 규칙의 의도와 판단 기준은 `docs/rules/**`를 따릅니다.
- 작업을 시작할 때 `docs/rules/README.md`에서 해당 작업에 필요한 family와 leaf만 선택해 읽으며, 모든 규칙 문서를 한꺼번에 읽지 않습니다.
- 설명할 수 없는 코드는 AI가 생성했더라도 제출하지 않습니다.
- UI, form, interaction, CSS, loading/error/empty state를 변경할 때는 `docs/rules/accessibility.md`를 읽습니다.
- 커밋할 때는 `docs/rules/git/commits.md`를 읽고 메시지와 Git hook 규칙을 따릅니다.
- 작업 완료 전에는 `docs/rules/testing/verification.md`에서 변경 유형에 맞는 검증을 확인하고, 미실행 항목과 남은 위험을 보고합니다.
