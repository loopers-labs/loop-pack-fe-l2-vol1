# 에러 처리 경계 설계 — 근거 리서치 노트 (6주차)

> 목적: RFC의 "4단계 에러 처리 경계" 결정을 확정하기 전에, 그 기준이 한 사람 취향이 아니라 통용되는 관행과 맞는지 크로스 검토한 기록.

## 확정하려는 기준

- **5xx(서버 오류) + 예상치 못한 렌더링 오류** → `throwOnError`로 route `error.tsx`(Error Boundary)에 전파
- **4xx(잘못된 요청) + 빈 결과** → 각 페이지 컴포넌트의 `isError` 분기에서 인라인 처리(다시 시도 버튼)
- 이 기준은 이미 `providers.tsx`의 `shouldRetry`(4xx 즉시 실패, 5xx만 재시도)와 방향이 일치한다.

## 검토 결과 — 두 개의 축

### 축 1: "4xx vs 5xx를 재시도 관점에서 다르게 다룬다" → 강한 컨센서스

여러 독립 출처가 동일하게 수렴:

- **5xx / 429 / 타임아웃**: 일시적일 수 있음 → 재시도 대상(retryable)
- **4xx (400/404)**: 요청 자체가 틀림 → 같은 요청 재시도 무의미(non-retryable). 사용자가 요청을 바꿔야 해결됨.
- 예외: 429(Too Many Requests)는 4xx지만 backoff 재시도 대상.

근거 출처:
- TkDodo(TanStack Query 메인테이너) — "4xx는 로컬 처리, 5xx는 Error Boundary로 전파." `throwOnError`에 함수를 넘겨 상태 코드별 분기하는 것은 v3.23+ 공식 지원.
  - https://tkdodo.eu/blog/react-query-error-handling
- Baeldung — 어떤 HTTP 상태 코드를 재시도하면 안 되는가: 4xx는 클라이언트가 요청을 바꾸지 않는 한 재시도해도 성공 못 함.
  - https://www.baeldung.com/cs/http-error-status-codes-retry
- api4ai — HTTP 클라이언트 재시도 로직 베스트 프랙티스: 재시도는 5xx·타임아웃 대상.
  - https://api4.ai/blog/best-practice-implementing-retry-logic-in-http-api-clients

### 축 2: "그 에러를 어디에 그리는가 (boundary vs 인라인)" → 방향은 일관, 컨센서스는 다소 느슨

- Next.js 진영: 세그먼트 단위 `error.tsx`로 실패를 **격리**하는 것을 권장. "한 섹션의 실패가 앱 전체를 무너뜨리면 안 된다"(예: 깨진 애널리틱스 페이지가 대시보드 전체를 죽이면 안 됨).
  - https://vercel.com/academy/nextjs-foundations/errors-and-not-found
  - https://betterstack.com/community/guides/scaling-nodejs/error-handling-nextjs/
- React 일반 가이드: 모든 것을 감싸지 말고 위험하거나 사용자-대면인 부분에만 **선별적으로** 경계를 둔다.

### 중요한 반례/한계

- Error Boundary(및 Next `error.tsx`)는 **렌더링 중 throw된 오류만** 잡는다. `useEffect`/setTimeout/Promise 콜백/이벤트 핸들러(onClick 등)에서 던진 오류는 **못 잡는다**.
  - 이 프로젝트에서 담기/찜 토글은 실패하지 않는 동기 연산이라 이벤트 핸들러 에러 이슈는 현재 없음.
  - 향후 이벤트 핸들러에서 실패 가능한 비동기 작업(예: 서버에 장바구니 저장)을 추가하면 그 핸들러 안에서 try/catch로 직접 처리해야 함.
- `throwOnError`가 true를 반환하면 그 쿼리는 컴포넌트의 `isError` 분기까지 도달하지 않고 렌더 중 throw됨 → "같은 에러를 두 군데서 처리"가 아니라 **서로 배타적 경로**. 겹침 걱정 없음.

## 결론(현재 시점)

우리가 세운 기준(5xx→boundary, 4xx·빈결과→인라인)은 어느 한 사람 취향이 아니라 여러 방향의 관행과 맞아떨어진다. 특히:
- 4xx/5xx 구분: 업계 표준 ✓
- 5xx를 route error.tsx로 격리: Next.js 권장 방향 ✓
- 4xx·빈 결과 인라인 유지: "사용자가 조건 바꿔 바로 재시도"라는 UX상 자연스러움 ✓

## 크로스 검토 시 다시 확인할 것

- [ ] 위 출처 링크가 여전히 유효하고 입장이 바뀌지 않았는지
- [ ] TanStack Query 최신 버전에서 `throwOnError` 시그니처/기본동작 변경 여부
- [ ] 이 프로젝트에 이벤트 핸들러 기반 비동기 작업이 새로 생겼는지(생겼다면 축2 한계 재검토)
