# MSW 요청 경계

## When to read

HTTP 경계 테스트, MSW handler, Node/DOM 테스트 setup을 추가하거나 변경할 때 읽는다.

## Source of truth

MSW 서버 수명 주기는 `tests/setup/msw.ts`, DOM 연결은 `tests/setup/dom.ts`, 각 테스트의 요청 계약은 해당 테스트 파일이 우선한다.

## Rules

- suite 시작 전 빈 MSW `setupServer`를 `onUnhandledRequest: 'error'`로 시작한다.
- 처리되지 않은 요청은 실패한다.
- handler는 각 테스트가 `server.use`로 등록한다. 전역 기본 handler를 두지 않는다.
- 매 테스트 뒤 `resetHandlers`, suite 종료 뒤 `close`를 실행한다.
- 기존 HTTP 경계 테스트는 transport를 직접 교체하지 않고 실제 요청을 MSW가 가로채는 방식으로 검증한다.
- Node의 `ApiClient`, `ProductRepository`, `ProductServerRepository` 테스트도 각 테스트가 등록한 MSW handler를 통과한다.
- 브라우저 repository에는 상대 경로를 해석할 실제 ky client의 `baseUrl`만 제공하고, 서버 repository는 기본 native fetch를 사용한다. fetch나 HTTP client method를 교체하지 않는다.
- 실제 HTTP 경계를 통과하지 않고 테스트 대역의 임의 동작만 검증하지 않는다. native fetch의 성공, malformed JSON, schema 오류, HTTP 오류, network `TypeError` 변환과 요청 횟수처럼 공개 계약을 검증한다.

## Verification

- handler가 해당 테스트 안에서만 등록되고 테스트 뒤 초기화되는지 확인한다.
- 처리되지 않은 요청이 실패하는지 확인한다.
- HTTP 경계 테스트에서 fetch, ky, API client를 mock transport로 교체하지 않았는지 확인한다. Service 단위 테스트에서 Repository 호출 계약을 spy로 검증하는 것은 허용한다.

```bash
pnpm test
```
