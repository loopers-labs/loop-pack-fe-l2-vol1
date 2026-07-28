# 5주차 체크리스트

> 기준: [`docs/assignments/week-05.md`](../assignments/week-05.md)
> 점검일 기준 실제 코드·런타임 대조 결과. 미완 항목은 [`flow.md`](./flow.md)의 "남은 작업"에 정리.

**상태 설계**

- [x] 구현 전에 `상태 · 소유자 · 수명 · 공유 범위 · 선택 이유` 표를 작성했는가 — [state-design.md](./state-design.md)
- [x] 서버·URL·클라이언트·로컬 상태를 나눈 기준을 설명할 수 있는가
- [x] 계산 가능한 값을 별도 상태로 중복 저장하지 않았는가 — 헤더 개수는 `ids.length` 파생
- [x] 같은 데이터를 여러 저장소에 복사하지 않았는가 — 서버 응답을 store에 복사 안 함

**TanStack Query**

- [x] `QueryClientProvider`를 구성했는가 — `providers.tsx`
- [x] `queryOptions`로 query key·queryFn·staleTime을 함께 정의했는가
- [x] 목록 조건이 query key와 API 요청에 모두 반영되는가 — `productQueries.list(params)`
- [x] staleTime과 gcTime의 근거를 기록했는가 — 홈 1분·목록 5분·기본 gcTime 5분, [state-design.md](./state-design.md)에 근거 기록
- [x] 서버 응답을 Zustand에 복사하지 않았는가
- [x] 로딩·에러·빈 상태를 구분했는가

**nuqs / URL 상태**

- [x] App Router용 `NuqsAdapter`를 구성했는가
- [x] `useQueryStates`와 parser로 검색·카테고리·정렬·페이지를 관리하는가
- [x] `history: "push"`로 각 변경을 앞뒤 이동에서 복원하는가 — q·category·sort·page에 적용. q는 300ms debounce 완료 단위로 push해 글자마다 히스토리가 쌓이지 않음
- [x] 검색·카테고리·정렬 변경 시 page가 1로 돌아가는가 — 필터 onChange에서 `page: 1`
- [x] 기본 정렬도 API 요청에 `sort=latest`로 명시하는가 — `clearOnDefault: false`
- [x] URL 공유·새로고침·뒤로 가기·앞으로 가기 후 같은 조건이 복원되는가 — 런타임 확인(뒤로/앞으로 시 이전 조건·select 값 복원)
- [x] `scenario`를 사용자 URL 상태나 `ProductListQuery`에 넣지 않았는가

**Zustand**

- [x] 장바구니·위시리스트의 담기·빼기를 구현했는가
- [x] store 데이터 형태와 선택 이유를 설명할 수 있는가 — [decisions.md](./decisions.md) 5
- [x] 헤더 개수를 별도 저장하지 않고 파생했는가
- [x] Header와 상품 버튼이 필요한 값과 action만 selector로 구독하는가
- [x] 홈과 목록의 같은 상품 상태가 일치하는가
- [x] 클라이언트 페이지 이동 중 상태와 헤더 개수가 유지되는가 — 런타임 확인

**홈 / 목록**

- [x] 홈에 배너·카테고리·인기 상품·신상품이 표시되는가 — 런타임 확인
- [x] 목록의 검색·카테고리·정렬·페이지네이션이 동작하는가
- [x] 홈과 목록 모두 로딩·에러·빈 상태를 구분하는가 — 홈(loading/error.tsx+섹션숨김), 목록(skeleton/error/빈상태)
- [x] 제공 레이아웃을 사용했더라도 상태와 컴포넌트 경계는 직접 설계했는가

**Advanced를 선택한 경우에만** (선택: A 상태 영속화, B 서버 프리패치, C 사용자 경험 개선, D 테스트)

- [x] 기본 과제를 먼저 완성했는가 — history push 포함 완료
- [x] 선택한 항목과 선택 이유를 기록했는가 — [decisions.md](./decisions.md) 8(B), 10(A), 13(C), 14(D)
- [x] 추가한 복잡도와 검증 결과를 설명할 수 있는가
- [x] A 선택 시 persist·hydration·version·migration을 검증했는가 — [hydration-test.md](./hydration-test.md)
- [x] B 선택 시 요청별 QueryClient·prefetch·hydration·중복 요청을 검증했는가 — decisions.md 8
- [x] C 선택 시 요청 흐름과 사용자 경험의 개선을 검증했는가 — 검색 debounce, `keepPreviousData`, 오류 재시도를 Chromium·WebKit에서 검증
- [x] D 선택 시 핵심 상태 계약을 자동화 테스트로 보호했는가 — URL/query 결과, Header 파생 개수, 홈·목록 store 동기화와 persist 복구, 페이지 초과 복귀 E2E 20개 시나리오(Chromium·WebKit 40개) 통과

**공통**

- [x] 변경마다 "왜 이렇게 설계했는가" 한 줄 근거가 있는가 — decisions.md·주석
- [x] 개발 중 `pnpm test`와 제출 전 `pnpm check`가 통과하는가 — Vitest 36개·전체 lint·typecheck·production build 통과, Playwright E2E 40개(20 시나리오 × 2 브라우저) 별도 통과
- [x] AI로 생성한 부분을 표기하고 직접 검토했는가 — md 하단 표기
