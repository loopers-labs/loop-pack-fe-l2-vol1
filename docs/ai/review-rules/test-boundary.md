# Test Boundary Review Rules

## Rule Sources

- `docs/assignments/week-08.md`
- `docs/ai/test-skill.md`

## Review Goal

테스트가 지켜야 할 동작을 알맞은 레벨에서 검증하고, 모킹 경계가 흐려지지 않았는지 확인한다.

## Rules

- 테스트를 추가할 때는 어떤 사용자 동작이나 상태 계약을 지키려는지 먼저 드러나야 한다.
- 입력과 출력이 명확한 순수 로직은 단위 테스트로 둔다.
- 사용자 조작이 URL, 서버 상태, store, 화면 결과를 함께 바꾸면 통합 테스트로 둔다.
- jsdom이나 컴포넌트 테스트로 보기 어려운 브라우저·서버 경계만 E2E로 올린다.
- 통합 테스트의 네트워크는 MSW로 가로챈다.
- 앱 코드의 HTTP 클라이언트, `fetch`, API 함수를 직접 mock해서 HTTP 경계를 우회하지 않는다.
- MSW 기본 handler에는 성공 경로만 둔다. 실패·지연·빈 결과는 각 테스트 안에서 덮어쓴다.
- 모킹되지 않은 요청은 실패해야 한다.
- 테스트 이름은 조건과 결과를 함께 보여줘야 한다.
- 새 테스트에는 정상 케이스와 경계 케이스를 함께 둔다.
- 요소는 role, label, visible text처럼 사용자가 인식하는 방식으로 찾는다. `getByTestId`는 마지막 수단이다.
- 모든 단언을 `waitFor`로 감싸지 않는다. 첫 비동기 전환만 기다리고, 이후 단언은 가능한 한 동기로 확인한다.
- E2E는 production build 위에서 돌리고, `sleep` 대신 조건 기반 대기를 쓴다.
- 실패하는 테스트를 `it.skip`, 주석 처리, 약한 단언으로 숨기지 않는다.

## Findings To Prefer

- 실패해도 무엇이 깨졌는지 알기 어려운 `works`, `renders`, `should be true` 테스트
- `toBeTruthy()`나 스냅샷만으로 사용자 관찰 결과를 대신한 경우
- 통합 테스트에서 `vi.mock`, `spyOn(fetch)`, API 함수 mock으로 네트워크 경계를 없앤 경우
- 빈 결과, 에러, 지연 같은 scenario를 전역 기본 handler에 넣어 테스트끼리 영향을 주는 경우
- 모든 화면 단언을 `waitFor`에 넣어 실패 원인이 흐려지는 경우
- role이나 label로 찾을 수 있는데도 `getByTestId`를 먼저 쓴 경우
- 통합 테스트가 이미 보장하는 사실을 E2E에서 그대로 반복한 경우

## Do Not Flag

- 순수 함수나 selector를 DOM 없이 단위 테스트로 검증한 경우
- 사용자 흐름을 검증하려고 여러 레이어를 함께 렌더한 통합 테스트
- E2E를 별도 명령으로 두고 CI 조건부 실행 근거를 문서화한 경우
- test id를 쓴 이유가 접근성 이름으로 표현하기 어려운 기술적 상태라면 기록된 경우

## Review Output

문제를 지적할 때는 이 테스트가 어떤 사실을 보장해야 하는지 먼저 적는다. 수정안은 테스트 레벨이나 모킹 경계를 바꾸는 가장 작은 변경이어야 한다.
