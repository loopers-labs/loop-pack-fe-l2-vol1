# Week 08 테스트 환경과 모킹 경계

## 결정 요약

| 항목             | 결정                                         |
| ---------------- | -------------------------------------------- |
| DOM 환경         | jsdom                                        |
| 테스트 환경 분리 | Vitest project로 Node와 jsdom 분리           |
| 네트워크 모킹    | 실제 `fetch`를 유지하고 MSW로 서버 응답 대체 |
| 상대 URL 기준    | `http://localhost:3000`                      |
| E2E 실행 환경    | Chromium + production build                  |
| E2E 실행 명령    | `pnpm test:e2e`로 분리                       |

## 1. Node와 jsdom 환경 분리

DOM이 필요 없는 테스트까지 DOM 환경에서 실행하면 매번 브라우저 모방 환경을 준비해야 하고, 테스트가 늘수록 이 비용이 누적된다. 필요한 테스트만 jsdom에서 실행하도록 Vitest project를 Node와 jsdom으로 나눈다. `pnpm test` 한 번으로 두 환경의 테스트를 함께 실행한다.

### jsdom을 선택한 이유

이번 통합 테스트는 입력, URL과 브라우저 저장소 등 DOM 동작의 정확성이 중요하므로 실행 속도보다 브라우저 API 호환성을 우선했다. 웹 표준에 가까운 동작을 제공하는 jsdom을 DOM 환경으로 사용한다.

실제 E2E 환경은 Chromium이 담당하며, jsdom은 통합 테스트와 실제 브라우저 사이의 동작 차이를 줄이는 역할을 한다.

### Vitest project를 선택한 이유

Node와 jsdom 테스트를 실행 목적별로 묶고 결과를 구분해 보기 위해 Vitest project 방식을 선택했다.

- `pnpm test`에서는 두 project를 함께 실행한다.
- 필요한 경우 project별로 따로 실행할 수 있다.
- 테스트 파일은 소스와 가까운 위치에 유지한다.
- `vitest.config.ts`의 `domTests` 목록으로 실행 환경을 구분한다.

### 어떤 테스트를 어디서 실행하는가

이 표는 테스트 방법론을 나누는 것이 아니라, 테스트 실행에 DOM이 필요한지를 기준으로 Node와 jsdom 중 어느 환경에서 실행할지 구분한 것이다.

| Node                                   | jsdom                                                        |
| -------------------------------------- | ------------------------------------------------------------ |
| API route 테스트                       | `render`, `renderHook`을 사용하는 테스트                     |
| mapper 테스트                          | Header, ProductCard, ProductListSection 테스트               |
| 순수 query 변환 및 query option 테스트 | 버튼 클릭과 입력을 재현하는 테스트                           |
| `apiResponseResult` 테스트             | 브라우저 저장소에 저장된 Zustand 상태를 다시 불러오는 테스트 |
| performance 계산 테스트                | Next.js 오류 UI 컴포넌트 테스트                              |

## 2. 환경 setup 시간 비교

동일한 24개 파일·97개 테스트를 대상으로 모든 테스트를 jsdom에서 실행하는 구성과 Node/jsdom으로 분리한 구성을 각각 3회 실행했다. Vitest 출력의 `environment` 시간 중앙값을 비교했다.

| 구성                                                |    1회 |    2회 |    3회 | 중앙값 |
| --------------------------------------------------- | -----: | -----: | -----: | -----: |
| 모든 테스트를 jsdom으로 실행                        | 14.11s | 14.01s | 13.85s | 14.01s |
| DOM 없는 테스트는 Node, DOM 테스트는 jsdom으로 분리 |  8.81s |  8.24s |  8.11s |  8.24s |

> 분리 후 환경 setup 시간은 중앙값 기준 5.77초, 약 41.2% 감소했다. 실제 전체 실행 시간 중앙값도 2.74초에서 2.02초로 줄었다.

## 3. 상대 URL과 CSS import

### 상대 URL

jsdom 문서의 URL을 `http://localhost:3000`으로 명시한다. `/api/home`, `/api/products` 같은 상대 요청이 해석되는 기준을 분명히 하기 위한 설정이다.

### CSS import

CSS 클래스명, 버튼 색상과 픽셀 배치는 이번 테스트 대상에 포함하지 않는다.

- CSS import가 컴포넌트 테스트 실행을 방해하지 않는지만 확인한다.
- CSS의 시각 결과는 단위·통합 테스트에서 단언하지 않는다.

## 4. MSW 모킹 경계

앱의 `fetch`나 HTTP 함수를 직접 바꿔치기하지 않는다. 실제 요청을 보낸 뒤 MSW가 네트워크 경계에서 서버 응답만 대체한다.

```text
클라이언트의 URL·query string 구성
→ 실제 fetch 호출
→ MSW가 요청 가로채기
→ 가짜 서버 응답 반환
→ 클라이언트의 응답 파싱
```

호출 함수를 직접 모킹하면 URL 구성과 응답 파싱 과정이 생략되어 이 부분이 잘못되어도 테스트가 통과할 수 있다. MSW를 사용하면 성공, 빈 결과, 지연과 오류 응답을 만들면서도 클라이언트의 실제 요청 과정을 함께 확인할 수 있다.

### MSW lifecycle

| 시점                    | 동작                                      |
| ----------------------- | ----------------------------------------- |
| 테스트 시작 전          | MSW 서버 시작                             |
| 처리되지 않은 요청 발생 | `onUnhandledRequest: 'error'`로 실패 처리 |
| 각 테스트 종료 후       | 테스트별 handler 초기화                   |
| 전체 테스트 종료 후     | MSW 서버 종료                             |

handler가 누락된 요청이 실제 외부 네트워크로 나가면 네트워크 상태에 따라 테스트 결과가 달라지고, 잘못된 URL도 의도하지 않은 응답을 받을 수 있다. 모든 요청이 정해 둔 모킹 경계를 통과하도록 미처리 요청을 즉시 실패시킨다.

### Handler 원칙

- 기본 handler에는 `/api/home`과 `/api/products`의 성공 응답만 둔다.
- 500 오류, 빈 결과, 지연과 네트워크 실패 같은 예외 응답은 해당 상태를 검증하는 테스트 안에서만 `server.use()`로 덮어쓴다.

공통 handler를 정상 응답으로 유지하면 예외 상태가 다른 테스트에 영향을 주지 않는다. 각 테스트는 자신이 검증하려는 예외만 직접 선언하므로 테스트의 전제와 실패 원인도 해당 파일 안에서 확인할 수 있다.

기존 `apiResponseResult`와 HomeView 테스트의 직접 `fetch` 모킹을 MSW로 교체했다. `window.fetch`를 덮어쓰던 미사용 `_mockApi.ts`도 제거했다.

## 5. Playwright production 실행

Playwright의 `webServer`가 다음 순서로 production 서버를 준비한다.

```text
pnpm build
→ pnpm start
→ Chromium에서 E2E 실행
```

실행 중인 개발 서버를 재사용하지 않도록 `reuseExistingServer`는 `false`로 둔다.

개발 서버는 개발 전용 컴파일과 오류 처리 동작을 포함하므로 production과 실행 조건이 다를 수 있다. 실제 배포 환경에서 발생할 수 있는 빌드와 라우팅 문제까지 확인하기 위해 production build와 `next start` 위에서 E2E를 실행한다.

### E2E 실행 명령을 분리한 이유

E2E는 `pnpm test`에 넣지 않고 `pnpm test:e2e`라는 별도 명령으로 실행한다.

`pnpm test`는 Node와 jsdom 환경의 Vitest 단위·통합 테스트를 실행하며, CI에 올리기 전에도 자주 사용한다. E2E까지 포함하면 production build, 서버 시작과 브라우저 실행이 매번 추가되어 테스트 시간이 길어지고 개발 공수에 영향을 줄 수 있다.

따라서 필요한 경우에만 E2E를 실행할 수 있도록 별도 명령으로 분리한다.
