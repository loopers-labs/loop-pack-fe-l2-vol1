# State and URL Review Rules

## Rule Sources

- `docs/assignments/week-05.md`
- `docs/assignments/week-07.md`
- `docs/ai/component-review-skill.md`

## Review Goal

서버 상태, URL 상태, 클라이언트 상태, 파생값의 원본이 흐려지지 않았는지 본다.

## Rules

- 서버 응답은 TanStack Query 같은 서버 상태 계층에서 다룬다.
- 서버 응답을 Zustand나 React 로컬 state에 다시 복사하지 않는다.
- 검색, 카테고리, 정렬, 페이지처럼 공유·새로고침·뒤로 가기가 필요한 조건은 URL이 원본이다.
- URL 조건은 query key와 실제 API 요청에 함께 반영한다.
- 사용자 URL 상태에 mock 검증용 `scenario`를 섞지 않는다.
- 검색, 카테고리, 정렬이 바뀌어 현재 page가 무효해질 수 있으면 page를 초기화한다.
- 장바구니, 위시리스트처럼 여러 화면에서 함께 쓰는 비로그인 로컬 데이터만 클라이언트 store에 둔다.
- Header 개수처럼 계산 가능한 값은 별도 state로 저장하지 않고 파생한다.
- 데이터 없는 최초 진입, 기존 목록 갱신, 0건, 최초 실패, 갱신 실패, 취소는 서로 다른 화면 상태로 다룬다.
- 기존 목록이 있는 갱신에서는 목록을 먼저 비우지 말고 갱신 중임을 보여준다.
- 이전 요청이 늦게 끝나도 현재 URL의 active query와 화면 결과를 덮지 않아야 한다.
- fallback과 실제 콘텐츠가 교체될 때 눈에 띄는 CLS를 만들면 안 된다.

## Findings To Prefer

- 서버 응답을 store나 local state에 복사해 원본을 둘로 만든 경우
- URL query와 query key 또는 API 요청 조건이 서로 다른 경우
- 필터 변경 후 이전 page를 그대로 둬 빈 결과나 잘못된 요청을 만드는 경우
- `scenario` 같은 검증용 값이 사용자 URL 상태 타입에 들어간 경우
- Header count, selected 여부 같은 파생값을 별도 state로 저장한 경우
- 기존 목록 갱신 중 목록을 비워 CLS나 빈 화면이 생기는 경우
- 늦게 끝난 이전 요청이 최신 화면을 덮을 수 있는 경우

## Do Not Flag

- 한 화면에서만 쓰는 modal open, 입력 초안, tab 같은 UI state를 React 로컬 state에 둔 경우
- 새로고침 후 초기화되어도 되는 비로그인 장바구니·위시리스트를 로컬 store에 둔 경우
- 실제 병목이나 UX 문제가 없어 prefetch, placeholderData, AbortSignal을 추가하지 않은 경우

## Review Output

문제를 지적할 때는 어떤 상태의 원본이 무엇이어야 하는지 먼저 적는다. 수정안은 원본을 하나로 줄이는 가장 작은 변경이어야 한다.
