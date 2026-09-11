# Specs

Playwright agent 산출물을 보관하는 디렉터리다.

- `week09-agent-plan.md`: planner가 생성한 9주차 E2E 후보 계획
- `week09-agent-generated.md`: generator가 생성한 테스트 후보 코드

생성 후보는 검수용으로만 보관한다. 실제 E2E suite에는 3단계에서 정한
`e2e/auth.spec.ts`, `e2e/checkout.spec.ts`만 포함한다.
