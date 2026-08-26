# 8주차 0단계 — 현재 상태 점검

> **관련 문서**
>
> - 과제 — [week-08.md](../assignments/week-08.md) 0단계
> - 1단계 — [테스트 계획](../rfc/week08-test-plan.md)
> - 2단계 — [대조 기록](./step2-review.md)
>
> 점검 시점 기준 브랜치는 `feat/week-08`이다.

## 요약

0단계 구현을 마쳤다. Vitest의 node/jsdom project를 분리하고 Testing Library·jsdom·MSW를 도입했으며, API 테스트의 직접 `fetch` 모킹을 MSW로 교체했다. Playwright는 production build 위에서 별도 명령과 workflow로 실행하도록 구성했다. 정적 검사와 Vitest, production build, Chromium·WebKit Playwright까지 모두 통과했다.

## 설치 현황

| 패키지                        | 역할                   | 상태   |
| ----------------------------- | ---------------------- | ------ |
| `@testing-library/react`      | 컴포넌트를 그리고 찾기 | 설치됨 |
| `@testing-library/user-event` | 클릭·입력 재현         | 설치됨 |
| `@testing-library/jest-dom`   | DOM matcher            | 설치됨 |
| `jsdom`                       | DOM 환경               | 설치됨 |
| `msw`                         | 네트워크 요청 가로채기 | 설치됨 |
| `@playwright/test`            | E2E                    | 설치됨 |
| `vitest`                      | 단위·통합 러너         | 설치됨 |

## 요구사항별 현황

| 요구사항                                  | 상태 | 근거                                                            |
| ----------------------------------------- | ---- | --------------------------------------------------------------- |
| 두 종류 테스트가 한 명령으로 함께 통과    | 충족 | `pnpm test`: 14개 파일, 92개 테스트 통과                        |
| 필요한 테스트만 DOM 환경에서 실행         | 충족 | Vitest의 node/jsdom project와 확장자 규칙, 파일 docblock 예외   |
| 환경 셋업 시간 비교 기록                  | 충족 | 아래 「환경 셋업 시간 비교」에 기록                             |
| MSW setup과 unhandled request 차단        | 충족 | 공통 `setupServer`와 `onUnhandledRequest: 'error'` 적용         |
| 앱 코드 HTTP 클라이언트 직접 모킹 제거    | 충족 | `api.test.ts`의 세 시나리오를 MSW 핸들러로 교체                 |
| Playwright를 production build 위에서 실행 | 충족 | production build 성공 후 Chromium·WebKit에서 E2E 18개 통과      |
| E2E를 `pnpm test`에 넣을지 결정하고 근거  | 충족 | 별도 명령(`test:e2e`) 유지, CI도 별도 workflow. 근거는 3번 항목 |

### 환경 셋업 시간 비교

90개 테스트를 각 구성마다 3회씩 실행한 Vitest 출력의 중앙값이다(6·7번에 갱신 실패 테스트 2개를 추가하기 전 시점).

| 환경 구성               | 명령                                                             | Duration | environment |
| ----------------------- | ---------------------------------------------------------------- | -------- | ----------- |
| node/jsdom project 분리 | `pnpm test`                                                      | 1.75초   | 2.26초      |
| 전체 jsdom 강제         | node docblock 제거 후 `pnpm exec vitest run --environment jsdom` | 1.75초   | 3.59초      |

`Duration`은 두 구성이 같고, 갈리는 것은 괄호 안의 `environment` 값이다. 2.26초에서 3.59초로 약 1.3초 늘어난다. Vitest가 파일을 병렬로 돌리므로 환경 셋업에 쓴 시간의 합이 벽시계 시간에 그대로 나타나지는 않는다. **이 규모에서 분리의 이점은 실행 시간 단축이 아니다.**

측정 방법에 주의할 점이 하나 있다. `--environment jsdom` 플래그는 기본 환경만 바꾸고 파일 상단의 `@vitest-environment` docblock을 이기지 못한다. 플래그만 주면 node docblock이 붙은 파일 2개가 그대로 node로 남아 "전부 DOM으로 돌렸을 때"가 되지 않는다. 그래서 위 두 번째 줄은 두 파일의 docblock을 임시로 지운 뒤 측정하고 되돌린 값이다.

앞선 측정(75개 테스트 기준 1.44초 / 1.46초)은 이 함정을 모르고 플래그만 준 값이라 두 구성의 차이가 거의 없게 나왔다. 지금 값으로 대체한다.

분리의 이점은 여전히 실행 시간보다 테스트가 필요로 하는 환경을 명시하고 불필요한 DOM 의존을 막는 데 있다. 다만 `environment` 합계에서는 차이가 측정된다.

`pnpm check`는 이미 존재한다. `pnpm test && pnpm lint && pnpm typecheck && pnpm build` 순서로 실행된다.

## 고쳐야 할 지점

> **이 절 전체의 전제가 틀렸다.** 아래 조사는 7주차 작업이 머지되지 않은 레포를 보고 쓴 것이다. 원래는 7주차가 머지된 `develop`에서 8주차를 시작했어야 하고, 그랬다면 아래 다섯 항목 중 세 곳의 진단이 달랐다. 어디가 어떻게 달랐는지는 [`step2-review.md`](./step2-review.md) 6장의 대조표에 있다. 기록으로서의 값이 있어 지우지 않고, 어긋난 자리에만 주석을 붙인다.

### 1. `vitest.config.ts` — 단일 node 환경

```ts
test: {
  environment: 'node',
  include: ['src/**/*.test.ts', 'app/**/*.test.ts'],
}
```

- 환경이 하나뿐이라 컴포넌트 테스트를 추가할 자리가 없다.
- include 패턴이 `*.test.ts`여서 **`.tsx` 파일이 잡히지 않는다.** `src/examples/week-07-performance/HeroSection.test.tsx`가 현재 실행 대상에서 빠져 있다.

> **정정.** 7주차가 머지된 상태였다면 빠지는 파일이 두 개다. 이 파일은 `src/_pages/home/ui/HeroSection.test.tsx`로 이동해 있었고, `src/_pages/product-list/ui/ProductListResults.test.tsx`가 하나 더 있었다.

#### 어떤 테스트를 어느 계층에서 검증할지 정하는 순서

테스트를 쓰기 전에 아래 세 질문을 순서대로 묻고, 처음 "그렇다"가 나오는 곳에서 멈춘다.

1. 컴포넌트를 렌더링하지 않고 값이나 상태만 확인해도 되는가? → DOM 없는 단위 테스트 (node)
2. 렌더링된 요소와 상호작용하면 충분한가? → Testing Library + jsdom 통합 테스트
3. 실제 브라우저의 탐색·렌더링·API가 있어야 재현되는가? → Playwright E2E

1과 2의 경계는 "검증하려는 결과가 값과 상태인가, 사용자가 보는 화면인가"이고, 2와 3의 경계는 "jsdom에 없는 것(라우팅, 실제 렌더링, 브라우저별 차이)이 필요한가"다.

이 순서를 적용하면 계층 선택과 vitest 환경 선택이 같은 판단으로 결정된다.

#### 환경 분리 방식

기본 규칙은 **파일 확장자**로 둔다.

| 확장자       | 환경  | 대상                                  |
| ------------ | ----- | ------------------------------------- |
| `*.test.ts`  | node  | 위 1번에서 멈추는 테스트              |
| `*.test.tsx` | jsdom | 위 2번까지 가는 테스트 — DOM이 필요함 |

컴포넌트를 렌더하려면 JSX가 필요하고 JSX는 `.tsx`에만 쓸 수 있으므로, 확장자가 "화면을 검증하는가"의 신호 역할을 대체로 해준다. 새 테스트를 쓸 때 따로 외울 규칙이 없고 설정도 단순하다는 점을 근거로 골랐다.

기준은 JSX 유무가 아니라 **DOM이 필요한가**다. `renderHook`으로 훅만 보는 테스트처럼 JSX를 한 줄도 안 쓰면서 DOM은 필요한 경우가 있다. 이때도 `.test.tsx`로 쓴다. 파일 하나마다 docblock 예외를 다는 대신 확장자 규칙 안에서 흡수하려는 것이다.

다만 확장자는 "JSX를 쓰는가"를 볼 뿐 "화면을 검증하는가"를 직접 보는 것이 아니라서 어긋나는 경우가 생긴다. 그때는 파일 상단의 `// @vitest-environment` 주석으로 해당 파일만 예외를 선언한다.

#### 현재 확인된 예외: `HeroSection.test.tsx`

`src/examples/week-07-performance/HeroSection.test.tsx`는 `.tsx`지만 node 환경에 둔다.

이 파일은 `react-dom/server`의 `renderToStaticMarkup`으로 컴포넌트를 문자열 HTML로 찍고 그 문자열을 검사한다. `document`나 `window`를 쓰지 않아 위 1번에서 멈추는 테스트다.

jsdom에서도 통과하므로 동작 때문에 예외를 두는 것이 아니다. 쓰지 않는 DOM 환경 셋업 비용을 파일마다 치르는 것을 피하려는 것이고, 이 비용이 과제가 요구하는 셋업 시간 비교의 대상이다.

이 파일은 7주차 과제 커밋(`3d42a44`)으로 과제 레포에서 내려온 코드라 테스트 방식을 임의로 바꾸지 않고 예외로 처리한다.

> **정정.** 이 문단의 전제 두 가지가 애초에 성립하지 않았다. 7주차가 머지된 상태였다면 이 파일은 이미 `src/_pages/home/ui/HeroSection.test.tsx`로 이동했고 내용도 수정된 뒤라, "손대지 않은 과제 코드"라는 근거가 없다. `src/examples/**` 경로도 존재하지 않으니 **경로로 예외를 건다는 선택지 자체가 나오지 않았을 것**이다. 지금은 파일 docblock으로 예외를 건다. 경위는 아래 「잘못된 베이스에서 시작한 결과」에 있다.

### 2. `fetch` 직접 모킹 — 과제 명시 금지 대상

`src/entities/product/api/api.test.ts`

| 위치    | 코드                                                                                     |
| ------- | ---------------------------------------------------------------------------------------- |
| 22번 줄 | `vi.stubGlobal('fetch', fetchMock)`                                                      |
| 29번 줄 | `vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })))` |
| 39번 줄 | `vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))`    |

세 곳 모두 MSW 핸들러로 옮겨야 한다.

#### 왜 앱 코드를 고치지 않는가

테스트를 통과시키려고 앱 코드를 고치면 테스트가 검증하는 코드와 실제로 배포되는 코드가 달라진다. 그러면 그 테스트가 통과해도 배포된 것에 대해 보장하는 바가 없다. 과제가 "요청은 실제로 나가고 MSW가 가로채는 구조"를 요구하는 이유가 이것이다.

여기서 금지하는 것은 **테스트를 통과시키려고 공개 동작을 바꾸는 것**이지 리팩터링 자체가 아니다. 훅 안에 섞여 있던 순수 계산을 함수로 분리하는 것처럼, 동작을 그대로 둔 채 책임을 나누는 변경은 이 원칙에 걸리지 않는다(1단계 3번 `getTotalPages`가 그 경우다).

`getProductList`는 다음과 같이 상대 경로로 요청한다. 이 코드는 그대로 두고 테스트 환경 쪽을 맞춘다.

```ts
response = await fetch(`/api/products${query}`)
```

> **정정.** 7주차가 머지된 상태의 실제 코드는 아래와 같다. 결론(jsdom 환경이 필요하다)은 그대로지만 **이유가 다르다.** `getApiBaseUrl()`은 `window`가 없으면 절대 URL을 돌려주므로, node 환경에서 요청 URL은 애초에 상대 경로가 아니다. 아래 「상대 경로가 걸리는 지점」의 "`Request` 생성 단계에서 실패한다"는 분석은 이 함수가 없던 시점의 코드를 보고 쓴 것이다.
>
> 현재 코드로 docblock을 `node`로 바꿔 실행하면 이렇게 나온다.
>
> ```
> [MSW] Error: intercepted a request without a matching request handler
> ```
>
> 요청은 절대 URL로 정상적으로 나갔고, 걸리는 쪽은 **핸들러의 상대 경로 predicate**(`http.get('/api/products', …)`)다. MSW가 이걸 `location.href` 기준으로 절대화해 매칭하는데 node에는 `location`이 없다. 즉 실패 지점이 요청 생성이 아니라 핸들러 매칭이다. 해결 방법(테스트 환경에 `location`을 제공한다)은 같다.
>
> ```ts
> response = await fetch(`${getApiBaseUrl()}/api/products${query}`, { signal })
> ```

#### MSW를 쓰는 두 가지 방식

| 실행 위치 | 사용처              | 가로채는 방법                        | 준비물                                              |
| --------- | ------------------- | ------------------------------------ | --------------------------------------------------- |
| 브라우저  | Playwright, 개발 중 | Service Worker                       | `public/mockServiceWorker.js` (`msw init`으로 생성) |
| Node      | vitest 통합 테스트  | `fetch`·`http`·`XMLHttpRequest` 패치 | 없음, `setupServer`만                               |

이번 주 통합 테스트는 vitest에서 돌므로 Node 방식을 쓴다. `msw init`은 필요 없다.

MSW가 `fetch`를 교체한다는 점은 `vi.stubGlobal('fetch', ...)`과 같아 보이지만 다르다. `stubGlobal`의 대체본은 호출을 기록하고 지정한 값을 돌려주는 것으로 끝난다. MSW의 대체본은 요청을 정상적인 `Request`로 만들어 핸들러에 넘기고 실제 `Response`를 돌려주며, 매칭되는 핸들러가 없으면 실제 네트워크로 내보낸다. 앱 코드 입장에서는 구분되지 않는다.

#### 상대 경로가 걸리는 지점

MSW 문서 [Intercepting Requests](https://mswjs.io/docs/http/intercepting-requests)는 다음과 같이 적고 있다.

> Relative URL predicates are resolved against the current document's location, requiring base URL configuration in Node.js tests.

상대 URL을 처리하려면 기준 URL이 필요하다. 현재 설치된 MSW에서 요청 쪽은 인터셉터가 `Request`를 만들기 전에 전역 `location.href`를 기준으로 절대화하고, 핸들러 predicate 쪽도 매칭을 준비하면서 `location.href`를 기준으로 절대화한다.

```
앱 코드    fetch('/api/products?page=1')
                  ↓ location 기준 절대화
           http://localhost:3000/api/products?page=1
                  ↓
               매칭 시도
                  ↑
           http://localhost:3000/api/products
                  ↑ location 기준 절대화
핸들러     http.get('/api/products', ...)
```

단, 이 그림은 `location`이 있는 환경에서 요청이 정상적으로 만들어졌을 때의 흐름이다. 순수 node 환경에는 `location`이 없으므로 인터셉터가 상대 URL로 `Request`를 만드는 단계에서 `TypeError: Failed to parse URL`이 발생한다. 따라서 핸들러 predicate를 해석하거나 매칭하는 단계까지 도달하지 않는다. `getProductList`는 이 예외를 `kind: 'network'`인 `ApiError`로 변환한다.

[디버깅 런북](https://mswjs.io/docs/runbook)은 이 상황의 진단 방법을 준다.

```ts
server.events.on('request:start', ({ request }) => {
  console.log(request.method, request.url)
})
```

실제 관찰 결과, 순수 node 환경에서는 `Request` 생성이 먼저 실패하므로 `request:start`가 한 번도 발생하지 않았다. jsdom에 `url: 'http://localhost:3000'`을 설정하자 `request:start`에 `GET http://localhost:3000/api/products?page=1&pageSize=12`가 찍히고 핸들러가 정상적으로 응답했다. 따라서 이 경우의 진단 기준은 "이벤트에 상대 URL이 찍히는가"가 아니라 "`request:start`까지 도달하는가"다. 해결 방법은 앱 코드를 바꾸는 것이 아니라 테스트 환경에 `location.href`를 제공하는 것이다.

#### 결정: `api.test.ts`만 jsdom 예외

jsdom은 인스턴스 생성 시 URL을 받고 그것이 `location.href`가 된다. 기본값이 `http://localhost:3000`이지만 이유가 드러나도록 명시한다.

```ts
// vitest.config.ts
environmentOptions: {
  jsdom: { url: 'http://localhost:3000' },
}
```

`api.test.ts`는 화면을 검증하지 않지만 `location`이 필요하므로 파일 상단 docblock으로 예외를 선언한다. config에 패턴을 추가하지 않는 이유는, 해당 파일이 현재 하나뿐이고(`queries.test.ts`는 query key 조립만 보므로 네트워크를 타지 않는다) 예외의 이유가 파일 옆에 남는 편이 낫기 때문이다.

```ts
/**
 * @vitest-environment jsdom
 *
 * getProductList가 `/api/products` 상대 경로로 요청한다. MSW는 상대 경로를
 * document.location 기준으로 절대화하는데 node 환경에는 location이 없다.
 * 앱 코드를 고치는 대신 이 파일만 location이 있는 환경에서 돌린다.
 * 화면을 검증하는 파일은 아니다.
 */
```

docblock은 파일 맨 위, `import`보다 앞에 있어야 vitest가 읽는다.

이 예외가 3개를 넘어가면 "확장자는 대략의 신호"라는 설명이 성립하지 않는 것이므로 분리 규칙 자체를 다시 본다.

> **현재 3개다.** `api.test.ts`(node → jsdom), `HeroSection.test.tsx`(jsdom → node), `ProductListResults.test.tsx`(jsdom → node). 임계값에 정확히 닿았으므로 다음에 예외가 하나 더 필요해지면 확장자 규칙을 유지할지부터 다시 판단한다.

### 3. `playwright.config.ts` — dev 서버 위에서 실행

```ts
webServer: {
  command: 'pnpm dev',
  ...
}
```

#### 지연은 dev와 production이 같다

`waitForMockApi`는 다음과 같다.

```ts
export const waitForMockApi = (requestedDelayMs = 500) =>
  new Promise<void>((resolve) => {
    const delayMs = process.env.NODE_ENV === 'test' ? 0 : requestedDelayMs
    setTimeout(resolve, delayMs)
  })
```

지연이 0이 되는 것은 `NODE_ENV === 'test'`일 때뿐이다. `next dev`는 `development`, `next start`는 `production`이므로 둘 다 500ms가 걸린다. 즉 production으로 바꾸는 이유는 지연 때문이 아니다.

#### production을 쓰는 이유

| 항목          | `next dev`                          | `next start`       |
| ------------- | ----------------------------------- | ------------------ |
| 번들          | 최적화 안 됨, HMR 포함              | 실제 배포되는 번들 |
| React         | dev 전용 경고, StrictMode 이중 렌더 | 없음               |
| 첫 요청       | 라우트를 그때 컴파일                | 미리 빌드됨        |
| 빌드 에러     | 페이지를 열 때 발견                 | 빌드 단계에서 발견 |
| mock API 지연 | 500ms                               | 500ms (동일)       |

dev에서만 도는 코드 경로가 있어 dev 서버로 통과한 결과는 배포되는 것에 대해 보장하지 않는다. 2번의 "앱 코드를 고치지 않는다"와 같은 이유다.

#### 빌드와 실행을 분리한다

`webServer.command`를 `pnpm build && pnpm start`로 두면 E2E를 돌릴 때마다 빌드가 돈다. 테스트 하나를 고쳐 다시 돌릴 때도 마찬가지라 비용이 크다.

대신 빌드를 스크립트로 옮긴다.

```ts
// playwright.config.ts
webServer: {
  command: 'pnpm start',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
},
```

```json
// package.json
"test:e2e": "pnpm build && playwright test"
```

| 명령                        | 빌드  | 용도                                  |
| --------------------------- | ----- | ------------------------------------- |
| `pnpm test:e2e`             | 함    | 기본. CI와 제출 전                    |
| `pnpm exec playwright test` | 안 함 | 빌드가 최신인 상태에서 반복 실행할 때 |

분리하면 오래된 빌드로 테스트할 수 있게 되는 위험이 생긴다. 그래서 기본값을 안전한 쪽(빌드하는 쪽)에 두고, 빠른 쪽은 명시적으로 고르게 한다. 반대로 두면 오래된 빌드로 통과하는 상황이 조용히 지나간다.

`next build`는 `.next/cache`를 재사용하므로 변경이 없으면 콜드 빌드보다 빠르다.

#### E2E는 `pnpm check`에 넣지 않고 별도 명령으로 둔다

과제 요구사항 중 "E2E를 `pnpm test`에 넣을지 별도 명령으로 둘지 결정하고 근거를 남겨요"에 대한 결정이다.

`pnpm check`는 지금 구성을 유지하고 E2E는 `pnpm test:e2e`로 분리한다. 이유는 아래 CI 구성과 맞물린다. `pnpm check`를 돌리는 CI job과 E2E job이 필요한 브라우저 설치 조건이 다르기 때문에, 하나의 명령으로 묶으면 두 job이 같은 준비 과정을 요구하게 된다.

#### CI에서 실행한다 — husky가 아니라 GitHub Actions

|              | husky              | GitHub Actions |
| ------------ | ------------------ | -------------- |
| 실행 위치    | 개발자 로컬 머신   | GitHub 서버    |
| 시점         | commit / push      | PR, main push  |
| 우회         | `--no-verify` 가능 | 불가           |
| 다른 사람 PR | 막지 못함          | 막음           |

E2E는 GitHub Actions에 둔다. husky는 로컬 훅이라 본인 머신에서만 돌고 우회할 수 있어 게이트 역할을 하지 못한다. 빌드와 브라우저 2종을 커밋마다 로컬에서 돌리는 것도 현실적이지 않다. 현재 `.husky/pre-commit`의 `lint-staged`처럼 빠르고 변경 파일만 보는 작업이 로컬 훅의 적정 범위다.

#### 별도 job으로 분리한다

현재 `.github/workflows/quality.yml`은 Chromium만 설치한다.

```yaml
- name: Install Playwright Chromium when used
  run: |
    if pnpm exec playwright --version >/dev/null 2>&1; then
      pnpm exec playwright install --with-deps chromium
    fi
```

그런데 `playwright.config.ts`에는 chromium과 webkit 두 프로젝트가 있다. webkit 설정에는 "Safari는 버튼 클릭 시 자동 포커스를 주지 않아, 마우스로 연 후 키보드로 조작하는 흐름이 chromium에서만 통과하고 여기선 깨질 수 있다(실제로 한 번 잡았다)"는 주석이 붙어 있다. 실제로 결함을 잡은 설정이므로 CI를 통과시키려고 제거하지 않는다.

그래서 E2E를 별도 workflow로 두고 그 job에서만 두 브라우저를 설치한다.

- `quality.yml`은 그대로 둔다. 과제 레포에서 내려온 파일이라 수정 시 이후 동기화에서 충돌할 수 있다.
- 새 workflow 파일을 추가해 `playwright install --with-deps chromium webkit` 후 `pnpm test:e2e`를 실행한다.
- 두 workflow가 병렬로 돌아 전체 소요 시간이 크게 늘지 않는다.

검토만 하고 머지를 막지 않는 방식은 택하지 않는다. 막지 않는 검사는 빨간불이 유지된 채로 방치되기 쉽고, 3단계에서 "구현을 망가뜨려 테스트가 잡는지 확인"하는 목적과도 어긋난다. 잡아도 막지 못하면 잡은 것이 아니다.

### 4. `create-collection-store.test.ts`의 `stubGlobal` — 결론: 현행 유지

이 파일 22~23번 줄이 `localStorage`와 `window`를 `vi.stubGlobal`로 만들고 있다. HTTP 클라이언트가 아니라 과제의 금지 대상은 아니다.

`it` 5개를 위 판단 순서로 확인하면 전부 1번에서 멈춘다.

| 검증 대상                             | 단언 위치              | 계층 |
| ------------------------------------- | ---------------------- | ---- |
| toggle로 추가하고 다시 누르면 제거    | `store.getState().ids` | node |
| 순서와 중복 없는 집합 유지            | `store.getState().ids` | node |
| selector로 포함 여부·개수·action 선택 | `store.getState()`     | node |
| 손상된 저장값을 빈 목록으로 복구      | `store.getState().ids` | node |
| 이전 버전 ids를 현재 상태로 migration | `store.getState().ids` | node |

단언이 모두 `store.getState()`를 향한다. `localStorage`를 단언하는 곳은 없고, 4·5번의 `localStorage.setItem`은 "이미 저장돼 있던 상황"을 만드는 준비 과정이다. 즉 이 파일이 검증하는 것은 store의 상태 전이와 복원 로직이지 localStorage 자체가 아니다.

그럼에도 `stubGlobal`이 필요한 이유는 `createCollectionStore`가 `persist` 미들웨어로 감싸져 있어 store를 만드는 것만으로 `localStorage`를 요구하기 때문이다. 검증을 위한 모킹이 아니라 node 환경에 없는 것을 채워 넣는 코드다.

jsdom으로 옮기면 실제 `localStorage`가 제공되어 `createMemoryStorage` 15줄과 `stubGlobal` 2줄이 `localStorage.clear()` 한 줄로 줄어든다. 그러나 이 파일은 화면을 검증하지 않으므로 위 분리 기준상 node가 맞다. 코드 15줄을 줄이려고 DOM 환경 셋업 비용을 치르는 교환은 하지 않는다.

### 5. 테스트 파일이 7개인 이유 (확인 완료)

> **정정.** 7주차가 머지된 상태였다면 9개다. 아래 「과제가 준 5개」 중 `HeroSection.test.tsx`는 이미 7주차가 `src/_pages/home/ui/`로 옮기고 내용도 고친 뒤였고, `ProductListResults.test.tsx`가 직접 추가한 쪽에 하나 더 들어간다.

과제 문서는 "지금 레포의 테스트 5개"라고 적는데 현재 include 패턴에 잡히는 파일은 7개다. 기준 레포와 갈라진 것이 아니라 직접 추가한 테스트가 섞여 있는 것이다.

| 출처          | 파일                                                                                                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 과제가 준 5개 | `app/api/home/route.test.ts`, `app/api/products/route.test.ts`, `app/api/_data/commerce.test.ts`, `src/app/performance-lab/inp/products.test.ts`, `src/examples/week-07-performance/HeroSection.test.tsx` |
| 직접 추가     | `src/entities/product/api/api.test.ts`, `src/entities/product/api/queries.test.ts` (`f36bd50`), `src/shared/lib/create-collection-store.test.ts` (`c28c165`)                                              |

과제가 준 5개 중 `HeroSection.test.tsx`는 `.tsx`라 현재 include 패턴에서 빠진다. 그래서 잡히는 파일이 4 + 3 = 7개다. "5개가 깨지면 안 된다"는 요구는 위 첫 줄을 가리키고, include에 `.tsx`를 추가하면 5개가 모두 실행 대상이 된다.

## 현재 테스트 파일 목록

`pnpm test` 기준 14개 파일 92개 테스트가 모두 실행된다. 실행되지 않는 파일은 없다.

node 환경 (DOM 없이 값·상태만 확인):

```
app/api/home/route.test.ts
app/api/products/route.test.ts
app/api/_data/commerce.test.ts
app/performance-lab/inp/products.test.ts
src/_pages/product-list/model/search-params.test.ts
src/entities/product/api/queries.test.ts
src/shared/lib/create-collection-store.test.ts
src/shared/lib/get-total-pages.test.ts
src/_pages/home/ui/HeroSection.test.tsx                       ← docblock 예외
src/_pages/product-list/ui/ProductListResults.test.tsx        ← docblock 예외
```

jsdom 환경 (렌더링된 요소와 상호작용):

```
src/_pages/product-list/model/useProductFilters.test.tsx
src/_pages/product-list/ui/ProductListContent.test.tsx
src/widgets/header/Header.test.tsx
src/entities/product/api/api.test.ts                          ← docblock 예외
```

E2E:

```
e2e/state-restoration.spec.ts
```

Vitest 출력의 `|node|`·`|jsdom|` 라벨은 **project 이름이지 환경이 아니다.** docblock 예외가 붙은 파일 3개는 라벨과 실제 환경이 서로 반대로 나온다. 환경을 확인하려면 라벨이 아니라 파일 상단의 docblock을 본다.

## 잘못된 베이스에서 시작한 결과

8주차는 7주차 PR이 머지된 `develop`에서 시작했어야 하는데, 머지 시점이 늦어 7주차 작업이 빠진 코드 위에서 0단계를 진행했다. 위 「고쳐야 할 지점」의 조사가 그 상태를 보고 쓴 것이다.

가장 눈에 띄게 드러난 곳이 `vitest.config.ts`다. node project include에 `'src/examples/**/*.test.tsx'`가 있었다. 「현재 확인된 예외」에서 정한 HeroSection 예외를 **파일 경로로** 건 것인데, 7주차 작업에서 그 디렉터리는 이미 삭제되고 파일은 `src/_pages/home/ui/`로 이동해 있었다. 나중에 머지하자 패턴이 아무 파일도 잡지 못하게 되면서 예외가 조용히 풀렸고, DOM이 필요 없는 테스트가 jsdom에서 돌기 시작했다.

처음부터 7주차 코드를 보고 있었다면 `src/examples/**`라는 경로를 쓸 일이 없었다. 즉 이건 머지가 만든 사고가 아니라, 없어질 구조를 보고 예외를 건 것이 뒤늦게 드러난 것이다.

같은 이유로 `src/_pages/product-list/ui/ProductListResults.test.tsx`도 8주차 분리 기준을 적용받은 적이 없다. `renderToStaticMarkup`만 쓰는데 jsdom에 있었다.

환경 밖에서도 같은 일이 있었다. 7주차가 `ProductListResults`에 갱신 실패 분기를 넣었는데 1단계 계획서 6번이 그걸 모른 채 에러를 한 갈래로 다뤘다. 자세한 내용과 대조표는 [`step2-review.md`](./step2-review.md) 6장에 있다.

| 무엇을                                 | 어떻게                                                           |
| -------------------------------------- | ---------------------------------------------------------------- |
| `vitest.config.ts`의 죽은 include 패턴 | 삭제. jsdom project의 `exclude: ['src/examples/**']`도 함께 삭제 |
| `HeroSection.test.tsx`                 | `@vitest-environment node` docblock 추가                         |
| `ProductListResults.test.tsx`          | 같은 docblock 추가                                               |

**경로 대신 docblock을 고른 이유.** 같은 사고가 다시 나지 않게 하려면 예외의 근거가 파일 밖에 있으면 안 된다. 경로 패턴은 파일이 움직이면 깨지는데, 깨져도 테스트는 계속 통과하므로 아무도 모른다. docblock은 파일과 같이 움직인다. 이 방식은 「환경 분리 방식」에서 이미 규칙으로 적어둔 것이고, 이번에는 그 규칙을 안 따른 자리가 뒤늦게 드러난 것이다.

docblock이 실제로 환경을 바꾸는지는 `expect(typeof document).toBe('undefined')`를 임시로 넣어 확인했다. jsdom project에 매칭된 파일이 node 환경에서 도는 것이 확인됐다.

## 다음 작업 순서

1. 의존성 설치
2. `vitest.config.ts` 환경 분리 (include에 `.tsx` 포함, `environmentOptions.jsdom.url` 명시)
3. MSW setup 작성, unhandled request 차단
4. `api.test.ts`의 `fetch` stub 3곳을 MSW로 교체
   - node 환경에서는 상대 URL로 `Request`를 만드는 단계에서 실패해 `request:start`가 발생하지 않는 것을 확인했다. jsdom에 기준 URL을 제공하면 절대 URL로 이벤트가 발생하고 핸들러가 응답하는 것도 확인했으므로, 이 관찰을 근거로 docblock을 붙인다. (7주차 머지 후에는 실패 지점이 핸들러 매칭으로 바뀐다 — 위 정정 참고.)
5. `playwright.config.ts`의 `webServer.command`를 `pnpm start`로 변경, `test:e2e` 스크립트에 빌드 추가
6. E2E용 GitHub Actions workflow 추가 (chromium·webkit 설치, `pnpm test:e2e` 실행)
7. 셋업 시간 비교 측정 후 이 문서에 기록

---

**AI 활용.** 현황 조사(설치 현황, 요구사항별 충족 여부, 파일 목록, `stubGlobal` 위치)와 각 선택의 반례 제시, jsdom·MSW·husky/GitHub Actions의 동작 확인, 셋업 시간 측정을 Claude에게 맡겼다. MSW의 상대 경로 처리는 공식 문서([Intercepting Requests](https://mswjs.io/docs/http/intercepting-requests), [디버깅 런북](https://mswjs.io/docs/runbook))에서 확인했다.

**직접 정한 것.** 계층 선택의 세 질문, 확장자 기준 환경 분리, `HeroSection.test.tsx`와 `create-collection-store.test.ts`의 배치, 앱 코드를 고치지 않는다는 원칙, 빌드와 E2E 실행 분리, E2E를 CI 별도 job으로 두는 결정. 경로 예외 대신 docblock으로 가는 선택도 작성자가 골랐다(Claude는 경로 패턴·docblock·파일명 규칙 세 가지를 대가와 함께 제시했다). `api.test.ts`만 jsdom 예외로 두는 방식과 별도 workflow 추가는 Claude가 제안하고 작성자가 받아들였다.

**Claude가 틀렸다가 고친 것.** 세 가지를 남긴다. ① `waitForMockApi`의 지연이 "production에서만 걸린다"고 잘못 적었다가 코드를 확인하고 dev·production 동일로 고쳤다. ② Vitest 출력의 `|node|`·`|jsdom|` 라벨을 환경으로 읽고 미충족으로 보고했다가, 실측으로 그것이 project 이름임을 확인했다. ③ 죽은 include 패턴을 "머지가 설정을 깼다"는 외부 원인으로 정리했다가, 원래 7주차가 머지된 상태에서 시작했어야 한다는 작성자의 지적으로 전제를 바꿔 이 문서의 진단 네 곳에 정정 주석을 붙였다.

문서 작성 당시에는 테스트를 실행하지 않고 파일 목록과 설정만 정적으로 확인했다. 이후 구현을 진행하며 정적 검사·Vitest·production build·Chromium·WebKit Playwright를 모두 실행해 통과를 확인했다.
