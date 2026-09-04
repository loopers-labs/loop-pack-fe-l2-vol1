# 인증 플로우 테스트 계획

## Application Overview

Loopers 커머스 앱(http://localhost:3000)의 인증 플로우를 검증한다. 인증은 httpOnly `session` 쿠키(HMAC 서명 JWT 유사 토큰, TTL 1시간)로 관리되며, `/order-form`·`/orders`는 edge `proxy`(src/proxy.ts)가 쿠키 "존재 여부"만으로 1차 게이트한다. 실제 서명·만료 검증은 Node 런타임(RSC 레이아웃·API 라우트)에서 수행되고, 클라이언트에서는 `meta.auth`가 달린 TanStack Query가 401을 받으면 `queryClient.ts`의 전역 핸들러가 `location.assign`으로 `/login?redirect=<원래 경로>`로 이동시킨다(README 주석: "만료 감지는 세션 값이 아니라 보호 쿼리의 401로 트리거"). 리다이렉트 목적지는 `safeRedirect`가 내부 절대 경로만 허용해 오픈 리다이렉트를 막는다. 백엔드는 목(mock)이며, 쿠키 `scenario=expired|invalid|error|slow`를 실어 보내면 실제 세션 유효성과 무관하게 로그인/주문 API가 해당 상황을 흉내 낸다 — 세션 만료를 재현하는 공식 테스트 훅이다. 테스트 계정은 looper1@loopers.dev / looper1234(비밀번호는 모든 mock 계정 공통 "looper1234").

## Test Scenarios

### 1. 인증 플로우

**Seed:** `e2e/seed.spec.ts`

#### 1.1. 미로그인 상태에서 보호 경로 진입 시 로그인으로 리다이렉트되고, 로그인 후 원래 경로로 복원된다

**File:** `e2e/auth/redirect-restore.spec.ts`

**Steps:**
  1. 브라우저 쿠키를 비운 새 컨텍스트(미로그인 상태)에서 /orders 로 직접 접근한다
    - expect: URL이 /login?redirect=%2Forders 로 리다이렉트된다
    - expect: 로그인 폼(이메일 입력, 비밀번호 입력, '로그인' 버튼)이 보인다
    - expect: 헤더에 '로그인' 링크만 보이고 '로그아웃' 버튼·사용자 이름은 보이지 않는다
  2. 이메일 입력란에 looper1@loopers.dev, 비밀번호 입력란에 looper1234를 입력하고 '로그인' 버튼을 클릭한다
    - expect: POST /api/auth/login 요청이 200으로 응답한다
    - expect: URL이 자동으로 /orders 로 이동한다(로그인 화면에 머무르지 않는다)
    - expect: 헤더에 '루퍼1'과 '로그아웃' 버튼, '주문 내역' 링크가 보이고 '로그인' 링크는 사라진다
    - expect: '주문 내역' 제목(h1)이 보인다

#### 1.2. redirect 파라미터 없이 /login에 직접 진입해 로그인하면 홈으로 이동한다

**File:** `e2e/auth/redirect-restore.spec.ts`

**Steps:**
  1. 미로그인 상태에서 /login 으로 직접 접근한다(redirect 쿼리 없음)
    - expect: 로그인 폼이 보인다
  2. looper1@loopers.dev / looper1234 로 로그인한다
    - expect: URL이 / (홈)으로 이동한다
    - expect: 헤더가 로그인 상태로 바뀐다

#### 1.3. redirect 파라미터가 외부 URL이면 오픈 리다이렉트를 막고 홈으로 대체한다

**File:** `e2e/auth/redirect-restore.spec.ts`

**Steps:**
  1. 미로그인 상태에서 /login?redirect=https%3A%2F%2Fevil.com 으로 접근한다
    - expect: 로그인 폼이 정상적으로 보인다(에러 없이 렌더된다)
  2. looper1@loopers.dev / looper1234 로 로그인한다
    - expect: URL이 https://evil.com 이 아니라 / (홈, safeRedirect의 fallback)으로 이동한다
    - expect: 새 탭이나 외부 도메인으로 이동하지 않는다

#### 1.4. 장바구니·상품 등 공개 경로는 미로그인 상태에서도 리다이렉트 없이 접근된다

**File:** `e2e/auth/redirect-restore.spec.ts`

**Steps:**
  1. 미로그인 상태에서 /products, /cart 에 각각 접근한다
    - expect: /login으로 리다이렉트되지 않고 해당 페이지가 그대로 렌더된다(proxy matcher가 /order-form, /orders만 보호하므로)

### 2. 세션 만료

**Seed:** `e2e/seed.spec.ts`

#### 2.1. 보호 자원 조회 중 세션이 만료되면(scenario=expired) 로그인으로 유도되고, 재로그인하면 원래 경로로 복원된다

**File:** `e2e/auth/session-expiry.spec.ts`

**Steps:**
  1. looper1@loopers.dev / looper1234 로 정상 로그인해 /orders 에 진입한 상태를 만든다
    - expect: '주문 내역' 화면과 로그인 상태 헤더가 보인다
    - expect: 브라우저 쿠키에 httpOnly `session` 쿠키가 존재한다
  2. 쿠키 `scenario=expired` 를 추가한다(mock 백엔드가 실제 session 쿠키 유효성과 무관하게 보호 API를 401 '로그인이 필요합니다.'로 응답하게 만드는 테스트 훅). 이후 /orders 를 다시 방문(새로고침)한다
    - expect: GET /api/orders 가 401을 반환한다
    - expect: URL이 자동으로 /login?redirect=%2Forders 로 이동한다(TanStack Query의 meta.auth 401 → 전역 핸들러 리다이렉트)
    - expect: 로그인 폼이 보인다
    - expect: (참고) SSR 레이아웃은 실제 session 쿠키만 읽으므로 이 시점 헤더에는 여전히 '루퍼1'/'로그아웃'이 남아 있을 수 있다 — 버그가 아니라 scenario 쿠키가 API 레벨에서만 401을 강제하는 테스트 훅의 특성이다
  3. `scenario` 쿠키를 제거해 실제 재로그인이 성공하도록 만든 뒤, 이메일/비밀번호를 다시 입력하고 로그인한다
    - expect: 로그인 성공 후 URL이 /orders 로 복원된다(redirect 파라미터 소비)
    - expect: '주문 내역' 화면이 정상적으로(에러나 무한 로딩 없이) 표시된다

#### 2.2. 로그인 페이지에서 발생한 401은 리다이렉트 루프를 만들지 않는다

**File:** `e2e/auth/session-expiry.spec.ts`

**Steps:**
  1. 쿠키 `scenario=invalid` 를 설정한 상태에서 /login 으로 이동해 looper1@loopers.dev / looper1234 로 로그인을 시도한다(로그인 API 자체가 401을 반환하는 상황)
    - expect: POST /api/auth/login 이 401을 반환한다
    - expect: /login 페이지에 머무르며 별도 리다이렉트가 발생하지 않는다(로그인 화면 자체 401은 전역 만료 핸들러가 무시하도록 설계됨 — 루프 방지)
    - expect: 인라인 에러 메시지가 표시된다

#### (발견 노트) 서명이 위조된 session 쿠키의 만료 UX 공백 — 테스트로 만들지 않음

탐색 중 발견한 실패 모드로, 테스트 케이스로는 만들지 않고 발견 기록으로만 남긴다. proxy는 session 쿠키의 '존재'만 확인하고 서명은 검증하지 않으므로(`src/proxy.ts`) 위조 쿠키도 edge 게이트를 통과한다. 서버는 서명 불일치로 로그아웃 취급하지만, `useOrders`가 `enabled: isLoggedIn`이라 쿼리를 아예 쏘지 않아 401도, 전역 리다이렉트도 발생하지 않고 '주문 내역을 불러오는 중…' 로딩에서 멈춘다. 세션 만료 감지가 보호 쿼리의 401에만 의존하는 설계의 사각지대다 — 만료 UX를 개선한다면 위조·손상 세션도 로그인으로 유도하도록 다뤄야 한다.

### 3. 잘못된 자격증명

**Seed:** `e2e/seed.spec.ts`

#### 3.1. 잘못된 비밀번호로 로그인하면 에러 메시지가 보이고 페이지 이동이 일어나지 않는다

**File:** `e2e/auth/invalid-credentials.spec.ts`

**Steps:**
  1. 미로그인 상태에서 /login 에 접근해 이메일에 looper1@loopers.dev, 비밀번호에 wrongpassword 를 입력하고 '로그인' 버튼을 클릭한다
    - expect: POST /api/auth/login 이 401을 반환한다
    - expect: URL이 /login 에 그대로 머무른다(이동하지 않는다)
    - expect: role=alert 요소에 '이메일 또는 비밀번호를 확인해주세요.' 메시지가 보인다
    - expect: 입력했던 이메일·비밀번호 값이 입력란에 그대로 남아있다
    - expect: 헤더는 계속 로그아웃 상태('로그인' 링크)를 유지한다

#### 3.2. 존재하지 않는 이메일로 로그인하면 동일한 일반 에러 메시지가 보인다(계정 존재 여부를 노출하지 않는다)

**File:** `e2e/auth/invalid-credentials.spec.ts`

**Steps:**
  1. 이메일에 nobody@loopers.dev, 비밀번호에 looper1234 를 입력하고 로그인한다
    - expect: 401 응답과 함께 '이메일 또는 비밀번호를 확인해주세요.' 동일 메시지가 보인다(존재하는 이메일+틀린 비밀번호 케이스와 문구가 같아야 계정 존재 여부가 노출되지 않는다)
    - expect: URL은 /login에 머무른다

#### 3.3. 에러가 보인 상태에서 값을 고쳐 재시도하면 정상 로그인된다

**File:** `e2e/auth/invalid-credentials.spec.ts`

**Steps:**
  1. 잘못된 비밀번호로 한 번 실패한 직후, 비밀번호 입력란을 looper1234로 고치고 다시 '로그인' 버튼을 클릭한다
    - expect: 로그인이 성공하고 보호되지 않은 기본 목적지(/)로 이동한다
    - expect: 이전에 보이던 에러 alert가 사라진다

#### 3.4. 로그인 요청이 진행 중일 때 버튼이 중복 제출을 막는다

**File:** `e2e/auth/invalid-credentials.spec.ts`

**Steps:**
  1. 올바른 자격증명을 입력하고 '로그인' 버튼을 클릭한 직후(응답이 오기 전) 버튼 상태를 확인한다
    - expect: 버튼이 비활성화(disabled)되고 로딩 인디케이터·aria-label='로그인 중'으로 바뀌어, 같은 요청이 중복 전송되지 않는다

#### 3.5. 이메일·비밀번호를 비운 채 제출하면 API 호출 없이 브라우저 자체 검증에 막힌다

**File:** `e2e/auth/invalid-credentials.spec.ts`

**Steps:**
  1. 이메일·비밀번호 입력란을 비운 채 '로그인' 버튼을 클릭한다
    - expect: POST /api/auth/login 요청 자체가 발생하지 않는다
    - expect: 필수 입력(required) 검증 메시지가 브라우저 기본 UI로 표시된다
    - expect: URL은 /login에 머무른다
