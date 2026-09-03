# Week 9 Analytics Instrumentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 analytics logger 위에 최소 필수 이벤트 일곱 개와 사용자 식별·초기화를 연결해 로그인부터 주문까지의 이벤트 순서를 예측하고 검증할 수 있게 한다.

**Architecture:** `src/analytics`가 공통 프로퍼티, 초기화, 이벤트 스키마를 소유한다. 화면과 feature는 raw `track()` 문자열 대신 타입이 있는 의미 기반 함수를 호출하며, 기존 logger가 큐·provider 격리·공통 속성 병합을 계속 담당한다.

**Tech Stack:** React 19, Next.js 16 App Router, TypeScript strict, Vitest, Testing Library, MSW, Zustand, existing console analytics provider

**Spec:** `docs/superpowers/specs/2026-09-03-week09-analytics-design.md`

## Global Constraints

- 패키지 매니저는 pnpm만 사용하고 npm·yarn을 사용하지 않는다.
- 새 외부 의존성과 tsconfig·Next·ESLint·Prettier 설정을 추가하거나 변경하지 않는다.
- `.env`, API 키, 이메일, 비밀번호, 서버 오류 원문을 analytics 이벤트에 기록하지 않는다.
- `@ts-ignore`, `eslint-disable`, non-null assertion으로 검사를 우회하지 않는다.
- 이벤트 이름은 `product_list_view`, `cart_add`, `login_start`, `login_success`, `login_fail`, `order_start`, `order_complete`만 구현한다.
- 현재 없는 상품 상세 화면과 선택 이벤트는 구현하지 않는다.
- 이벤트별 UI 연결 전에 실패하는 테스트를 먼저 확인한다.
- 각 Task가 끝나면 일반 리뷰와 별도의 적대적 리뷰를 통과하고, 수정 사항은 재리뷰한다.
- Git add·commit 직전에 변경 파일과 메시지를 제시하고 사용자 승인을 새로 받는다.
- 모든 프로젝트 명령은 portable Node `D:\Loopers-tools\node-v22.23.2-win-x64`를 PATH 선두에 두고 `pnpm.cmd`로 실행한다.

## File Structure

- `src/analytics/commonProperties.ts`: session ID, timestamp, device 공통 속성 생성
- `src/analytics/commonProperties.test.ts`: storage·device·timestamp 경계 검증
- `src/analytics/client.ts`: console provider 등록과 멱등 client 설정·초기화
- `src/analytics/AnalyticsInitializer.tsx`: 앱 루트에서 analytics 초기화
- `src/analytics/AnalyticsInitializer.integration.test.tsx`: 큐 flush와 중복 초기화 검증
- `src/analytics/events.ts`: 타입이 있는 이벤트·identify·reset 함수
- `src/analytics/events.test.ts`: 이벤트 이름과 프로퍼티 변환 검증
- `src/_app/providers.tsx`: `AnalyticsInitializer` 장착
- 기존 목록·장바구니·인증·주문 컴포넌트: 의미 기반 이벤트 함수 호출

---

### Task 1: 저장소 lint·format 기준선 정리

**Files:**
- Modify: `src/analytics/consoleProvider.ts`
- Create: `src/analytics/consoleProvider.test.ts`
- Mechanically format only files reported by `pnpm format:check`, including existing analytics, API, performance example, and assignment scratch files

**Interfaces:**
- Consumes: existing `AnalyticsProvider`, `window.__analytics`
- Produces: lint-compliant `consoleProvider` with unchanged provider interface

- [ ] **Step 1: Capture the failing repository gates**

Run:

```powershell
$portable='D:\Loopers-tools\node-v22.23.2-win-x64'
$env:Path="$portable;$env:Path"
pnpm.cmd lint
pnpm.cmd format:check
```

Expected: lint reports the three existing `console.info` violations in `consoleProvider.ts`; Prettier reports the current baseline files.

- [ ] **Step 2: Write the failing console provider test**

Create `src/analytics/consoleProvider.test.ts` that initializes the provider, calls `track`, `identify`, and `reset`, then asserts:

```ts
expect(window.__analytics).toEqual([
  { event: 'cart_add', properties: { productId: 'p1', quantity: 1 } },
])
expect(consoleWarn).toHaveBeenCalledTimes(3)
```

Spy on `console.warn` and restore it after the test. Do not suppress `no-console`.

- [ ] **Step 3: Verify RED**

Run:

```powershell
pnpm.cmd exec vitest run src/analytics/consoleProvider.test.ts
```

Expected: FAIL because the current provider calls `console.info`, not the allowed observation method.

- [ ] **Step 4: Make the minimal lint fix**

Keep `window.__analytics` as the primary observable buffer. Change the three development messages in `track`, `identify`, and `reset` to `console.warn`, which is permitted by the repository rule. Do not alias `console` or bypass the lint rule.

- [ ] **Step 5: Mechanically format the reported baseline**

Run:

```powershell
pnpm.cmd format
```

Inspect `git diff --name-only` and confirm formatting did not change runtime semantics. Do not make opportunistic refactors in the formatted files.

- [ ] **Step 6: Verify GREEN and repository baseline**

Run:

```powershell
pnpm.cmd exec vitest run src/analytics/consoleProvider.test.ts src/analytics/logger.test.ts
pnpm.cmd lint
pnpm.cmd format:check
pnpm.cmd typecheck
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 7: Run normal and adversarial review**

Normal review checks provider behavior and mechanical-only formatting. Adversarial review checks that lint was not evaded, console buffering still works, secrets are not logged, and unrelated formatted files have no semantic edits. Fix and re-run the same checks before closing the Task.

- [ ] **Step 8: Git approval gate**

Proposed message: `chore: 저장소 린트와 포맷 기준선 정리`

Show the exact formatted file list and provider changes, then obtain explicit approval before add/commit.

---

### Task 2: 공통 프로퍼티와 analytics 초기화

**Files:**
- Create: `src/analytics/commonProperties.ts`
- Create: `src/analytics/commonProperties.test.ts`
- Create: `src/analytics/client.ts`
- Create: `src/analytics/AnalyticsInitializer.tsx`
- Create: `src/analytics/AnalyticsInitializer.integration.test.tsx`
- Modify: `src/_app/providers.tsx`

**Interfaces:**
- Produces: `getCommonAnalyticsProperties(): EventProperties`
- Produces: `ensureClientAnalyticsConfigured(): void`
- Produces: `initializeClientAnalytics(): Promise<void>`
- Produces: `resetClientAnalyticsForTest(): void` (test-only state reset seam)
- Produces: `AnalyticsInitializer(): null`
- Consumes: `consoleProvider`, `registerProviders()`, `setCommonProperties()`, `initAnalytics()`

- [ ] **Step 1: Write failing common-property tests**

Test these exact cases:

```ts
expect(getCommonAnalyticsProperties()).toMatchObject({
  sessionId: expect.any(String),
  ts: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
  device: 'mobile',
})
```

- two calls in the same jsdom tab reuse `loopers.analytics.session-id`;
- width 767 is `mobile`, 768 is `tablet`, 1023 is `tablet`, 1024 is `desktop`;
- missing or throwing sessionStorage returns a stable non-secret fallback instead of throwing;
- the current time is evaluated on every call.

- [ ] **Step 2: Verify common-property RED**

Run: `pnpm.cmd exec vitest run src/analytics/commonProperties.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement common properties**

Use constants:

```ts
const SESSION_STORAGE_KEY = 'loopers.analytics.session-id'
const TABLET_MIN_WIDTH = 768
const DESKTOP_MIN_WIDTH = 1024
```

Generate a non-PII ID with `crypto.randomUUID()` and keep it in sessionStorage. Also retain the generated ID in a module-scoped variable: if sessionStorage is missing, denied, or throws, reuse that same in-memory ID for the lifetime of the page. Return `device: null` when browser viewport information is unavailable. Catch storage access failures locally; never make rendering fail because analytics storage is unavailable.

- [ ] **Step 4: Write failing initializer tests**

Queue a `track()` call before initialization, render `AnalyticsInitializer`, and assert the queued event reaches one provider once with common properties. Rerender and assert provider initialization and queue flush do not repeat.

- [ ] **Step 5: Verify initializer RED**

Run: `pnpm.cmd exec vitest run src/analytics/AnalyticsInitializer.integration.test.tsx`

Expected: FAIL because client setup and initializer do not exist.

- [ ] **Step 6: Implement idempotent setup and root mounting**

`client.ts` owns a module boolean and provides:

```ts
export function ensureClientAnalyticsConfigured(): void
export async function initializeClientAnalytics(): Promise<void>
export function resetClientAnalyticsForTest(): void
```

Configuration registers `[consoleProvider]` and calls `setCommonProperties(getCommonAnalyticsProperties)`. `resetClientAnalyticsForTest()` resets only this module's initialization flag and the existing logger's test state, and is used exclusively in test cleanup. `AnalyticsInitializer` invokes `initializeClientAnalytics()` in a mount effect and returns `null`. Event functions added later will call `ensureClientAnalyticsConfigured()` before queueing, so an event that happens before the effect still receives the configured common-property getter.

Render `<AnalyticsInitializer />` as the first child inside the existing `QueryClientProvider` without delaying or hiding application children.

- [ ] **Step 7: Verify Task 2**

Run:

```powershell
pnpm.cmd exec vitest run src/analytics/commonProperties.test.ts src/analytics/AnalyticsInitializer.integration.test.tsx src/analytics/logger.test.ts
pnpm.cmd typecheck
pnpm.cmd exec eslint src/analytics src/_app/providers.tsx
pnpm.cmd exec prettier --check src/analytics src/_app/providers.tsx
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 8: Run normal and adversarial review**

Attack Strict Mode remounts, duplicate initialization, child events occurring before the initializer effect, storage denial, SSR evaluation, device boundaries, session ID stability, and accidental application render blocking. Fix and re-review.

- [ ] **Step 9: Git approval gate**

Proposed message: `feat: 분석 공통 속성과 초기화 경계 추가`

Show exact files and fresh verification, then request explicit approval.

---

### Task 3: 타입이 있는 최소 이벤트 경계

**Files:**
- Create: `src/analytics/events.ts`
- Create: `src/analytics/events.test.ts`

**Interfaces:**
- Produces: `trackProductListView({ category, sort, page }): void`
- Produces: `trackCartAdd({ productId, quantity }): void`
- Produces: `trackLoginStart({ from }): void`
- Produces: `trackLoginSuccess({ from }): void`
- Produces: `trackLoginFail({ reason, status }): void`
- Produces: `trackOrderStart({ productIds, itemCount }): void`
- Produces: `trackOrderComplete({ orderId, productIds, itemCount }): void`
- Produces: `identifyUser(userId): void`, `resetUser(): void`
- Produces: `getLoginSource(returnTo): 'cart' | 'orders' | 'direct'`
- Produces: `getLoginFailure(error): { reason: LoginFailureReason; status: number | null }`

- [ ] **Step 1: Write failing event-contract tests**

Mock only `ensureClientAnalyticsConfigured` and the existing logger boundary. For every public function, assert the exact event name and object. Include:

```ts
trackCartAdd({ productId: 'p1', quantity: 1 })
expect(track).toHaveBeenCalledWith('cart_add', {
  productId: 'p1',
  quantity: 1,
})
```

Test `/checkout?coupon=welcome → cart`, `/orders?page=2 → orders`, unsafe/external/undefined → `direct`. Test failure normalization for ApiError 400, 401, 500, a network `Error`, and an unknown thrown value.

- [ ] **Step 2: Verify RED**

Run: `pnpm.cmd exec vitest run src/analytics/events.test.ts`

Expected: FAIL because `events.ts` does not exist.

- [ ] **Step 3: Implement exact typed functions**

Define interfaces for object arguments and:

```ts
export type LoginSource = 'cart' | 'orders' | 'direct'
export type LoginFailureReason =
  | 'INVALID_REQUEST'
  | 'INVALID_CREDENTIALS'
  | 'SERVER_ERROR'
  | 'UNKNOWN'
```

Every tracking and identity function first calls `ensureClientAnalyticsConfigured()`, then calls exactly one logger method. Do not accept arbitrary event names or arbitrary property bags at UI call sites.

- [ ] **Step 4: Verify Task 3**

Run:

```powershell
pnpm.cmd exec vitest run src/analytics/events.test.ts src/analytics/logger.test.ts
pnpm.cmd typecheck
pnpm.cmd exec eslint src/analytics
pnpm.cmd exec prettier --check src/analytics
git diff --check
```

- [ ] **Step 5: Run normal and adversarial review**

Attack event spelling, property mismatch, unsafe return paths, status boundary 499/500, PII leakage, mutation of passed arrays, and a raw `track()` escape hatch. Fix and re-review.

- [ ] **Step 6: Git approval gate**

Proposed message: `feat: 최소 이벤트 계측 계약 추가`

Request explicit approval immediately before the commit.

---

### Task 4: 상품 목록과 장바구니 계측

**Files:**
- Modify: `src/_pages/product-list/ui/ProductListPage.tsx`
- Modify: `src/_pages/product-list/ui/ProductListPage.integration.test.tsx`
- Modify: `src/features/add-to-cart/ui/AddToCartButton.tsx`
- Modify: existing add-to-cart or header integration tests that exercise the real button

**Interfaces:**
- Consumes: `trackProductListView()`, `trackCartAdd()`
- Preserves: current query correction, loading/error/refresh behavior and cart toggle semantics

- [ ] **Step 1: Write failing list-view tests**

Mock the typed analytics function, not the logger. Assert:

- first render of a valid query sends one event with category, sort, and page;
- ordinary rerender and background refetch do not duplicate it;
- category, sort, page, or search condition change sends one new list-view event;
- an invalid page corrected by existing logic is recorded only for the corrected displayed condition.

- [ ] **Step 2: Verify list RED**

Run the focused ProductList integration test and confirm the new assertions fail because no event is sent.

- [ ] **Step 3: Implement list instrumentation**

Use an effect keyed by the normalized displayed query signature. Keep a ref to the last recorded signature so Strict Mode and non-semantic rerenders cannot duplicate the event. Do not add filter/sort/page change event names.

- [ ] **Step 4: Write failing cart tests**

Assert the first click from not-in-cart sends:

```ts
trackCartAdd({ productId: PRODUCT.id, quantity: 1 })
```

Click again to remove and assert the call count stays one. Rerendering and failed duplicate clicks must not create new events.

- [ ] **Step 5: Verify cart RED and implement**

Capture `inCart` before toggling. Call `trackCartAdd()` only when the click changes false to true, after `toggleCart(productId)` is invoked. Preserve the existing accessible name and pressed state.

- [ ] **Step 6: Verify Task 4**

Run focused list, add-to-cart, product-card, and header tests, then typecheck and changed-file lint/format checks.

- [ ] **Step 7: Run normal and adversarial review**

Attack Strict Mode, query correction, refresh, rapid query changes, cart removal/re-add, stale `inCart`, and event inflation. Fix and re-review.

- [ ] **Step 8: Git approval gate**

Proposed message: `feat: 상품 목록과 장바구니 이벤트 계측`

Request explicit approval with exact files and evidence.

---

### Task 5: 로그인 식별과 로그아웃 reset 계측

**Files:**
- Modify: `src/features/auth/ui/LoginForm.tsx`
- Modify: `src/features/auth/ui/LoginForm.integration.test.tsx`
- Modify: `src/features/auth/ui/LogoutButton.tsx`
- Modify: `src/features/auth/ui/LogoutButton.integration.test.tsx`
- Modify: `src/features/auth/ui/LogoutButton.call-order.integration.test.tsx`

**Interfaces:**
- Consumes: login event functions, `identifyUser()`, `resetUser()`
- Preserves: synchronous duplicate guard, AbortController, private query reset, safe return path, refresh ordering

- [ ] **Step 1: Write failing login event-order tests**

Assert these sequences through typed analytics mocks:

```text
mount → login_start
success → login_success → identifyUser(user.id) → router.replace → router.refresh
401 → login_fail({ reason: INVALID_CREDENTIALS, status: 401 })
400 → login_fail({ reason: INVALID_REQUEST, status: 400 })
500 → login_fail({ reason: SERVER_ERROR, status: 500 })
network/unknown → login_fail({ reason: UNKNOWN, status: null })
```

Also assert duplicate synchronous submission yields one success/failure event and unmount-aborted login yields neither result event nor identity/navigation.

- [ ] **Step 2: Verify login RED**

Run: `pnpm.cmd exec vitest run src/features/auth/ui/LoginForm.integration.test.tsx`

- [ ] **Step 3: Implement login instrumentation**

Use a ref so `login_start` fires once per mounted login screen even under Strict Mode replay. Derive `from` once from the safe return path. Capture the returned `AuthUser`; after a non-aborted success call `trackLoginSuccess({ from })` then `identifyUser(user.id)` before state cleanup and navigation. In the existing non-aborted catch, normalize and call `trackLoginFail()` before setting the UI message.

- [ ] **Step 4: Write failing logout tests**

Assert successful logout calls `resetUser()` after the 204 response and before local private state cleanup/refresh. Assert 400/500/network failures do not call reset and keep the current user state.

- [ ] **Step 5: Implement logout reset**

Insert `resetUser()` only in the existing success branch immediately after `await logout()`. Do not add a new logout event.

- [ ] **Step 6: Verify Task 5**

Run all auth UI/API/session tests, typecheck, and changed-file lint/format. Confirm raw credentials never appear in analytics assertions or browser buffer.

- [ ] **Step 7: Run normal and adversarial review**

Attack duplicate native submits, Strict Mode remounts, slow request navigation, aborted fetches, failed logout, account switching, order-query reset order, stale identity, and PII leakage. Fix and re-review.

- [ ] **Step 8: Git approval gate**

Proposed message: `feat: 로그인 식별과 로그아웃 분석 연결`

Request explicit approval with exact files and call-order evidence.

---

### Task 6: 주문 시작과 완료 계측

**Files:**
- Modify: `src/features/create-order/ui/CreateOrderButton.tsx`
- Modify: `src/features/create-order/ui/CreateOrderButton.integration.test.tsx`

**Interfaces:**
- Consumes: `trackOrderStart()`, `trackOrderComplete()`
- Preserves: global submission coordinator, auth-generation invalidation, remount pending/error state, versioned cart snapshots

- [ ] **Step 1: Write failing order event tests**

Assert:

- one accepted submit emits one `order_start` with the exact submitted product ID array and count;
- 201 emits one `order_complete` with response order ID and the submitted snapshot;
- empty cart and duplicate/remounted submit emit no additional start;
- 400, 500, 401, abort, and auth reset emit no complete;
- items added after the submitted snapshot never appear in the old order events.

- [ ] **Step 2: Verify RED**

Run the focused CreateOrderButton integration suite and confirm failures are due to absent event calls.

- [ ] **Step 3: Implement minimal order instrumentation**

Call `trackOrderStart()` only after the existing pending/empty guard and immediately before the accepted coordinator submission. Capture the `Order` returned by `createOrder()` in the submission closure. In `onSuccess`, call `trackOrderComplete()` using that response and the immutable submitted cart snapshot before removing that snapshot and navigating.

Do not compute `totalPrice` and do not read the current cart in `onSuccess`.

- [ ] **Step 4: Verify Task 6**

Run create-order, order-list, order API, logout/private-order and cart snapshot tests, then typecheck and changed lint/format.

- [ ] **Step 5: Run normal and adversarial review**

Attack double clicks, unmount/remount, same-ID remove/re-add, later cart additions, 401 redirect, account switch, abort, rejected requests, stale order ID, and event order relative to cart clearing/navigation. Fix and re-review.

- [ ] **Step 6: Git approval gate**

Proposed message: `feat: 주문 시작과 완료 이벤트 계측`

Request explicit approval with exact files and evidence.

---

### Task 7: 2단계 전체 검증과 3단계 인계

**Files:**
- Modify only if fresh evidence reveals a defect in Task 1–6 files
- Read: `docs/assignments/week-09.md`
- Read: `docs/superpowers/specs/2026-09-03-week09-analytics-design.md`

**Interfaces:**
- Verifies the complete Stage 2 deliverable; introduces no new event name

- [ ] **Step 1: Verify event inventory and raw-call boundary**

Run searches that prove production UI uses typed functions and only the seven approved names exist:

```powershell
rg -n "track\(" src --glob '!src/analytics/**'
rg -n "product_list_view|cart_add|login_start|login_success|login_fail|order_start|order_complete" src
```

Expected: no raw UI `track()` calls and no unapproved production event names.

- [ ] **Step 2: Run the complete harness**

Run:

```powershell
pnpm.cmd test
pnpm.cmd lint
pnpm.cmd format:check
pnpm.cmd typecheck
pnpm.cmd build
pnpm.cmd test:e2e
pnpm.cmd check
git diff --check
```

Expected: all commands exit 0 on Node 22.23.2. Record exact test counts. If a command fails, use systematic debugging and distinguish an instrumentation defect from an environment problem before editing.

- [ ] **Step 3: Verify observable browser sequence**

On a production server, clear only the local test session, then complete:

```text
product list → cart add → checkout → login → order submit → orders → logout
```

Inspect `window.__analytics` and verify this relative order:

```text
product_list_view
cart_add
login_start
login_success
order_start
order_complete
```

Because the existing browser buffer stores track events only, separately capture the console provider's identity messages and verify `identify(u1)` occurs after login success and `reset()` only after successful logout. Do not record or expose credentials in the evidence.

- [ ] **Step 4: Reconcile the authoritative Stage 2 checklist**

Map every required behavior to code, a focused test, or the runtime observation. Explicitly record that `product_detail_view` and the optional seed events were omitted because those screens or minimum-scope requirements are absent. Do not claim Stage 3 RFC analysis or E2E selection is complete.

- [ ] **Step 5: Run final normal and adversarial review**

Normal review checks spec coverage, FSD direction, tests, and evidence. Adversarial review tries to create missing, duplicated, reordered, post-abort, cross-user, PII-bearing, or uninitialized events and challenges the browser buffer evidence. Fix and rerun full verification until both pass.

- [ ] **Step 6: Git approval gate for verification fixes**

If verification changed code, show the exact diff and propose a Korean fix commit. If no files changed, do not create an empty commit.

## Definition of Done

- The seven minimum events have one documented trigger and typed property contract each.
- `identify()` happens only after successful login and `reset()` only after successful logout.
- Common `sessionId`, `ts`, and `device` are present without PII.
- The production browser buffer shows the predictable login-to-order sequence.
- Product detail and optional seed events are explicitly omitted, not silently forgotten.
- Repository lint, format, test, typecheck, build, existing E2E, and `pnpm check` all pass.
- Each implementation Task has passed normal and adversarial review.
