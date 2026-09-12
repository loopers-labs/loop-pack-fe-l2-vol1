# Preview 서버 self-fetch 실패 — 근본 원인, 선택지, 결정

- 대상: `docs/assignments/week-10-quests.md` 5번(158~189번 줄) — 187번 줄 "Preview URL과 Production URL 모두에서 실행"
- 선행 결정: [01-env-variable-decisions.md](./01-env-variable-decisions.md) 4~6절(`APP_ORIGIN`·`VERCEL_URL`·`getAppOrigin()`), [06-smoke-test-plan.md](./06-smoke-test-plan.md) 9절 첫 항목(210번 줄, Preview 배포 URL 접근 방법)
- 이 문서가 다루는 범위: **Preview 배포에서 서버의 자기 API 호출(self-fetch)이 실패한 근본 원인, 검토한 선택지, 결정, 구현·검증 결과까지.** Preview smoke의 자동 실행 트리거는 다루지 않는다.
- 상태: **결정 확정, 구현·검증 완료** (2026-09-11). 구현 커밋 `31128f40`, Preview 대상 smoke run 34609425053 통과, 수정 전후 배포 실측으로 서버 prefetch 성공 확인(8절). **Preview smoke 자동 실행 트리거는 구현하지 않았다**(10절).

## 목차

1. [증상](#1-증상)
2. [근본 원인](#2-근본-원인)
3. [원인을 확정한 근거](#3-원인을-확정한-근거)
4. [선택지](#4-선택지)
5. [세 축 비교](#5-세-축-비교)
6. [결정](#6-결정)
7. [구현](#7-구현)
8. [검증 결과](#8-검증-결과)
9. [기존 결정에 미치는 영향](#9-기존-결정에-미치는-영향)
10. [아직 확인하지 않은 것](#10-아직-확인하지-않은-것)
11. [검토 중 철회·정정한 판단](#11-검토-중-철회정정한-판단)
12. [References](#12-references)

## 1. 증상

- 사용자 관찰(2026-09-11): Preview 첫 진입이 오래 걸렸다. 같은 시점에 "목록이 잘 뜬다"고 본 화면은 이후 사용자가 Production이었던 것 같다고 정정했다(11절).
- Preview `/`에서 브라우저 DevTools Network에 `https://loop-pack-fe-l2-vol1-git-feat-week-10-hyeodoong2s-projects.vercel.app/api/home` 요청이 보였다(사용자 관찰).
- 화면은 깨지지 않았다. 서버 prefetch가 실패해도 `prefetchQuery`는 에러를 던지지 않고, 브라우저가 같은 쿼리를 다시 받아 오기 때문이다.

## 2. 근본 원인

**Preview 배포는 Vercel Standard Protection 뒤에 있는데, 서버 self-fetch가 인증 증거(쿠키·bypass 헤더) 없이 `VERCEL_URL`로 나갔다.**

### 요청 경로

```
[브라우저] ──(Vercel 인증 쿠키 자동 첨부)──▶ Vercel 경계(보호 검사) ──▶ 함수: 통과
[함수 안의 서버 fetch] ──(쿠키 없음)──▶ Vercel 경계(보호 검사) ──▶ 302 sso-api
      └ 자기 배포 URL로 보내도 공용 경계를 다시 통과한다
```

- 보호 검사는 자기 배포로 가는 요청도 예외로 두지 않는다. Vercel 문서: "Deployment Protection requires authentication for all requests, including those to Routing Middleware." 같은 문서의 Standard Protection 이전 안내가 서버 요청에도 쿠키를 직접 붙이라고 요구한다(4-3). 같은 origin이라는 개념은 브라우저 보안 규칙(same-origin policy)의 것이고, 이 검사를 면제해 주지 않는다.
- 방문자의 인증은 방문자 브라우저의 쿠키에만 있다. 서버가 렌더링 중 새로 보내는 요청은 별개의 HTTP 요청이라 방문자 인증이 자동으로 넘어가지 않는다. Node `fetch`에는 쿠키 저장소가 없다.
- Vercel 문서의 `VERCEL_URL` 항목: "This variable cannot be used in conjunction with Standard Deployment Protection."

### 코드 흐름 (변경 전, `319f3a7d` 기준)

1. `src/shared/config/appOrigin.ts:2-3` — `VERCEL_ENV === 'preview' && VERCEL_URL`이면 `https://${VERCEL_URL}` 반환
2. `src/shared/api/apiFetch.ts:21-22`(`319f3a7d`) — 서버에서는 `${getAppOrigin()}${input}`로 `fetch(url, init)`. 쿠키·헤더를 추가하지 않음
3. 명시적인 서버 prefetch·fetchQuery 4곳이 이 경로를 탄다. 이 밖에 `'use client'` 컴포넌트도 서버에서 SSR되므로, 그 과정의 `useSuspenseQuery`도 `apiFetch` 서버 분기를 탄다(`HomeSection.tsx:41`, `OrderFormSection.tsx:20`, `CartSection.tsx:14`, `SavedProductGrid.tsx:16` — 교차 검토에서 확인한 목록)
   - `src/_app/RootLayout.tsx:42` — `authQueries.me((await cookies()).toString())` prefetch (방문자 쿠키를 넘기지만 목적지는 `VERCEL_URL`)
   - `src/_pages/home/ui/HomePage.tsx:15` — `homeQueries.detail()` prefetch (쿠키 없음)
   - `src/_pages/home/api/generateHomeMetadata.ts:19` — `homeQueries.detail()` fetchQuery (쿠키 없음)
   - `src/_pages/product-list/api/generateProductListMetadata.ts:24` — `productQueries.list(filters)` fetchQuery (쿠키 없음)
4. 보호가 302로 `vercel.com/sso-api`에 보내고, fetch가 리다이렉트를 따라가 **`vercel.com/login` HTML을 200으로** 받는다(3절 측정)
5. `apiFetch`는 `res.ok`가 참이라 에러 분기를 건너뛰고 `res.json()`에서 `SyntaxError`
6. `src/_pages/home/api/homeQueries.ts:14` retry는 `ApiError`이면서 4xx일 때만 멈추므로 `SyntaxError`는 최대 3회 재시도. `productQueries.ts:22`는 최대 1회
7. `prefetchQuery`는 실패를 삼킨다. 실패한 쿼리는 dehydrate 대상이 아니므로(`defaultShouldDehydrateQuery`는 성공한 쿼리만 포함), SSR 중 `HomeSection`의 `useSuspenseQuery`가 서버에서 다시 시도하고, 그것도 실패하면 브라우저가 다시 요청한다(1절의 `api/home` 요청). 이 단계는 코드와 TanStack Query 동작에서 추론한 것이며 단계별로 측정하지는 않았다

## 3. 원인을 확정한 근거

| 근거 | 방법 | 결과 |
| --- | --- | --- |
| 쿠키 없는 요청이 보호에 막힌다 | `curl`로 Preview `/api/home` 요청(쿠키 없음 = 서버 self-fetch와 같은 조건) | `302` → `https://vercel.com/sso-api?url=…&nonce=…` |
| 리다이렉트 끝에서 무엇을 받는가 | `curl -L`로 끝까지 추적 | 리다이렉트 2회, 최종 `https://vercel.com/login?next=…`, **`200 text/html`**, 1.04s(로컬 맥 기준) |
| 보호가 없으면 서버 prefetch가 성공한다 | Playwright로 Production `/`를 2회 새로 열어 브라우저 `api/home` 요청 수 측정 | **0건 / 0건** |
| Preview에서는 서버 prefetch가 실패한다 | 사용자가 Preview `/` DevTools Network 확인 | 브라우저 `api/home` 요청 **있음** |
| 같은 코드·같은 캐시 설정 | `src/shared/api/getQueryClient.ts:6` `staleTime` 20초. 당시 Production 배포 `7b1a1e9d`와 `319f3a7d` 사이 `src`·`app/api`·`proxy.ts` 차이 없음(교차 검토 확인) | 두 환경 차이는 보호 여부 |
| `VERCEL_URL`이 실제로 존재한다(다른 원인 배제) | 사용자가 대시보드 "Enable access to System Environment Variables" 확인 | **켜져 있음** |

### 배제한 원인

| 후보 | 배제 근거 |
| --- | --- |
| 시스템 환경 변수가 꺼져 `getAppOrigin()`이 `APP_ORIGIN=http://localhost:3000`으로 떨어져 함수 안에서 localhost 연결 실패 | 증상(브라우저 재요청)만으로는 구분 불가했으나, 체크박스가 켜져 있음을 확인해 배제 |
| Production 기준 TTFB 자체가 느림 | Production도 `curl` TTFB 1.75s(첫 요청) → 0.84s → 0.84s. 원인은 mock API 기본 지연(`app/api/_data/commerce.ts:362`, 500ms)과 서버의 prefetch 대기로, Preview 실패와 별개 |
| "첫 진입만 느리고 새로고침은 괜찮다" | Vercel 인증 첫 통과 리다이렉트와 서버리스 cold start로 설명 가능하다. 반면 self-fetch 실패는 매 요청 재현되는 구조라 이 증상과 맞지 않는다. 이후 실측에서 수정 전 Preview는 **3회 모두** HTML 응답 완료가 약 17초였으므로(8절), "새로고침은 괜찮다"는 관찰은 Preview가 아니었던 것으로 본다. 이 증상은 원인 판정 근거로 쓰지 않았다 |

## 4. 선택지

### 4-1. Preview 보호 해제

- 내용: Vercel Authentication을 끄거나 Preview를 보호 범위에서 제외
- 결과: self-fetch와 CI smoke 모두 추가 설정 없이 통과
- 검토 사실: 저장소가 public이고 `vercel[bot]`이 PR에 Preview URL을 댓글로 남기므로 URL은 사실상 공개된다. 백엔드는 `app/api/_data`의 mock이라 실제 DB·결제가 없고, 세션 서명 기본값은 이미 `app/api/_data/auth.ts:58`에 공개돼 있다. Preview에는 Vercel이 `X-Robots-Tag: noindex`를 자동으로 붙이지만 접근을 막지는 않는다.
- 사용자 결정: **채택하지 않음.** CI 접근은 Protection Bypass for Automation으로 한다.

### 4-2. 서버 요청에 bypass 헤더

- 내용: `apiFetch` 서버 분기에서 Preview일 때 `x-vercel-protection-bypass: ${VERCEL_AUTOMATION_BYPASS_SECRET}` 부착
- 근거: Vercel이 bypass secret을 모든 배포에 시스템 환경 변수로 넣는다 — "Available at: Both build and runtime". secret은 "When you build a deployment" 시점에 들어가므로 secret 생성 이후 빌드된 배포에만 존재한다.
- 필요한 방어: 목적지 조건(Preview + `VERCEL_URL`), `redirect: 'manual'`(3절·5절 측정), 로그·에러·query key에 넣지 않기, CI용과 배포 환경용 secret 분리

### 4-3. 요청 origin + 쿠키 전달

- 내용: Preview 분기에서만, 방문자가 연 URL(요청 Host)로 방문자 쿠키를 실어 self-fetch
- 근거: Vercel Standard Protection 문서의 이전 안내 — 서버 요청은 "use the origin from the incoming request and manually add request cookies to pass the user's authentication cookie". Vercel 인증 쿠키는 "restricted to one URL and isn't transferable, even between URLs pointing to the same deployment"이므로 목적지는 반드시 방문자가 연 그 URL이어야 한다.
- CI smoke는 `x-vercel-set-bypass-cookie: true`로 bypass를 URL 전용 쿠키로 바꿔 받아야 한다(Vercel 공식 Playwright 예시와 같은 구성).

### 4-4. 서버 HTTP self-fetch 제거

- 내용: 서버에서 데이터 함수를 직접 호출
- 결과: 네트워크 왕복과 보호 문제 자체가 사라짐
- 채택하지 않은 이유: 7주차 `6f016256`에서 metadata 실패 재현을 위해 의도적으로 direct-call 우회를 없앤 결정을 되돌린다.

## 5. 세 축 비교

4-2와 4-3을 비교했다. 두 방식 모두 Preview 분기 안에서만 동작해 로컬·CI·Docker·Production 동작은 바뀌지 않는다는 전제다.

### 안정성 (비밀키 유출 + 운영 중 깨짐)

| | bypass 헤더 | 요청 origin + 쿠키 |
| --- | --- | --- |
| 앱 코드가 secret을 다루나 | 다룸 | 다루지 않음 |
| 다른 origin 리다이렉트 | 커스텀 헤더가 **그대로 전달됨** → `redirect: 'manual'` 필수 | 쿠키는 fetch가 제거 |
| 유출 시 영향 범위 | 프로젝트의 모든 배포, Bot protection·일부 Firewall 차단까지 | URL 하나 |
| 운영 중 깨지는 경우 | secret 교체 후 재배포 누락 | 방문자에게 해당 URL 쿠키가 없음, smoke 쿠키 옵션 누락 |

`NEXT_PUBLIC_` 접두사가 없어서 막히는 것은 브라우저 번들 경로뿐이다. 서버가 읽어 나가는 요청 헤더로 보내는 경로, 리다이렉트 전달, 로그·모니터링 기록, 배포에 포함된 다른 코드가 환경 변수를 읽는 경로는 접두사와 무관하다. 마지막 경로는 Vercel이 모든 배포에 secret을 넣으므로 두 방식 공통이다.

#### 측정: 리다이렉트를 따라갈 때 전달되는 헤더 (Node 24.17.0, 내장 undici 7.28.0)

로컬 서버 A가 302를 보내고, 도착 서버가 받은 헤더를 기록했다.

| 리다이렉트 | `x-vercel-protection-bypass` | `cookie` | `authorization` |
| --- | --- | --- | --- |
| 다른 origin으로 | **전달됨** | 제거됨 | 제거됨 |
| 같은 origin으로 | 전달됨 | 전달됨 | 전달됨 |
| `redirect: 'manual'` | 따라가지 않고 `302`를 그대로 반환 | | |

### 변경 비용

| | bypass 헤더 | 요청 origin + 쿠키 |
| --- | --- | --- |
| 앱 코드 | `apiFetch.ts` 한 곳 | `apiFetch.ts` 한 곳 |
| smoke 설정 | 헤더 1개 | 헤더 + `x-vercel-set-bypass-cookie` |
| Vercel 설정 | CI용·배포용 secret 분리(권장) | 없음 |
| 결정 문서 | 변경 없음 | `01` 5절 90번 줄 보조 문단 |

#### 측정: `next/headers`를 `apiFetch`에서 쓸 수 있는가

`apiFetch`는 `'use client'` 파일 13개가 직접 또는 query·API 모듈을 거쳐 import하는 공용 모듈이다(교차 검토의 정적 import 추적 결과. 처음 grep으로 센 10개는 과소 집계).

| 실험 | 결과 |
| --- | --- |
| 파일 상단 정적 import `import { headers } from 'next/headers'` | **빌드 실패** — "You're importing a module that depends on "next/headers". This API is only available in Server Components…", 추적 경로에 `apiFetch.ts` → `getProductCatalog.ts` → … → `WishlistPage.tsx` [Client Component Browser] |
| 서버 분기 안 동적 import `await import('next/headers')` | **빌드 성공**(exit 0, 페이지 17개 생성) |

두 실험 모두 끝난 뒤 `git diff`로 파일 원복을 확인했다.

### 정확성 (Production과 같은 경로를 타는가)

| | bypass 헤더 | 요청 origin + 쿠키 |
| --- | --- | --- |
| self-fetch 목적지 | `VERCEL_URL` = 렌더링 중인 바로 그 배포 | 방문자가 연 URL |
| 브랜치 URL로 들어온 경우 | 영향 없음 | 요청과 self-fetch 사이에 새 배포가 올라온 순간에만 다른 배포를 부를 수 있음(추론, 시간 창 짧음) |
| 쿠키 없는 요청 | 통과 | 실패 |
| Vercel 문서와의 관계 | 문서가 선택지로 언급 — "Bypassing protection using Protection Bypass for Automation is an option but not required for requests targeting the same domain." 다만 목적지는 문서가 병용 불가라고 한 `VERCEL_URL` 그대로 | 문서의 Standard Protection 이전 안내(요청 origin + 쿠키)를 따름 |

### 요약

| 축 | 앞선 쪽 |
| --- | --- |
| 안정성 | 요청 origin + 쿠키 — secret이 앱에 들어오지 않아 유출 경로가 구조적으로 없다. bypass는 방어가 모두 지켜져야 하고, 그중 리다이렉트 경로는 측정 전까지 검토에서 빠져 있었다 |
| 변경 비용 | 비슷함 — 둘 다 `apiFetch.ts` 한 곳 |
| 정확성 | bypass 헤더(근소) — 항상 렌더링 중인 배포를 부르고 쿠키 유무와 무관 |

## 6. 결정

| 항목 | 결정 | 결정 주체 |
| --- | --- | --- |
| Preview 보호 | 유지. CI 접근은 Protection Bypass for Automation | 사용자 |
| 서버 self-fetch 방식 | **요청 origin + 쿠키 전달** (Preview 분기에서만) | 사용자 — 세 축 비교 후 "비밀키가 유출되지 않는 구현"을 기준으로 선택 |
| 서버 self-fetch의 리다이렉트 | `redirect: 'manual'`. 3xx를 `ApiError`로 받아 곧바로 실패(재시도 조건상 5xx 미만은 즉시 실패) | Claude가 결론안 1번 항목에 포함해 제시, 사용자가 진행 승인 |
| CI smoke 헤더 | 계정 scope Preview 호스트(`-hyeodoong2s-projects.vercel.app`)일 때만 `x-vercel-protection-bypass` + `x-vercel-set-bypass-cookie: true` | 결정된 방식을 구현하며 적용 |
| secret 없을 때 smoke 동작 | 헤더 없이 진행(Production 도메인은 보호 대상이 아님) | 사용자에게 두 차례 선택을 요청했으나 답이 없어 Claude가 기본값으로 적용 — **사용자 확정 필요** |
| smoke.yml | `client_payload`를 `env`로 받아 스크립트 주입 차단, secret은 "Run smoke tests" step에만 전달, `workflow_dispatch` 입력 `deployment_url`, concurrency를 대상별로 분리 | 사전 점검에서 확인한 노출 지점에 대한 조치 |

감수하는 것:

- self-fetch 목적지가 `VERCEL_URL`이 아니라 방문자가 연 URL이 된다.
- 방문자에게 해당 URL의 Vercel 인증 쿠키가 없으면 서버 prefetch가 실패한다.
- Vercel Preview 분기 안에서는 요청 Host 헤더를 믿는다. Vercel 라우팅이 그 도메인을 이 배포로 보냈다는 추론에 기댄다(10절).

## 7. 구현

커밋 `31128f40` (2026-09-11 23:18 KST), 파일 4개.

| 파일 | 변경 |
| --- | --- |
| `src/shared/api/apiFetch.ts` | 서버에서 `resolveServerRequest()`를 거친다(21번 줄). Preview가 아니거나(38번 줄) Host가 없으면(46번 줄) 기존대로 `getAppOrigin()`(39·47번 줄). Preview면 `next/headers`를 동적 import(43번 줄), 호출부가 cookie를 넘기지 않았을 때만 요청 쿠키를 복사(53번 줄), `redirect: 'manual'`(60번 줄), 목적지는 `x-forwarded-proto`와 Host로 구성(63번 줄) |
| `src/shared/api/apiFetch.unit.test.ts` | Preview 분기 테스트 2개 — 요청 Host로 방문자 쿠키를 싣는다(55번 줄), 보호 리다이렉트를 따라가지 않고 `ApiError`로 실패한다(68번 줄) |
| `playwright.smoke.config.ts` | 대상 호스트가 `-hyeodoong2s-projects.vercel.app`로 끝날 때만 헤더 부착(16·27번 줄). trace가 요청 헤더를 기록한다는 주의 주석(26번 줄) |
| `.github/workflows/smoke.yml` | `deployment_url` 입력(9번 줄), concurrency `smoke-${{ inputs.deployment_url \|\| 'production' }}`(19번 줄), `client_payload`를 env로 전달(51~53번 줄), secret은 smoke step에만(69번 줄) |

## 8. 검증 결과

| 검증 | 결과 |
| --- | --- |
| 단위 테스트 | `apiFetch.unit.test.ts` 5개 통과. 프로젝트 본체 26파일 185개 통과. 로컬 `pnpm test` 출력은 52파일 368개였으나 `.claude/worktrees/ci-before` 복사본 26파일 183개가 함께 실행된 수치다(`vitest list`로 경로 분리 확인) |
| 테스트가 로직을 잡는가 | 쿠키 복사 줄 제거 → "calls the requested host with the visitor cookie" 실패 / `redirect: 'manual'`을 `'follow'`로 변경 → "fails with ApiError instead of following a protection redirect" 실패. 확인 후 원복 |
| lint·typecheck | 통과 |
| Preview 환경 변수로 로컬 빌드(`VERCEL_ENV=preview VERCEL_URL=example-preview.vercel.app`) | 통과(exit 0, 페이지 17개). 빌드 중 `headers()` 호출 문제 없음 |
| smoke 호스트 판정 | Preview 브랜치 URL `true`, Production 도메인 `false`, `evil-hyeodoong2s-projects.vercel.app.attacker.com` `false` |
| Preview 배포 | deployment 6395002549 성공 |
| Preview 대상 smoke | [run 34609425053](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34609425053)(2026-09-11 14:19~14:20 UTC), `feat/week-10` 기준 수동 실행, 대상 `https://loop-pack-fe-l2-vol1-git-feat-week-10-hyeodoong2s-projects.vercel.app` — `home` 2.4s, `orders-new` 2.2s, `products` 1.9s, **3 passed** |

smoke 통과는 **CI가 보호된 Preview에 들어간다**는 증거다. 서버 prefetch 성공의 증거는 아니다. `home` 스펙은 추천 상품 데이터 존재만 확인하므로, 서버 prefetch가 실패해도 브라우저 재요청으로 통과할 수 있다. 서버 prefetch 성공은 아래 수정 전후 실측으로 확인했다.

Preview smoke는 **수동 실행**(`gh workflow run smoke.yml --ref feat/week-10 -f deployment_url=…`)으로 돌렸다. `smoke.yml`의 자동 트리거는 Production 승격(`repository_dispatch` `vercel.deployment.promoted`)뿐이다.

### 수정 전후 배포 실측

- 측정: 2026-09-11, Claude가 Chrome 연동 도구로 사용자 Chrome(Vercel 로그인 상태 → 배포 URL 인증 쿠키 보유)에서 각 URL `/`를 열고 페이지 안에서 Performance API로 수집. 로드 완료 후 3초 대기
- 대상: 배포별 고유 URL. 브랜치 URL은 최신 배포만 가리켜 수정 전 배포를 열 수 없다

| 지표 | 수집 방법 | 무엇을 뜻하나 |
| --- | --- | --- |
| TTFB | `PerformanceNavigationTiming.responseStart`(내비게이션 시작 기준) | **참고값, 판정에 쓰지 않음.** 함수가 iad1에서 돌고 RootLayout이 `me` self-fetch를 기다린 뒤 렌더하는데 24~43ms로 나와, 계산 기준이나 중간 응답 여부를 설명하지 못했다 |
| HTML 응답 완료 | `PerformanceNavigationTiming.responseEnd` | 스트리밍 HTML이 끝나기까지. 서버가 홈 섹션 데이터를 기다린 시간 포함 |
| 브라우저 `api/home` 요청 | `performance.getEntriesByType('resource')` 중 경로 `/api/home` | 0이면 서버 prefetch 성공(브라우저가 캐시 사용) |
| `<title>` | `document.title` | `매일 새롭게 발견하는 취향 \| Commerce`이면 서버 `generateHomeMetadata`의 self-fetch 성공, `Commerce`면 실패 후 기본값 |
| 브라우저 `api/auth/me` 요청 | 위와 같은 방식 | 0이면 서버 `me` prefetch 성공 |

| 배포 | 회차 | TTFB | HTML 응답 완료 | 브라우저 `api/home` | `<title>` | 브라우저 `api/auth/me` |
| --- | --- | ---: | ---: | --- | --- | --- |
| 수정 전 `319f3a7d` (`…-k5d6fc2ep-…`) | 1 | 32ms | 16,830ms | 1건(16,837ms 시작, 732ms) | `Commerce` | 0 |
| | 2 | 24ms | 17,021ms | 1건(17,032ms 시작, 767ms) | `Commerce` | 0 |
| | 3 | 28ms | 17,054ms | 1건(17,063ms 시작, 784ms) | `Commerce` | 0 |
| 수정 후 `31128f40` (`…-aidpofdgw-…`) | 1 | 35ms | 886ms | 0 | `매일 새롭게 발견하는 취향 \| Commerce` | 0 |
| | 2 | 29ms | 821ms | 0 | `매일 새롭게 발견하는 취향 \| Commerce` | 0 |
| | 3 | 27ms | 812ms | 0 | `매일 새롭게 발견하는 취향 \| Commerce` | 0 |
| 수정 후, 브랜치 URL (`…-git-feat-week-10-…`) | 1 | 43ms | 838ms | 0 | `매일 새롭게 발견하는 취향 \| Commerce` | 0 |

| 요약 | 수정 전 | 수정 후 |
| --- | --- | --- |
| HTML 응답 완료 중앙값(범위) | **17,021ms**(16,830~17,054) | **821ms**(812~886) |
| 브라우저 `api/home` 재요청 | 3회 모두 발생, HTML 완료 직후 | 0 |
| 서버 metadata | 3회 모두 기본값 | 3회 모두 홈 데이터 반영 |

핵심 결과:

- **서버 self-fetch 실패 → 성공.** 수정 전에는 HTML이 끝난 직후 브라우저가 `api/home`을 다시 받았고 `<title>`이 기본값이었다. 수정 후에는 재요청이 없고 `<title>`에 홈 데이터가 들어갔다.
- **Preview HTML 응답이 약 17.0초에서 약 0.8초로 줄었다.** 두 범위가 겹치지 않는다. 수정 전 17초는 서버가 실패하는 self-fetch를 재시도하며 홈 섹션을 기다린 시간으로 본다(2절 6·7번). TanStack Query 기본 재시도 대기는 1·2·4초라, prefetch와 SSR 중 `useSuspenseQuery`가 차례로 실패하면 대기만 7초×2 = 14초이고 시도 8회의 리다이렉트 왕복이 더해진다(추론, 구성 미분해). 이전에 prefetch 한 번만 넣어 계산한 약 11초보다 길다(11절).
- **브랜치 URL로 들어와도 성공한다.** 브랜치 URL은 `VERCEL_URL`(배포별 고유 URL)과 다른 주소다. 요청 Host로 그 URL 전용 쿠키를 넘기는 결정의 전제가 성립한다. Vercel이 인증 쿠키를 함수까지 넘긴다는 전제도 이 결과로 함께 확인됐다.
- 수정 전 배포에서도 브라우저 `api/auth/me`는 0건이었다. 배포별 고유 URL로 열어 `VERCEL_URL`과 방문 URL이 같았기 때문에, `RootLayout.tsx:42`가 넘긴 쿠키가 유효했던 것으로 본다. 수정 전 코드에서 브랜치 URL로 들어온 경우의 `me` 실패 여부는 측정하지 못했다(브랜치 URL이 이미 수정 후 배포를 가리킴).

측정 환경의 한계:

- 측정 탭이 백그라운드(`document.visibilityState === 'hidden'`)라 `requestAnimationFrame`이 실행되지 않았다. 수정 후 2회차에서 스트리밍으로 도착한 홈 콘텐츠가 DOM의 숨은 조각(`S:1`)에만 있고 화면에는 로딩 폴백이 남았다(38초 경과 시점까지). React의 Suspense 콘텐츠 교체 스크립트가 멈춘 측정 환경 문제로 보고 "화면 표시 여부"는 판정 지표에서 뺐다. 위 표의 지표는 탭 표시 상태와 무관하다.
- 한국 네트워크에서 사용자 브라우저로 잰 값이며, Vercel 함수 리전 기준 서버 시간은 따로 측정하지 않았다.

## 9. 기존 결정에 미치는 영향

| 문서 | 영향 |
| --- | --- |
| `01` 5절 90번 줄 보조 문단("self-fetch 관점에서도 같은 방향이다… 정확히 `VERCEL_URL`이 가리키는 그 배포다") | self-fetch 목적지가 요청 URL로 바뀌어 근거가 달라진다. 5절의 주 근거(87~88번 줄, PR 본문에 기록할 주소의 불변성과 커밋 간 비교)는 유지된다. `metadataBase`(`RootLayout.tsx:25`)는 fetch가 아니라 계속 `getAppOrigin()`을 쓴다 |
| `01` 4절 68·70번 줄, 6절 95번 줄 | "소비처 두 곳이 모두 `getAppOrigin()`을 거친다", "`apiFetch.ts:21`"이 Preview 분기에서는 더 이상 사실이 아니다. Preview의 `apiFetch`는 `getAppOrigin()` 대신 요청 Host를 쓰고, 해당 코드 줄도 옮겨졌다 |
| `06` 8-5절 concurrency 행 | `smoke-production` 고정 그룹이 `31128f40`에서 `smoke-${{ inputs.deployment_url \|\| 'production' }}`로 바뀌었고 `workflow_dispatch` 입력 `deployment_url`이 추가됐다. 반영되지 않았다 |
| `06` 9절 첫 항목(210번 줄) | 이 문서로 결정됐다. 해당 항목이 예상한 "bypass로 페이지 접근이 되어도 서버의 데이터 요청이 막힐 수 있다"는 실제로 발생했다 |
| `06` 9절 둘째 항목(211번 줄) "Preview 자동 실행 연동 — 발제 노트 기준 선택 사항" | 과제 체크리스트 246번 줄은 "Preview/Production URL에서 smoke test(3~5개)가 자동 실행되는가"를 묻는다. 두 기준이 어긋나며, 어느 쪽을 따를지는 정하지 않았다(10절) |

## 10. 아직 확인하지 않은 것

| 항목 | 확인 방법 |
| --- | --- |
| **Preview smoke 자동 실행 트리거** | 미구현. 과제 187번 줄(Preview·Production 모두 실행)과 체크리스트 246번 줄(자동 실행)은 요구하고, `06` 211번 줄은 발제 노트 기준 선택 사항으로 적었다. 어느 기준을 따를지 미결 |
| 클라이언트 컴포넌트 SSR 경로에서 Preview 분기의 `headers()`·`cookies()`가 동작하는가 | `/cart`·`/wishlist`·`/orders/new`는 prefetch 없이 SSR 중 `productCatalogQueries.lookup()`이 `apiFetch`를 부른다. Next.js `headers()` 문서 페이지는 Server Component 사용만 명시한다. smoke의 `orders-new`는 로그인 리다이렉트만 확인해 이 경로를 검증하지 않는다. 실측 없음 |
| smoke 호스트 판정의 정확도 | `endsWith('-hyeodoong2s-projects.vercel.app')`는 다른 계정이 이름을 `…-hyeodoong2s-projects`로 지은 프로젝트의 Production 도메인에도 참이 될 수 있다. 검증은 `…vercel.app.attacker.com` 형태만 했다. `workflow_dispatch` 입력은 저장소 쓰기 권한이 있어야 해 영향은 제한적 |
| Vercel Preview에서 요청 Host를 믿어도 되는가 | 추론(Vercel 라우팅이 해당 도메인을 이 배포로 보낸 요청만 도달). 브랜치 URL·고유 URL 모두 동작은 확인했으나 Host 위조 요청에 대한 실측은 없음 |
| 수정 전 코드에서 브랜치 URL 방문자의 `/api/auth/me` prefetch도 실패했는가 | 쿠키가 URL 하나에만 유효하다는 문서에서 추론. 브랜치 URL이 수정 후 배포를 가리켜 측정 불가 |
| 수정 전 서버 대기 17초의 구성 | 홈 prefetch, SSR 중 `HomeSection` `useSuspenseQuery`의 서버 재시도, `generateHomeMetadata`의 재시도가 각각 얼마를 차지하는지 분해하지 않았다 |
| 수정 전후 실측의 TTFB 24~43ms | 계산 기준을 설명하지 못해 판정에서 제외(8절) |
| Vercel Git Fork Protection이 켜져 있는가 | 대시보드 Settings → Security. bypass secret이 모든 배포 환경에 들어가므로 fork PR 배포 승인 여부가 노출 경로가 된다 |
| secret 없을 때 smoke 동작(헤더 없이 진행) | 사용자 확정 대기 |

## 11. 검토 중 철회·정정한 판단

| 철회·정정한 판단 | 왜 틀렸나 / 무엇이 바뀌었나 |
| --- | --- |
| "Preview 목록이 잘 뜨므로 self-fetch가 막히지 않을 수 있다"(사용자 관찰에 기댄 판단) | 사용자가 그 화면은 Production이었던 것 같다고 정정했다. 목록은 7주차에 서버 prefetch를 철회해 브라우저가 직접 받으므로(`ProductListPage.tsx:4` 주석) 원래 판정 근거가 될 수 없는 화면이었다 |
| "첫 진입이 느린 원인은 self-fetch 실패"(사용자 추정) | 첫 진입만 느리고 새로고침은 괜찮다는 관찰은 인증 리다이렉트·cold start와 맞고, 매 요청 재현되는 self-fetch 실패와는 맞지 않았다. 원인 확정은 브라우저 `api/home` 요청 비교로 따로 했다 |
| Claude: "origin + 쿠키는 서버 진입점 4곳, query 모듈, API 함수를 모두 바꿔야 한다" | 정적 import 빌드 실패 하나만 보고 범위를 넓게 잡았다. 동적 import로 `apiFetch.ts` 한 곳에서 구현되고 빌드가 통과함을 측정해 정정했다 |
| Claude: "안정성 축에서 bypass 헤더가 낫다" | 리다이렉트 측정에서 커스텀 헤더가 다른 origin으로 전달되고 쿠키는 제거됨을 확인했다. Vercel 인증 쿠키가 URL 하나에만 유효하다는 문서도 확인해, 비밀키 유출 기준으로는 origin + 쿠키가 낫다고 정정했다 |
| "self-fetch는 Vercel 환경에서만 발생한다"(사용자 질문) | self-fetch는 `apiFetch.ts` 서버 분기에서 모든 환경(로컬·CI·Docker·Production)에 일어난다. Vercel Preview에만 있는 것은 보호로 인한 실패다 |
| "secret은 `NEXT_PUBLIC_`이 아니므로 앱에 노출되지 않는다"(사용자 질문) | 접두사가 막는 것은 브라우저 번들 경로뿐이다. 서버가 읽어 헤더로 보내는 경로와 리다이렉트 전달은 막지 못한다 |
| Claude: "수정 전 홈 섹션 서버 대기는 약 11초" | prefetch 한 번의 요청 4회·재시도 대기만으로 계산한 값이었다. 실측은 HTML 응답 완료 중앙값 17,021ms로 더 길었고, 교차 검토에서 SSR 중 `useSuspenseQuery`의 서버 재시도가 계산에서 빠졌음을 지적받았다(2절 7번, 8절) |
| Claude: "서버 호출 지점은 4곳", "실패하면 브라우저가 다시 요청한다" | 명시적 prefetch·fetchQuery만 셌다. `'use client'` 컴포넌트의 SSR 중 `useSuspenseQuery`도 서버 분기를 탄다는 점을 교차 검토에서 지적받아 2절을 고쳤다 |
| Claude: Next.js `headers()` 사용 위치를 "Server Components, Server Actions, Route Handlers, Middleware"로 인용 | 이 목록은 Next.js 소스 `packages/next/src/server/request/headers.ts`의 JSDoc(Context7로 조회)에 있는 표현이다. 공식 문서 페이지는 Server Component 사용만 명시한다. 12절 출처 설명을 고쳤다 |
| Claude: 테스트 "52파일 368개 통과" | `.claude/worktrees/ci-before` 복사본이 함께 실행된 수치였다. 프로젝트 본체는 26파일 185개(8절) |
| 사용자 요청: 수정 전·후 측정 URL로 같은 브랜치 URL 두 개 | 브랜치 URL은 최신 배포만 가리켜 둘 다 수정 후 배포였다. 배포별 고유 URL(`…-k5d6fc2ep-…`, `…-aidpofdgw-…`)로 바꿔 측정했다 |
| Claude: 측정 스크립트를 사용자가 secret과 함께 로컬 실행하는 방식 제안 | secret 없이도 Vercel에 로그인된 사용자 Chrome에서 측정할 수 있어 Chrome 연동 도구로 바꿨다. 준비한 스크립트는 쓰지 않았다 |

## 12. References

- `docs/assignments/week-10-quests.md` — 5번(158~189번 줄), 187번 줄
- [Vercel — Deployment Protection](https://vercel.com/docs/deployment-protection) — Standard Protection 범위, "requires authentication for all requests", Standard Protection 이전 안내(서버 요청은 요청 origin과 쿠키 사용)
- [Vercel — Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication) — 로그인 후 쿠키 설정, 토큰은 URL 하나에만 유효
- [Vercel — Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) — 헤더 방식, `x-vercel-set-bypass-cookie`, secret의 시스템 환경 변수 설정, 재생성 시 재배포 필요, Playwright 예시
- [Vercel — System environment variables](https://vercel.com/docs/environment-variables/system-environment-variables) — `VERCEL_URL`의 Standard Protection 병용 불가 주석, `VERCEL_AUTOMATION_BYPASS_SECRET` "Both build and runtime", 시스템 환경 변수 노출 체크박스
- [Vercel — Accessing Deployments through Generated URLs](https://vercel.com/docs/deployments/generated-urls) — 배포별 고유 URL·브랜치 URL·Production URL 구분
- [Vercel — Are Preview Deployments indexed by search engines?](https://vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines) — Preview `X-Robots-Tag: noindex`
- [Next.js — headers()](https://nextjs.org/docs/app/api-reference/functions/headers) — Server Component에서 요청 헤더를 읽는 async 함수. Server Actions·Route Handlers·Middleware까지 적힌 목록은 공식 문서 페이지가 아니라 Next.js 소스 `packages/next/src/server/request/headers.ts` JSDoc의 표현
- [TanStack Query `retryer`](https://github.com/TanStack/query/blob/main/packages/query-core/src/retryer.ts) — 기본 재시도 대기 `min(1000 * 2 ** failureCount, 30000)`(교차 검토에서 설치본 `query-core` 5.101.2로 확인)
- 코드: `src/shared/api/apiFetch.ts`, `src/shared/config/appOrigin.ts`, `src/_app/RootLayout.tsx`, `src/_pages/home/ui/HomePage.tsx`, `src/_pages/home/api/homeQueries.ts`, `src/_pages/home/api/generateHomeMetadata.ts`, `src/_pages/product-list/api/generateProductListMetadata.ts`, `src/_pages/product-list/api/productQueries.ts`, `playwright.smoke.config.ts`, `.github/workflows/smoke.yml`
- 커밋·실행: `319f3a7d`(변경 전 기준, Preview deployment 6390255538 `…-k5d6fc2ep-…`), `31128f40`(구현, Preview deployment 6395002549 `…-aidpofdgw-…`), smoke run 34609425053
