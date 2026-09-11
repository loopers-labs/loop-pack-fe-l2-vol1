# React Component Review Rules

## Rule Sources

- `AGENTS.md`
- `docs/assignments/week-02.md`
- `docs/assignments/week-03.md`
- `docs/ai/component-review-skill.md`

## Review Goal

컴포넌트, Hook, API, 유틸의 책임이 뒤섞이지 않았는지 확인한다.

## Rules

- 컴포넌트는 UI 구조와 이벤트 연결에 집중한다.
- API endpoint, request params, response contract는 컴포넌트 밖에서 확인할 수 있어야 한다.
- 페이지나 큰 컴포넌트는 화면 구획을 조합하는 역할에 가깝게 둔다.
- Custom Hook은 한 문장으로 설명할 수 있어야 한다. 설명에 "그리고"가 반복되면 분리 후보로 본다.
- Hook은 JSX나 스타일 객체를 반환하지 않는다.
- 파생값은 state로 저장하지 않는다.
- 파생값을 `useEffect`로 동기화하지 않는다.
- `useEffect`는 API 요청, 구독, storage, history, scroll처럼 외부 시스템과 동기화할 때만 사용한다.
- 조건부 렌더링은 모든 Hook 호출 이후 early return으로 처리한다.
- props 이름은 역할을 드러내야 한다.
- 동시에 참이면 안 되는 boolean props/state가 여럿이면 union type이나 enum으로 표현할 수 있는지 검토한다.
- props 전달이 깊다는 이유만으로 Context를 도입하지 않는다. 여러 곳에서 같은 상태를 실제로 공유할 때만 검토한다.
- 파일 수를 늘리기 위한 컴포넌트/Hook/유틸 추출은 지적한다.

## Findings To Prefer

- 컴포넌트가 API 요청 세부사항과 UI 렌더링을 함께 맡는 경우
- 큰 컴포넌트를 거의 그대로 큰 Hook으로 옮긴 경우
- Hook 이름이 역할을 설명하지 못하거나 여러 책임을 숨기는 경우
- 렌더 중 계산 가능한 값을 state/effect로 동기화하는 경우
- cleanup 없는 외부 구독, stale response 방어 없는 비동기 effect
- 여러 boolean 조합으로 불가능한 상태를 만들 수 있는 경우

## Do Not Flag

- 실제 중복이나 복잡도를 줄이지 못하는 추출을 하지 않은 경우
- 한 파일 안의 private helper로 충분한 로직
- 사용처가 하나뿐인 UI를 공통 컴포넌트로 만들지 않은 결정
- 도메인 전용 표시 정책을 해당 컴포넌트 근처에 둔 결정

## Review Output

문제는 UI, Hook, API, 유틸 중 어떤 경계가 흐려졌는지 함께 적는다. 분리 제안은 동작을 보존하는 가장 작은 변경이어야 한다.
