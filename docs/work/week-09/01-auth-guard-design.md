# 1단계 — 인증 구현 판단 기록

- 목적: `docs/assignments/week-09.md` 1단계 요구사항 중 "정하고 근거를 남겨요" 대상만 초안으로 정리. 최종 제출 위치는 문서 96번 줄 기준 PR 본문.
- 참조: 작업 흐름·선수 관계·착수 시점 실측은 [00-step1-plan.md](./00-step1-plan.md). 아래 항목 번호는 그 문서의 A~F 단계와 연결된다.
- 작성 규칙: 판단·근거는 직접 채운다. 각 항목 승인 전까지 다음 항목으로 넘어가지 않는다.

## 목차

1. [세션 만료(401) 처리 위치](#1-세션-만료401-처리-위치)
2. ["미로그인" vs "세션 만료" 401 구분 기준](#2-미로그인-vs-세션-만료-401-구분-기준)
3. [로그아웃 시 클라이언트 상태 정리 방침](#3-로그아웃-시-클라이언트-상태-정리-방침)
   - [3-1. 구현 위치](#3-1-구현-위치-2026-09-03-기록)
   - [3-2. 발견했지만 미반영 사항](#3-2-구현-중-발견했지만-아직-반영-안-된-사항-2026-09-03-판단-보류)
4. [보호 경로 경계](#4-보호-경로-경계)
5. [복원 경로 파라미터 설계](#5-복원-경로-파라미터-설계)
6. [세션 쿠키 검증 수준](#6-세션-쿠키-검증-수준)
7. [세션 상태를 기존 클라이언트 상태 패턴으로 다뤄도 되는가](#7-세션-상태를-기존-클라이언트-상태-패턴으로-다뤄도-되는가)
8. [초기 HTML 로그인 상태 반영과 7주차 성능 기준](#8-초기-html-로그인-상태-반영과-7주차-성능-기준)
9. [인증 왕복이 브라우저 히스토리에 남기는 것](#9-인증-왕복이-브라우저-히스토리에-남기는-것)

## 1. 세션 만료(401) 처리 위치

> 근거: 119번 줄 — "화면마다 따로 처리하면 나중에 어디를 고칠지 알 수 없습니다"

- 질문: 401을 어디서 한 곳으로 받아 처리할 것인가
- 결정: **전역 `QueryCache.onError` · `MutationCache.onError`**(`src/_app/providers.tsx`)에서 `SessionExpiredError`에만 반응해 `/login?next=<현재 href>&reason=expired`로 이동한다. 401 자체는 여기까지 올라오지 않는다 — 각 API 모듈이 의미로 번역한 뒤 던진다(2번 항목).

  ```ts
  // src/_app/providers.tsx
  queryCache: new QueryCache({
    onError: (error) => { if (error instanceof SessionExpiredError) redirectToLogin(); }
  }),
  mutationCache: new MutationCache({
    onError: (error) => { if (error instanceof SessionExpiredError) redirectToLogin(); }
  })

  // src/_app/redirectToLogin.ts
  export function redirectToLogin() {
    if (window.location.pathname === '/login') return; // 리다이렉트 루프 차단
    window.location.replace(`/login?next=${encodeURIComponent(window.location.href)}&reason=expired`);
  }
  ```

- 근거:
  - `ErrorBoundary`는 렌더 중 throw만 잡아 `useMutation`의 실패를 놓친다. 주문 생성(`POST /api/orders`)이 만료를 만나는 자리라, 이걸 못 잡으면 "한 곳"이 성립하지 않는다.
  - 전환 수단은 `window.location`이다. `onError`는 훅 밖이라 `useRouter`를 쓸 수 없고, 만료 시엔 `RootLayout`이 서버에서 채운 헤더까지 다시 그려져야 한다.
  - 그 전체 이동은 `replace`로 한다. 만료는 사용자가 누른 이동이 아니므로 보고 있던 보호 화면 엔트리를 남기지 않고 대체한다(9번 결정). 실패한 쿼리마다 `onError`가 돌아 이 함수가 여러 번 불려도 목적지가 같아 엔트리가 늘지 않으므로, 중복 호출 방어 코드도 필요 없다.
  - 목적지를 `/login`으로 잡은 이유는 `proxy.ts`가 실제 TTL 만료에서 하는 일과 같기 때문이다. 갈리는 건 `reason` 하나뿐이다. 안내를 `reason` 쿼리로 실어 보내는 이유도 여기 있다 — 전체 이동이라 토스트는 살아남지 못한다.
  - `reason`은 안내 문구를 고르는 키일 뿐, 원인을 단정하는 문구로 쓰지 않는다(3번 결정).

## 2. "미로그인" vs "세션 만료" 401 구분 기준

> 근거: 125번 줄 — `/api/auth/me`는 두 경우를 같은 401로 돌려줌

- 질문: 어떤 요청의 401을 "만료"로 볼 것인가
- 결정: **요청 대상으로 가르되, 판정은 각 API 모듈이 한다.** 401을 그대로 전역에 올리지 않고 자원별로 의미 있는 값·타입으로 번역한다.

  | 요청                    | 401의 의미      | 번역                          | 전역 `onError` 도달   |
  | ----------------------- | --------------- | ----------------------------- | --------------------- |
  | `GET /api/auth/me`      | 미로그인        | `null` 반환                   | 도달 안 함            |
  | `GET·POST /api/orders`  | 세션 만료       | `SessionExpiredError` throw   | 도달 → 이동           |
  | `POST /api/auth/login`  | 자격 증명 불일치 | `ApiError` 그대로             | 도달하나 타입이 달라 무시 |

  ```ts
  // src/entities/order/api/listOrders.ts (실제 구현 위치 — queryFn 정의는 orderQueries.ts가 분리해 가짐)
  // 보호 자원이라 401은 만료뿐이다 — proxy.ts가 미인증 진입을 이미 막는다.
  if (error instanceof ApiError && error.status === 401) throw new SessionExpiredError();
  ```

- 근거:
  - `proxy.ts`가 쿠키 없음·위조·`exp` 초과를 진입 단계에서 걸러낸다(6번 결정). 보호 화면 안까지 들어와서 받는 401은 "들어올 때는 유효했던 세션"뿐이므로 만료로 단정할 수 있다.
  - `me`는 비보호 화면의 헤더에서도 불린다. 거기서 401은 미로그인이라는 정상 상태이므로 만료로 보지 않는다. `getMe`가 이미 `null`로 번역하고 있어(`getMe.ts:11-14`) 전역에 도달하지 않는다.
  - 로그인 화면은 비보호라 프록시를 지나지 않는다. 그 401은 자격 증명 불일치이고, 만료 안내로 바꿔 보여주면 사용자에게 틀린 다음 행동을 알려주게 된다. 타입이 달라 예외 규칙 없이 걸러진다.

## 3. 로그아웃 시 클라이언트 상태 정리 방침

> 근거: 120번 줄, 체크리스트 318번 줄

- 질문: 로그아웃 시 장바구니·위시리스트를 지울 것인가, 남길 것인가
- 결정: **남긴다.** 로그아웃이 정리하는 것은 세션 캐시(`['auth']`) 하나뿐이고, `cart`·`wishlist`의 Zustand store는 건드리지 않는다.
- 히스토리도 정리 대상이 아니다. 로그아웃 뒤에 남은 보호 화면 엔트리는 그대로 두고, 대신 **로그인 화면 안내 문구가 원인을 단정하지 않게** 한다.
- 근거:
  - 4번 결정에서 장바구니·위시리스트를 "계정 없이도 성립하는 기능"으로 보고 비보호로 뒀다. 로그아웃할 때 지우면 비회원도 쓰라고 열어둔 기능을 로그아웃이 초기화하는 셈이라 그 판단과 모순된다.
  - 두 값은 서버 API가 없는 클라이언트 상태라 계정에 귀속된 데이터가 아니다. 남겨도 다른 계정의 데이터가 새는 경로가 없다.
  - 반대로 세션 캐시는 서버가 주인인 값이고(7번 결정), 로그아웃으로 서버 세션이 사라진 뒤에도 캐시에 남아 있으면 화면이 로그인 상태를 계속 보여준다. 그래서 이쪽만 지운다.
  - 히스토리를 건드리지 않아도 되는 이유: 뒤로 가기로 보호 화면이 캐시에서 복원되면 `proxy.ts`를 지나지 않지만, 데이터 요청이 401을 받아 2번 결정대로 `SessionExpiredError`가 되고 로그인 화면으로 대체 이동한다(9번 결정). 상태는 스스로 수렴한다.
  - 안내 문구를 중립으로 두는 이유: 이 경로는 사용자가 스스로 로그아웃한 경우라 "세션이 만료되었습니다"가 틀린 안내가 된다. 두 경로의 다음 행동이 "다시 로그인"으로 같으므로 문구를 그 행동만 가리키게 두고, 로그아웃을 구분하는 상태는 새로 만들지 않는다.

### 3-1. 구현 위치 (2026-09-03 기록)

- 트리거: `src/widgets/header/ui/Header.tsx`의 "로그아웃" 버튼 → `useMutation({ mutationFn: logout })` → `onSuccess`에서 `queryClient.invalidateQueries({ queryKey: authQueries.all() })`.
- API 호출: `src/entities/auth/api/logout.ts`. `apiFetch`를 쓰지 않고 `fetch`를 직접 호출한다 — `POST /api/auth/logout`은 스펙상 노브 없이 항상 204(본문 없음)를 반환하는데(과제 57번 줄), `apiFetch`는 성공 응답에서 항상 `res.json()`을 호출해 빈 본문에서 예외를 던진다. `apiFetch`를 204까지 다루도록 넓히는 대신, 이 엔드포인트만 그 계약 밖에서 처리했다.
- 로그아웃은 별도 리다이렉트를 하지 않는다 — 화면 이동 없이 현재 페이지에 머문다. 히스토리를 건드리지 않는다는 위 결정과 일치한다.
- 안내 문구(`LoginNotice`)는 `LoginForm`과 분리된 별도 컴포넌트(`src/_pages/login/ui/LoginNotice.tsx`)로 구현됐다 — `reason=expired`일 때만 렌더링.

### 3-2. 구현 중 발견했지만 아직 반영 안 된 사항 (2026-09-03, 판단 보류)

대화로 분석만 하고 코드에는 반영하지 않았다. 결정은 비워둔다.

- **재조회 경쟁 상태**: `invalidateQueries`는 로그아웃 시점에 이미 진행 중이던(로그아웃 이전에 유효한 쿠키로 나간) `me` fetch를 취소하지 않는다. 그 fetch가 로그아웃 완료 이후에 응답하면, 로그인 상태였던 데이터로 캐시를 다시 덮어쓸 수 있다. `queryClient.cancelQueries()` 후 `setQueryData(authQueries.me().queryKey, null)`로 바꾸면 막을 수 있으나 미적용.
- **무효화 범위가 `['auth']`뿐**: `orderQueries`의 키는 `['orders', ...]`라 로그아웃해도 갱신되지 않는다. 같은 브라우저에서 다른 계정으로 재로그인하면, `staleTime`(20초, `src/_app/providers.tsx:18`) 동안 이전 계정의 주문 내역이 캐시에 남아 화면에 보일 수 있다.
- **"상태는 스스로 수렴한다"(3번 결정 근거)의 전제 재확인**: 이 문장은 뒤로 가기로 보호 화면에 진입하면 데이터 요청이 401을 받아 즉시 로그인으로 튕긴다고 서술한다. 하지만 해당 페이지의 쿼리가 이미 `staleTime` 이내로 캐시돼 있으면 재요청 자체가 즉시 일어나지 않는다 — 수렴은 즉시가 아니라 `staleTime` 경과·재마운트·창 포커스 등 재조회 트리거가 발생한 시점까지 지연된다.

## 4. 보호 경로 경계

> 근거: 121번 줄 — 주문서·주문 내역은 필수, 장바구니·위시리스트·마이페이지는 판단

- 질문: 위 세 화면(장바구니/위시리스트/마이페이지) 중 보호 경로에 포함할 것은?
- 제약(121번 줄): 포함하기로 한 화면이 아직 없으면 검증을 위해 새로 만들어야 함
- 결정: 판단 기준은 "유저 계정이 필요한 기능이 아니라면 비보호로 둔다".

  | 페이지                 | 보호/비보호 | 근거                                                                                                                                                                                                                                           |
  | ---------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | 주문서 (`/orders/new`) | 보호        | 유저 계정 생성을 전제로 하는 기능이다. `app/api/orders/route.ts`의 `resolveSession()`이 POST에서 세션 쿠키를 검증하고 실패 시 401을 반환하며(29~34번 줄), `addOrder(resolved.user.id, items)`로 주문을 `user.id`에 귀속시켜 저장한다(81번 줄). |
  | 주문 내역 (`/orders`)  | 보호        | 동일한 `resolveSession()` 검증을 GET에도 적용한다. `listOrders(resolved.user.id)`로 로그인한 계정의 `user.id`로 필터링해 조회하므로(90번 줄), 계정 없이 성립할 수 없는 조회 조건이 mock 백엔드 계약 자체에 있다.                               |
  | 장바구니 (`/cart`)     | 비보호      | 비회원도 가능한 행동이고 목록 표시가 가능하다. `src/entities/cart`는 서버 API가 없는 클라이언트 Zustand 상태(5주차 결정)라, 계정에 귀속될 서버 데이터 자체가 없다.                                                                             |
  | 찜 목록 (`/wishlist`)  | 비보호      | 위와 동일 — `src/entities/wishlist` 역시 서버 API가 없는 클라이언트 Zustand 상태다.                                                                                                                                                            |
  | 마이페이지 (`/mypage`) | 보호        | 표시할 정보가 로그인 없이는 존재하지 않는다.                                                                                                                                                                                                   |

- 근거: 계정 없이도 동작·관리가 가능한 기능(장바구니·위시리스트)까지 막는 것은 과잉 보호다. 계정이 있어야 성립하는 기능(주문, 마이페이지의 표시 정보)만 가드 대상으로 좁힌다.

## 5. 복원 경로 파라미터 설계

> 근거: 116번 줄 — 파라미터 직접 정하고, 외부 주소로 못 나가게 막아야 함

- 질문: 원래 경로를 어떤 파라미터명으로 실어 나를 것인가
- 질문: 그 값이 외부 주소(open redirect)로 못 나가게 어떤 방법으로 막을 것인가
- 결정: 파라미터명은 `next`. 검증은 문자열 매칭(`startsWith`)이 아니라 **URL 파싱 후 origin 비교**로 한다.

  ```ts
  function isSafeRedirect(next: string, requestOrigin: string): boolean {
    try {
      return new URL(next, requestOrigin).origin === requestOrigin;
    } catch {
      return false;
    }
  }
  ```

  - `requestOrigin`은 `request.nextUrl.origin`(요청 시점 값)을 쓴다. 환경변수로 고정하지 않는다 — 로컬(`localhost:3000`)과 운영 도메인이 달라, 고정하면 정상 리다이렉트까지 오판해 막는다.
  - `next`가 비어 있으면(값 없음) 이 함수는 `true`를 반환하지만 의미 있는 목적지가 아니다. 호출부(로그인 성공 처리)에서 빈 값은 검증 전에 먼저 걸러 기본 경로(`/`)로 보낸다.
  - `proxy.ts`가 `next` 값을 만들 때는 **절대경로**(`request.nextUrl.href`)를 쓴다. 예: `next=http://localhost:3000/orders/new`.
    - 근거: 쿠팡 `rtnUrl`, 무신사 `referer` 실측 결과 둘 다 자기 도메인의 절대 URL을 그대로 전달하는 방식이었다(2026-08-30 확인). `isSafeRedirect`는 상대경로·절대경로(같은 origin) 모두 통과시키도록 설계돼 있어 보안·기능상 차이는 없고, 국내 대형 커머스 관행에 맞춘 스타일 선택이다.
  - 로그인 화면이 이 값을 **쓸 때는** 검증을 통과한 뒤 경로 부분만 남겨 넘긴다.

    ```ts
    // src/_pages/login/lib/resolveLoginDestination.ts
    if (next === null || next === '' || !isSafeRedirect(next, origin)) {
      return HOME_PATH;
    }

    const { pathname, search, hash } = new URL(next, origin);
    return pathname + search + hash;
    ```

    - 근거: 절대 URL을 그대로 `router.replace()`에 넘기면 라우터가 외부 주소로 판정할 때 하드 내비게이션으로 폴백해 9번 결정의 "엔트리 대체"가 깨질 수 있다. origin 비교는 바로 위 `isSafeRedirect`에서 끝났으므로 경로만 남겨도 검증 수준은 그대로다. Shopify가 `return_to`를 상대 URL로만 받는 것도 같은 방향의 제약이다([Customer sign-in links and redirects](https://shopify.dev/docs/storefronts/themes/sign-in)).
    - `search`·`hash`까지 살려 넘기므로 nuqs로 URL에 둔 필터·페이지 상태도 함께 복원된다.

- 근거: 문자열 접두사 검사(`startsWith('/')`)는 `//evil.com`(프로토콜 상대 URL), `/\evil.com`(브라우저가 백슬래시를 슬래시로 정규화)처럼 브라우저 파싱 규칙에 의존하는 우회를 막지 못한다. `new URL()`은 브라우저와 같은 파서를 쓰므로 이 정규화를 검증 시점에 동일하게 반영하고, 결과를 `origin` 단위로 비교하면 `javascript:` 등 스킴이 섞인 값도 origin 불일치로 함께 걸러진다(OWASP Unvalidated Redirects and Forwards Cheat Sheet 권장 방식).

## 6. 세션 쿠키 검증 수준

> 근거: 123번 줄 — 서명까지 검증할지, 존재만 확인할지

- 질문: `proxy.ts`에서 서명까지 검증할 것인가, 존재 여부만 볼 것인가
- 결정: 서명까지 검증한다. `app/api/_data/auth.ts`의 `readSessionToken()`을 `proxy.ts`에서 그대로 재사용한다.
- 근거: 실 서비스 환경에 가깝게 재현하기 위함이다. 존재 여부만 보면 `session` 쿠키에 아무 문자열이나 넣어도 가드를 통과한다 — 실 서비스라면 절대 허용하지 않는 위조 경로다.

## 7. 세션 상태를 기존 클라이언트 상태 패턴으로 다뤄도 되는가

> 근거: 127번 줄 — "5주차부터 써온 클라이언트 상태 패턴을 그대로 써도 되는지 먼저 검토"

- 질문: 세션(요청마다 달라지는 서버 상태)을 지금까지 쓴 상태 관리 방식(Zustand 등)에 그대로 태울 수 있는가, 다른 방식이 필요한가
- 결정: 그대로 쓸 수 없다. Zustand가 아니라 **TanStack Query 서버 상태**로 다룬다. `GET /api/auth/me`를 `queryFn`으로 두는 `authQueries`를 만들고, 기존 홈·목록과 같은 prefetch → dehydrate 패턴으로 초기 HTML까지 채운다.
- 근거:
  - 소유권이 다르다. `cart`·`wishlist`(Zustand)는 클라이언트가 값의 주인이라 클라이언트가 바꾸기 전까지 값이 변하지 않는다. 세션은 **서버가 주인**이라 클라이언트가 아무것도 하지 않아도 만료될 수 있다(`expired` 시나리오, TTL 1시간).
  - Zustand로 다루면 서버가 만료시킨 시점과 store 값이 어긋나고, 그 동기화를 401을 받을 때마다 수동으로 맞춰야 한다. 서버 상태를 클라이언트 상태로 복사할 때 생기는 전형적인 문제다.
  - 조회 API(`GET /api/auth/me`)가 이미 있어 `queryFn`으로 바로 감쌀 수 있고, CLAUDE.md 상태 분류 기준("서버에서 오는 데이터 → 서버 상태(TanStack Query)")에도 그대로 해당한다.

## 8. 초기 HTML 로그인 상태 반영과 7주차 성능 기준

> 근거: 118번 줄 — 쿠키 읽는 위치에 따라 정적 생성 범위가 달라짐

### 8-1. 세션 쿠키를 어디서 읽을 것인가

- 질문: 세션 쿠키를 읽는 코드를 어느 계층에 둘 것인가
- 결정: **`RootLayout`**
- 근거:
  - 세션 소비처가 `Header`와 권한 필요 페이지(주문서·주문 내역·마이페이지) 양쪽이라, 공통 조상이 `RootLayout`뿐이다.

### 8-2. 정적 생성 범위와 7주차 성능 기준이 어떻게 달라지는가

- 질문: 그 위치가 7주차에 확보한 정적 생성 범위·성능 기준을 깨지 않는가
- 결정: **정적 생성 범위는 포기**(전 페이지 동적). **TTFB·FCP 회귀는 감수**하고, **LCP·CLS는 유지됨을 확인**했다.
- 실측 1 — 정적 생성 범위 (`pnpm build` Route 목록)

  | 빌드   | `RootLayout`                   | 정적(`○`) |
  | ------ | ------------------------------ | --------- |
  | Before | HEAD 원본                      | 8         |
  | 분리   | `prefetch`만, `cookies()` 없음 | 8         |
  | After  | `cookies()` + `prefetch`       | **0**     |

- 실측 2 — 홈 성능. 같은 SHA에서 `RootLayout`·`Header`만 HEAD로 되돌려 Before를 만들고, week-07과 동일 조건 5회(Lighthouse CLI 13.3.0, `--preset=desktop`, CPU 2.4x + 지연 167ms + 하향 7,910Kbps).

  | 지표       | Before  | After   | 판정              |
  | ---------- | ------- | ------- | ----------------- |
  | TTFB       | 36.0ms  | 530.1ms | **회귀 +494.1ms** |
  | FCP 중앙값 | 466.1ms | 871.9ms | **회귀 +405.8ms** |
  | LCP 중앙값 | 925.5ms | 888.6ms | 유지 (-36.9ms)    |
  | CLS        | 0.005   | 0       | 유지              |

- 근거:
  - 원인은 `await cookies()` 단독이다. 계정 정보를 전 페이지가 공유하는 이상 불가피하다.
  - TTFB·FCP 회귀는 `/api/auth/me`의 고정 지연 500ms(`app/api/auth/me/route.ts:14`)를 셸 렌더 전에 `await`하기 때문이다.
  - 이 회귀를 다시 무는 전체 이동은 만료 시 1회뿐이다. 인증 후 복원은 클라이언트 내비게이션이라(9번 결정) 문서 요청이 다시 나가지 않는다.
  - LCP·CLS 유지는 세션·홈 조회가 병렬이라서다 — Hero의 Resource load delay가 516.6 → 24.3ms로 줄어 TTFB 증가분을 상쇄했다(`scenario=slow`로 `me`만 1.5초로 늘렸을 때 홈 문서 총 소요 1.52초, 순차라면 2.0초).
- 남은 선택지: `getMe`를 direct-call로 바꾸면 TTFB 500ms는 대부분 사라진다(`proxy.ts`의 direct-call 경로 TTFB 2.45ms). 정적 범위는 그래도 안 살아난다.
- 파기한 대안: `Suspense`(TTFB 12.6ms)와 `cacheComponents`/PPR(`◐`, TTFB 3.0ms) 둘 다 헤더가 `<div hidden>`으로 스트리밍돼 JS 없이는 안 보여 118번 줄을 못 지킨다.

## 9. 인증 왕복이 브라우저 히스토리에 남기는 것

> 목적: 세션 만료는 사용자가 의도한 이동이 아니다. 만료 → 로그인 → 복원 왕복이 끝난 뒤 히스토리는 아무 일도 없었던 것과 같아야 한다.

- 질문: 왕복이 끝난 뒤 스택에 무엇이 남아야 하고, 각 전환을 무엇으로 할 것인가
- 결정: **로그인 화면은 스택에 남기지 않는다.** 사용자가 누르지 않은 이동은 추가(push)가 아니라 대체(replace)로 한다.

  ```
  만료 전:   [/, /product/1, /orders/new]
  만료 직후: [/, /product/1, /login?next=…]   ← 보호 화면 엔트리를 대체
  인증 완료: [/, /product/1, /orders/new]      ← 로그인 엔트리를 복원 화면이 대체
  ```

  | 전환                | 수단                                     | 히스토리                                                          |
  | ------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
  | 보호 경로 진입 차단 | `proxy.ts`의 리다이렉트 응답             | 추가 없음 — 요청한 URL이 차지하려던 엔트리가 최종 URL로 채워진다 |
  | 이용 중 만료        | `window.location.replace` (1번 결정)     | 보고 있던 보호 화면 엔트리를 `/login`이 대체                      |
  | 인증 성공 → 복원    | `router.replace` (아래)                  | `/login` 엔트리를 복원 대상이 대체                                |

  ```ts
  // src/_pages/login/ui/LoginForm.tsx — 로그인 성공 처리
  await loginMutation.mutateAsync({ email, password });
  queryClient.invalidateQueries({ queryKey: authQueries.all() });
  router.replace(resolveDestination());
  ```

- 근거:
  - 지켜야 할 것은 하나다. 복원된 화면에서 뒤로 가기가 인증 전 맥락(`/product/1`)으로 곧장 이어지고, 이미 지나온 로그인 화면으로 되돌아가지 않는다. `push`를 쓰면 스택이 `[…, /login, /orders/new]`가 되어 뒤로 가기가 이미 로그인한 사용자를 로그인 폼으로 보낸다 — 그 화면은 다시 복원 경로로 튕겨내거나 로그인 폼을 그대로 보여주거나 둘 중 하나라 어느 쪽도 정상 동작이 아니다.
  - `router.replace`는 "히스토리 스택에 새 엔트리를 추가하지 않고 수행하는 클라이언트 내비게이션"으로 정의돼 있다([Next.js useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router)). 만료 쪽은 훅 밖이라 같은 의미의 `Location.replace`를 쓴다 — `href` 대입은 `assign`과 같아 엔트리를 남긴다([MDN Location.replace](https://developer.mozilla.org/en-US/docs/Web/API/Location/replace)).
  - 복원은 만료와 달리 전체 이동이 필요 없다. 클라이언트 전환은 "공유 레이아웃과 UI를 유지"하므로([Next.js Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)) `RootLayout`은 재실행되지 않지만, `Header`가 `useQuery(authQueries.me())`를 구독하는 클라이언트 컴포넌트라 `['auth']` 무효화만으로 새 쿠키 기준으로 다시 조회된다. 세션을 서버 상태로 둔 7번 결정의 이득이 여기서 나온다.
  - 목적지는 5번 결정대로 경로만 남겨 넘긴다. 절대 URL을 그대로 넘기면 대체 이동이 하드 내비게이션으로 갈릴 수 있다.
  - 커머스 관행과도 같다. Shopify는 로그인 후 "sign-in이 시작된 페이지로 되돌아가기"를 기본 동작으로 두고, 구형 계정 시스템이 주문 내역 페이지에 떨어뜨리던 것을 개선 대상으로 공지했다([changelog](https://changelog.shopify.com/posts/direct-customers-back-to-the-online-store-after-login)).
