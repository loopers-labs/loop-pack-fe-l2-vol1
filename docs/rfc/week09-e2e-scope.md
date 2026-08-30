# 9주차 E2E 범위와 인증 정책

## 1단계 인증 정책

### 보호 경로

보호 경로는 주문서(`/order`)와 주문 내역(`/orders`)으로 정한다. 장바구니와 위시리스트는 로컬 사용자 상태를 확인하는 public-ish 화면으로 두고, 실제 주문을 시작하는 시점부터 인증을 요구한다.

### 세션 쿠키 검증 위치

`proxy.ts`는 세션 쿠키의 존재만 확인한다. proxy는 Edge 런타임에서 실행되므로 `node:crypto`를 사용하는 `readSessionToken`을 가져오지 않는다.

실제 서명 검증은 Node 런타임의 서버 layout과 API에서 한다.

- `(commerce-auth)/layout.tsx`: 보호 route group 진입 시 `readSessionToken`으로 사용자 정보를 복원하고 Header 초기 HTML에 반영한다.
- `/api/auth/me`, `/api/orders`: API 요청마다 `readSessionToken`으로 세션을 다시 검증한다.

이 구조에서는 위조되거나 만료된 쿠키가 proxy를 통과할 수 있다. 하지만 보호 route group과 API에서 다시 검증하므로 인증 신뢰 판단은 proxy에 두지 않는다.

### 401 처리 위치

`/api/auth/me`의 401은 로그인하지 않은 상태와 세션 만료를 같은 응답으로 돌려준다. 그래서 모든 401을 세션 만료로 보지 않는다.

- `/api/auth/me` 401: Header의 세션 확인 실패로 보고 `{ user: null }`로 처리한다.
- 보호 기능 API 401: 이미 보호 화면에 들어온 뒤 발생한 인증 실패이므로 세션 만료 또는 유효하지 않은 세션으로 본다.

보호 기능 API의 401은 `parseApiError`에서 `AuthRequiredError`로 변환한다. 화면마다 401 분기를 직접 만들지 않고, `(commerce-auth)` route group의 `AuthRequiredModalBoundary`에서 한 번만 처리한다.

세션이 만료되면 현재 화면은 유지하고 모달로 다음 행동을 알려준다. 모달의 로그인하기 링크는 현재 경로를 `redirectTo`에 담아 로그인 후 원래 경로로 돌아올 수 있게 한다.

### 초기 HTML 로그인 상태

`/order`, `/orders`는 `(commerce-auth)` route group으로 분리한다. 이 layout에서만 쿠키를 읽고 세션 query cache를 hydrate한다. 공통 `(commerce)` layout에서는 쿠키를 읽지 않아 `/cart`, `/wishlist`의 정적 렌더링 범위를 유지한다.
