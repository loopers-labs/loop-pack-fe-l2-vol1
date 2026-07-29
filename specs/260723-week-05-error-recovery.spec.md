# 5주차 Advanced C 보강 — 오류 재시도 경험 스펙

## 목표

오류가 났을 때 사용자가 행동할 수 있는 상태에 빨리 도달하게 하고, 페이지 새로고침 없이 회복할 수 있게 한다. 회복이 안 되는 오류에서는 갈 곳을 명시적으로 준다.

기본 과제는 [260719-week-05-state-management.spec.md](260719-week-05-state-management.spec.md), 서버 prefetch와 페이지 전환은 [260722-week-05-advanced-server-prefetch.spec.md](260722-week-05-advanced-server-prefetch.spec.md)에 있다. 이 문서는 과제 Advanced C의 "전체 페이지 새로고침 없는 오류 재시도 경험"만 다룬다.

## 비범위

- HTTP status를 담은 에러 타입과 4xx·5xx 분기 재시도 정책
- 재시도 지연 시간(`retryDelay`) 조정
- 재시도 진행 상황 안내 문구
- `global-error.tsx`, `not-found.tsx`와 404 상태 코드
- 헤더 JSX 중복 제거, route group 재편, layout 재구성
- `useSuspenseQuery` 전환
- 오류 종류별로 다른 복구 화면
- Advanced A(`persist`), Advanced D(Zustand 테스트)
- upstream 제공 파일(`src/types/`, `src/app/api/**`, `src/examples/`) 수정

## 확정 목표

- 자동 재시도가 오래 붙잡지 않고, API가 계속 실패하면 더 빨리 오류 화면에 도달한다.
- 서버 prefetch의 즉시 실패 동작은 그대로 유지한다.
- 홈과 상품 목록의 인라인 오류 화면에서 새로고침 없이 다시 조회할 수 있다.
- 예상 못 한 렌더 오류에는 우리말 전체 화면을 보여주고 다시 시도와 홈으로 가기를 준다.
- URL(`/`, `/products`), 화면 구성, 정상 흐름의 동작은 바뀌지 않는다.

## 조사 결과

- `apiClient`는 status를 에러 객체에 담지 않고 메시지 문자열에만 넣는다 (`src/shared/api-client.ts:24`). 4xx·5xx 분기가 구조적으로 불가능하다.
- 브라우저 URL로는 400을 만들 수 없다. nuqs 파서가 `sort=hack`·`category=unknown`·`page=abc`·`page=0`·`pageSize=9999`를 전부 기본값으로 바꿔 API에는 유효한 값만 간다 (실측: 모두 HTTP 200, API 직접 호출만 400).
- TanStack Query의 재시도 기본값은 환경마다 다르다. `const retry = config.retry ?? (environmentManager.isServer() ? 0 : 3)`. 서버 prefetch는 0회로 즉시 실패하고(실측 0.058초), 브라우저는 3회를 재시도한다.
- 지연은 `defaultRetryDelay(failureCount) = Math.min(1e3 * 2 ** failureCount, 3e4)`로 1s·2s·4s 순이다. 실측 결과는 다음과 같다.

| `retry`  | 총 요청 | 지연     | 오류 화면까지 |
| -------- | ------- | -------- | ------------- |
| 2        | 3건     | 1s·2s    | **3.5초**     |
| 3 (기본) | 4건     | 1s·2s·4s | 7.5초         |

- `??` 병합이므로 `defaultOptions`에 `retry`를 그냥 넣으면 서버의 0회 기본값까지 덮어써 스트리밍이 느려진다.
- 브라우저 재조회는 서버 prefetch가 실패했을 때만 시작된다. 정상 진입에서는 브라우저 API 요청이 0건이므로, 브라우저 요청만 차단해서는 오류 화면을 재현할 수 없다. `APP_ORIGIN`을 살아 있지 않은 주소로 두어 서버 prefetch도 함께 실패시켜야 한다.
- 재시도 중에는 `isPending`이 유지되어 기존 로딩 문구만 계속 보인다. 사용자는 느린 것과 실패 중인 것을 구분할 수 없다.
- `useQuery`는 `failureCount`와 `refetch`를 반환한다 (`@tanstack/query-core` `QueryObserverBaseResult`).
- 오류 상태는 데이터 유무에 따라 화면이 다르게 움직인다.
  - **데이터 없음(첫 조회 실패)**: 다시 조회를 시작하면 `fetchState`가 `data === undefined`일 때 `error: null, status: 'pending'`을 함께 넣어 오류 상태를 잃는다 (`query-core` `query.js:437`). 오류 화면이 로딩 화면으로 바뀌며 재시도 버튼이 사라진다.
  - **데이터 있음(백그라운드 재조회 실패)**: `error` 액션이 `status: 'error'`를 조건 없이 넣는다 (`query.js:412`, 주석도 "flag existing data as invalidated if we get a background error"). 이전 데이터가 남은 채 `isError`가 되고 `isPending`은 false다. 오류 화면이 유지되므로 버튼도 남는다. 목록 `staleTime`이 1분이라 탭을 떠났다 돌아올 때 이 경로가 실제로 열린다.
- 현재 인라인 오류 화면은 문구뿐이라 사용자가 할 수 있는 행동이 없다 (`HomeContent.tsx:22`, `ProductList.tsx:45`). CONVENTIONS 5의 "유저가 이해하고 다음 행동을 할 수 있게 보여준다"를 충족하지 못한다.
- `prefetchQuery`는 `fetchQuery(options).then(noop).catch(noop)`이라 에러를 삼킨다. `useQuery`도 throw하지 않는다. 그래서 지금은 ErrorBoundary 없이도 동작한다.
- ErrorBoundary가 없어 예상 못 한 throw는 Next 기본 화면으로 간다. 실측 결과 서버 컴포넌트 throw는 `"This page couldn't load / A server error occurred. Reload to try again. / ERROR 2842533732"`, 클라이언트 throw는 `"This page couldn't load / Reload to try again, or go back."`이며 둘 다 영어이고 헤더가 사라진다.
- 무신사의 존재하지 않는 주소는 HTTP 404와 함께 헤더 없는 전체 화면을 보여준다 (실측: 6KB HTML, `<header>`·`<nav>`·장바구니·GNB 0건). 화면은 로고, "페이지를 찾을 수 없습니다.", "페이지 주소가 잘못되었거나 알 수 없는 오류가 발생했습니다.", `이전 페이지`·`무신사 홈` 버튼으로 구성된다. 헤더를 남기는 대신 갈 곳을 명시적으로 준다.
- Next 문서는 `error.js`가 "`page.js`와 nested `layout.js`를 감싸고, 같은 세그먼트의 위쪽 `layout.js`는 감싸지 않는다"고 명시한다 ([error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error)). `app/error.tsx`는 `app/layout.tsx` 안에서 렌더되므로 전역 스타일과 Providers를 그대로 쓸 수 있다.
- `global-error.tsx`는 root layout을 대체하며 `<html>`·`<body>`를 직접 렌더해야 하고 전역 스타일이 적용되지 않는다.
- Next 16.2.0부터 `error.js`에 `unstable_retry`가 추가됐고 문서가 `reset`보다 이쪽을 권한다. `reset`은 재렌더만, `unstable_retry`는 재조회 후 재렌더한다. 현재 프로젝트는 Next 16.2.10이다.
- 프로덕션에서 서버 컴포넌트 에러의 `error.message`는 일반 문구로 대체되고 `error.digest`만 남는다. 에러 화면에 원본 메시지를 보여줄 수 없다.

## 결정 사항

### D1. 브라우저 자동 재시도를 2회로 줄인다

- **3회차의 기대값이 가장 낮은데 대기 시간의 절반 이상을 차지한다.** 재시도가 실제로 구제하는 것은 1~2회차에 성공하는 일시적 실패이고, 그 경우는 1초 안에 끝나 사용자는 로딩 화면만 보고 지나간다. 3회를 모두 소진했다는 것은 서버가 실제로 죽었다는 뜻이고, 그 상태가 7.5초 안에 풀릴 확률은 낮다. 마지막 4초를 더 쓰고 얻는 게 적다.
- **재시도 버튼(D5)을 만들면 남은 회복 기회는 사용자 손에 있다.** 자동 재시도의 목적은 사용자가 눈치채기 전에 조용히 해결하는 것인데, 7.5초면 이미 눈치챘다. 그 시점부터는 자동으로 한 번 더 시도하는 것보다 사람이 상황을 보고 누르는 편이 낫다. 네트워크를 고친 뒤 누를 수도 있다.
- 오류 화면 도달 시간이 7.5초에서 3.5초로 줄어든다 (실측).
- 더 줄이려면 `retry: 1`(약 1.5초)도 가능하지만, 기본값에서 3회를 1회로 낮추는 것은 일시적 실패 구제 폭을 크게 줄인다. 2회를 절충으로 삼는다.

### D2. 재시도 진행 상황 문구는 두지 않는다

- 첫 실패 직후(약 0.5초)에 경고 문구가 뜨면 곧 회복될 일시적 실패에도 과민하게 반응하는 화면이 된다.
- `failureCount >= 2`로 조건을 올리면 문구가 보이는 구간이 2초 남짓이라 값어치가 작다.
- 안내 문구와 재시도 횟수 축소는 대체재다. D1으로 절반 이하로 줄였으므로 문구까지 더하지 않는다.
- 재시도 횟수 자체는 화면에 내보내지 않는다. `2/3` 같은 값은 사용자의 결정을 바꾸지 못하고 내부 구현을 노출할 뿐이다.

### D3. 서버 prefetch의 재시도 0회는 유지한다

- `defaultOptions.queries.retry`에 값을 그냥 넣으면 `??` 병합 때문에 서버의 0회 기본값까지 덮어쓴다. 서버 prefetch가 재시도하면 홈·목록 스트리밍이 그만큼 늦어진다.
- `makeQueryClient`에서 환경을 보고 나눠 넣는다.

```ts
retry: environmentManager.isServer() ? 0 : 2,
```

- 서버가 0회인 이유(실패해도 브라우저가 재조회하므로 스트리밍을 막을 이유가 없다)를 주석으로 남긴다.

### D4. 부분 실패는 인라인, 전체 실패는 전체 화면으로 나눈다

- **인라인**: `useQuery` 실패는 목록 영역만 깨진 것이다. 헤더·검색·필터가 멀쩡하므로 사용자가 조건을 바꿔볼 수 있어야 한다. 기존 인라인 오류 화면을 유지하고 재시도 버튼만 더한다.
- **전체 화면**: `error.tsx`가 뜨는 상황은 우리가 예상하지 못한 오류다. 무엇이 깨졌는지 모르는 상태에서 헤더가 멀쩡하다고 가정할 수 없고, 헤더가 반쯤 살아 있으면 페이지가 정상 동작 중이라는 오해를 준다. 무신사와 같은 방식으로 전체 화면을 쓴다.

### D5. 인라인 오류 화면에 재시도 버튼을 둔다

- `HomeContent`와 `ProductList`의 `isError` 분기에 버튼을 추가하고 `refetch`를 호출한다.
- 버튼에 `disabled={isFetching}`을 건다 (CONVENTIONS 5). 첫 조회 실패에서는 클릭과 동시에 오류 화면이 사라져 이 속성이 쓰이지 않지만, 이전 데이터가 남은 오류에서는 화면이 유지되므로 잠금이 실제로 필요하다. 두 경로가 다르다는 것을 주석으로 남긴다.
- 오류 문구와 버튼은 기존 `role="alert"` 영역 안에 둬 스크린리더가 함께 읽게 한다.
- 홈과 목록의 기존 문구는 유지하고 버튼만 더한다.

### D6. `error.tsx`는 `app`에 하나만 둔다

- `app/error.tsx` 하나로 홈·목록·데모를 모두 감싼다. 두 화면의 문구를 구분할 이유가 없다.
- `app/layout.tsx` 안에서 렌더되므로 전역 스타일과 Providers를 그대로 쓸 수 있다.
- route group을 새로 만들지 않는다. 헤더를 남기지 않기로 했으므로 하위 layout이 필요 없고, 폴더 이동에 따르는 회귀 위험도 지지 않는다.
- `global-error.tsx`는 만들지 않는다. root layout을 대체해 전역 스타일과 Providers가 사라지고, 지금 root layout은 폰트와 Providers뿐이라 터질 경로가 거의 없다.
- 404 상태 코드는 다루지 않는다. `not-found.tsx`는 존재하지 않는 리소스용이고 우리 라우트는 홈과 목록뿐이다.

### D7. `error.tsx`는 다시 시도와 홈으로 가기를 준다

- 복구 버튼은 `unstable_retry`를 쓴다. Next 문서가 `reset`보다 권하고, 재렌더만으로는 서버 컴포넌트 오류가 회복되지 않는다.
- `unstable_` 접두어가 붙어 있어 Next 업그레이드 때 확인이 필요하다는 것을 주석으로 남긴다.
- 재시도가 실패할 수도 있으므로 홈으로 가는 링크를 함께 둔다.
- 프로덕션에서 서버 오류의 원본 메시지를 받을 수 없으므로 화면에는 고정 문구만 쓰고 `error.message`는 노출하지 않는다.

## 완료 조건

- [ ] E1. 브라우저 자동 재시도가 2회로 제한되어, 서버와 브라우저 조회가 모두 실패할 때 약 3.5초 안에 오류 화면에 도달한다.
- [ ] E2. 서버 prefetch의 재시도는 0회로 유지되어, `APP_ORIGIN`이 잘못됐을 때 홈 응답이 이전처럼 1초 이내에 끝난다.
- [ ] E3. 재시도 횟수나 진행 상황을 나타내는 문구가 화면에 없다.
- [ ] E4. 홈과 목록의 `role="alert"` 오류 화면에 재시도 버튼이 보인다.
- [ ] E5. 재시도 버튼을 누르면 페이지 새로고침 없이 다시 조회하고, 성공하면 콘텐츠가 표시된다.
- [ ] E6. 재시도 요청 중에는 중복 클릭이 불가능하다. 첫 조회 실패에서는 오류 화면이 로딩 화면으로 바뀌어 버튼이 사라지고, 이전 데이터가 남은 오류에서는 버튼이 비활성화된다.
- [ ] E7. 서버 컴포넌트가 throw하면 `app/error.tsx`의 우리말 전체 화면이 보인다.
- [ ] E8. 클라이언트 컴포넌트가 throw해도 같은 화면이 보인다.
- [ ] E9. 오류 화면에 다시 시도 버튼과 홈으로 가는 링크가 있고, 원인이 해소된 경우 다시 시도로 정상 화면에 돌아온다.
- [ ] E10. 오류 화면에 `error.message`나 digest가 노출되지 않는다.
- [ ] E11. 정상 흐름에서 브라우저가 보낸 `/api/home`·`/api/products` 요청이 0건이라는 기존 동작이 유지된다.
- [ ] E12. 홈·목록의 스트리밍 시점(대기 화면 뒤 약 500ms에 콘텐츠 도착)이 이전과 같다.
- [ ] E13. 화면 간 장바구니·위시리스트 상태 유지가 기존대로 동작한다.
- [ ] E14. `/`와 `/products`의 URL과 빌드 결과(`ƒ /`, `ƒ /products`)가 그대로다.
- [ ] E15. `pnpm check`(test · lint · typecheck · build)가 통과한다.

## 태스크

### T1. 재시도 정책과 재시도 버튼을 넣는다

- `makeQueryClient`의 `defaultOptions.queries.retry`를 환경별로 나눠 넣는다.
- `HomeContent`와 `ProductList`의 오류 분기에 `refetch` 버튼을 더하고 `disabled={isFetching}`으로 잠근다.
- fulfills: E1, E2, E3, E4, E5, E6

### T2. `app/error.tsx`를 추가한다

- `'use client'` 컴포넌트로 만들고 `unstable_retry`를 버튼에, 홈 링크를 함께 둔다.
- `error.message`는 노출하지 않고 고정 문구를 쓴다.
- `unstable_` 접두어에 대한 주석을 남긴다.
- fulfills: E7, E8, E9, E10

### T3. 검증한다

- `pnpm check`를 실행한다.
- `APP_ORIGIN`을 살아 있지 않은 주소로 두고 브라우저 API도 차단해 오류 화면 도달 시간과 요청 간격을 잰다.
- 차단을 풀고 재시도 버튼으로 복구되는지 확인하고, 데이터 유무에 따른 두 오류 경로에서 중복 클릭이 막히는지 각각 확인한다.
- `APP_ORIGIN`만 잘못 설정해 서버 prefetch 실패 시 응답 시간이 이전과 같은지 확인한다.
- 서버·클라이언트 컴포넌트에 임시 throw를 넣어 `error.tsx`를 확인하고 되돌린다.
- 정상 진입의 스트리밍 시점, 브라우저 API 요청 0건, 상태 유지를 회귀 확인한다.
- fulfills: E11, E12, E13, E14, E15

## 런타임 검증

- [ ] `APP_ORIGIN`을 죽은 주소로 두고 브라우저 API를 차단한 뒤 `/products`에 들어가면 약 3.5초에 오류 문구와 재시도 버튼이 보이고, API 요청이 3건에 간격이 1초·2초다.
- [ ] 그 사이 화면에 재시도 횟수나 진행 상황 문구가 없다.
- [ ] 차단을 풀고 재시도 버튼을 누르면 새로고침 없이 목록이 표시된다.
- [ ] 첫 조회 실패에서 재시도 버튼을 누른 직후 버튼이 사라지고 로딩 화면으로 바뀐다.
- [ ] 이전 데이터가 남은 오류에서 재시도 버튼을 누르면 화면이 유지된 채 버튼이 비활성화된다.
- [ ] 홈에서도 같은 흐름이 동작한다.
- [ ] `APP_ORIGIN`만 잘못 설정하면 홈 응답이 1초 이내에 끝나고 브라우저 재조회로 복구된다.
- [ ] 서버 컴포넌트 throw에서 우리말 전체 화면이 보이고 다시 시도·홈으로가 있다.
- [ ] 클라이언트 컴포넌트 throw에서도 같다.
- [ ] 오류 화면에 영어 기본 문구나 digest가 보이지 않는다.
- [ ] 정상 진입에서 대기 화면 뒤 약 500ms에 콘텐츠 HTML이 도착하고 브라우저 API 요청이 0건이다.
- [ ] 목록에서 담은 장바구니·위시리스트가 홈으로 이동해도 유지된다.
- [ ] `pnpm check`가 통과한다.
