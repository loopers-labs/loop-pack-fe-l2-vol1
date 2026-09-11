# 10주차 — CI 파이프라인 측정과 최적화

<!-- AI 초안 -->

## 0. 측정 환경

- 대상 워크플로: `.github/workflows/quality.yml` (6주차 스타터에서 들어온 것, 이번 주 착수 시점까지 무변경).
  단일 job `quality`에서 `pnpm check` 한 방으로 `test → lint → typecheck → build → test:e2e`를 **직렬**로 돈다.
- 러너 `ubuntu-latest`, Node는 `.nvmrc`의 24.17.0, pnpm 10.15.1.
- 측정 커밋 `60d6e305` 고정. 같은 커밋에서 재실행만 반복했으므로 러너 종류·Node 버전·검증 항목이 전부 같고,
  변수는 캐시 유무 하나다.
- 측정 창구: 포크 내부 PR #1(`[측정용 · 머지 금지]`). 워크플로 트리거가 `main` push와 `pull_request`뿐이라
  작업 브랜치에 push하는 것만으로는 run이 생기지 않는다. 포크 안에서 돌려야 캐시 목록을 직접 지울 수 있다.
- run id `34560012066`. cold는 매번 Actions의 Caches에서 캐시를 삭제한 뒤 `Re-run all jobs`,
  warm은 캐시를 남긴 채 `Re-run all jobs`.

## 1. Before — raw 값

전체 wall-clock은 run의 `Total duration`, job은 `quality` job의 소요 시간이다.

| 조건 | 시도 | 전체 run | job |
| --- | --- | --- | --- |
| cold 1 | 최초 실행 | 1:43 (103s) | 1:38 (98s) |
| cold 2 | attempt #5 | 1:36 (96s) | 1:31 (91s) |
| cold 3 | attempt #6 | 1:44 (104s) | 1:38 (98s) |
| warm 1 | attempt #2 | 1:32 (92s) | 1:28 (88s) |
| warm 2 | attempt #3 | 1:43 (103s) | 1:37 (97s) |
| warm 3 | attempt #4 | 1:29 (89s) | 1:24 (84s) |

|  | 중앙값(run) | 범위(run) |
| --- | --- | --- |
| cold | 103s | 96–104 (8s) |
| warm | 92s | 89–103 (14s) |

**cold와 warm의 중앙값 차이는 11초인데 warm 자체의 범위가 14초다.** 즉 이 파이프라인에서
캐시 유무는 측정 흔들림에 묻히는 수준이다. 이유는 아래 step 비교에 그대로 나온다.

> 참고로 이 커밋 이전의 run 하나(`34557799783`, 1:37)는 시각 회귀 기준선이 리눅스용으로 없어서
> 실패했다. 검증 항목이 다르므로 위 표에 넣지 않았다.

## 2. step별 비교 — 캐시가 실제로 바꾸는 것

cold는 attempt #6, warm은 attempt #4다.

| step | cold | warm | 차이 |
| --- | --- | --- | --- |
| Set up job | 2s | 1s | |
| Checkout | 2s | 2s | |
| Set up pnpm | 3s | 4s | |
| Set up Node.js | 6s | 9s | **+3s** (캐시 복원) |
| Install dependencies | 6s | 1s | **−5s** |
| Install Playwright Chromium when used | 24s | 23s | |
| Run quality checks | 46s | 40s | |
| Post Set up Node.js | 5s | 0s | **−5s** (cold만 캐시 저장) |
| 나머지 post·complete | 1s | 1s | |
| **job 합계** | **1:38** | **1:24** | |

캐시가 버는 것은 install 5초와 저장 5초이고, 복원에 3초를 도로 쓴다. 순이익이 한 자릿수 초다.
**cold에서도 `pnpm install --frozen-lockfile`이 6초**라 애초에 줄일 대상이 아니었다.

## 3. 캐시 hit / miss 증명

- **miss (cold, attempt #6)** — `Set up Node.js` 로그 마지막 줄:

  ```
  pnpm cache is not found
  ```

  이어서 `Install dependencies` 6s, job 끝에 `Post Set up Node.js` 5s로 캐시를 저장한다.
  저장 직후 Actions의 Caches 목록에 190MB짜리 항목이 다시 생기는 것을 매 회 확인했다.

- **hit (warm, attempt #4)** — 같은 step:

  ```
  Cache hit for: node-cache-Linux-x64-pnpm-31a81b1aee3f6127babf66fb543e26d386f23aaea2a203fcd6b0d9cbd1593035
  Received 50331648 of 201264474 (25.0%), 48.0 MB/sec
  ```

  `Install dependencies`가 6s → 1s로 줄고, `Post Set up Node.js`는 0s다(이미 같은 키가 있어 저장하지 않는다).

miss 재현은 **캐시를 삭제하는 방식**으로 했다. lockfile을 고쳐 키 해시를 깨는 실험은 아직 하지 않았다 —
그건 "키가 lockfile에서 유도된다"는 것까지 확인하는 실험이라 별도로 남긴다.

## 4. 병목 지목

job 1:38(98초) 기준으로 두 구간이 전체의 71%다.

| 구간 | cold | 비중 |
| --- | --- | --- |
| Run quality checks | 46s | 47% |
| Install Playwright Chromium when used | 24s | 24% |
| 나머지 전부 | 28s | 29% |

`Run quality checks` 안쪽은 로그의 각 도구 출력으로 갈린다. vitest 7.9초(18파일 146개),
Playwright 17.2초(14개, 워커 2개), `next build`가 컴파일 3.3초 + TypeScript 3.8초 + 정적 생성 0.3초,
나머지가 eslint와 tsc다. 이 다섯이 **한 job에서 직렬로** 돈다.

그래서 이 파이프라인의 병목은 "설치가 느리다"가 아니라 **서로 독립인 검증을 한 줄로 세워 둔 것**이고,
그 앞에 캐시를 타지 않는 브라우저 설치 24초가 붙어 있는 구조다.

## 5. 고른 전략과 고르지 않은 전략

| 전략 | 채택 | 근거 |
| --- | --- | --- |
| job 병렬화 | ○ | 병목 1에 직접 대응. lint·typecheck·test는 서로 독립이고 build는 E2E가 그 산출물 위에서 도니 같은 job에 둔다 |
| Playwright `install-deps` 제거 | ○ | 병목 2를 apt와 다운로드로 갈라 재니 16초와 10초였다. apt 로그가 전부 `already the newest version` |
| 브라우저 바이너리 캐시 | ○ | 남은 다운로드 10~11초를 없앤다. `~/.cache/ms-playwright`는 pnpm store 밖이라 setup-node 캐시가 덮지 않는다 |
| pnpm store 캐시 | 손대지 않음 | 이미 켜져 있고, 2절대로 버는 게 한 자릿수 초다. 없는 걸 넣는 게 아니라 이미 있는 걸 그대로 뒀다 |
| `concurrency` 그룹 | ○ (wall-clock 목적 아님) | 한 run을 빠르게 하지 않는다. 같은 PR에 연속 push할 때 쌓이는 run을 없앨 뿐이다. 키에 `github.ref`를 넣어 `main` push까지 취소하지 않게 했다 |

공통 준비(pnpm·Node·install)는 네 job이 똑같이 하므로 `.github/actions/setup` composite로 뺐다.
GitHub Actions에는 YAML 앵커가 없어서 안 빼면 같은 다섯 줄이 네 번 복사되고 갈라진다.

**분할만으로는 안 줄었다.** 첫 After 시도(`74b44bd2`)가 1:49로 Before보다 오히려 길었다.
가장 긴 job인 e2e가 혼자 1:45였기 때문이다. 병렬화는 **가장 긴 job이 기존 직렬 합보다 짧을 때만** 이득인데,
e2e에 준비·브라우저 설치가 통째로 남아 있었다. 그 job의 step을 갈라 본 것이 `install-deps` 16초를 찾은 계기다.

## 6. After — raw 값

측정 방식은 0절과 같다. 커밋 `96a443df`, run `34562346033`. cold는 **캐시 두 개를 모두** 지운다
(pnpm store와 Playwright 브라우저).

| 조건 | 시도 | 전체 run |
| --- | --- | --- |
| cold 1 | attempt #4 | 1:20 (80s) |
| cold 2 | attempt #5 | 1:13 (73s) |
| cold 3 | attempt #6 | 1:06 (66s) |
| warm 1 | 최초(push) | 0:52 (52s) |
| warm 2 | attempt #2 | 0:57 (57s) |
| warm 3 | attempt #3 | 0:56 (56s) |

| 조건 | Before 중앙값(범위) | After 중앙값(범위) | 차이 |
| --- | --- | --- | --- |
| cold | 103s (96–104, 8) | 73s (66–80, 14) | **−30s (−29%)** |
| warm | 92s (89–103, 14) | 56s (52–57, 5) | **−36s (−39%)** |

**줄어든 폭이 흔들림보다 크다.** warm은 Before 범위 14초·After 범위 5초인데 중앙값이 36초 내려갔다.
cold도 범위 8초와 14초에 대해 30초다. 두 분포는 겹치지 않는다.

검증 항목은 Before와 같다. test·lint·typecheck·build·E2E 다섯 그대로고, 무엇도 빼지 않았다.
단위 테스트 146개와 E2E 14개가 양쪽에서 같이 통과한다.

## 7. 무엇이 줄었나 — step 귀속

After의 job별 시간이다. 전체 run은 가장 긴 job으로 정해진다.

| job | cold(attempt #6) | warm(최초) |
| --- | --- | --- |
| lint | 33s | 30s |
| typecheck | 27s | 25s |
| test | 36s | 33s |
| **e2e** | **62s** | **48s** |
| run 전체 | 66s | 52s |

e2e가 양쪽 다 임계 경로다. 그 안쪽(cold)은 이렇다.

| step | cold |
| --- | --- |
| Set up job · Checkout | 2s |
| Setup (pnpm·Node·install) | 14s |
| Cache Playwright browsers (miss) | 0s |
| Install Playwright Chromium | 11s |
| Build | 10s |
| E2E | 16s |
| Post Cache (저장) · Post Setup | 6s |

Before의 단일 job 98초와 비교하면 줄어든 30초의 출처가 분명하다. `install-deps` 16초가 통째로 사라졌고,
lint·typecheck·test 세 검증이 e2e와 같은 시계에서 겹쳐 돈다. warm에서는 브라우저 다운로드 11초까지 빠져 48초가 된다.

**벽시계는 줄었지만 러너 시간은 늘었다.** job마다 checkout과 설치를 따로 하기 때문이다.
같은 cold 3회차끼리 비교하면 단일 job 98초가 네 job 합 158초가 된다(33+27+36+62).
warm도 84초에서 136초(30+25+33+48)다. 약 60% 늘어난 셈이다. 이 저장소는 public이라
Actions 사용료가 0이어서 벽시계만 보고 택했지만, 사설 러너나 유료 조직이었다면
같은 선택이 손해일 수 있다. 과제 함정 문구가 짚는 "install 중복으로 캐시 이득을 까먹는" 구조가 이것이다.

**캐시 저장 비용은 흔들린다.** 같은 270MB를 저장하는데 한 번은 28초, 다른 한 번은 3초였다.
저장은 lockfile이 바뀌어 키가 달라질 때만 생기므로 대부분의 run은 부담이 없지만,
"캐시는 항상 이득"이라고 적기에는 관측이 일정하지 않아 그대로 남긴다.

## 8. 사고 기록 — 잘못 핀한 action이 초록불로 통과했다

job 분리 커밋(`74b44bd2`)에서 `actions/cache`를 이렇게 핀했다.

```
uses: actions/cache@d8cd72f230726cdf4457ebb61ec1b593a8d12337 # v6.1.0
```

주석은 v6.1.0인데 이 SHA는 태그가 아니다. `git ls-remote`로 대조하니 **`refs/pull/1768/head`**,
즉 PR #1768 브랜치의 head 커밋이었다. v6.1.0의 실제 커밋은 `55cc8345863c7cc4c66a329aec7e433d2d1c52a9`다.

**그런데 CI는 초록불이었다.** 잘못된 핀은 실패로 드러나지 않는다.

이 건은 결과적으로 위험하지 않았다. PR #1768은 제목이 "Bump @actions/cache to v6.1.0"이고
6월 24일에 머지됐다. 즉 리뷰를 거친 코드이고 내용도 v6.1.0과 사실상 같다. 처음에는 `refs/pull/`이라는
ref 이름만 보고 "머지되지 않은 PR"이라고 적었는데, PR 페이지를 열어 확인하니 사실이 아니었다.
그 오기는 커밋 `2e5b9f08`의 메시지에도 남아 있다 — 이미 push한 뒤라 메시지 대신 여기에 정정을 남긴다.

위험하지 않았던 건 운이다. **핀이 가리킨 것은 저장소가 릴리스로 보증하는 커밋이 아니다.**
커밋 SHA로 핀하는 목적이 "태그가 옮겨가도 같은 코드를 쓴다"인데, 검증 없이 적으면
릴리스가 아닌 임의의 ref를 고정하게 된다. 같은 실수가 다른 SHA였다면 아무도 리뷰하지 않은
커밋을 고정했을 것이고, 그때도 CI는 똑같이 초록불이었을 것이다.

정정은 `2e5b9f08`. 같이 핀 4개를 전수 대조했다.

```
git ls-remote https://github.com/<owner>/<repo> 'refs/tags/*' | grep <sha>
```

`actions/checkout@9c091bb`(v7.0.0)와 `actions/setup-node@48b55a0`(v6.4.0)은 그대로 맞았다.
`pnpm/action-setup@0ebf471`은 `refs/tags/v6.0.9`가 `008330…`으로 나와 한 번 어긋나 보였는데,
annotated 태그라 태그 객체와 커밋이 다른 경우였다. `refs/tags/v6.0.9^{}`가 `0ebf471`이므로 핀이 맞다.

## 9. 2단계 — 조건부 실행

### 조건을 붙인 것은 e2e 하나뿐이다

1단계 측정에서 e2e가 임계 경로이자 가장 비싼 job이었다(cold 62초·warm 48초, 나머지는 25~36초).
조건을 붙일 값어치가 있는 검증은 이것 하나다.

lint·typecheck·test에는 조건을 붙이지 않았다. 저비용 결정적 검증이라는 일반론 때문만은 아니다.
**이 저장소에서는 "문서만 바꿨으니 검증을 건너뛰어도 된다"가 사실이 아니다.**
`src/app/api/_data/commerce.test.ts`가 `docs/assets/week-05-product-images.md`를
`readFileSync`로 읽어 상품 이미지 목록을 대조한다. 문서 하나를 고치면 단위 테스트가 깨질 수 있다.
경로 필터를 이 세 job에 붙였다면 그 실패를 스킵으로 덮었을 것이다.

### 수단 — workflow `on.paths`가 아니라 job 분기

`on.pull_request.paths`는 workflow 자체를 트리거하지 않으므로 lint·typecheck·test까지 같이 사라진다.
"저비용 검증은 모든 PR에서"와 정면으로 부딪힌다. 그래서 `dorny/paths-filter`로 판정만 한 번 하고
그 결과를 job 사이로 넘기는 구조를 택했다.

```yaml
changes:
  outputs:
    e2e: ${{ steps.filter.outputs.e2e }}
e2e:
  needs: changes
  if: github.event_name != 'pull_request' || needs.changes.outputs.e2e == 'true'
```

판정은 **PR에서만** 한다. `main` push는 조건 없이 전부 돈다.

### 무엇을 스킵하고, 왜 안전한가

e2e를 돌리는 경로는 `src/**`, `e2e/**`, `public/**`, `package.json`, `pnpm-lock.yaml`,
`next.config.ts`, `playwright.config.ts`, `tsconfig.json`, `.github/**`이다.
여기 없는 것 중 실제로 스킵되는 건 `docs/**`, `*.md`, `scripts/**`, `fixtures/**`다.

안전 논리는 세 겹이다.

1. e2e는 production build 위에서 앱을 조작한다. 스킵 대상 네 경로는 번들에 들어가지 않으므로
   빌드 산출물이 같고, 같은 산출물에 같은 스펙을 돌리면 결과가 같다.
2. 스킵되는 PR에서도 lint·typecheck·test는 그대로 돈다. 위에서 적은 docs 의존도 여기서 잡힌다.
3. `main` push에서 조건 없이 한 번 더 돈다. 필터가 틀렸더라도 머지 직후에 드러난다.

세 번째는 게이트가 아니라 사후 방어선이다. merge queue를 쓰면 머지 직전에 막을 수 있지만,
이 저장소는 혼자 쓰는 포크라 큐를 둘 만큼의 동시성이 없다고 보고 넣지 않았다.

### required와 조건부 스킵의 충돌

과제가 짚은 함정이다. e2e를 branch protection의 required로 걸면, 조건에 걸리지 않은 PR에서는
그 체크가 아예 보고되지 않아 "대기" 상태로 영영 머지되지 않는다.

그래서 `e2e-gate`를 따로 뒀다. `needs: e2e` + `if: always()`라 항상 돌고,
`needs.e2e.result`가 `success`거나 `skipped`면 통과, 그 외(`failure`·`cancelled`)면 실패한다.
required로 둘 체크는 `lint`·`typecheck`·`test`·`e2e-gate` 넷이고 `e2e`는 넣지 않는다.

### 자가 검증 — PR 두 개

조건에 걸리는 PR과 안 걸리는 PR을 하나씩 만들어 같은 워크플로가 갈라지는 것을 확인했다.
둘 다 `feat/week-10`을 base로 하는 draft PR이고 머지하지 않는다.

| PR | diff | run | e2e | 전체 |
| --- | --- | --- | --- | --- |
| #2 문서 전용 | `docs/rfc/week10-ci.md` 한 줄 | Quality #8 | **skipped** | 39s |
| #3 소스 변경 | `src/app/gallery/stories.ts` 주석 한 줄 | Quality #9 | 실행 | 1m 30s |

두 PR 모두 `changes`·`lint`·`typecheck`·`test`·`e2e-gate`는 초록불이다. 갈린 건 `e2e` 하나뿐이고,
**문서만 바꾼 PR에서 51초가 줄었다.**

required 충돌도 여기서 확인됐다. PR #2에서 `e2e`는 스킵인데 `e2e-gate`는 통과다.
gate를 required로 걸어두면 이 PR은 정상적으로 머지 가능 상태가 된다. e2e를 직접 required로
걸었다면 "대기"에서 멈췄을 자리다.

### flaky 정책

`retries: process.env.CI ? 1 : 0`.

재시도를 실패를 감추는 장치로 쓰지 않는다. Playwright는 재시도 뒤 통과한 테스트를 `flaky`로
따로 세어 보고하므로, 재시도는 결과를 숨기는 대신 **흔들림에 이름을 붙인다**. 진짜 실패는
1회 재시도로도 그대로 실패한다. 로컬은 0을 유지한다 — 흔들림을 그 자리에서 보는 편이 낫다.

반복해서 flaky로 찍히는 스펙이 생기면 `test.fixme`로 격리하고 이슈로 남긴다. 지금까지 CI에서
e2e를 열 번 넘게 돌리는 동안 흔들린 적은 없어서, 이 정책은 아직 실제로 발동한 적이 없다.

## 10. 3단계 — 예산 게이트

### 번들 예산: 첫 정의는 틀렸고, 실험이 그걸 잡았다

처음에는 `build-manifest.json`의 `rootMainFiles + polyfillFiles`(프레임워크 셸, gzip 167.7KB)에
예산을 걸었다. "사용자가 첫 화면에서 받는 양"이라고 생각했다.

걸기 전에 한 가지를 확인했다. **이 숫자가 앱 코드 변경에 반응하는가.**
클라이언트 컴포넌트(`AnalyticsProvider`, 루트 레이아웃에 있다)에 128KB짜리 모듈을 억지로
물려 빌드했다. 결과는 **167.7KB로 1바이트도 움직이지 않았다.** 그 128KB는 셸이 아니라
별도 청크(`static/chunks/038cxj3jcb4az.js`)로 나갔다.

셸은 Next 런타임이라 우리 코드로 바뀌지 않는다. 앱 변경에 반응하지 않는 예산은 회귀를 막지 못하고
Next 업그레이드 때만 울린다. 그래서 대상을 **클라이언트 JS 전체**로 바꿨다.

| 항목 | gzip |
| --- | --- |
| 클라이언트 JS 전체 (21개) | **237.5KB** |
| 그중 프레임워크 셸 | 167.7KB |
| 그중 앱 코드 | 69.8KB |

측정에서 두 번 더 걸렸다. **파일별로 gzip해서 더해야 한다** — 전부 이어붙여 한 번에 압축하면
사전이 공유돼 224.5KB로 13KB 작게 나오는데, 브라우저는 파일을 각각 받으므로 그건 실제 전송량이
아니다. 그리고 `.next`를 지우지 않고 다시 빌드하면 **이전 빌드의 청크가 남아** 숫자를 부풀린다.
CI는 매번 새 체크아웃이라 해당 없지만 로컬에서는 클린 빌드로 재야 한다.

### 임계값 261KB — 어디서 나왔나

실측 237.5KB에 여유 10%를 얹었다. 여유 23.5KB는 의존성 하나 추가나 기능 두어 개는 통과시키고,
차트 라이브러리급이 들어오면 걸리는 폭이다.

7주차 스로틀 모델(1474.56Kbps = 184.32KB/s)로 환산하면 지금이 **1.29초**, 예산선이 **1.42초**다.
7주차 최종 LCP가 3,073ms였으니 JS 전송이 그 40% 남짓을 차지한다. 이 환산이 두 주차를 잇는 다리다 —
7주차는 이미지가 지배 구간이라 JS를 재지 않았고, 남긴 건 전송 실측값과 스로틀 가정이다.

**size-limit을 쓰지 않았다.** Next 청크 파일명은 빌드마다 해시가 바뀌어 glob으로 특정 묶음을
골라낼 수 없다. 무엇이 무엇인지는 매니페스트가 정의하므로 그걸 읽어 재는 쪽이 정확하다.
과제가 "또는 동등 도구"를 허용하는 자리로 보고 `scripts/check-bundle-budget.mts`를 썼다.

**한계는 적어 둔다.** 지연 로드되는 라우트 청크까지 포함하므로 "첫 화면 비용"이 아니라
"우리가 내보내는 총량"이다. 진입점별로 가르려면 앱을 띄워 HTML의 script 태그를 읽어야 하는데,
Turbopack 빌드가 라우트별 클라이언트 매니페스트를 남기지 않아 그 복잡도를 지금은 지지 않는다.

### 환경 변수: 문제는 "없으면 실패"가 아니라 "없어도 조용히 뜬다"

이 앱이 읽는 환경 변수는 둘뿐이고 둘 다 기본값으로 넘어간다.

| 변수 | 없을 때 | 결과 |
| --- | --- | --- |
| `APP_ORIGIN` | `http://localhost:3000` | metadata·OG가 localhost를 가리키고 서버 fetch가 자기 자신을 못 찾는다 |
| `AUTH_SESSION_SECRET` | `loopers-week09-secret` | **저장소에 적힌 문자열로 세션을 서명한다.** 누구나 위조할 수 있다 |

그래서 이 게이트는 "값이 없다"를 잡는 게 아니라 **침묵을 깬다.**

`scripts/validate-env.mts`는 두 모드다. 기본은 형식만 본다 — `NEXT_PUBLIC_` 접두사가 붙은
민감한 이름, URL로 해석되지 않는 `APP_ORIGIN`, origin이 아닌 경로. `--strict`는 배포를 가정해
필수 존재·기본값 금지·localhost 금지·32자 미만까지 본다.

**CI는 기본 모드로 돌린다.** 이 저장소에는 배포가 없어 CI 빌드는 기본값으로 돈다.
없는 배포를 있는 척하며 `--strict`를 걸면 매 PR이 빨간불이 될 뿐이라, strict는 배포 파이프라인의
몫으로 남긴다. 자가 검증은 네 가지로 했다.

| 입력 | 결과 |
| --- | --- |
| 아무것도 없음 | 통과 (format) |
| `NEXT_PUBLIC_AUTH_SESSION_SECRET=x` | 실패 — 클라이언트 번들에 박힌다 |
| `APP_ORIGIN=not-a-url` | 실패 — URL로 해석되지 않는다 |
| `--strict` + 기본 시크릿 | 실패 — 저장소에 적힌 값이다 |

### 빨간불 자가 검증 — PR #4

`chart.js`를 넣고 루트 레이아웃의 클라이언트 컴포넌트에서 쓰지도 않으면서 import했다.
과제가 예로 든 "큰 라이브러리를 무의미하게 import"가 그대로다.

| 체크 | 결과 |
| --- | --- |
| changes · lint · typecheck · test · e2e · e2e-gate | 초록 |
| **budget** | **빨강** |
| **budget-gate** | **빨강** |

`budget-gate`가 두 방향으로 검증됐다. PR #2에서는 **스킵을 통과**시켰고, 여기서는 **실패를 막았다**.
스킵과 실패를 같은 자리에서 구분한다는 뜻이고, 이게 required로 둘 수 있는 조건이다.

PR 화면에는 job summary가 `budget summary` 카드로 뜬다. 로그를 열지 않아도 초과 사실과
얼마나 넘었는지, 셸과 앱 코드의 몫이 표로 보인다.

```
❌ 예산 초과 — 43.6KB 넘었다 (304.6KB > 261.0KB)
클라이언트 JS 전체(22개) 304.6KB · 그중 셸 167.9KB · 그중 앱 코드 136.7KB · 예산 261.0KB
```

CI의 셸이 167.9KB로 로컬 167.7KB와 0.2KB 다르다. 플랫폼 차이로 보이고, 여유 23.5KB에 비하면
무시할 수준이라 예산선을 흔들지 않는다.

환경 변수 게이트도 같은 job에서 돌았다(`Validate env`, 0초, 통과). 빌드 앞에 있으므로 설정이
틀리면 번들을 재기 전에 멈춘다.

### 배치와 가시성

예산도 빌드가 있어야 재므로 `bundle` 경로 필터에 걸고 `budget-gate`로 받는다. e2e와 같은 구조다.
필터는 e2e와 다르다 — `e2e/**`와 `public/**`은 첫 화면 JS 크기를 바꾸지 않는다.

결과는 `$GITHUB_STEP_SUMMARY`로 올린다. 초과 여부, 얼마나 넘었는지, 셸과 앱 코드의 몫,
스로틀 환산까지 PR 화면에서 바로 보인다. 로그를 열어야만 보이면 실무에서 안 본다.

### required를 실제로 걸어 보니

`feat/week-10`에 classic branch protection을 걸었다. required는 다섯이다.

| 체크 | required | 이유 |
| --- | --- | --- |
| `lint` · `typecheck` · `test` | ○ | 저비용 결정적 검증. 항상 돈다 |
| `e2e-gate` · `budget-gate` | ○ | 조건부 검증을 대신 받는 자리 |
| `e2e` · `budget` | ✗ | 조건부라 스킵될 수 있다. 걸면 스킵된 PR이 영영 대기한다 |
| `changes` | ✗ | 판정만 하는 보조 job이다. 막을 것이 없다 |

"Require a pull request before merging"과 "Do not allow bypassing"은 껐다. 켜면 `feat/week-10`에
직접 push를 못 해 지금 작업 방식이 막힌다. 혼자 쓰는 포크라 사람 리뷰 강제는 의미가 없고,
막고 싶은 건 **검증을 통과하지 않은 코드**지 PR 없는 머지가 아니다.

결과는 두 PR에서 갈린다.

| PR | 체크 | 머지 |
| --- | --- | --- |
| #2 문서 전용 | 2 skipped(`e2e`·`budget`), 6 successful | **가능** — All checks have passed |
| #4 예산 초과 | `budget`·`budget-gate` 빨강 | **차단** |

#2가 과제가 말한 충돌이 없다는 증거다. 조건부로 스킵된 검증이 required를 막지 않는다.
#4는 gate가 실패를 그대로 넘긴다는 증거다.

### 예상하지 못한 함정 — required 추가는 열린 PR을 멈춘다

required를 건 직후 PR #2가 `budget-gate`에서 **`Expected — Waiting for status to be reported`**
상태로 멈췄다. 조건부 실행 때문이 아니었다. **PR #2의 브랜치가 `budget` job이 생기기 전에
갈라져 나와서**, 그 PR이 도는 워크플로에는 `budget-gate` job 자체가 없었다.
보고할 주체가 없으니 GitHub은 무한정 기다린다.

브랜치에 base를 머지해 워크플로를 최신으로 만드니 바로 보고됐다.

이건 과제가 짚은 "조건부 스킵과 required의 충돌"과는 다른 축이다. **required 체크를 새로 추가하는 것은
이미 열려 있는 모든 PR에 대한 breaking change다.** 추가하는 순간 그 PR들은 전부 대기 상태가 되고,
각자 base를 머지해야 풀린다. 혼자 쓰는 저장소라 PR 세 개로 끝났지만, 팀이었다면 추가 시점에
열려 있던 PR 전부를 건드려야 했을 것이다. 실무에서는 조건부 충돌보다 이쪽을 더 자주 밟을 것 같다.

## 11. 남은 것

- [ ] lockfile 해시를 깨서 miss 재현 (3절). 지금은 캐시 삭제로만 miss를 봤다.
- [x] 2단계 자가 검증. PR #2·#3으로 확인했다(9절).
- [x] 3단계 빨간불 자가 검증. PR #4로 확인했다(10절).
- [ ] 실험 브랜치·PR #2·#3·#4는 근거로만 남기고 머지하지 않는다. 제출 전에 닫을지 열어둘지 정한다.
- [ ] Lighthouse 정기 실행(선택). 배포가 없어 러너에서 띄워 재야 하고, 7주차 LCP를 임계값으로
      옮길 수 없다. 임계값 없이 기록만 남기는 것으로 시작한다.
- [x] branch protection required 다섯 개를 실제로 걸고 두 PR로 확인했다(10절).
- [ ] 시각 회귀 spec을 e2e job 안에 그대로 둘지. 지금은 나머지 E2E와 같이 돈다.
- [ ] `pnpm format:check`가 CI에 없다. `pnpm check`에 원래 없어서 Before와 조건을 맞추려고 그대로 뒀다.
      지금 포맷 게이트는 husky뿐이라 `--no-verify`나 웹 편집으로 들어오면 아무도 막지 않는다.
      넣으면 검증 항목이 Before와 달라지므로, 넣은 시점을 명시하고 After 수치는 지금 것을 유지한다.
