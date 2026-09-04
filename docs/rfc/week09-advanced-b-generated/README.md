# Advanced B — 생성 원본 (검수용, 실행 안 함)

`npx playwright init-agents --loop claude`로 스캐폴딩한 planner·generator를 돌려 인증 플로우를 자동 생성한 결과다. **검수용 증거이므로 `e2e/` 밖에 두어 테스트 스위트로 실행하지 않는다.** 검수 결과(비교·지운 것·healer)는 RFC의 [§E](../week09-e2e-scope.md#e-advanced-b--에이전트-생성-검수)에 있다.

- `auth-flow.plan.md` — planner가 앱을 탐색해 쓴 테스트 계획.
- `redirect-restore.spec.ts`·`session-expiry.spec.ts`·`invalid-credentials.spec.ts` — generator가 계획으로 생성한 테스트, 원본 그대로.

`session-expiry.spec.ts`의 원본에는 위조 서명 쿠키를 다루는 `test.fixme`가 하나 더 있었으나, 과제가 비활성화 테스트를 금지해 걷어냈다(경위는 §E). 스캐폴딩(`.claude/agents/playwright-test-*`·`.mcp.json`)은 init-agents가 만든 일회성 도구라 커밋에 남기지 않는다.
