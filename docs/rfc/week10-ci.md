# 10주차 CI 파이프라인 — 측정·조건부 실행·예산 게이트·AI 리뷰·룰 승격

과제가 요구하는 산출물을 단계별로 채운다. 측정과 실험은 전부 작성자의 fork(`kjeunn/loop-pack-fe-l2-vol1`)에서 했다. upstream에 여는 제출 PR은 fork PR이라 토큰이 읽기 전용이고 브랜치 보호를 걸 수 없어서, 그쪽 run은 근거로만 쓰고 enforcement는 fork의 통합 브랜치 `kjeunn`에 건다([3.4](#34-branch-protection--무엇을-required로-두나)).

## 0. 시작 상태 진단

10주차 시작 시점의 `quality.yml`은 job 하나에서 `pnpm check`(test·lint·typecheck·dupcheck·build)를 돌렸다. 로그와 대조해 확인한 문제는 셋이다.

- **E2E가 CI에 없었다.** Chromium을 매 run마다 설치하면서(23~55s) 정작 `test:e2e`는 부르지 않았다. 8주차 문서는 "CI는 `pnpm check`와 Playwright를 각각 실행"이라 적었지만 워크플로엔 없었다.
- **통합 브랜치 push에서 CI가 돌지 않았다.** `push.branches`가 `main`뿐이었는데 실제 통합 브랜치는 `kjeunn`이다. 주차 PR을 합친 뒤 검증이 한 번도 없었다.
- `timeout-minutes`·`concurrency`가 없었다. upstream 9주차 PR run 중 하나는 pnpm setup에서 7분을 멈춘 뒤에야 끝났다(run 33854288293, 08:36:59 → 08:44:02).

## 1. CI 측정과 병목 제거

### 1.1 측정 조건

- 같은 커밋(`cbc1489e`)에서 Re-run으로 attempt 6개. cold는 매번 `gh cache delete --all` 뒤 실행, warm은 캐시를 두고 실행.
- 러너 ubuntu-latest, Node 24.17.0(`.nvmrc`), 검증 항목은 Before·After 동일(test·lint·typecheck·dupcheck·build).
- 시간은 Actions API의 step `started_at`·`completed_at` 차이(초). run 34353366979.

### 1.2 Before

| step                           | cold 1 | cold 2 | cold 3 | warm 1 | warm 2 | warm 3 |
| ------------------------------ | ------ | ------ | ------ | ------ | ------ | ------ |
| Set up pnpm                    | 7      | 18     | 7      | 4      | 7      | 3      |
| Set up Node.js(캐시 복원)      | 5      | 5      | 5      | 9      | 12     | 11     |
| Install dependencies           | 6      | 6      | 5      | 3      | 2      | 2      |
| Install Playwright Chromium    | 30     | 55     | 26     | 23     | 32     | 23     |
| Run quality checks             | 46     | 34     | 33     | 46     | 48     | 37     |
| Post Set up Node.js(캐시 저장) | 5      | 4      | 5      | 0      | 0      | 1      |
| 전체                           | 104    | 130    | 87     | 93     | 108    | 84     |

| 조건 | raw        | median | 범위   |
| ---- | ---------- | ------ | ------ |
| cold | 104·130·87 | 104s   | 87–130 |
| warm | 93·108·84  | 93s    | 84–108 |

**병목 지목.** 검증 본체(`Run quality checks`) 33~48s가 1위이지만 검증 유지가 조건이라 손댈 대상이 아니다. 2위 `Install Playwright Chromium` 23~55s가 실제 병목이다. E2E를 돌리지 않는 job에서 매번 브라우저를 내려받았고, 전체의 25~42%를 차지했으며 흔들림(범위 32s)의 대부분이 이 step이었다. 3위 `Set up Node.js` 5~12s는 캐시 복원 비용이다.

**예상과 달랐던 것 둘.** cold와 warm의 median 차이(11s)가 각 범위 안에 묻힌다(cold 87s가 warm 108s보다 빨랐다). 이 레포에서 캐시 상태는 wall-clock을 가르는 변수가 아니다. 그리고 pnpm 캐시의 순이익이 0에 가깝다. install에서 3~4s를 아끼는데 206MB를 복원하는 데 4~7s를 쓴다. 의존성이 작아 cold install이 6s라서다.

### 1.3 고른 전략과 고르지 않은 전략

병목에 맞는 것만 넣었다.

- **Chromium 설치를 check job에서 제거**하고 2단계의 E2E job으로 옮겼다. 검증을 뺀 게 아니라 쓰지 않는 step을 뺀 것이다.
- **`pnpm check` 한 덩어리를 named step으로 분리**했다(1단계 시점엔 다섯, 3단계에서 Validate env·Bundle budget이 더해져 일곱). 시간은 같지만 step별 타임스탬프가 남아 검증 안의 분포가 처음 보인다(After 표). 같은 목록이 `package.json`과 워크플로 두 곳에 있는 이유는 워크플로 주석에 적었다.
- **`concurrency`**: `group: ${{ github.workflow }}-${{ github.ref }}`, `cancel-in-progress`는 `pull_request`일 때만. 통합 브랜치 push는 취소하지 않는다.
- **`timeout-minutes`**: check 10, E2E 15. 7분 stall run이 근거다.
- **job 병렬화는 넣지 않았다.** 검증 체인이 33~48s인데 job당 setup(checkout·pnpm·node·install)이 15~25s라 이득이 작고 러너 시간은 4배가 된다.
- **pnpm 캐시 튜닝은 넣지 않았다.** install은 병목이 아니고(6s) 캐시 순이익이 0이다. 캐시는 그대로 두되 hit/miss 증명([1.5](#15-캐시-hitmiss-증명))만 남긴다.

### 1.4 After

run 34362069942(커밋 `18aacb88`), 같은 방식으로 attempt 6개.

| step                 | cold 1 | cold 2 | cold 3 | warm 1 | warm 2 | warm 3 |
| -------------------- | ------ | ------ | ------ | ------ | ------ | ------ |
| Set up pnpm          | 6      | 3      | 3      | 5      | 11     | 3      |
| Set up Node.js       | 13     | 5      | 5      | 9      | 11     | 8      |
| Install dependencies | 6      | 6      | 7      | 2      | 2      | 3      |
| Lint                 | 8      | 12     | 12     | 11     | 11     | 11     |
| Typecheck            | 2      | 4      | 4      | 5      | 4      | 5      |
| Test                 | 13     | 20     | 21     | 19     | 20     | 20     |
| Duplicate check      | 0      | 0      | 0      | 1      | 0      | 0      |
| Build                | 8      | 12     | 13     | 12     | 12     | 12     |
| 검증 합(Lint~Build)  | 31     | 48     | 50     | 48     | 47     | 48     |
| 전체                 | 67     | 70     | 75     | 68     | 79     | 67     |

| 조건 | Before median(범위) | After median(범위) | 변화     |
| ---- | ------------------- | ------------------ | -------- |
| cold | 104s (87–130)       | 70s (67–75)        | **−34s** |
| warm | 93s (84–108)        | 68s (67–79)        | −25s     |

감소가 흔들림보다 크다. After 범위 전체가 Before 최솟값(cold 87·warm 84) 아래에 있어 겹치는 구간이 없다. 감소분 34·25s는 제거한 Chromium step의 Before 시간(cold median 30·warm 23s)과 맞는다. 검증 합은 31~50s(cold 1만 31, 나머지 47~50)로 Before의 `Run quality checks` 33~48s와 같은 수준이라 검증을 깎은 게 아니다. 부산물로 범위 폭이 cold 43 → 8s로 좁아졌다. 검증 안 분포는 Test 20 > Build 12 > Lint 11 > Typecheck 4s이고, 다음 병목 후보는 Test다.

### 1.5 캐시 hit/miss 증명

- **miss(cold 1)**: `Set up Node.js` 로그 `pnpm cache is not found`, Post step `Cache saved with the key: node-cache-Linux-x64-pnpm-4b610a8e…`. install 6s.
- **hit(warm 1)**: `Cache hit for: node-cache-Linux-x64-pnpm-4b610a8e…`, `Cache Size: ~206 MB`, `Cache restored from key: …`. install 2~3s, 복원 9~12s.
- **lockfile 변경으로 키가 바뀐 miss**: size-limit을 추가한 커밋 `1e895267`이 든 push(run 34456290949, head `9acb1e45`)에서 키가 `4b610a8e…` → `441ceda4…`로 바뀌며 pnpm 캐시와 Playwright 브라우저 캐시 둘 다 `cache not found`. install 6s로 cold와 같고, Post step에서 새 키로 저장됐다. 이후 run 34464568933에서 새 키로 hit.
- hit과 miss의 install 차이는 3~4s이고, 복원 비용이 그보다 크다는 것이 [1.2](#12-before)의 결론이다.
- **Playwright 브라우저 캐시**(E2E job, `~/.cache/ms-playwright`, lockfile 해시 키)는 반대로 이득이 분명하다. miss면 Chromium 설치 25~31s, hit이면 복원 3s + OS 의존성(apt) 12s. E2E job 전체는 miss 92~96s, hit 73s(run 34464568933).

## 2. 조건부 실행 — E2E

### 2.1 무엇을 어떻게

E2E는 별도 job(`e2e`)이다. 스킵 조건은 `changes` job이 `dorny/paths-filter`(SHA 핀)로 판정한다.

```yaml
predicate-quantifier: some-with-excludes
filters: |
  runtime:
    - "**"
    - "!docs/**"
    - "!**/*.md"
    - "!.claude/**"
```

기본이 실행이고 스킵을 명시한다. "E2E 관련 경로가 바뀌면 돌린다"(allow-list)로 짜면 목록에 없는 새 경로가 조용히 스킵돼 깨진 코드가 통과한다. deny-list는 틀렸을 때 E2E 1분을 낭비할 뿐이다. `some-with-excludes`가 필요한 이유는 기본 모드가 부정 패턴을 무시해 md 변경도 true가 되기 때문이다.

`e2e`의 조건은 job 레벨 `if`다.

```yaml
if: ${{ !cancelled() && (github.event_name != 'pull_request' || needs.changes.result != 'success' || needs.changes.outputs.runtime == 'true') }}
```

- 워크플로 `on.paths`로 막으면 run 자체가 생기지 않아 required check가 Expected 상태로 남고 PR이 영영 머지되지 않는다. job 레벨 `if`로 스킵하면 GitHub 문서상 skipped가 통과로 집계된다. required가 걸린 `kjeunn`에서의 실증은 [2.3](#23-실행되는-pr과-스킵되는-pr)의 문서 PR에서 한다.
- `push`(통합 브랜치)에서는 `changes`가 스킵되므로 `!cancelled()`를 앞에 둬 조건이 평가되게 하고, 필터 없이 항상 돈다.
- `changes`가 실패하면(API 오류 등) outputs가 비어 스킵으로 흘러간다. 그건 "안 바뀜"이 아니라 "판정 불가"라, `result != 'success'`면 돌린다. 이 조건은 AI 리뷰가 찾은 결함이다([4.3](#43-잘-잡은-것-하나)).

라벨·`workflow_dispatch`·nightly는 쓰지 않았다. fork PR에 라벨을 다는 건 write 권한이라 작성자 PR에선 쓸 수 없고, deny-list가 좁아 "문서만 바꿨는데 E2E가 필요한" 경우가 없다. nightly는 PR 단계에서 못 잡는다.

### 2.2 스킵이 안전한 이유

스킵되는 경로는 `docs/**`·`**/*.md`·`.claude/**`이고, 런타임 산출물에 실리지 않는 파일이라 구성상 동작을 바꿀 수 없다. 그 위에 통합 브랜치 `kjeunn` push에서 E2E가 무조건 돌아 사후 방어가 한 번 더 있다. merge queue는 켜지 않았다(설정과 설명할 트리거가 늘고, 혼자 작업하는 레포에선 큐가 비어 있다).

### 2.3 실행되는 PR과 스킵되는 PR

| 경우                                                           | run                                                    | `changes`           | `e2e`                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------ | ------------------- | --------------------------------------------------------------- |
| 워크플로·설정 변경(PR #1, 커밋 `1a1a19f7`)                     | 34435712817                                            | runtime=true        | 실행, 29 passed(37.5s), 전체 92s                                |
| 실험 PR의 revert 커밋(PR #2·#3·#4) — 변경 파일 0개             | 34466762242·34466762258·34466763510                    | runtime=false       | skipped. base `feat/week-10`엔 required가 없어 스킵 동작만 실증 |
| 문서만 바꾼 PR(이 문서·회고·이미지를 올리는 PR, `kjeunn` 대상) | 그 PR의 run — 번호·결과는 upstream 제출 PR 본문에 기록 | runtime=false(예상) | required가 걸린 `kjeunn`에서 skipped인 채 머지 가능한지 확인    |

revert 케이스는 계획한 게 아니다. 실험 커밋을 되돌리자 PR의 변경 파일이 0개가 됐고, 그대로 스킵 경로의 실증이 됐다.

### 2.4 첫 E2E run이 전부 실패한 사건

E2E job을 붙인 첫 run(34431518663)에서 29개 중 정적 화면 3개만 통과했다. 원인은 CI 빌드에 `NEXT_PUBLIC_BASE_URL`이 없어서였다. `appOrigin.ts`는 `APP_ORIGIN ?? NEXT_PUBLIC_BASE_URL`이 없으면 throw하는데, 브라우저 번들엔 서버 전용 `APP_ORIGIN`이 실리지 않는다. 로컬은 `.env.local`이 빌드에 박혀 괜찮았고 CI만 비어 있었다. 브라우저에서 모듈 평가 시점에 throw → 클라이언트 트리가 에러 경계로 → 데이터가 필요한 화면의 heading이 사라져 30s 타임아웃. 로컬에서 `NEXT_PUBLIC_BASE_URL=`로 빌드해 같은 실패를 재현했다. 워크플로 최상위 `env`에 두 값을 같은 origin으로 두어 고쳤고, 이 사건이 3단계 env 게이트 규칙 ②의 근거다.

### 2.5 flaky 정책

`retries: process.env.CI ? 1 : 0`. 로컬은 0이다. 재시도가 "실패 후 통과"를 가리면 결정성을 확인할 수 없어서다(9주차의 `--workers=4`·`1` 동일성 검증이 그 용도였다). CI는 1이다. 목적은 실패를 숨기는 게 아니라 흔들림과 진짜 실패를 가르는 것이다. 진짜 실패는 두 번 다 실패해 빨강이고, 재시도로 통과한 것은 Playwright가 flaky로 따로 표시한다. CI는 json 리포터를 함께 켜고 `Report flaky specs` step이 `stats.flaky`와 해당 스펙 목록을 job summary에 쓴다. 초록이어도 흔들린 건 보인다. trace는 `retain-on-failure`라 flaky의 첫 실패 시도도 남고, `Upload traces`가 `trace.zip`만 항상 올린다. 워커는 CI에서 4다(4 vCPU 러너, 9주차에서 4·1이 8과 같은 결과를 냄을 확인).

## 3. 예산 게이트

### 3.1 번들

**측정.** Next 16(Turbopack)은 build 출력에 First Load JS를 찍지 않는다. `.size-limit.mts`가 `build-manifest.json`의 `rootMainFiles`(공통 청크)와 라우트별 `page_client-reference-manifest.js`의 청크를 합쳐 size-limit entry를 동적으로 만든다. gzip 기준. `polyfillFiles`는 `<script nomodule>`로 실려 ES 모듈을 아는 브라우저가 받지 않으므로 뺐다. `pnpm start`로 서버를 띄워 `/`·`/products`·`/login`의 HTML에서 `/_next/static/chunks/*.js` script 태그를 뽑아 설정의 path 목록과 대조했다. 세 화면 모두 HTML 16개 vs 설정 15개이고, 차이는 `<script nomodule>`인 `0cz1d0mv5g_q7.js` 하나였다(`build-manifest.json`의 `polyfillFiles`와 일치).

**근거값.** 7주차 RFC에는 이미지·document 바이트만 있고 JS 바이트가 없다. 7주차 After SHA `e7d0c2b`를 worktree로 빌드해 같은 방법으로 쟀다.

| 진입점      | 7주차 `e7d0c2b` | 측정값(로컬 빌드) | 한도 |
| ----------- | --------------- | ----------------- | ---- |
| /           | 241.4           | 246.3             | 257  |
| /products   | 245.0           | 249.8             | 260  |
| /cart       | 없었음          | 235.9             | 246  |
| /order-form | 없었음          | 239.7             | 250  |
| /orders     | 없었음          | 239.4             | 250  |
| /login      | 없었음          | 236.2             | 247  |

단위 kB(gzip). 측정값은 `.size-limit.mts`의 `measuredKb`와 같고, CI run 34464568933(커밋 `2c0d0ed2`)의 표는 `/products`만 249.9로 0.1 다르다. 8~9주차 두 주 동안 라우트당 약 +5 kB 자랐다.

**한도 = 측정값 + 10 kB.** 설정 파일에 측정값(`measuredKb`)을 두고 한도를 계산해 "지금 얼마인데 왜 이 숫자인가"가 코드에 남는다. 10 kB는 두 주치 정상 성장의 두 배이고, 무심코 들어오는 라이브러리 하나(실험에서 TanStack devtools 패널을 홈에 실었을 때 +15.6 kB)보다 작다. 정상 작업은 통과하고 사고는 걸린다. 같은 소스라도 빌드마다 ±0.5 kB 흔들리는데 여유폭이 흡수한다. 이 한도는 절대 목표가 아니라 회귀 게이트다. 7주차 측정에서 LCP를 지배한 건 이미지 전송이지 JS가 아니라, "이 바이트 밑이어야 UX가 지켜진다"는 절대선을 세울 근거가 측정에 없다. 한도를 올릴 땐 측정값만 갱신하고 커밋에 이유를 적는다. CI는 커밋된 숫자와 비교만 하므로 base 빌드가 필요 없고 fork PR에서도 같다.

### 3.2 환경 변수

`scripts/env-rules.mts`(규칙)와 `scripts/validate-env.mts`(CLI)로 나눴다. `next.config.ts`가 빌드 시작 시 규칙을 호출해 로컬·배포 빌드가 같은 검사를 받고, CI는 빌드 앞 `Validate env` step에서 CLI를 한 번 더 부른다. 실패 원인이 "Build"가 아니라 step 이름으로 보이고, summary에 표가 남는다. 규칙은 이 앱에서 날 수 있는 사고에서 역산했다.

| #   | 규칙                                                                       | 막는 사고                                                                 | CI에서 잡나                              |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| ①   | `APP_ORIGIN` 필수, http(s), origin 형태(경로·끝 슬래시·기본 포트 없음)     | self-fetch·OG URL이 깨진다                                                | 잡는다                                   |
| ②   | `NEXT_PUBLIC_BASE_URL` 같은 조건 + `APP_ORIGIN`과 동일                     | [2.4](#24-첫-e2e-run이-전부-실패한-사건)의 사고                           | 잡는다                                   |
| ③   | `CI` 또는 `VERCEL_ENV`가 있으면 `NEXT_PUBLIC_MOCK_SCENARIO` 금지           | 측정용 slow·error mock이 실서비스에 실린다                                | 잡는다                                   |
| ④   | `VERCEL_ENV=production`이면 `AUTH_SESSION_SECRET` 32바이트 이상            | 기본 시크릿으로 세션 위조                                                 | 배포 빌드에서만. CI는 vitest로 로직 보증 |
| ⑤   | `NEXT_PUBLIC_*` 이름에 SECRET·TOKEN·PASSWORD·PRIVATE·KEY                   | 비밀이 브라우저 번들에 노출                                               | 잡는다                                   |
| ⑥   | production이면 `APP_ORIGIN` = `https://` + `VERCEL_PROJECT_PRODUCTION_URL` | 남의 origin으로 self-fetch([배포 사고](#36-배포-실증과-배포에서-난-사고)) | 배포 빌드에서만. CI는 vitest로 로직 보증 |

32바이트는 세션 서명이 HMAC-SHA256이고 RFC 2104가 HMAC 키를 해시 출력 길이 이상으로 권고해서다. `next build`는 항상 `NODE_ENV=production`이라 실배포 판별은 `VERCEL_ENV`로만 한다. 한계: ④·⑥은 `VERCEL_ENV`·`VERCEL_PROJECT_PRODUCTION_URL`에 묶여 있어 Vercel 밖 배포에선 울리지 않고, Vercel 안에서도 프로젝트 설정 "Automatically expose System Environment Variables"(기본 켜짐)가 꺼져 있으면 두 변수가 주입되지 않아 조용히 개입하지 않는다. ⑥은 Vercel이 정한 production 도메인(커스텀 도메인이 있으면 가장 짧은 것) 하나만 인정하므로 `www.` 같은 별칭을 `APP_ORIGIN`에 쓰면 오탐이다. ⑤는 이름 수준이라 순진한 이름의 비밀은 못 잡고 공개용 키(`NEXT_PUBLIC_MAPS_KEY` 같은)는 오탐이다. 조용히 새는 쪽보다 시끄럽게 막히는 쪽을 골랐다. preview는 ④를 요구하지 않는다. mock 백엔드라 preview 세션을 위조해도 얻는 게 없고, 실데이터가 붙으면 `isDeploy`로 넓혀야 한다. 단위 테스트 26개(`env-rules.test.mts`)가 규칙별 경계(빈 문자열·비-origin 7종·컨텍스트별 금지·바이트 길이·도메인 일치와 그 스킴·포트·대소문자·미개입 경계·표 이스케이프)를 고정한다. ④·⑥이 배포 빌드에서 실제로 울린 기록은 [3.6](#36-배포-실증과-배포에서-난-사고)에 있다.

### 3.3 결과 가시성

번들·env·flaky 표는 `$GITHUB_STEP_SUMMARY`에 쓴다. summary는 쓰기 권한이 필요 없어 fork PR에서도 Checks 탭에 뜬다. size-limit의 PR 코멘트 액션은 fork PR에서 토큰이 읽기 전용이라 실패하므로 붙이지 않았다. 빨간불 실험에서 Bundle budget step 로그에 `exit code 1`만 남고 원인이 summary에만 있는 걸 확인해, 표를 로그에도 함께 찍도록 `tee`로 고쳤다(`ec72794c`).

### 3.4 branch protection — 무엇을 required로 두나

fork의 `kjeunn`에 ruleset `kjeunn-required-checks`를 걸었다. required는 `quality`와 `e2e`, bypass 없음. `changes`는 required가 아니다. 그 job이 실패하면 `e2e`가 스킵이 아니라 실행되므로([2.1](#21-무엇을-어떻게)) 판정 job 자체를 required로 둘 이유가 없다. `e2e`는 조건부지만 job 레벨 `if`로 스킵되면 통과로 집계돼 충돌하지 않는다([2.1](#21-무엇을-어떻게)). required에서 뺀 것은 Lighthouse(변동성이 커서 required면 거짓 빨간불이 생기고, 7주차에서 headless가 회귀를 못 잡은 기록이 있다)와 AI 리뷰(비결정적, [4](#4-ai-코드리뷰))다. Lighthouse CI는 붙이지 않았다. upstream 제출 PR에는 required를 걸 수 없어 그 run은 근거 신호이고, 병합을 실제로 막는 것은 fork의 이 ruleset이다. 부작용이 하나 있다. required check는 PR 머지만이 아니라 그 브랜치로의 직접 push도 막으므로, 그동안 직접 push하던 upstream 동기화 머지 커밋도 이제 PR을 거쳐야 한다. 통합 브랜치엔 전부 PR로 들어간다는 뜻이라 규칙과 맞고, 작업 브랜치(`feat/*`)는 대상이 아니라 push가 자유롭다.

### 3.5 빨간불 자가검증

`feat/week-10`을 base로 실험 브랜치 셋을 한 커밋씩 만들어 PR로 열었다. 머지하지 않는다.

| PR                                   | 심은 것                                               | 빨간 step                                                                         | run         |
| ------------------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------- | ----------- |
| #2 `experiment/bundle-over`          | 홈에 `@tanstack/react-query-devtools/production` 패널 | Bundle budget: `/ first load 261.9 kB > 257 kB, 초과 +4.9 kB`, 다른 라우트 통과   | 34464570790 |
| #3 `experiment/lint-relative-import` | `HomeView`에 `./HomeSkeleton` 상대 import             | Lint: `no-restricted-imports`                                                     | 34464574926 |
| #4 `experiment/env-invalid`          | `APP_ORIGIN` 끝 슬래시 + `NEXT_PUBLIC_SESSION_SECRET` | Validate env: 표 2건. e2e도 실패 — 그 job의 빌드에서 `next.config.ts`가 같은 검사 | 34464577997 |

한 PR에 셋을 쌓지 않은 이유는 가장 앞 step(Validate env)에서 멈춰 나머지 빨강이 보이지 않고, 순차 push는 concurrency가 앞 run을 취소해서다. #3의 위반 커밋은 husky가 막아서(정상 동작) 그 커밋만 훅을 우회해 만들었다. 머지하지 않는 실험이고 CI가 잡는지 보려면 위반 커밋이 있어야 했다. 세 브랜치에 revert를 push해 전부 초록으로 돌아왔다(quality 성공, e2e는 변경 파일 0개라 skipped).

스크린샷: [번들 step 로그(원인 안 보임)](../images/week10-bundle-red-log-before.png) · [번들 summary 표](../images/week10-bundle-red-summary.png) · [lint](../images/week10-lint-red.png) · [env quality](../images/week10-env-red.png) · [env e2e](../images/week10-env-red-e2e.png) · [e2e summary flaky 0건](../images/week10-e2e-summary-flaky.png) · [ruleset](../images/week10-ruleset-required-checks.png).

### 3.6 배포 실증과 배포에서 난 사고

배포는 채점 대상이 아니지만 env 게이트의 배포 쪽 규칙(④)을 실측하려고 마지막 날 Vercel에 붙였다. Production Branch `kjeunn`, env는 Production에만 넣고 Preview는 비워뒀다. 시간순으로 적는다.

**첫 production 배포에서 사고가 났다.** `<프로젝트명>.vercel.app`은 전역에서 유일한데, 같은 이름을 다른 수강생이 먼저 써서 이 프로젝트는 `-indol` 접미사가 붙은 도메인(`https://loop-pack-fe-l2-vol1-indol.vercel.app`)을 받았다. 그런데 `APP_ORIGIN`·`NEXT_PUBLIC_BASE_URL`에는 대시보드에서 실제 도메인을 확인하지 않고 접미사 없는 주소를 넣었다. 원인은 이름 충돌이 아니라 값을 확인 없이 넣은 것이다. 빌드는 통과했고 사이트도 떴다. 관측된 것은 서빙된 HTML의 `og:url`·`canonical`이 남의 주소였다는 것이고, `fetcher.ts`가 서버 self-fetch base로 `APP_ORIGIN`을 쓰므로 홈·목록 prefetch도 남의 `/api/home`·`/api/products`로 갔을 것이다(코드로 추론, 요청 로그로 관측하진 않았다). mock 백엔드라 화면은 같아 보였다. 실서비스였으면 남의 API에 요청을 보내는 사고다. `APP_ORIGIN`·`NEXT_PUBLIC_BASE_URL`의 형태·일치 검사(①·②)는 "내 origin인가"를 보지 않아 이걸 통과시킨다.

**규칙 ⑥을 사고에서 역산했다.** Vercel은 production 빌드에 자기 production 도메인 `VERCEL_PROJECT_PRODUCTION_URL`을 넣어준다. production이면 `APP_ORIGIN`이 `https://` + 그 값과 같아야 한다(`c65f3315`, 이후 스킴·포트까지 비교하도록 좁힘). Vercel 밖과 preview에선 개입하지 않는다. 한계는 [3.2](#32-환경-변수)에 있다.

**preview 빌드가 막혔다(①·②).** ⑥을 올린 PR #5의 preview 배포(커밋 `c65f3315`)는 env가 없어 `next.config.ts` 검증에서 11s 만에 멈췄다. 로그 원문: `Error: 환경 변수 검증 실패` / `- APP_ORIGIN: 설정되지 않았습니다` / `- NEXT_PUBLIC_BASE_URL: 설정되지 않았습니다`([스크린샷](../images/week10-vercel-preview-red.png)). GitHub PR 화면에서는 `Vercel` check가 FAILURE로 뜨지만 required가 아니라 머지를 막지 않는다.

**④·⑥ 실측.** PR #5를 머지해 ⑥이 든 커밋(`1c0aad04`)을 production에 올린 뒤, env를 일부러 틀리게 바꿔(`AUTH_SESSION_SECRET=short`, `APP_ORIGIN`=접미사 없는 남의 주소) Redeploy했다. 빌드가 23s 만에 멈췄고, `NEXT_PUBLIC_BASE_URL`은 그대로 둔 탓에 ②까지 세 규칙이 함께 울렸다([스크린샷](../images/week10-vercel-env-red.png)). 로그의 세 줄은 `env-rules.mts`의 메시지 그대로이고(② `…과 같아야 합니다`, ④ `…32바이트 이상으로 설정해야 합니다(기본값 금지). 지금은 5바이트`, ⑥ `production 도메인(loop-pack-fe-l2-vol1-indol.vercel.app)과 다릅니다…`), 스크린샷에서 ⑥ 줄 끝은 화면 폭에 잘렸다. 값 일부는 `[REDACTED]`로 가려졌다. Vercel이 Secret 타입으로 저장된 변수의 값을 로그에서 가린 것으로(헤더 "Sensitive Environment Variable Redacted 1"), 우리 메시지가 값을 찍어도 플랫폼이 한 겹 더 막는다. 그 사이 production은 직전 Ready 배포가 그대로 서빙됐다. 원복 뒤 Redeploy로 Ready를 확인했고, `E2E_BASE_URL`을 production URL로 준 Playwright 29개가 로컬 실행에서 전부 통과했다(리포트 파일은 보존하지 않았다).

**Vercel도 ⑤와 같은 검사를 한다.** `NEXT_PUBLIC_BASE_URL`을 Secret 타입으로 저장하려 하자 "Public prefixes expose values to the browser. If that's safe, change the variable to Config"라고 막았다. 공개값이라 Config로 다시 만들었다.

## 4. AI 코드리뷰

### 4.1 어디서, 무엇으로

CI 밖에서 로컬 Claude Code로 PR 전에 diff를 리뷰한다. CI 안 무료 엔진은 우리 컨벤션을 먹일 수 없고, fork PR에선 코멘트를 달 수 없어 로그로만 남는다. 리뷰 기준은 `.claude/skills/pr-review/SKILL.md`에 커밋했다. CLAUDE.md·CONVENTION.md 규칙에 ID(Q1~Q10, C, S, N, T)를 붙인 표, 억제 규칙(ESLint·tsc가 잡는 것, 스타터 코드, diff 밖, 취향), 리포트 형식(파일:줄·규칙 ID·확신도)이다. 재현성은 프롬프트까지만 보장한다. 같은 diff에 같은 프롬프트로 돌려도 출력은 흔들리므로 참고용이고 required가 아니다.

### 4.2 앵커 유무 대조 — 같은 diff에 두 번

10주차 diff(`cbc1489e..9acb1e45`, lockfile 제외 10파일)에 A(CLAUDE.md·CONVENTION.md만, 억제 규칙 없음)와 B(스킬)를 각각 돌렸다. 9주차 src diff(약 5,000줄)에도 B를 돌렸고, 이것을 B'로 부른다.

|                                    | A    | B    |
| ---------------------------------- | ---- | ---- |
| 지적 수                            | 15   | 6    |
| 규칙 ID·확신도                     | 없음 | 전부 |
| 실제 결함(실패 경로 3·낡은 주석 2) | 5건  | 0건  |
| 취향·중복 지적                     | 섞임 | 억제 |

예상과 반대였다. 앵커는 노이즈를 줄였지만 신호도 걸렀다. A가 찾은 실패 경로 결함 셋("changes 실패 시 e2e 스킵", "매니페스트 정규식 0건이면 통과", "flaky 리포트 파싱 실패가 초록을 빨강으로")과 낡은 주석 2곳은 전부 진짜였는데, B는 "규칙에 없는 지적은 하지 마라" 때문에 내지 않았다. 1회 대조라 방향만 보이고, 수치 근거로 쓰지 않는다.

### 4.3 잘 잡은 것 하나

A의 1번. `e2e`의 `if`가 `needs.changes.outputs.runtime == 'true'`만 봐서, `changes` job이 실패하면 outputs가 빈 문자열이 되고 e2e가 스킵돼 required는 통과했다. 판정 불가를 "안 바뀜"으로 취급한 결함이다. `needs.changes.result != 'success'`면 실행하도록 고쳤다(`21c79aad`). 그 외 A가 찾은 것 중 넷을 더 고쳤다. flaky 리포트 파싱 가드(`c43498bf`), 낡은 주석 2곳(`3d74dacf`), 매니페스트 검증·정규식 0건 throw(`9b4207fc`), 리포트 표의 `|` 이스케이프(`57b075a6`).

### 4.4 헛소리 하나

B'의 3번. "`makeOrder()`를 추가하고 정작 쓰는 테스트가 없다"고 했다. Grep하면 MSW 핸들러 두 곳(`handlers.ts:64-65`)이 소비자다. 테스트가 리터럴을 쓰는 건 기대값을 명시하는 의도다. "테스트에서 안 부름"을 "미사용"으로 비약했다.

### 4.5 프롬프트를 어떻게 고쳤나

- "안 쓴다·두 벌이다" 주장은 Grep으로 소비처를 찾은 뒤에만, 소비처를 지적에 적어서.
- 규칙 밖이라도 실패 경로에서 게이트가 조용히 통과하는 결함은 억제하지 않고 별도 "결함 후보" 섹션에 재현 조건과 함께.

### 4.6 CI 통합

붙이지 않았다. 과제도 선택이고, 유료 API 없이 붙일 수 있는 엔진은 팀 컨벤션을 먹일 수 없다. CI에 들어오는 건 리뷰에서 굳힌 룰([5](#5-룰-승격))뿐이고, 반대로 프롬프트에 "ESLint·tsc가 잡는 건 보고하지 마라"를 넣어 CI가 결정적으로 잡는 건 AI가 다시 말하지 않게 했다.

## 5. 룰 승격

### 5.1 무엇을

CLAUDE.md 규칙 7 "import는 절대경로 `@/`". 1주차부터 사람이 지키던 규칙인데 src에 상대 import 28건이 있었다. 규칙이 있는데 위반이 쌓였다는 것이 "사람 눈으로는 안 지켜진다"는 증거이고, 반복의 근거는 리뷰 기록이 아니라 그 위반 수다(멘토 리뷰는 구두라 API에 남지 않는다). AI 리뷰 B'도 Q7로 같은 걸 짚었다. 판단 항목(네이밍·단일 책임)은 승격 대상이 아니다. `id-denylist`로 `data`·`temp`를 막는 안을 봤다가 버렸다. TanStack의 `{ data }` 구조분해 18건이 전부 오탐이었다.

### 5.2 어떻게

- 28건 중 18건(16파일)을 `@/`로 바꿨다(`6e7074b7`). 나머지 10건은 스타터 파일(`api/auth`·`api/orders`·`_data/auth*`·`analytics/logger·consoleProvider`)이라 이미 lint 대상 밖이고 그대로 뒀다.
- `no-restricted-imports`(`src/**`)에 `patterns`의 `group: ["./*", "../*", "!./*.css"]`(`9861ad3c`). 테스트가 자기 대상을 `./`로 부르는 것도 예외로 두지 않았다. 테스트·테스트 인프라의 22건을 다시 보니 1:1 콜로케이트가 아닌 상대 import(`setup.ts → ./server`, `auth.test.ts → ./auth-cookies`)가 섞여 있어 원리가 아니라 회피였다. `src` 밖(루트 설정·`scripts/`)은 alias가 없어 대상이 아니다.
- **오탐 1건 → 룰 좁힘.** 처음엔 예외를 `!./*.module.css`로 뒀는데 전체 lint에서 `app/layout.tsx`의 `import "./globals.css"`가 걸렸다. 규칙 문면엔 없지만 같은 폴더의 CSS라는 취지는 같아서 `./*.css`로 넓혔고 CLAUDE.md·CONVENTION·스킬 Q7 문구를 같은 말로 맞췄다(`2c0d0ed2`).

### 5.3 자가검증

- 프로브: `../safeRedirect`·`./parent`·테스트 파일의 `./sibling` → 빨강 3건. `./globals.css`·`./p.module.css` → 초록.
- CI: 실험 PR #3에서 `./HomeSkeleton`이 Lint step에서 빨강, revert 뒤 초록.
- 전체 lint 초록, 테스트 283개 통과.

### 5.4 무엇을 기계에, 무엇을 AI·사람에

기계로 내린 것은 참/거짓이 문자열·구문으로 갈리는 것이다. import 경로(규칙 7), env 값의 형태와 관계, 번들 바이트, deprecated prop. AI에 남긴 것은 맥락 판단이다. 단일 책임·의도적 네이밍·성급한 추상화·상태 소유권. 이건 프롬프트에 일부러 남겼고 거기서 나오는 지적은 사람이 최종이다. 내리려다 버린 것은 `id-denylist`처럼 판단이 섞여 오탐이 나는 것이다. 이번 주 A/B에서 배운 건, 억제 규칙이 맥락 판단만 남기면 규칙 밖 결함까지 걸러진다는 것이라, AI 리뷰의 몫에 "실패 경로 결함"을 명시적으로 더했다.

## 6. 워크플로 보안

- `permissions: contents: read`를 워크플로 기본으로. `changes` job에만 `pull-requests: read`(paths-filter가 PR 파일 목록을 읽는다).
- 모든 action은 커밋 SHA로 핀하고 버전을 주석으로 남긴다. 공식 action도 같은 방식이다. 기존 파일이 이미 그렇게 돼 있어 결을 맞췄다.
- `persist-credentials: false`.
- `pull_request_target`·secrets 없음. 이 워크플로는 secrets를 한 줄도 쓰지 않아 fork PR에서도 같은 결과가 난다. `AUTH_SESSION_SECRET`은 mock 백엔드라 CI에선 값이 필요 없고, 실배포 값은 Vercel env에 둔다.

## 7. 생각해 볼 질문

**1. E2E를 모든 PR에 required로 걸면.** 이 레포에서 E2E job은 73~96s(브라우저 캐시 hit·miss)이고 29개 중 재시도 없이 통과하지만, 환경 흔들림은 남는다(첫 run에서 env 누락으로 전멸한 것처럼 인프라 원인의 빨강도 있다). required로 걸어도 조건부로 실행하지 않으면 Expected 상태로 머지가 막힌다. 그래서 required로 두되 job 레벨 `if`로 스킵이 통과가 되게 하고, 스킵 범위를 런타임에 안 실리는 경로로 좁히고, 통합 브랜치 push에서 무조건 한 번 더 돈다.

**2. Lighthouse 하락은 항상 blocker인가.** 아니다. 7주차에서 같은 코드가 headless와 실브라우저에서 다른 LCP를 냈고, headless는 회귀를 못 잡았다. 변동성이 큰 지표를 required로 두면 거짓 빨간불이 쌓여 사람이 무시하게 된다. 막을 것은 결정적으로 재현되는 것(번들 바이트, env 형태)이고, Lighthouse는 주요 화면 변경 때 참고로 본다.

**3. Preview가 production API를 보면.** 이 앱은 자기 origin으로 self-fetch하므로, preview의 `APP_ORIGIN`이 production 도메인이면 preview가 production 데이터를 읽고 쓴다. 실주문·실결제가 붙은 서비스라면 테스트 주문이 실데이터에 쌓인다. 이번 주에 그 사고의 사촌을 실제로 겪었다([3.6](#36-배포-실증과-배포에서-난-사고)). production의 `APP_ORIGIN`이 남의 사이트를 가리켰고 형태 검사(①·②)는 통과시켰다. 그래서 "내 origin인가"를 보는 ⑥을 더했다. preview는 이번 주 env를 비워 빌드 자체가 막히므로 production API를 볼 수 없지만, preview에 env를 주기 시작하면 `VERCEL_ENV=preview`일 때 `APP_ORIGIN` 호스트가 production 도메인이면 실패하는 규칙이 ⑥의 짝으로 필요하다.

**4. AI가 만든 workflow를 그대로 머지하면.** 이번 주에 실제로 겪은 것으로 답한다. AI가 짠 초안에 `changes` 실패 시 e2e가 조용히 스킵되는 조건이 있었고, 매니페스트 형식이 바뀌면 예산이 항상 통과하는 정규식이 있었으며, summary만 쓰고 로그에 원인을 남기지 않았다. 셋 다 초록으로 돌았다. 머지 전 검증은 세 가지다. 실패 경로를 일부러 만들어 빨강이 나는지(실험 PR), 조건식의 각 분기가 어떤 이벤트에서 무엇으로 평가되는지 표로 쓰기, `permissions`·SHA 핀·`pull_request_target` 부재를 눈으로 확인하기.
