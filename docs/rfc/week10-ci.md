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

## 9. 남은 것

- [ ] lockfile 해시를 깨서 miss 재현 (3절). 지금은 캐시 삭제로만 miss를 봤다.
- [ ] 2단계 조건부 실행. e2e가 임계 경로이자 가장 비싼 job이라 대상이 분명하다.
- [ ] 시각 회귀 spec을 e2e job 안에 그대로 둘지. 지금은 나머지 E2E와 같이 돈다.
- [ ] `pnpm format:check`가 CI에 없다. `pnpm check`에 원래 없어서 Before와 조건을 맞추려고 그대로 뒀다.
      지금 포맷 게이트는 husky뿐이라 `--no-verify`나 웹 편집으로 들어오면 아무도 막지 않는다.
      넣으면 검증 항목이 Before와 달라지므로, 넣은 시점을 명시하고 After 수치는 지금 것을 유지한다.
