---
name: project-ai-review
description: PR diff를 이 프로젝트의 10주차 누적 규칙으로 리뷰할 때 사용한다. 타입/린트 우회, React 경계, 상태 원본, FSD 구조/Public API, 테스트/모킹 경계를 점검한다.
---

# Project AI Review Skill

## Purpose

PR diff를 이 프로젝트의 규칙으로 리뷰한다. 일반적인 코드 스타일 조언이 아니라, 10주 동안 정한 팀 규칙을 기준으로 버그 가능성, 경계 위반, 검증 누락을 찾는다.

## Rule Files

리뷰를 시작하기 전에 아래 파일을 읽고 적용한다.

- `docs/ai/review-rules/type-lint.md`
- `docs/ai/review-rules/react-component.md`
- `docs/ai/review-rules/state-url.md`
- `docs/ai/review-rules/fsd-boundary.md`
- `docs/ai/review-rules/test-boundary.md`

## Review Scope

- PR diff에 포함된 변경을 먼저 본다.
- 변경 줄 주변의 기존 코드도 읽되, 이번 PR과 무관한 오래된 문제는 finding으로 쓰지 않는다.
- 추측으로 지적하지 않는다. 파일/라인, 변경 내용, 어긴 규칙이 이어질 때만 finding으로 쓴다.
- 자동화가 더 맞는 문제라면 어떤 결정적 하네스로 내릴 수 있는지 함께 적는다.

## Review Order

1. 타입/린트 우회와 검증 우회가 있는지 확인한다.
2. React 컴포넌트, Hook, API, 유틸의 책임 경계를 본다.
3. 서버 상태, URL 상태, 클라이언트 상태, 파생값의 원본이 유지되는지 확인한다.
4. FSD 구조 배치와 slice Public API 의도가 변경에 맞는지 확인한다.
5. 테스트 레벨과 모킹 경계가 변경 의도에 맞는지 확인한다.

## Output Format

리뷰 결과는 아래 순서로 쓴다.

1. Findings: 심각도 높은 순서로 파일/라인, 문제, 근거, 가장 작은 수정안을 적는다.
2. Open Questions: 판단에 필요한 정보가 diff에 없을 때만 적는다.
3. False Positive Notes: 지적하지 않기로 한 애매한 항목과 그 이유를 적는다.
4. Rule Promotion Candidates: 반복될 수 있고 결정적으로 판별 가능한 항목만 적는다.

finding이 없으면 "발견한 문제 없음"이라고 쓰고, 남은 위험이나 테스트 공백만 짧게 남긴다.

## Do Not

- "가독성", "유지보수성"처럼 근거 없는 일반론으로 지적하지 않는다.
- 취향 차이, 파일명 선호, 이번 PR 밖의 오래된 문제를 finding으로 만들지 않는다.
- 큰 rewrite를 제안하지 않는다. 동작을 보존하는 가장 작은 변경을 우선한다.
- AI 리뷰를 required gate처럼 단정하지 않는다. 이 리뷰는 advisory이고, 최종 판단은 사람이 한다.
