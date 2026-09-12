# 2단계 결정 — 품질 게이트와 CI job 구성

- 대상: `docs/assignments/week-10-quests.md` 2번(86~~116번 줄) GitHub Actions CI 보강, 4번(137~~152번 줄) 품질 게이트 정의
- 선행 결정: [03-branch-release-flow.md](./03-branch-release-flow.md) — 어느 브랜치에 게이트를 걸지가 거기서 정해진다
- 검증 기록: [05-gate-blocking-verification.md](./05-gate-blocking-verification.md) — 여기서 정한 게이트가 실제로 막는지 확인한 결과
- 이 문서가 다루는 범위: **어떤 검증을 어느 브랜치 어느 시점에 두고 무엇을 required로 할지, CI job을 어떻게 나눌지까지.** 각 결정에 채택하지 않은 선택지와 그 이유를 함께 적었다.
- 상태: **결정 확정, 워크플로 반영 완료** (2026-09-10 작성 / 2026-09-11 파라미터 추가·구현). `14f1ac9c`(job 분리)와 `58ab4974`(`.env` 추적 제거)로 반영했고 PR #5에서 두 job 모두 통과했다. branch protection의 required 지정은 아직 남아 있다. 폰트 조치는 Docker 단계까지 보류.

## 목차

1. [판단 축 4개](#1-판단-축-4개)
2. [게이트 배치표](#2-게이트-배치표)
3. [실측값](#3-실측값)
4. [게이트별 결정](#4-게이트별-결정)
5. [main에는 required를 두지 않는다](#5-main에는-required를-두지-않는다)
6. [job 구성과 워크플로 파라미터](#6-job-구성과-워크플로-파라미터)
7. [Google Fonts 빌드 의존성](#7-google-fonts-빌드-의존성)
8. [아직 정하지 않은 것](#8-아직-정하지-않은-것)
9. [References](#9-references)

## 1. 판단 축 4개

멘토 노트 142번 줄이 세 축을 제시한다 — 실행 비용, 실패 변동성, 실패 비용. 과제 151번 줄이 같은 셋을 "실행 비용·변동성·현재 리스크"로 부른다.

네 번째 축은 노트 132~140번 줄 표의 "이유" 열에 들어 있으나 이름이 붙어 있지 않다. 이 문서에서는 **대체 가능성**으로 부른다.

| 축          | 묻는 것                                         |
| ----------- | ----------------------------------------------- |
| 실행 비용   | 매 PR마다 돌리면 시간과 개발 흐름을 얼마나 쓰나 |
| 실패 변동성 | 코드가 멀쩡한데도 빨간불이 뜨나                 |
| 실패 비용   | 이것이 main에 새면 얼마나 아픈가                |
| 대체 가능성 | 이 검증이 아니면 못 잡는 실패가 있는가          |

축 조합에서 나오는 배치:

- 비용 낮음 + 변동성 낮음 → 모든 PR required
- 비용 높음 + 실패 비용 높음 → merge 직전 또는 조건부 (과제 148번 줄)
- 변동성 높음 → 게이트가 아니라 관찰. 차단하지 않음 (과제 149번 줄)
- 대체 가능성 없음 → 비용이 높아도 앞으로 당김 (과제 147번 줄)

## 2. 게이트 배치표

실행 시점과 차단 여부는 별개 축이다. 워크플로 트리거가 실행 시점을, branch protection이 차단 여부를 정한다.

| 게이트                | develop PR | develop push | main push |      required      |
| --------------------- | :--------: | :----------: | :-------: | :----------------: |
| 환경 변수 검증        |     ●      |              |           |         예         |
| lint                  |     ●      |              |           |         예         |
| typecheck             |     ●      |              |           |         예         |
| unit test             |     ●      |              |           |         예         |
| integration test      |     ●      |              |           |         예         |
| production build      |     ●      |              |           |         예         |
| E2E (spec 4개 전부)   |     ●      |              |           |         예         |
| Preview smoke test    |            |      ●       |           |       아니오       |
| Production smoke test |            |              |     ●     |    아니오 (5번)    |
| Lighthouse            |            |              |           | CI 게이트 아님 (4-9) |

main에 required가 하나도 없는 이유는 5번에 있다.

## 3. 실측값

로컬 (macOS, `.next` 삭제 후 클린 빌드, 2026-09-10):

| 검증                          | 명령             | 시간                             |
| ----------------------------- | ---------------- | -------------------------------- |
| typecheck                     | `pnpm typecheck` | 2.77초                           |
| unit·integration test (178개) | `pnpm test`      | 3.80초                           |
| lint                          | `pnpm lint`      | 6.15초                           |
| production build              | `pnpm build`     | 7.25초                           |
| E2E (10 tests / spec 4개)     | `pnpm test:e2e`  | 22.6초 (`retries: 0`, 전부 통과) |

CI step 타이밍 (PR #187, 2026-09-07, upstream 저장소 실행분):

| step                             | 시간     |
| -------------------------------- | -------- |
| Set up job                       | 2초      |
| Checkout                         | 2초      |
| Set up pnpm                      | 6초      |
| Set up Node.js                   | 10초     |
| Install dependencies (캐시 warm) | **3초**  |
| Install Playwright Chromium      | **23초** |
| Run quality checks (전체)        | 47초     |
| 합계                             | 93초     |

CI step 타이밍 (PR #5, run 34504338510, 2026-09-11, job 분리 후):

| job | 시간 | timeout | 여유 |
| --- | --- | --- | --- |
| `quality` | 59초 | 2분 | 2.0배 |
| `e2e` | 76초 | 4분 | 3.2배 |

| step (`quality`) | 시간 |
| --- | --- |
| Set up pnpm | 8초 |
| Set up Node.js | 10초 |
| Install dependencies | 3초 |
| 환경 변수 검증 | 0초 |
| lint | 9초 |
| typecheck | 4초 |
| test | 8초 |
| build | 10초 |

이 실행에서 검증 4개의 CI 시간(`Q`)이 **31초**로 처음 분리 측정됐다. `e2e` 76초는 앞서 유도한 정상 상한 91초 안쪽이다. 두 job의 시작 시각이 겹쳐 병렬 실행도 확인됐다(6-1 참조).

여기서 나오는 두 값이 이후 판단의 근거다.

- **job당 반복 고정비 약 21초** — checkout 2 + pnpm 6 + Node 10 + install 3. 의존성 설치가 아니라 툴체인 셋업이 지배한다.
- **E2E job의 고정비 44초** — 셋업 21 + Playwright 설치 23. 여기에 build와 E2E 실행 시간이 더해진다(6-1에서 e2e job이 `.next`를 자체 조달하기로 했다). 두 값 모두 CI에서 분리 측정되지 않았고(로컬 7.25초·22.6초), `Run quality checks` 47초 안에 묶여 있다. 실측에서 유도되는 정상 상한은 91초다.

## 4. 게이트별 결정

### 4-1. 환경 변수 검증 — develop PR, build 이전, required

- 축: 실행 비용 매우 낮음 / 변동성 없음 / 실패 비용 매우 높음 / **대체 가능성 없음**
- 결정: **develop PR에서 build step 이전에 실행하고 required로 둔다.** 실행 방법은 6-2에 있다.
- 근거: 노트 241번 줄과 과제 131번 줄이 "build 전 실행"을 명시한다. 값 누락은 빌드를 통과하고 배포된 화면에서 드러나므로 다른 게이트가 잡지 못한다. 서버 비밀값에 `NEXT_PUBLIC_`을 붙인 경우는 브라우저 번들에 실려 나가 되돌릴 수 없다.
- 채택하지 않은 것: **build step 이후 배치.** 빌드가 잘못된 값으로 성공해버리면 검증이 사후 확인이 되어 "누락을 빨리 발견한다"(노트 241번 줄)는 목적을 잃는다.
- 채택하지 않은 것: **CI에서만 실행.** Production 환경 변수는 Vercel이 주입하므로 CI에서 볼 수 없다. 검증 스크립트를 build 스크립트 체인에 넣으면 CI와 Vercel 빌드 양쪽에서 실행되어 Production 값 누락도 잡힌다. 검증 대상과 스크립트 형태는 [02-env-validation-decisions.md](./02-env-validation-decisions.md)에 있다.

### 4-2. lint — develop PR, required

- 축: 실행 비용 매우 낮음(6.15초) / 변동성 없음 / 실패 비용 낮음 / 대체 가능성 낮음
- 결정: **required로 둔다.**
- 근거: 비용 낮음 + 변동성 낮음 조합이다. required 근거는 버그 검출력이 아니다 — lint가 실제로 런타임 버그를 줄이는 범위는 `react-hooks/exhaustive-deps`, `no-floating-promises` 같은 일부 규칙에 한정된다. 거의 공짜이고 결과가 결정적이며 리뷰어가 스타일 지적에 쓰는 시간을 없앤다는 것이 근거다. 노트 134번 줄의 "가장 싸게 차단"과 같다.
- 채택하지 않은 것: **경고까지 실패로 처리.** 현재 warning 32건, error 0건이다. 전부 error로 올리면 급한 수정이 스타일 이슈로 막힌다. 다만 경고를 통과시키는 상태가 길어지면 게이트가 서서히 무의미해지므로, 경고 건수를 줄이는 것은 별도 과제로 남긴다.

### 4-3. typecheck — develop PR, required

- 축: 실행 비용 낮음(2.77초) / 변동성 없음 / 실패 비용 중간 / **대체 가능성 있음(비용 우위)**
- 결정: **required로 둔다.**
- 근거: 런타임 이전에 타입 계약 불일치를 차단한다(노트 135번 줄).
- 대체 가능성 관점: production build도 타입 오류를 잡는다. 그럼에도 별도 게이트로 두는 이유는 2.77초로 build(7.25초)보다 빠르고, 타입 오류만 있을 때 실패 지점이 명확하게 드러나기 때문이다. 대체 가능하지만 비용에서 앞선다.
- 채택하지 않은 것: **build에 통합.** 위 비용 우위를 잃고, 실패 원인이 타입인지 RSC 경계인지 로그에서 구분하기 어려워진다.

### 4-4. unit test — develop PR, required

- 축: 실행 비용 낮음 / 변동성 낮음 / 실패 비용 중간 / 대체 가능성 있음
- 결정: **required로 둔다.**
- 근거: 비용 낮음 + 변동성 낮음 조합이다(노트 136번 줄 "순수 로직·작은 규칙을 빠르게 검증").
- 축 외 논거 하나를 함께 적는다. required가 아니면 깨진 테스트를 방치할 수 있게 되고 스위트 전체의 신뢰가 사라진다. 이것은 네 축 어디에도 속하지 않으며, 세 축이 이미 required를 가리키므로 결정을 바꾸지는 않는다.
- 전제: 테스트가 구현 세부가 아니라 동작을 검증할 것. 구현에 결합된 테스트가 많으면 리팩터링마다 무관한 실패가 나서 "통과시키려고 테스트를 고치는" 패턴이 생긴다.

### 4-5. integration test — develop PR, required

- 축: 실행 비용 낮음(32개 2.8초) / 변동성 낮음 / 실패 비용 높음 / 대체 가능성 있음
- 결정: **required로 둔다.**
- 근거: 사용자 흐름 일부와 네트워크 경계를 검증하므로 단위보다 실패 비용이 높다(노트 137번 줄). 실행 비용은 실측상 낮다.
- required 유지 조건은 결정적일 것이다. 특정 테스트가 간헐적으로 깨지기 시작하면 required 여부를 조정할 것이 아니라 그 테스트를 고쳐야 한다. MSW 모킹 경계를 벗어나 실제 네트워크나 타이머에 의존하면 여기서부터 변동성이 생긴다.

### 4-6. production build — develop PR, required

- 축: 실행 비용 낮음(7.25초) / 변동성 없음 / 실패 비용 높음 / **대체 가능성 없음**
- 결정: **required로 둔다.** 검증에서 빼자는 검토가 있었으나 근거 네 가지로 유지한다.

**실행 비용이 높다는 전제가 성립하지 않는다.** build는 7.25초로 lint(6.15초)보다 1.1초 길 뿐이다. Next 16의 Turbopack 빌드다. CI 전체에서 비중이 큰 것은 Playwright 설치와 툴체인 셋업이다.

**대체 가능성이 없다.** `'use client'` 없이 `useState`를 사용하는 서버 컴포넌트를 임시 라우트로 추가해 확인했다.

```
typecheck exit: 0   (통과)
lint      exit: 0   (통과)
build     exit: 1   (실패)
```

```
You're importing a module that depends on `useState` into a React Server
Component module. This API is only available in Client Components.
```

타입 시스템은 서버/클라이언트 경계를 검사하지 않는다. `useState`의 타입은 호출 위치와 무관하게 유효하기 때문이다. 이 경계는 빌드 단계의 RSC 컴파일러만 확인한다. (실험 파일은 제거했고 `app/` 변경이 없음을 확인했다.)

같은 부류로 빌드만 잡는 오류가 더 있다 — 서버 전용 모듈이 클라이언트 번들에 유입되는 경우, prerender 중 `window`/`document` 참조, dynamic API를 잘못된 컨텍스트에서 호출하는 경우. 과제 147번 줄이 같은 이유로 build를 모든 PR에 둔다.

`src/_app/RootLayout.tsx`가 서버에서 `cookies()`를 읽어 `HydrationBoundary`와 클라이언트 `Providers`로 전달하는 구조이므로 이 프로젝트는 해당 오류가 발생하기 쉬운 형태다.

**E2E가 빌드 산출물에 의존한다.** `playwright.config.ts`의 `webServer.command`가 `pnpm start`이며, `next start`는 `.next` 산출물이 있어야 구동된다. build를 제외하면 E2E가 실행 자체가 불가능하다.

**배포 산출물을 만드는 명령이다.** CI에서 실행하지 않으면 배포 가능 여부를 배포 시점에 알게 된다.

- 채택하지 않은 것: **build 제외하고 typecheck·lint로 대신하기.** 위 두 번째 근거대로 RSC 경계 오류를 아무도 잡지 못하게 되고, E2E도 실행 불가가 된다.

### 4-7. E2E — develop PR, required, spec 4개 전부

- 축: 실행 비용 중간(job 고정비 44초 + build + 실행 시간, 정상 상한 91초) / **변동성 미관측** / 실패 비용 매우 높음 / **대체 가능성 없음**
- 결정: **develop PR에서 spec 4개를 전부 실행하고 required로 둔다.**

**변동성 표기를 실측으로 정정한다.** 일반론으로 E2E는 변동성이 높은 검증이지만, 이 프로젝트에서는 `retries: 0` 설정으로 10개 전부 통과했다. 관측된 flaky는 없다. 따라서 "변동성 높음 → 차단하지 않음"(과제 149번 줄) 규칙의 적용 대상이 아니다. 향후 간헐 실패가 관측되면 그때 이 결정을 재검토한다.

**대체 가능성이 없다.** integration test는 MSW 모킹 경계 안에서 돌기 때문에 실제 쿠키 설정, 미들웨어 통과, 로그인 후 리다이렉트, 세션 만료 처리는 E2E만 검증한다. `auth.spec.ts`의 "미로그인으로 담고 주문서로 가면 로그인 후 그 화면으로 돌아온다", "세션이 만료되면 보호 경로에서 로그인 화면으로 안내된다"가 그 예다. 노트 139번 줄의 "비싸지만 로그인·주문 같은 고위험 흐름 검증"에 해당한다.

**실행 비용이 merge 직전으로 미룰 만큼 높지 않다.** 과제 148번 줄은 E2E를 "핵심 플로우 PR 또는 main merge 전"에 두라고 한다. E2E job은 고정비 44초에 build와 E2E 실행 시간을 더한 값이고, 로컬 기준으로 각각 7.25초·22.6초이므로 1분 남짓이다(실측에서 유도된 상한은 91초). 노트 142번 줄이 경계하는 "단순 문구 변경마다 전체 E2E를 돌려 개발 흐름을 느리게 만드는" 수준이 아니다. 과제가 제시한 두 선택지 중 앞의 것을 택한다.

- 채택하지 않은 것: **merge queue(`on: merge_group`)로 옮기기.** PR당 커밋 수가 많을 때 실행 횟수를 줄이는 것이 이득인데, 단독 작업 저장소라 그 상황이 아니다. 1분 남짓을 아끼려고 merge queue 설정을 도입하면 복잡도가 이득을 넘는다.
- 채택하지 않은 것: **핵심 플로우(`auth`)만 required로 쪼개기.** E2E 비용은 고정비가 지배한다 — Playwright 설치 23초가 전체 실행 22.6초와 맞먹는다. spec을 줄여도 job 시간이 거의 줄지 않으므로 쪼개는 이득이 없고, 나머지 3개 spec의 검증만 잃는다.
- 채택하지 않은 것: **일부를 develop push 이후로 미루기.** 위와 같은 이유로 시간이 줄지 않는다.

### 4-8. Preview smoke test — develop push 이후, required 아님

- 결정: **develop push 이후 Vercel Preview 배포가 끝나면 `DEPLOYMENT_URL`을 받아 실행한다. 차단하지 않는다.**
- 근거: 노트 237번 줄이 "Preview URL을 CI에서 자동으로 가져오는 연동은 선택이지만, `DEPLOYMENT_URL`을 받아 실행되는 smoke test 자체는 필수"라고 한다. 과제 185~~186번 줄이 전체 E2E가 아니라 배포가 완전히 깨졌는지 확인할 최소 경로 3~~5개로 제한하라고 한다.
- required가 아닌 이유: 배포가 끝난 뒤에 실행되므로 막을 대상이 없다. develop → main 머지를 막으려면 main branch protection에 status check를 걸어야 하는데, smoke test는 develop push 이벤트의 결과라 main PR의 체크로 잡히지 않는다.
- 채택하지 않은 것: **main branch protection에 required로 연결.** 워크플로 간 상태 전달 설정이 필요한데, 단독 작업 저장소에서 얻는 것은 "사람이 확인하는 대신 자동으로 막는다" 정도다. 실패는 워크플로 실패로 드러나므로 머지 전에 보인다.
- 채택하지 않은 것: **전체 E2E를 배포 URL 대상으로 재실행.** 과제 185번 줄이 명시적으로 배제한다. 최소 경로만 확인하는 것이 목적이다.

### 4-9. Lighthouse — 이번 범위에서 CI에 넣지 않는다

- 축: 실행 비용 중간 / **변동성 높음** / 실패 비용 낮음(지연됨) / 대체 가능성 있음
- 결정: **CI 게이트로 넣지 않는다.** 과제 7번(운영 체크)에서 배포 후 회귀 확인으로 다룬다.
- 근거: 노트 140번 줄이 "중요하지만 변동성·실행 비용이 있음", 과제 149번 줄이 "Lighthouse 점수 하락은 항상 merge blocker여야 할까"를 묻는다. CI 머신 부하에 따라 지표가 흔들리므로 required로 걸면 무관한 PR을 막는 빈도가 잡아내는 회귀보다 많아진다. 노트 224번 줄은 Lighthouse를 배포 후 운영 확인 표에 두고 있다.
- 과제가 Lighthouse를 배치한 위치도 같은 방향이다. 완료 기준 7개(46~52번 줄) 중 CI를 다루는 2번·4번이 아니라 **7번 운영 체크**(207~216번 줄)의 "7주차 성능 기준 대비 회귀 여부" 항목으로 들어가 있고, 체크리스트(259번 줄)도 배포 후 확인으로 묶는다. 즉 과제 범위 밖이 아니라 **CI 게이트가 아닌 운영 확인 항목**이다.
- 채택하지 않은 것: **develop PR에서 실행하되 차단하지 않기(리포트만).** 변동성 높은 지표를 매 PR에 노출하면 읽히지 않는 리포트가 쌓인다. 성능이 명시적 계약인 화면이 생기면 그 화면 한정으로 예산을 거는 것은 별개 문제다.

## 5. main에는 required를 두지 않는다

- 질문: `develop → main` 단계에 게이트를 걸 것인가
- 결정: **걸지 않는다. main은 게이트가 아니라 배포 트리거다.**
- 근거: develop PR에서 모든 검증이 통과한 동일 커밋이다. 다시 실행해도 새로운 정보가 나오지 않는다. 같은 논리를 [03-branch-release-flow.md](./03-branch-release-flow.md) 7번에서 upstream PR에 적용했다.
- Production smoke test는 main push 이후에 실행되지만 required가 아니다. 배포가 이미 끝난 시점이라 차단이 원리적으로 불가능하다. 실패는 워크플로 실패로 남기고 rollback 판단의 입력으로 쓴다.
- 채택하지 않은 것: **main PR에서 전체 검증 재실행.** 같은 커밋이라 얻는 것이 없고 CI 시간만 두 배가 된다.
- 채택하지 않은 것: **Production smoke test 실패 시 자동 rollback.** 과제가 요구하지 않으며, 자동 rollback은 smoke test 자체가 잘못됐을 때 정상 배포를 되돌리는 위험이 있다. rollback 절차는 03에서 다룬다.

## 6. job 구성과 워크플로 파라미터

### 6-1. job은 2개로 나누고 needs로 묶지 않는다

- 결정: **`quality`(환경 변수 검증·lint·typecheck·test·build)와 `e2e` 두 job으로 나누고, `e2e`에 `needs`를 걸지 않는다. `e2e`는 `.next`를 자체적으로 build한다.**

현재 `package.json`의 `check`는 `&&` 체인이며 단일 job에서 순차 실행된다.

```json
"check": "pnpm test && pnpm lint && pnpm typecheck && pnpm build && pnpm test:e2e"
```

문제 세 가지 — `&&` 체인이라 첫 실패에서 멈춰 한 번에 하나씩만 확인하게 되고, required 체크 이름이 하나뿐이며, E2E가 묶여 있어 분리가 불가능하다.

**job 개수를 늘려도 벽시계가 줄지 않는다.** E2E job이 어느 구성에서든 가장 느리기 때문이다.

계산은 CI 실측값으로만 한다. 로컬 시간과 CI 시간을 섞으면 두 구성을 같은 자로 재지 못한다.

CI에서 아직 분리 측정되지 않은 값이 셋 있으므로 미지수로 둔다. `Q`를 검증 4개(lint·typecheck·test·build)의 CI 시간, `B`를 build만의 CI 시간, `E`를 E2E의 CI 실행 시간이라 하면, PR #187의 `Run quality checks` 47초가 `Q`와 `E`를 합친 값이다. `B`는 `Q`에 포함되므로 `B ≤ Q`다.

```
Q + E = 47
B ≤ Q
```

`e2e` job은 `.next`를 자체적으로 build하므로 `B`가 더해진다.

| 구성  | quality 계열 job           | e2e job                          | 벽시계  |
| ----- | -------------------------- | -------------------------------- | ------- |
| 2 job | 21 + Q = 68 − E            | 21 + 23 + B + E = 44 + B + E     | max(둘) |
| 5 job | 21 + max(각 검증) < 21 + Q | 21 + 23 + B + E = 44 + B + E     | max(둘) |

두 job 중 어느 쪽이 큰가는 `44 + B + E > 68 − E`, 즉 `B + 2E > 24`로 갈린다. 로컬 build 7.25초·E2E 22.6초이고 CI 러너가 로컬보다 빠를 이유가 없으므로 성립한다.

따라서 **두 구성 모두 벽시계는 e2e job(`44 + B + E`)이 결정한다.** 5 job으로 쪼개면 quality 계열만 짧아지는데 그것은 이미 더 짧은 쪽이므로 전체가 줄지 않는다. job당 반복 고정비가 21초여서 쪼갤수록 총 머신 시간만 늘어난다.

E2E job이 벽시계를 결정하는 근본 이유는 Playwright Chromium 설치 23초다. 이 고정비는 job을 어떻게 나누든 사라지지 않는다.

`B ≤ Q`와 `Q + E = 47`에서 **e2e job의 정상 상한 `21 + 23 + 47 = 91초`**가 나온다. 이 값이 6-2의 timeout 판단 근거다.

**병렬이 성립하는 전제 — `e2e`는 `quality`의 결과를 전혀 쓰지 않는다.** 일부가 아니라 전부다.

| `quality`의 step | `e2e`가 필요한가 |
| --- | --- |
| 환경 변수 검증 | 아니오 |
| lint | 아니오 |
| typecheck | 아니오 |
| test | 아니오 |
| build | 필요하지만 **자기가 직접 한다** |

`e2e`에 필요한 것은 소스 코드와 `APP_ORIGIN`뿐이고, 둘 다 checkout과 워크플로 `env`로 각자 얻는다. 넘겨받는 산출물이 없으므로 기다릴 이유도 없다.

**`quality` 실패가 `e2e`를 무의미하게 만들지 않는다.** 실패 원인별로 나눠 보면 어느 쪽도 헛돌지 않는다.

| `quality` 실패 원인 | `e2e`는 어떻게 되나 |
| --- | --- |
| lint | 정상 실행된다. 스타일 문제가 런타임을 깨지 않으므로 결과가 유효한 정보다 |
| unit·integration test | 정상 실행된다. 다른 층을 검증한다 |
| typecheck | `e2e`도 자기 build에서 같은 지점에 걸린다. 중복 검출이지 낭비가 아니다 |
| build | 위와 같다 |

**`needs`를 걸지 않는 이유.** `e2e`에 `needs: quality`를 걸면 순차가 되어 `(68 − E) + (44 + B + E) = 112 + B`가 된다. `E` 값과 무관하게 병렬보다 느리다. 얻는 것은 "싼 검증이 실패할 때 비싼 E2E를 돌리지 않는다"인데, 위 표대로 그 실행은 낭비가 아니고, 대가로 성공하는 모든 실행이 매번 quality job 시간만큼 더 걸린다.

`needs`를 걸면 `&&` 체인과 같은 왕복이 job 레벨에서 되살아난다. lint가 깨진 경우 `e2e`가 실행되지 않으므로, lint를 고쳐 다시 push한 뒤에야 E2E도 깨져 있었다는 것을 알게 된다. **`needs` 없음은 step에 `if: always()`를 붙인 결정의 job 레벨 확장**이며, 한쪽만 적용하면 일관성이 깨진다.

**실측 (PR #5, run 34504338510, 2026-09-10 UTC)**

```
[quality] success  16:48:24 -> 16:49:23   (59초)
[e2e]     success  16:49:00 -> 16:50:16   (76초)
                      ↑ quality 종료 전 시작 = 병렬 확인
```

| step (quality) | 시간 |
| --- | --- |
| Set up pnpm | 8초 |
| Set up Node.js | 10초 |
| Install dependencies | 3초 |
| 환경 변수 검증 | 0초 |
| lint | 9초 |
| typecheck | 4초 |
| test | 8초 |
| build | 10초 |

이 실행에서 `Q`(검증 4개의 CI 시간)가 **31초**로 처음 분리 측정됐다. `Q + E = 47`이라는 앞의 관계식은 PR #187의 단일 job 기준이었고, 이번 값은 job 분리 후의 것이다.

순차와 병렬의 차이는 실측으로 `59 + 76 = 135초` 대 `max(59, 76) = 76초`, 즉 **59초**다. `e2e`가 build를 중복 실행해 약 10초를 버리지만, 그 중복을 없애려면 artifact 전달이 필요하고 그러면 `quality` 59초를 통째로 기다려야 한다. **10초 중복이 59초 대기보다 싸다.**

즉 "`e2e`가 build를 자체 조달한다"는 선택과 병렬 구성은 한 묶음의 결정이다. 산출물을 넘겨받기로 하면 `needs`가 따라오고 병렬이 사라진다.

**`e2e`가 build를 자체 조달하는 이유.** `needs`를 걸지 않으면 job 간에 파일 시스템이 공유되지 않아 quality job의 `.next`를 받을 수 없다. `playwright.config.ts`의 `webServer.command`가 `pnpm start`이고 `next start`는 `.next`를 요구하므로, e2e job에 build step이 없으면 항상 실패한다. build가 두 job에서 각각 1회씩 실행되지만 병렬이라 벽시계에는 한 번만 반영된다.

- 채택하지 않은 것: **artifact로 `.next` 전달.** `needs`가 필요해져 순차가 되고, 위 계산대로 병렬보다 느리다.
- 채택하지 않은 것: **`webServer.command`를 `pnpm build && pnpm start`로 변경.** CI 워크플로는 손대지 않아도 되지만 로컬 실행에도 적용된다. `reuseExistingServer`가 걸리지 않을 때마다 빌드가 돌아 로컬 E2E가 느려진다.

**`&&` 체인 문제는 step 분리로 해결한다.** `if: always()`를 붙이면 앞 step이 실패해도 나머지가 실행되어 한 번의 실행으로 모든 실패를 확인할 수 있다. job을 나누지 않고도 해결된다.

```yaml
jobs:
  quality:
    steps:
      # checkout / pnpm / node(.nvmrc) / install
      - run: pnpm validate-env
      - run: pnpm lint
        if: always()
      - run: pnpm typecheck
        if: always()
      - run: pnpm test
        if: always()
      - run: pnpm build
        if: always()

  e2e:
    steps:
      # checkout / pnpm / node(.nvmrc) / install / playwright install
      - run: pnpm build
      - run: pnpm test:e2e
```

required status check로 지정할 이름은 `quality`, `e2e` 두 개다.

`pnpm check`는 로컬 검증용으로 유지하고 CI는 개별 스크립트를 호출한다.

- 채택하지 않은 것: **5 job으로 병렬화.** 위 표대로 벽시계가 같고 총 머신 시간만 늘어난다. 병렬화가 이득인 지점은 quality 계열 시간이 E2E job을 넘을 때다.
- 채택하지 않은 것: **3 job 구성(`static` / `test` / `build` → `e2e`).** `.next` artifact를 E2E에 넘기는 것이 장점인데, 빌드가 7.25초라 artifact 업로드·다운로드보다 재빌드가 빠를 가능성이 높다. 다만 이 비교는 측정하지 않았다.
- 채택하지 않은 것: **단일 job 유지.** 이유가 넷이다.
  1. **required 체크 이름이 하나뿐이다.** E2E만 정책을 다르게 가져갈 수 없다. 지금은 둘 다 required지만 E2E에 flaky가 관측되면 시점을 옮겨야 하므로 이름을 분리해 둔다. 4-7이 남긴 재검토 여지가 이 분리에 의존한다.
  2. **오히려 느리다.** 단일 job이면 Playwright 설치 23초를 검증 4개와 순차로 지므로 `21 + 31 + 23 + B + E ≈ 107초`가 된다. 실측된 2 job 벽시계 76초보다 31초 길다.
  3. **실패한 job만 재실행할 수 없다.** GitHub의 "Re-run failed jobs"는 job 단위다. E2E는 이 프로젝트에서 flaky 가능성이 있는 유일한 검증인데, 단일 job이면 재실행 때 lint·typecheck·test·build까지 함께 돈다.
  4. **실패 위치가 체크 목록에서 드러나지 않는다.** `quality ✓ / e2e ✗`면 PR 화면에서 원인 범위가 즉시 좁혀지는데, 단일 job이면 로그를 열어야 한다. 나중에 E2E를 별도 트리거로 옮길 때 파일을 나누기 쉽다는 점도 같은 방향이다.

### 6-2. 워크플로 파라미터

발제 110~117번 줄이 묻는 항목들이다. 값 자체보다 판단 기준을 남긴다.

#### Node 버전 — 결정 불필요

이미 세 곳이 일치한다. 로컬 셸만 다른 버전을 쓰고 있어 `nvm use`로 맞추면 된다.

```
package.json  engines: { "node": "24.x" }   ← Vercel이 이 값을 본다
.nvmrc        24.17.0                        ← CI가 node-version-file로 이 값을 본다
```

#### 환경 변수 검증 실행 방법 — Node 내장 type stripping

- 결정: `package.json`에 `"validate-env": "node scripts/validate-env.ts"`를 추가하고 CI에서 `pnpm validate-env`로 부른다.
- 근거: Node 23.6부터 타입 어노테이션 제거가 기본 활성화되어 `.ts`를 그대로 실행할 수 있다. `.nvmrc`가 24.17.0이므로 조건을 만족한다. 의존성이 늘지 않고 파일도 그대로 둔다. `scripts/validate-env.ts`는 타입 어노테이션만 쓰므로 제약(enum·namespace 같은 런타임 TypeScript 기능 불가)에 걸리지 않는다.
- 실행 확인 (Node v24.17.0, 2026-09-11):

```
APP_ORIGIN=https://example.com  → exit 0, "검증 통과"
APP_ORIGIN 미설정                → exit 1, "설정되지 않았습니다"
```

두 번째 경우는 `.env`에 `APP_ORIGIN`이 있는 상태에서 실행한 결과다. **이 스크립트는 dotenv를 쓰지 않아 `.env`를 읽지 않는다** — 실제 환경 변수만 본다. `next build`는 `.env`를 로드하므로 둘이 보는 값이 다를 수 있다.
- 채택하지 않은 것: **`tsx` 의존성 추가.** 버전 제약이 없어지지만 devDependency가 하나 늘어난다. Node 24가 이미 확정된 상태에서 얻는 것이 없다.
- 채택하지 않은 것: **`.mjs`로 전환.** 의존성도 버전 제약도 없지만 타입 어노테이션을 잃고 `tsc --noEmit` 검사 대상에서 빠진다.

#### permissions — 변경 없음

현재 `contents: read`로 이미 최소 권한이다. 발제 117번 줄을 만족한다. 나중에 smoke test 결과나 릴리즈 정보를 PR에 남기게 되면 그 job에만 `pull-requests: write`를 더한다.

#### timeout-minutes — quality 2분, e2e 4분

- 결정: **하한으로 두고, 규모가 커져 실제로 걸리면 그때 올린다.**

timeout은 정상 실행 시간을 재는 자가 아니라 멈춘 job을 끊는 상한이다. 그래서 정상 상한보다 크기만 하면 목적은 달성되고, 그 위로는 "실패를 얼마나 늦게 알아도 되는가"만 남는다. 값이 곧 최악의 피드백 지연이므로 하한 쪽을 택했다.

| job | 근거 |
| --- | --- |
| `e2e` 4분 | `playwright.config.ts`의 `webServer.timeout`이 120초다. 그 앞 단계(셋업 21 + Playwright 23 + build)까지 더하면 약 172초이므로, job timeout이 3분 미만이면 webServer가 실패 원인을 남기기 전에 job이 잘린다. 여기에 캐시 미스 여유를 더해 4분 |
| `quality` 2분 | webServer가 없어 하한이 낮다. 정상 상한 `21 + Q ≤ 68초`에 캐시 미스 여유를 더한 값 |

정상 상한 91초 기준으로 e2e는 약 2.6배 여유다. 로컬 E2E가 10 tests 22.6초로 test당 약 2.26초이므로, 4분까지 남은 149초는 test 60개 남짓에 해당한다. 지금의 7배가 되어도 닿지 않는다.

- 채택하지 않은 것: **하한의 3~4배(12~16분).** 배수를 걸 대상이 다르다 — 하한 4분은 webServer timeout과 셋업 고정비에서 나온 값이라 테스트가 늘어도 변하지 않는다. 커지는 것은 정상 실행 시간 쪽이고, 4분은 이미 7배 여유다. 여유를 26배로 늘리는 대가로 hang일 때 피드백이 3배 늦어진다.
- 참고: **timeout을 테스트 시간 최적화 신호로 쓰지 않는다.** 걸리거나 안 걸리거나뿐인 이진 신호라 2배 느려져도 침묵하고, 신호가 도착할 때는 실패 형태라 개발이 막힌다. 실행 시간 추이는 Actions가 job·step 단위로 이미 기록하므로 그쪽을 본다.

#### concurrency — PR만 취소

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

- 근거: `pull_request` 실행을 취소하면 잃는 것이 없다. 낡은 커밋을 검증하던 중이고 최신 커밋이 다시 검증된다. 반면 `push` 실행은 develop·main의 배포와 smoke test로 이어지므로, 취소하면 그 커밋이 배포 검증을 통과했는지 기록이 끊긴다. develop에 연속으로 머지할 때 앞 커밋의 Preview smoke test가 중단되는 상황이 그 예다.
- 채택하지 않은 것: **`cancel-in-progress: true`(전부 취소).** 표현은 단순하지만 위 기록 손실이 생긴다.
- 채택하지 않은 것: **설정하지 않음.** 기본값이 360분이라 연속 push 시 낡은 실행이 끝까지 돌고 Playwright 설치도 매번 반복된다. 발제 116번 줄이 묻는 항목을 미해결로 남긴다.

## 7. Google Fonts 빌드 의존성

**위험으로 인지만 하고 조치는 보류한다.** 신규 패키지 설치를 포함한 수정은 하지 않는다.

`src/_app/RootLayout.tsx:3`에서 `next/font/google`의 `Geist`, `Geist_Mono`를 사용한다. Google Fonts는 빌드 타임에 다운로드되어 self-host되므로 빌드 머신이 `fonts.googleapis.com`에 접근할 수 있어야 한다.

네트워크가 차단된 환경에서 실행한 결과 재현되었다.

```
next/font: error: Failed to fetch `Geist` from Google Fonts.
  ./src/_app/RootLayout.tsx → ./app/layout.tsx
```

빌드는 5.4초 만에 실패했다.

**환경별 실측 현황.**

| 환경                           | build      | 근거                                                                         |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------- |
| GitHub Actions `ubuntu-latest` | 성공       | PR #187 `quality` SUCCESS                                                    |
| Vercel 빌드 컨테이너           | 성공       | 배포 로그 (`Skipping build cache`인 클린 빌드에서 `✓ Compiled successfully`) |
| 로컬 macOS, 네트워크 열림      | 성공       | 이 세션                                                                      |
| 로컬 macOS, 네트워크 차단      | 실패       | 이 세션                                                                      |
| Docker                         | **미실측** | Dockerfile 없음                                                              |

배포 경로 세 곳(GitHub Actions, Vercel, 로컬)에서 모두 통과한다. 실패는 네트워크를 차단한 환경에서만 관측됐다. 커뮤니티 보고상 Alpine 기반 이미지에서 실패 사례가 있으나 이 저장소에서 확인한 것은 아니다.

**보류 판단.** Docker 빌드가 미실측이므로 지금 조치하지 않는다. 실제 실패를 관측하기 전에 의존성을 추가하는 것은 근거가 예측에 기댄다. 과제 6번(193~200번 줄) Docker 단계에서 빌드를 실행해 보고, 그때 실패하면 조치한다.

**성격.** 코드 결함이 아니라 빌드의 외부 네트워크 의존성이다. required 게이트는 결정적이어야 하는데, 간헐적으로 실패하면 빨간불이 신호가 아니라 소음이 되고 실제 빌드 오류도 같은 취급을 받게 된다. 다만 현재 배포 경로에서는 실패가 관측되지 않으므로 required 유지에 지장이 없다.

Docker 단계에서 실패가 확인될 경우의 수정 방향 세 가지:

| 방법                                | 의존성   | 비고                                    |
| ----------------------------------- | -------- | --------------------------------------- |
| `geist` npm 패키지로 교체           | 추가 1개 | `node_modules`에서 오므로 네트워크 무관 |
| `next/font/local` + woff2 파일 커밋 | 없음     | 폰트 파일 관리, 라이선스 확인 필요      |
| 시스템 폰트 스택으로 전환           | 없음     | 디자인 결정                             |

## 8. 아직 정하지 않은 것

구현을 막는 것:

- **Vercel Deployment Protection** — Preview URL이 SSO로 302 리다이렉트된다. 해제하거나 bypass 토큰을 쓰지 않으면 4-8의 Preview smoke test가 접근 자체를 못 한다. 배포를 공개로 바꾸는 결정이라 별도 판단이 필요하다.
- **`.env` 처리와 CI 환경 변수** — `.env`가 git 추적 중이다(`APP_ORIGIN=http://localhost:3000`). `validate-env`는 `.env`를 읽지 않으므로 게이트 자체는 정상 작동하지만, `next build`는 `.env`를 로드하므로 **검증과 빌드가 서로 다른 값을 볼 수 있다.** 실제 위험은 Vercel 환경 변수에서 `APP_ORIGIN`이 빠졌을 때 `.env`의 localhost가 조용히 채워져 `getAppOrigin()`이 던지지 않고 배포된 `metadataBase`가 localhost가 되는 경우다. 추적에서 빼면 CI 빌드에 `APP_ORIGIN`을 주는 조치가 함께 가야 한다.

smoke test 설계 (4-8이 "실행한다"까지만 정함):

- 확인할 경로 3~5개 선정 (과제 185번 줄)
- 기존 `e2e/`와 분리할 방식 — 별도 디렉터리인지 태그인지
- Preview URL을 CI에서 자동으로 가져오는 연동 (노트 237번 줄 기준 선택 사항)
- Production smoke test 실패 시 알림 방식 (5번에서 rollback 판단 입력으로만 정함)

그 밖:

- 폰트 조치 여부 — Docker 단계에서 실패가 관측되면 재검토 (7번)
- 과제 2번의 "실패한 CI를 한 번 만들어 어느 단계에서 왜 실패했는지 PR 본문에 기록" 항목
- 3 job 구성의 artifact 전송 시간 (6-1에서 미측정으로 남김)
- CI에서 `Q`(검증 4개)와 `E`(E2E)의 분리 측정 — 6-1의 계산은 부등식으로 닫히므로 결론에는 영향이 없다

## 9. References

| 구분 | 출처                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------ |
| 과제 | `docs/assignments/week-10-quests.md` 2번(86~~116번 줄), 4번(137~~152번 줄), 5번(158~189번 줄)                |
| 발제 | `docs/mentor-notes/round10-cicd-자동화-배포.md` 128~~142번 줄(품질 게이트), 231~~245번 줄(핵심 자동화 3가지) |
| 실측 | `pnpm lint` / `typecheck` / `test` / `build` / `test:e2e` 소요 시간 (로컬)                                   |
| 실측 | `gh api repos/loopers-labs/loop-pack-fe-l2-vol1/actions/jobs/101791034703` (CI step 타이밍)                  |
| 실측 | RSC 경계 위반 임시 라우트로 typecheck·lint·build exit code 비교                                              |
| 코드 | `.github/workflows/quality.yml`, `playwright.config.ts`, `package.json#scripts`                              |
