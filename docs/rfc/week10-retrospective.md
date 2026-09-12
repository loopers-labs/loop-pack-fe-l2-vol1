# 10주 기술 회고

<!-- 완료조건(week-10-quests.md 281번 줄): 기능 목록이 아니라 본인이 내린 기술 결정과 그 근거. 숫자·URL·로그·CI 결과처럼 확인 가능한 근거가 있어야 한다 -->

## 1. 프로젝트 요약

- Next.js 16 App Router 커머스 화면. 백엔드는 `app/api`의 mock
- 페이지 9개 + API 라우트 6개 → **빌드 출력 16개 라우트가 전부 `ƒ (Dynamic)`, 요청 시 서버 렌더링**
  - 서버가 매 요청 자기 API를 부르므로 환경 변수 하나가 틀리면 모든 화면이 빈다. 10주차 결정 대부분의 출발점
- 검증 자산: 단위·통합 26파일 185개, E2E 4 spec 10개, smoke 3개

## 2. 10주 동안의 구조 변화

| 주차 | 무엇을 바꿨나 |
| --- | --- |
| 2~4 | 코드 냄새를 심각도로 줄 세워 500줄 상품 목록 컴포넌트 분해. 재사용 컴포넌트의 소유·위임 경계를 headless·compound로 정리 |
| 5 | 상태의 **위치** 결정 — 검색·페이지는 URL, 서버 데이터는 TanStack Query, 장바구니는 클라이언트 |
| 6 | FSD 계층 전환 (`src/{_app,_pages,widgets,features,entities,shared}`) |
| 7 | 측정 조건을 고정한 뒤 LCP·CLS 병목 제거 |
| 8~9 | 테스트를 망가뜨려 검증하고, 이벤트 로그로 E2E 대상 선정 |
| 10 | 품질 게이트·환경 변수 검증·배포·smoke·Docker |

- 방향은 하나 — **판단 근거를 주관에서 실행 가능한 검증으로 옮겼다**
  - 2주차 "심각도"는 내 감 → 9주차 E2E 대상은 7,514세션 로그 → 10주차 required 게이트는 실패하는 PR로 확인

## 3. 주요 기술 결정 2개

### 3-1. 환경 식별 변수를 Vercel 값이 아니라 직접 정의한다

- 결정: `NEXT_PUBLIC_VERCEL_ENV` 대신 `NEXT_PUBLIC_ENV`를 직접 정의
- 근거: 과제 6번이 Docker 실행을 요구하는데 **컨테이너 안에는 `VERCEL_ENV`가 없다**
  - Vercel 값에 결합하면 그 플랫폼을 안 거치는 경로에서 값이 빈다
  - 폴백을 두면 그 폴백은 Vercel 밖에서만 발동해 CI가 못 잡는 구멍이 된다
- 따라온 조치: `RootLayout.tsx`의 `?? 'http://localhost:3000'` 폴백 제거
- 출처: `work/week-10/01`

### 3-2. Preview self-fetch를 bypass secret이 아니라 요청 origin + 쿠키로 뚫는다

- 증상: Preview self-fetch가 Vercel Standard Protection에 막혀 실패. `prefetchQuery`가 삼켜 화면은 멀쩡해 보였다
- 선택지: ① bypass secret을 헤더로 전송 ② 방문자가 연 URL로 방문자 쿠키를 전달
- 결정: **②** — secret이 앱에 안 들어오면 유출 경로가 구조적으로 없다. ①은 커스텀 헤더가 리다이렉트를 따라가 `redirect: 'manual'` 같은 방어가 전부 지켜져야 성립
- 원인 규명·측정·감수 항목: `work/week-10/07`

| Preview `/` 3회 측정 | 수정 전 `319f3a7d` | 수정 후 `31128f40` |
| --- | ---: | ---: |
| HTML 응답 완료 중앙값 | **17,021 ms** | **821 ms** |
| 브라우저 `api/home` 재요청 | 3회 모두 | 0 |
| 서버 `generateHomeMetadata` | 3회 모두 기본 `<title>` | 3회 모두 홈 데이터 반영 |

## 4. 테스트와 품질 게이트

**job 구성**

- `develop` PR의 required는 `quality`(환경 변수 검증·lint·typecheck·test·build)와 `e2e` 두 체크
- `e2e`에 `needs`를 걸지 않고 `.next`를 자체 build — 순차 59 + 76 = 135초, 병렬 max(59, 76) = **76초** (run [34504338510](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34504338510))
  - build 중복 10초가 `quality` 59초 대기보다 싸다
  - 더 쪼개도 벽시계는 안 줄어든다 — Playwright 설치 23초가 고정비라 `e2e`가 항상 가장 느리다

**required 판단 축** — 실행 비용·실패 변동성·실패 비용·**대체 가능성** 넷. 마지막 축이 결정을 여러 번 갈랐다.

| 게이트 | required | 결정적이었던 축 |
| --- | :---: | --- |
| 환경 변수 검증 | ○ | 대체 불가 — 값 누락은 빌드를 통과하고 배포된 화면에서 드러난다. `prebuild`에 붙여 CI와 Vercel 빌드 양쪽에서 실행 |
| lint · typecheck · unit·integration | ○ | 비용 낮음 + 변동성 없음 |
| production build | ○ | 대체 불가 — `'use client'` 없이 `useState`를 쓰는 서버 컴포넌트로 확인. typecheck exit 0, lint exit 0, **build exit 1** |
| E2E (spec 4개 전부) | ○ | 대체 불가 — integration은 MSW 경계 안이라 실제 쿠키·미들웨어·세션 만료는 E2E만 본다. `retries: 0`으로 flaky 미관측 |
| Lighthouse | ✕ | 변동성 높음 — CI 부하로 흔들려 무관한 PR을 막는 빈도가 잡는 회귀보다 많다. 배포 후 운영 확인으로 이동 |

**차단 실증** — 타입 오류로 PR `BLOCKED` → 수정 후 `CLEAN`(PR #6), `APP_ORIGIN=not-a-url`로 `next build` 미실행(PR #10). job·step·로그 원문은 PR 본문과 [`05-gate-blocking-verification.md`](../work/week-10/05-gate-blocking-verification.md).

## 5. 성능 개선 결과

| 무엇을 | 전 | 후 |
| --- | ---: | ---: |
| 홈 LCP (7주차, 조건 고정 후 5회 중앙값) | 8,225 ms | **538 ms** |
| Hero 이미지 전송 크기 | 7.2 MB | **79 KB** |
| 상품 목록 문서 응답 (SSR `await` 제거) | 1.508 s | **0.007 s** |
| Preview HTML 응답 완료 (10주차) | 17,021 ms | **821 ms** |

- 7주차에서 제일 오래 걸린 건 최적화가 아니라 "이 숫자를 믿어도 되는가"였다
  - 조건을 고정하고 5회 raw 값의 범위를 먼저 재서 LCP 40 ms, FCP 37 ms를 기준선으로 잡았다 — 그보다 작은 변화는 개선으로 주장하지 않기로
  - 덕분에 `fetchpriority` 적용 여부도 감이 아니라 구간 비중(요청 시작 대기 = LCP의 2.0%)으로 접었다
- 10주차의 17초는 성능 작업의 결과가 아니라 **버그 수정의 부산물** — 실패하는 self-fetch를 TanStack Query가 재시도하며 기다린 시간

## 6. 배포와 운영

**릴리즈 흐름** — 단계·검증 명령·로그 위치는 [`week10-release-flow.md`](./week10-release-flow.md). 결정만 적으면, main에는 required를 두지 않았다 — develop PR에서 전부 통과한 **같은 커밋**이라 새 정보가 없다. main은 게이트가 아니라 배포 트리거다.

**smoke test** — 배포 URL에서 3경로(`/`, `/products`, `/orders/new`)

- 판정 수준을 "HTTP 200"이 아니라 **"목록에 항목이 1개 이상 있다"**로 잡았다. `getAppOrigin()`이 틀려도 페이지는 200을 반환할 수 있어서다
- CI가 원리적으로 못 보는 층이다 — CI의 `APP_ORIGIN`은 localhost이고 MSW 경계 안

**rollback** — 절차·실측은 release-flow 4절과 PR 본문. 배운 것: **rollback 때는 `repository_dispatch`가 오지 않는다**(복구는 온다) → smoke 수동 실행용 `workflow_dispatch`를 남겼다.

**Docker** — 컨테이너 안에서 production build까지 확인. 비교·실측은 [`week10-deployment-options.md`](./week10-deployment-options.md). 결론은 "더 좋다"가 아니라 **조건**이다 — 지금은 Vercel, 배포 대상이 Vercel이 아니거나 Node 패치 버전·실행 사용자까지 고정해야 하면 Docker.

## 7. AI 활용 회고

**도움이 된 것 — 내가 세운 전제를 실측으로 깨준 것**

- 검증 스크립트를 `.mjs`로 정해 두고 "`tsx`가 없으니 TypeScript는 못 돌린다"를 근거로 삼았는데, 직접 돌려 보니 Node 24.17.0이 플래그 없이 `.ts`를 실행했다 → `.ts`로 변경(`tsc --noEmit`과 ESLint 대상에 들어옴)
- `apiFetch`를 import하는 `'use client'` 파일을 grep으로 10개로 셌다가, 정적 import를 따라가니 13개였다

**맡길 수 없던 것 — 감수 항목이 있는 결정**

- 무엇을 required로 둘지, Preview 보호를 해제할지, Docker와 Vercel 중 무엇을 쓸지
- 그래서 작업 문서마다 "채택하지 않은 것"과 "감수하는 것"을 따로 적었다. 결론만 적힌 문서는 재검토할 때 아무것도 안 알려준다

## 8. 다시 만든다면

- **환경 변수를 1주차에 정리했을 것이다** — 10주차에 `APP_ORIGIN` 하나를 정리하는 데 문서 두 편이 들었고, 폴백 하나가 7주차부터 로컬에서만 발동하며 숨어 있었다
- **`.env`를 git에 올리지 않았을 것이다** — 커밋된 `.env`의 `APP_ORIGIN=http://localhost:3000`이 preview 빌드에도 들어와, `getAppOrigin()`에서 Vercel 파생을 `APP_ORIGIN`보다 먼저 보게 만드는 우선순위가 필요했다. 추적은 `58ab4974`에서 뺐지만 우선순위는 코드에 남아 있고 원래 이유는 사라졌다 — 재검토 대상
- **판단과 근거를 같이 적었을 것이다** — 7주차에 AVIF가 실측에서 더 좋았는데(297 KB/1,227 ms vs WebP 400 KB/1,422 ms) WebP를 골랐고 이유를 안 남겼다. 지금은 근거를 다시 세우거나 바꿔야 하는 열린 항목

남은 미완(Sentry·`NEXT_PUBLIC_ENV` 미도입, Preview 분기의 클라이언트 SSR 경로 실측 없음, smoke 호스트 판정 한계)은 PR 본문 「아직 해결하지 못한 것」과 `work/week-10/07` 10절에 정리돼 있다.

## References

- 결정 문서: `docs/work/week-10/01`~`08`, `docs/rfc/week10-release-flow.md`, `docs/rfc/week10-deployment-options.md`
- CI 실측: run 34504338510(병렬), 34508783824·34509302109(차단→통과), 34580841387(환경 변수 검증 실패)
- 배포 실측: run 34619931613(rollback 후 smoke), 34660668651(Production smoke)
- 로컬 실측(Node 24.17.0): `pnpm build` 라우트 16개 전부 `ƒ (Dynamic)`, 단위·통합 26파일 185개, `playwright test --list` 10 tests / 4 files
