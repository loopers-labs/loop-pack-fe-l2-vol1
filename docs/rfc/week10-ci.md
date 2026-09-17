# 10주차 CI — 측정과 조건부 실행

## A. 측정 방법

같은 커밋에서 반복 실행하고, 실행마다 run URL · commit SHA · 캐시 상태 · 스텝별 시간을 남긴다.

**측정 PR** — 포크 안에 `feature/week10 → measure/week10-base` PR을 연다(`hyungkishin/loop-pack-fe-l2-vol1#2`). 베이스를 커밋 1 직전 SHA(`5b29c432`)로 잡아 diff를 workflow 한 파일로 제한했다. 포크의 `main`은 1주차 시점에 멈춰 있어 그리로 열면 10주치 3만 줄이 잡히고 경로 판정 실험까지 오염된다.

**이 PR은 병합 대상이 아니다.** `main`에 합칠 수 있는지를 보는 PR이 아니라 PR 이벤트에서 workflow가 어떻게 동작하는지 재는 실험 PR이다. required status check와 branch protection 검증은 최종 upstream PR에서 따로 한다.

**반복 실행 수단** — `workflow_dispatch`는 workflow가 기본 브랜치에 있어야 동작한다. 이 변경이 `main`에 들어가기 전까지는 Actions의 Re-run jobs를 쓰고, 병합 이후에는 `workflow_dispatch`를 쓴다.

**최초 실행은 통계에서 뺀다.** 캐시가 없는 상태라 조건이 다르다. 별도로 표기한다.

### 캐시 상태 표기

| 대상 | 상태 |
| --- | --- |
| pnpm store (`setup-node`의 `cache: pnpm`) | hit / miss 구분 |
| Playwright browser cache | **미적용** |
| runner | 매 실행 새 GitHub-hosted runner |

Playwright 설치를 hit/miss로 부르지 않는다. 캐시를 걸지 않았으므로 매 실행 새로 받는다.

## B. 기준 측정 (커밋 `e72b8d93`)

run `34498716030` · https://github.com/hyungkishin/loop-pack-fe-l2-vol1/actions/runs/34498716030

| 실행 | pnpm store | job 전체 |
| --- | --- | ---: |
| 최초 (시도 1) | miss | 115s |
| Re-run 1 | hit | 111s |
| Re-run 2 | hit | 130s |
| Re-run 3 | hit | 112s |

pnpm hit 3회 기준 **중앙값 112s, 범위 111~130s**.

서로 다른 무해한 lockfile 주석으로 setup-node의 key를 세 번 바꿨다. 세 로그 모두 `pnpm cache is not found`를 출력하고 서로 다른 key를 저장했다. 브라우저 캐시는 세 실행 모두 적용하지 않았다.

| cold 실행 | PR | install | job 전체 | Actions |
| --- | --- | ---: | ---: | --- |
| 1 | [#6](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/pull/6) | 4.9s | 107s | [run 34541863877](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/actions/runs/34541863877) |
| 2 | [#8](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/pull/8) | 6.0s | 115s | [run 34541865636](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/actions/runs/34541865636) |
| 3 | [#7](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/pull/7) | 6.1s | 103s | [run 34541866613](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/actions/runs/34541866613) |

cold 중앙값은 **107s, 범위 103~115s**다. install 중앙값은 6.0s로 warm의 2s보다 4s 길지만 job 전체는 runner 변동에 묻혀 cold가 더 느리다고 볼 수 없다. 캐시 hit은 의존성 설치 구간을 줄인다는 범위까지만 증명한다.

| 스텝 | R1 | R2 | R3 | 중앙값 |
| --- | ---: | ---: | ---: | ---: |
| Install dependencies | 2 | 2 | 2 | 2 (miss일 때 7) |
| Install Playwright system deps | 14 | 28 | 13 | 14 |
| Download Playwright Chromium | 11 | 11 | 11 | 11 |
| Architecture check | 1 | 1 | 0 | 1 |
| Unit and DOM tests | 20 | 17 | 20 | **20** |
| Storybook tests | 9 | 10 | 8 | 9 |
| Lint | 5 | 4 | 5 | 5 |
| Typecheck | 4 | 4 | 4 | 4 |
| Build | 11 | 10 | 10 | 10 |
| Build Storybook | 3 | 4 | 4 | 4 |
| E2E | 14 | 14 | 14 | 14 |

### 스텝을 나누기 전에는 지목할 수 없었다

GitHub Actions는 스텝 단위로만 시간을 기록한다. 이전 workflow는 `pnpm check` 한 줄로 여덟 검증을 직렬 실행해 로그에 총합 65초만 남았고, Playwright도 `install --with-deps` 하나라 apt 의존성과 브라우저 다운로드가 한 단계로 합쳐져 있었다.

### 가설이 깨진 지점

작업 전 관측한 기존 run 2건에서 Playwright 설치가 176초로 찍혀 있었다. 그것을 브라우저 다운로드로 귀속한 초안의 결론은 **표본 4개에서 재현되지 않았다.** `install-deps` 13~28초 + 다운로드 11초로 합쳐 24~39초다.

특히 다운로드 11초는 **세 표본에서 편차가 0**이다. 여기에 캐시를 붙여도 최대 11초를 아끼는데 복원 비용을 빼면 남는 것이 거의 없다. Playwright 공식 문서가 브라우저 캐시를 권장하지 않는 근거와 측정이 일치한다. **브라우저 캐시는 채택 후보에서 내린다.**

## C. 개선 대상 선정

setup 구간(2 + 14 + 11 = 27s)과 검증 체인(65s)으로 갈린다.

**검증 항목과 실행 횟수는 유지한다.**

초안은 병렬화를 "설치 중복 비용을 재기 전까지 적용하지 않는다"로 기각했다. 근거가 병목과 맞지 않았다. `.next` 의존은 E2E와 번들 예산만의 제약인데 lint·typecheck·unit·Storybook까지 같은 이유로 묶었다. 그 넷은 `.next`를 쓰지 않는다. 그래서 재기로 했다.

### 실험 A — chromium 다운로드를 headless shell로 좁힌다

현재 다운로드 스텝은 셋을 받는다.

```
Chrome for Testing 151.0.7922.34
FFmpeg (playwright ffmpeg v1011)
Chrome Headless Shell 151.0.7922.34
```

이 저장소는 channel 지정 없이 headless로만 쓴다 — `playwright.config.ts`의 chromium 프로젝트, `vitest.config.ts`의 storybook 프로젝트(`headless: true`).

**채택 기준 (실험 전 고정)**

```
기능 검증 동일 (Storybook 18 · E2E 12 통과)
AND setup 중앙값이 측정 편차보다 크게 감소
AND job 전체 중앙값도 감소
```

다운로드 스텝만 줄고 job 전체가 기존 범위 111~130s 안에 머무르면 "다운로드는 줄었지만 전체 개선은 판정 불가"로 기록한다.

**결과** — SHA `340d77f6`, 3회, 전부 pnpm hit. run [`34505357684`](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/actions/runs/34505357684)

| 항목 | R1 | R2 | R3 | 중앙값 | baseline 중앙값 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Download Chromium | 6 | 7 | 5 | **6s** | **11s** (편차 0) |
| Install Playwright system deps | 14 | 15 | 15 | 15s | 14s (범위 13~28) |
| Install dependencies | 2 | 2 | 3 | 2s | 2s |
| setup 합 | 22 | 24 | 23 | **23s** | **27s** |
| job 전체 | 112 | 114 | 109 | **112s** | **112s** (범위 111~130) |

다운로드 대상이 실제로 좁혀졌다.

```
before   Chrome for Testing 151.0.7922.34
         FFmpeg (playwright ffmpeg v1011)
         Chrome Headless Shell 151.0.7922.34

after    FFmpeg (playwright ffmpeg v1011)
         Chrome Headless Shell 151.0.7922.34
```

기능 검증은 3회 모두 동일하다 — 단위·통합 375(48파일), Storybook 18(7파일), E2E 12. pnpm 캐시는 3회 모두 `Cache restored from key: node-cache-Linux-x64-pnpm-a0d0503a…`.

**판정 — 채택하지 않는다.**

`--only-shell`은 다운로드 단계를 중앙값 11초에서 6초로 줄였고, 다운로드 대상에서 Chrome for Testing을 제거했다. 그러나 setup 중앙값 감소는 `install-deps`의 변동 범위에 포함됐으며 job 전체 중앙값은 112초로 변하지 않았다. 사전에 정한 채택 기준을 충족하지 못했으므로 workflow에는 반영하지 않는다. 176초 이상치 감소 가능성은 이번 실험으로 검증되지 않아 근거로 사용하지 않는다.

이상치를 근거로 쓸 수 없는 이유를 남긴다. 그 값은 스텝을 분리하기 전 단일 스텝에서 관측했고, 시스템 의존성과 브라우저 다운로드를 구분할 수 없으며, 당시 조건에서 재현되지 않았다.

### 이상치의 정체가 upstream 실행에서 드러났다

최종 제출 실행([run 34594937306](https://github.com/loopers-labs/loop-pack-fe-l2-vol1/actions/runs/34594937306))에서 `runtime` job이 429초였다. 스텝별로 보면 하나가 전부였다.

| 스텝 | 소요 |
| --- | ---: |
| Install Playwright system deps | **347s** |
| E2E | 13s |
| Download Playwright Chromium | 11s |
| Build | 11s |
| Storybook tests | 10s |

`install-deps`는 포크 러너에서 13~28초였다. 같은 명령이 347초가 됐다. 176초 이상치의 정체가 여기였다는 것이 이제 확인된다. **브라우저 다운로드가 아니라 apt 의존성 설치다.** 다운로드는 이 실행에서도 11초로, 세 표본에서 편차 0이었던 값과 같다.

그래서 `--only-shell`을 기각한 판정은 맞았다. 다운로드를 6초로 줄여도 347초짜리 스텝 옆에서는 의미가 없다.

**지금 가장 큰 병목은 `install-deps`이고, 변동 폭은 13초에서 347초다.** 중앙값만 보면 14초라 세 번째 순위였는데, 최악값을 보면 나머지를 모두 합친 것보다 크다. 중앙값으로 병목을 고른 것의 한계다.

이 스텝을 제거하는 것은 여전히 기각한다(아래 참조). 대신 제거하지 않고 줄이는 수단이 둘 있다.

| 수단 | 기대 | 대가 |
| --- | --- | --- |
| apt 아카이브 캐시 | 다운로드 구간만 줄인다. 설치 시간은 남는다 | 캐시 키 관리, 러너 이미지 갱신 시 무효화 |
| Playwright 공식 컨테이너 이미지로 job 실행 | `install-deps`와 다운로드를 둘 다 없앤다 | 이미지의 Node 버전이 `.nvmrc`와 갈릴 수 있다. 실행 환경이 바뀌므로 8·9주차 테스트 계약을 다시 확인해야 한다 |

둘째가 기댓값이 크지만 실행 환경을 바꾼다. **측정 없이 채택하지 않는다.** 사전 기준을 정하고 재는 것을 다음 작업으로 남긴다 — 이번 주 내내 쓴 절차를 그대로 적용한다.

실험 커밋(`340d77f6`)은 히스토리에 남기고 복구를 별도 커밋으로 뒀다. 다운로드가 실제로 병목이 되는 날 이 측정이 출발점이 된다.

### 실험 B — 검증을 두 job으로 나눈다

측정 PR 세 개를 같은 base로 열고 warm 3회씩 쟀다. 검증 집합은 세 arm 모두 같다.

| 구성 | PR | warm raw | 중앙값 | 범위 |
| --- | --- | --- | ---: | ---: |
| 단일 job, 스텝 12개 | [#9](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/pull/9) | 130, 119, 106s | **119s** | 106~130 |
| 단일 job, `pnpm check` 한 줄 | [#10](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/pull/10) | 101, 103, 112s | **103s** | 101~112 |
| 2 job 임계경로 | [#11](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/pull/11) | 86, 94, 83s | **86s** | 83~94 |

**채택 기준 (실험 전 고정)**

```
검증 항목 동일
AND 임계경로 중앙값이 baseline 범위의 하한보다 낮음
```

**판정 — 채택한다.** 임계경로 중앙값 86초는 baseline 범위 하한 106초보다 낮다.

### 같은 구성을 다시 재니 범위가 넓었다

게이트를 여섯 개 더한 뒤 채택 구성을 한 번 더 쟀다([#12](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/pull/12)).

| 회차 | warm raw | 중앙값 | 범위 |
| --- | --- | ---: | ---: |
| 1차 (#11) | 86, 94, 83s | 86s | 83~94 |
| 2차 (#12, 게이트 6개 추가) | 118, 95, 75s | 95s | 75~118 |
| 합산 6회 | 75, 83, 86, 94, 95, 118s | 90s | 75~118 |

**앞서 적었던 "두 측정 범위가 겹치지 않는다"는 표본 3개에 기댄 진술이었다.** 6개로 보면 단일 job 범위(106~130)와 2 job 범위(75~118)가 위쪽에서 겹친다. 정정한다.

채택 판단은 유지한다. 근거를 좁혀서 다시 쓴다 — 중앙값은 119초와 90초로 갈리고, 2 job 표본 6개 중 5개가 단일 job 최소값 106초보다 낮다. 2차 구성은 검증이 여섯 개 더 많은데도 그렇다. 다만 **한 번의 실행만 보고 판단할 수 있는 차이는 아니다.** GitHub 공유 러너의 변동이 우리가 줄인 폭과 같은 자리수다.

### 실험 C — Next build 캐시를 복원한다

`build` 스텝이 매 실행 Next 캐시 없이 돈다. 1단계에서 검토조차 하지 않았던 최적화라 사전 기준을 정하고 쟀다([#13](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/pull/13)).

**채택 기준 (실험 전 고정)**

```
검증 항목 동일
AND 임계경로 중앙값이 비교 대상(#12) 범위의 하한보다 낮음
```

| 항목 | #12 (캐시 없음) | #13 (캐시 있음) |
| --- | ---: | ---: |
| runtime raw | 118, 95, 75s | 90, 85, 86s |
| 임계경로 중앙값 | 95s | **86s** |
| 범위 | 75~118 | 85~90 |

캐시는 실제로 복원됐다 — `Restore Next build cache: Cache restored successfully`. 걸어두고 hit을 확인하지 않는 실수는 하지 않았다.

**판정 — 채택하지 않는다.** 중앙값이 9초 낮아 보이지만 비교 대상의 범위 하한 75초보다 높다. 사전 기준을 충족하지 못한다. 눈에 띄는 것은 오히려 **범위가 85~90으로 좁아진 것**인데, 표본 3개로 분산 감소를 주장할 수는 없고 그것은 사전 기준도 아니었다.

`build` 스텝 자체가 10초다. 캐시가 완벽히 동작해도 임계경로에서 아낄 수 있는 상한이 그 안에 있다. 나중에 build가 실제로 길어지면 이 측정이 출발점이 된다.



`static`은 브라우저도 `.next`도 쓰지 않아 Playwright 설치 27초를 아예 치르지 않는다. `runtime`에는 Storybook 테스트, build, 번들 예산, 조건부 E2E가 남는다.

**대가를 함께 적는다.** 총 runner 시간은 119초에서 137초(54 + 83)로 늘었다. install이 job마다 한 번씩 돌기 때문이다. 사람이 기다리는 시간 33초를 총 compute 18초와 바꾼 것이다. 공유 러너 한도가 병목이 되면 이 교환을 다시 본다.

### 함께 나온 것 — 스텝 분리는 무료가 아니었다

같은 측정에서 예상하지 않은 값이 나왔다. `pnpm check` 한 줄 구성이 스텝 12개 구성보다 중앙값 **16초 빠르다**(103s 대 119s). 두 범위도 거의 겹치지 않는다(101~112 대 106~130).

스텝마다 `pnpm`이 새로 기동하는 비용이다. B절에서 "스텝을 나누기 전에는 병목을 지목할 수 없었다"고 적었는데, 그 관측 능력의 값이 16초였다는 것이 이제 숫자로 남았다.

**그래도 나눈 구성을 유지한다.** 어느 검증이 느린지 모르는 상태로 돌아가면 다음 최적화의 출발점이 없어진다. 13%를 관측 비용으로 지불하는 선택이고, 병렬화가 그보다 큰 33초를 돌려줬다.

이 값은 애초 기준 측정(B절)에 없던 정보다. B절은 이미 스텝을 나눈 뒤 잰 값이라 Before가 아니었다. 같은 검증 집합의 한 줄 구성을 따로 재고 나서야 분리 비용이 분리됐다.

### 실험하지 않고 기각한 것 — `install-deps` 제거

`install-deps` 스텝은 13~28초로 변동이 가장 크다. 제거하면 현재 runner에서 통과할 가능성이 있다.

그래도 실험하지 않는다. GitHub `ubuntu-latest` 이미지에 우연히 설치된 시스템 패키지 구성에 의존하기 때문이다. 3회 통과해도 runner 이미지가 갱신되면 다시 깨진다. Playwright의 공식 CI 계약도 Linux에서 `install --with-deps` 또는 동등한 의존성 설치를 요구한다. E2E 통과는 현재 이미지가 충분조건임을 보일 뿐, 미래 runner에서도 안전하다는 보장이 아니다.

## D. 조건부 E2E

### 허용 목록은 fail-open이었다

처음 판정은 허용 목록이었다. `src`, `e2e`, `scripts`, `.storybook`, workflow, 환경 파일, config가 바뀔 때만 E2E를 실행하고 나머지는 생략했다. 이 설계는 목록에 없는 경로에서 **조용히 생략**한다. 실제로 찍어봤다.

| 변경한 파일 | 앞 판정 |
| --- | --- |
| `instrumentation.ts` | 생략 |
| `middleware.ts` | 생략 |
| `proxy.ts` | 생략 |
| `src/foo.config.ts` | 실행 |
| `docs/a.md` | 생략 |

앞의 셋은 모두 Next 런타임이 읽는 파일이다. 루트에 런타임 파일을 새로 만들면 가장 비싼 게이트가 빠진다. 과제가 경고한 "너무 좁으면 필요한 검증을 스킵해 깨진 코드가 통과해요"에 그대로 해당한다.

**원인은 테스트가 없었다는 것이다.** 판정이 workflow YAML 안의 30줄 bash라 실행해 볼 수단이 없었다. 가장 미묘한 로직이 가장 검증이 없는 자리에 있었다.

### 거부 목록으로 뒤집는다

`scripts/ci/decide-e2e.mjs`로 옮기고 판정을 뒤집었다. **바뀐 경로가 전부 무해 목록에 해당할 때만 생략하고, 하나라도 모르는 경로가 있으면 실행한다.** 새 경로의 기본값이 실행이다.

무해 목록은 `docs/`, `**/*.md`, `LICENSE`, `.gitignore`, `.gitattributes`, `.editorconfig`, `.prettierignore`, `.vscode/`, `.idea/`, `.github/ISSUE_TEMPLATE/`, `.github/CODEOWNERS`다. 여기에 경로를 넣을 때의 기준은 "이 파일만 바뀐 PR이 배포돼도 화면이 같은가"다.

변경 목록을 읽지 못한 경우에도 실행한다. 그때 생략하면 조용한 false green이 된다.

판정 근거를 job summary에 남긴다. PR 화면에서 왜 돌았는지, 어떤 경로가 판정을 만들었는지 보인다.

### 스킵의 최종 방어선

경로 판정 하나에 안전 논리를 걸어두지 않는다.

| 이벤트 | E2E |
| --- | --- |
| `pull_request` (ready) | 무해 목록만이면 생략, 그 외 실행 |
| `pull_request` (draft) | 생략 |
| `merge_group` | 조건 없이 실행 |
| `push` (main) | 조건 없이 실행 |
| `workflow_dispatch` | 조건 없이 실행 |

`merge_group`이 방어선이다. PR에서 생략한 검증을 main에 들어가기 직전에 한 번 더 돈다. draft에서 E2E를 아끼는 판단도 여기에 근거를 둔다. `pull_request`의 `types`에 `ready_for_review`를 넣어야 draft를 푼 순간 재실행이 걸린다.

판정은 12개 케이스로 고정했다. 앞 구현이 놓친 루트 런타임 파일 셋, 모르는 확장자, 무해와 런타임 혼합, 빈 변경 목록, `merge_group`, draft가 모두 케이스다.

### 조건에 걸리는 PR과 안 걸리는 PR

| 측정 PR | 변경 | E2E | Quality | Actions |
| --- | --- | --- | --- | --- |
| [#3](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/pull/3) | `src` 측정 파일 | 실행·성공 | 성공 | [run 34540029109](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/actions/runs/34540029109) |
| [#4](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/pull/4) | 문서 측정 파일 | skipped | 성공 | [run 34540029859](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/actions/runs/34540029859) |

재시도는 0회로 유지한다. 조건 기반 대기를 쓰는 12개 테스트가 직렬·병렬·3회 반복에서 안정적으로 통과했다. 재시도를 켜면 실패 원인 대신 두 번째 시도의 성공 여부를 보게 된다. 실패한 최초 실행의 trace·screenshot·video는 7일간 artifact로 보존한다.

### 실제로 만난 flaky 하나

작업 마지막에 `pnpm test`가 실패했다. 375개 테스트는 전부 통과했는데 처리되지 않은 예외 하나가 있었다 — `location is not defined`.

원인은 `nuqs`의 주소 갱신 throttle이다. 갱신을 모아 `setTimeout`으로 흘리는데, 테스트가 그 타이머보다 먼저 끝나면 남은 콜백이 환경 해제 뒤에 실행된다. `ProductListView.conditions.test.tsx`만 실제 history 어댑터를 쓰기 때문에 이 파일에서만 나타난다.

단일 파일 5회 실행에서는 재현되지 않았다. 48개 파일 병렬 실행에서만 나온다. 워커 경합으로 타이머 발화가 밀리면서 teardown을 넘기는 것이다.

**재시도로 덮지 않고 원인을 없앴다.** 해당 파일의 `afterEach`에서 한 번 양보해 남은 갱신이 환경 안에서 흘러나가게 했다. 이 대기 타이머는 `nuqs`의 타이머보다 뒤에 예약되므로 경합 상황에서도 순서가 보장된다. 전체 실행 3회에서 375개가 모두 통과했다.

정책은 같다 — **흔들림과 진짜 실패를 구분하는 것이 목적이고, 원인을 없앨 수 있으면 없앤다.** 재시도는 원인을 찾지 못했을 때의 차선이다.

## E. 번들 예산

7주차 Lighthouse의 `script.transferSize`는 네트워크 전송량이다. Next 16의 `firstLoadUncompressedJsBytes`와 단위가 달라 직접 비교하지 않는다. 기준 커밋과 현재 커밋을 모두 Next 16.2.10으로 다시 build해 `.next/diagnostics/route-bundle-stats.json`의 같은 필드를 읽었다.

| 커밋 | 상태 | `/` | `/products` |
| --- | --- | ---: | ---: |
| `3aa1981` | 7주차 최적화 전 | 589,937 B | 599,696 B |
| `0785d2c` | 홈 최적화 후 | 591,786 B | 608,043 B |
| `36e31e0` | 상품 목록 최적화 후 | 591,786 B | 608,043 B |
| `9ae3fa6f` | 10주차 현재, 3회 | 602,487 B | 619,069 B |

현재 3회는 두 라우트 모두 편차가 0 B다. 8·9주차 인증·주문·계측 이후 홈은 10,701 B, 상품 목록은 11,026 B 늘었다. 현재값에서 약 5%를 허용해 홈 618 KiB, 상품 목록 635 KiB를 예산으로 둔다. 5%는 현재 기능 추가 한 번 정도의 증가를 허용하면서, 30 KiB가 넘는 신규 의존성이나 공통 청크 증가는 검토 대상으로 돌리는 경계다.

`pnpm size:check`는 build 뒤에 실행한다. 라우트, 현재값, 예산, 차이와 결과를 `$GITHUB_STEP_SUMMARY`에 쓴다. 700,000 B fixture를 넣은 로컬 자가 검증에서는 홈이 683.6 KiB, 예산이 618.0 KiB, 초과량이 65.6 KiB라고 표시하고 종료 코드 1을 반환했다.

원격 측정 PR [#5](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/pull/5)에서는 홈 예산만 500 KiB로 낮추고 이에 맞춘 단위 테스트를 먼저 통과시켰다. [run 34541923894](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/actions/runs/34541923894)는 production build 뒤 `Check bundle budget`에서 실패했다. 출력과 summary에는 현재 588.4 KiB, 예산 500.0 KiB, 초과 88.4 KiB가 표시됐다. 첫 시도는 fixture의 고정 기대값이 먼저 실패해 게이트 증거로 사용하지 않았다.

### 예산표에 없는 라우트를 통과시키던 구멍

처음 구현은 `ROUTE_BUDGETS`의 키만 순회했다. 진단 파일에 있는데 예산표에 없는 라우트는 표에 나타나지도 않고 통과했다. `/checkout`에 5,000,000 B를 넣은 fixture로 확인했더니 종료 코드 0이었다. **라우트를 새로 만드는 것만으로 예산 게이트를 빠져나갈 수 있었다.**

두 목록 중 하나에 이름이 있어야 통과하게 바꿨다. 예산을 정하거나, 이유를 적고 제외한다. 임계값은 모두 같은 정책이다 — 같은 build에서 3회 측정해 편차가 0인 현재값에 5%를 더하고 KiB로 올림한다.

| 라우트 | 현재 | 예산 | 근거 |
| --- | ---: | ---: | --- |
| `/` | 602,487 B (588.4 KiB) | 618 KiB | 7주차 추이 위의 표 |
| `/products` | 619,069 B (604.6 KiB) | 635 KiB | 7주차 추이 위의 표 |
| `/login` | 576,958 B (563.4 KiB) | 592 KiB | 10주차 현재값 |
| `/orders` | 583,526 B (569.8 KiB) | 599 KiB | 10주차 현재값 |
| `/orders/new` | 577,350 B (563.8 KiB) | 593 KiB | 10주차 현재값 |

| 예산을 두지 않는 라우트 | 이유 |
| --- | --- |
| `/_not-found` | Next 내부 라우트다. 제품 화면이 아니고 공통 청크만 싣는다. |
| `/playground` | 컴포넌트 확인용 실습 화면이다. 제품 표면이 아니다. |
| `/performance-lab/inp` | 7주차 INP 측정 실습 화면이다. 측정 대상을 일부러 무겁게 두는 자리다. |

실제 build 산출물 8개 라우트로 실행하면 종료 코드 0, 같은 입력에 `/checkout`을 더하면 종료 코드 1과 `예산 미등록 라우트: /checkout`이다. 세 케이스를 `route-bundle.test.mjs`에 넣었다.

### 예산은 상한만 본다 — 기준선을 함께 둔다

예산은 618 KiB를 넘을 때만 막는다. 588 KiB에서 610 KiB로 오르는 22 KiB는 통과한다. 임계값도 손으로 갱신하는 상수라 "무엇이 몇 바이트 늘렸나"가 어디에도 남지 않는다.

그래서 측정값 자체를 커밋된 기준선(`docs/measurements/week-10/route-bundle-baseline.json`)과 맞춘다. 번들이 바뀌면 같은 PR에 기준선 diff가 올라오고 리뷰가 숫자를 본다. 허용 폭 512 B는 toolchain 비결정성만 흡수하는 크기다 — 측정 편차가 0 B였으므로 기능 추가는 이 폭에 숨지 않는다. 갱신은 `pnpm size:baseline`이다.

예산을 두지 않은 `/_not-found`, `/playground`, `/performance-lab/inp`도 기준선에는 들어간다. 예산 대상이 아니라는 판단이 "얼마든 늘어도 된다"는 뜻은 아니다.

**base를 함께 build해 비교하는 쪽이 더 정확하다.** 그 경로는 base worktree에 의존성을 설치하고 build를 한 번 더 해야 해서 약 10초와 구조 복잡도가 든다. 측정 편차가 0 B인 값이라 커밋된 기준선으로 같은 목적을 비용 없이 얻는다고 판단했다. 편차가 커지면 이 교환을 다시 본다.

이 스크립트는 Next 16.2.10의 진단 파일 계약에 의존한다. 파일이나 필수 라우트가 없으면 통과시키지 않고 실패한다. Next를 올릴 때 진단 파일 구조와 측정 단위를 함께 재검토한다.

## F. 환경 변수 게이트

현재 production build의 필수 설정은 서버가 자기 API를 부를 때 쓰는 `APP_ORIGIN`이다. 값이 없거나 절대 URL이 아니거나 http(s)가 아니면 `pnpm env:check`가 실패한다. Next와 같은 production 환경 로더로 `.env.production.local`, `.env.local`, `.env.production`, `.env`도 먼저 읽는다.

이름이 `NEXT_PUBLIC_`으로 시작하면서 `SECRET`, `TOKEN`, `PASSWORD`, `PRIVATE`, `API_KEY`, `ACCESS_KEY`를 포함하면 브라우저 노출 후보로 거부한다. 오류에는 변수 이름만 쓰고 값은 쓰지 않는다. mock 인증의 `AUTH_SESSION_SECRET`은 현재 코드가 과제용 기본값을 명시한 상태라 필수 목록에 넣지 않았다. 실제 백엔드로 전환할 때 기본값을 제거하고 Preview·Production 필수 변수로 승격한다.

자가 검증은 누락, 상대 URL, ftp URL, 공개 비밀 변수와 `.env.production` 입력을 모두 실패시켰다. 성공·실패 결과는 build 전에 summary에 남는다.

### 게이트를 우회하던 build 기본값

`appOrigin.ts`는 "기본값은 두지 않는다. 조용한 localhost 기본값이 불일치를 숨기고 결과물에 굳는다"를 주석으로 명시하고 있었다. 그런데 `Dockerfile`의 builder 단계가 `ARG APP_ORIGIN=http://127.0.0.1:3000`으로 그 기본값을 채워 넣었다. `--build-arg` 없이 빌드해도 `env:check`가 그 값으로 통과했고, runner 단계에는 값이 아예 없어 `-e` 없이 실행하면 요청마다 `getAppOrigin`이 던졌다. **게이트가 막으려던 설정 사고가 게이트 안쪽에 있었다.**

기본값을 없애고 runner에도 같은 값을 굽는다.

| 실행 | 결과 |
| --- | --- |
| `docker build` (인자 없음) | builder 단계 0.4초에 `APP_ORIGIN이 없습니다`로 실패 |
| `docker build --build-arg APP_ORIGIN=http://127.0.0.1:3100` | 성공, 이미지 `Config.Env`에 `APP_ORIGIN=http://127.0.0.1:3100` |
| 컨테이너 3100 포트에 smoke 3개 | 1.4초에 3개 통과 |

`docker run -e APP_ORIGIN=...`으로 덮어쓸 수 있다. build와 runtime 값이 같아야 하는 제약은 그대로다.

## G. 품질 게이트와 required check

| 검증 | required | 판단 |
| --- | --- | --- |
| `static` | 예 | architecture, unit·DOM, lint, 문체, 커밋 메시지, CI 구성, 타입과 게이트별 테스트를 한 상태로 보고한다. 조건부 스텝이 없어 항상 결론이 난다. |
| `runtime` | 예 | Storybook, 환경 변수, production build, 번들 예산, 조건부 E2E. E2E가 생략돼도 job은 항상 존재해 성공으로 보고한다. |
| E2E 개별 상태 | 아니오 | `runtime` 안의 조건부 스텝이다. 실행 대상이면 실패가 job을 막고, 무해 변경이면 생략한다. |
| Lighthouse | 아니오 | 7주차 기준은 throttling 5회 중앙값이다. 공유 CI runner 한 번의 점수를 merge blocker로 쓰면 변동성을 결함으로 오인한다. |
| AI 리뷰 | 아니오 | 모델과 프롬프트에 따라 결과가 바뀌므로 advisory로만 쓴다. |

### required와 조건부 스킵이 충돌하지 않는지 실제로 확인했다

앞 기록은 "항상 존재하는 job 안의 스텝이라 대기 상태가 생기지 않는다"는 **구조 설명뿐**이었다. required를 걸어본 적이 없었다.

포크의 `measure/week10-protected-base`에 branch protection을 걸어 `static`과 `runtime`을 required로 지정하고, 런타임에 닿지 않는 주석 한 줄만 바꾼 PR [#14](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/pull/14)을 열었다.

| 항목 | 결과 |
| --- | --- |
| required status check | `static`, `runtime` |
| `static` | SUCCESS |
| `runtime` | SUCCESS |
| `Decide whether E2E is required` | success |
| `E2E` | **skipped** |
| PR 상태 | `mergeable=MERGEABLE`, `mergeStateStatus=CLEAN` |

E2E가 생략된 PR이 대기 상태에 걸리지 않고 머지 가능해진다. 같은 조건에서 `runtime`은 67초였고, E2E가 도는 PR은 87초였다.

upstream 저장소는 관리자 권한이 없어 정책만 문서화한다. required 후보는 `static`과 `runtime` 둘이다.

### 보안

`quality`의 workflow 권한은 `contents: read`뿐이다. PR 코멘트와 secrets를 쓰지 않는다. checkout, setup-node, pnpm setup, cache, artifact 액션은 commit SHA로 고정했다. `pull_request_target`도 사용하지 않는다. 이 항목들은 이제 `ci:audit`이 기계로 확인한다.

secrets를 쓰는 workflow는 `deployment-smoke` 하나다. `deployment_status`는 `pull_request_target`과 같이 base 저장소 권한과 secrets를 들고 도는 트리거라, 배포 SHA를 checkout하면 fork PR preview의 코드가 bypass secret이 있는 환경에서 실행된다. 실행 코드는 기본 브랜치에서 받고, 대상 URL도 https `*.vercel.app`으로 좁혔다. 근거는 `week10-release-flow.md`에 있다.

## H. 게이트와 그 자가 검증

게이트 자신이 회귀하면 본 게이트는 성공으로 남는다. 그래서 게이트마다 테스트를 붙이고, 테스트를 게이트보다 먼저 실행한다. `env:test`-`env:check`, `size:test`-`size:check`가 그 배치였고 나머지도 같게 맞췄다.

| 막는 것 | 게이트 | 테스트 | 실제로 겪은 실수 |
| --- | --- | --- | --- |
| 화면의 원시 계측 import | ESLint `no-restricted-imports`·`no-restricted-syntax` | `lint:rule:test` 11개 | 확장자·동적 import 우회, `.test.ts`에서 빠진 동적 import 제한 |
| 커밋의 AI 서명 | `commit-msg` 훅 + CI `Check commit messages` | `commit:test` 7개 | 서명이 붙은 커밋 5개가 실제로 만들어졌다 |
| 주석의 의인화·영어식 직역 | `style:check` (python) | `style:test` 24개 | `상태를 가진 타입` 같은 직역이 주석에 남아 있었다 |
| 예산 미등록 라우트 | `size:check` | `size:test` 13개 | `/checkout` 5 MB fixture가 종료 코드 0으로 통과했다 |
| 예산 안에서의 번들 증가 | `size:check` 기준선 비교 | 같은 테스트 | 절대 상수만 봐서 증가가 기록되지 않았다 |
| 필수 환경 변수 누락 | `env:check` | `env:test` | — |
| E2E를 빠뜨리는 경로 판정 | `decide-e2e.mjs` | `ci:test` 12개 | 허용 목록이 fail-open이었다 |
| CI 구성 자체의 퇴행 | `ci:audit` (python) | `ci:audit:test` 17개 | 배포 SHA checkout, Dockerfile 기본값, workflow와 check 드리프트 |

### CI 구성 감사

이번에 고친 실수 셋에는 재발 방지 장치가 없었다. 되돌려도 막을 것이 없었다.

1. `deployment-smoke.yml`이 배포 SHA를 checkout했다. `deployment_status`는 base 저장소 권한과 secrets를 들고 도는 트리거라, fork PR preview의 코드가 bypass secret이 있는 job에서 실행될 수 있었다.
2. `Dockerfile`이 `ARG APP_ORIGIN=http://127.0.0.1:3000`으로 기본값을 채웠다. `appOrigin.ts`가 기본값을 금지한 자리인데 build 게이트가 그 값으로 통과했다.
3. workflow 스텝 목록과 `pnpm check`가 따로 있어 새 게이트를 양쪽에 손으로 넣었다. 오늘만 다섯 번 했다.

`scripts/ci/audit_ci.py`가 셋을 검사한다.

| 검사 | 근거 |
| --- | --- |
| 최상위 `permissions`가 `contents: read` | 최소 권한 |
| `pull_request_target` 금지 (트리거 키만 본다) | fork PR에서 secrets 접근 |
| 권한 있는 트리거에서 신뢰 못 할 ref checkout 금지 | 위 1번 |
| 모든 `uses:`를 40자 commit SHA로 핀 | third-party action 공급망 |
| 모든 job에 `timeout-minutes` | 폭주 차단 |
| `pull_request` 트리거에서 `secrets.` 사용 금지 | fork PR에서 secrets 접근 |
| 필수 환경 변수에 Dockerfile `ARG` 기본값 금지 | 위 2번 |
| `quality.yml`의 `pnpm X` 집합 = `check` 스크립트 집합 | 위 3번 |

일치 검사는 자기 자신도 대상에 넣는다. `ci:audit`을 한쪽에만 추가하면 `ci:audit`이 빨개진다.

**한계를 적어 둔다.** YAML 파서를 쓰지 않는다. 의존성을 늘리지 않으려고 필요한 키만 줄 단위로 읽는다. 들여쓰기를 크게 바꾸면 이 검사가 눈이 먼다. 검사 대상이 workflow 두 개뿐이라 그 교환을 받아들였고, workflow가 늘면 파서를 넣는다.

룰을 만들다 오탐도 겪었다. 주석의 `pull_request_target` 설명을 트리거로 봤고, 배포 smoke의 `test:smoke`를 PR 게이트 일치 검사에 넣었다. 둘 다 케이스로 남겼다. 문체 게이트에서도 `복원한다`가 `원한다`에 걸린 오탐과 `좁힐 필요가 있다`가 빠진 미탐이 각각 하나 있었다.

### 무엇을 기계에 두지 않았나

문체 전부를 기계가 판정할 수는 없다. `style:check`는 반복 지적된 표현만 목록으로 고정하고, 목록에 없는 표현은 통과시킨다. 그것은 누락이 아니라 설계다. 백틱 인용도 검사에서 뺀다 — 룰이 왜 있는지 적으려면 나쁜 표현을 인용해야 한다.

커밋 서명 검사도 이름 기반이라 좁다. 사람 공동 작업자의 `Co-authored-by`는 정당하므로 trailer 자체를 막지 않고 알려진 AI 계정과 생성 문구만 거부한다.

## I. 함께 생각해 볼 질문

### E2E를 모든 PR에 required로 걸면 어떤 문제가 생길까?

문서 변경에도 브라우저 설치와 12개 흐름을 실행해 비용이 반복된다. 조건부 job 자체를 required로 두면 실행되지 않은 PR이 대기 상태에 남는다. 이 저장소는 항상 존재하는 `runtime` job 안의 스텝으로 두고, required는 `static`과 `runtime`에 건다. 실제로 protection을 걸고 문서만 바꾼 PR이 `mergeStateStatus=CLEAN`이 되는 것까지 확인했다. 그리고 PR에서 생략한 검증은 `merge_group`이 병합 직전에 한 번 더 돈다.

### Lighthouse 점수 하락은 항상 merge blocker여야 할까?

아니다. 네트워크와 CPU throttling에 따른 변동 폭이 코드 변화보다 클 수 있다. 결정적인 bundle byte는 예산과 기준선 두 층으로 막고, Lighthouse는 주요 화면 변경에서 5회 중앙값과 범위를 비교하는 판단 자료로 남긴다. 가르는 기준은 "같은 입력에서 같은 답이 나오는가"다.

### Preview가 Production API를 바라보면 무슨 일이 생길까?

테스트 주문·이메일·결제가 실제 데이터와 외부 시스템에 들어갈 수 있다. 현재 mock API에는 이 경계가 없지만 실제 API를 붙이면 Preview와 Production의 API origin을 별도 필수 변수로 두고, Preview 값에서 Production host를 거부하는 검증을 추가해야 한다. 이번에 `Dockerfile`이 `APP_ORIGIN`에 localhost 기본값을 넣어 환경 게이트를 통과시킨 것이 같은 사고의 축소판이었다. 기본값이 있으면 게이트는 값이 틀렸는지 알 수 없다.

### AI가 만든 workflow를 그대로 merge하면 어떤 위험이 있을까?

이번 초안은 176초를 브라우저 다운로드로 잘못 귀속해 효과 없는 캐시를 제안했고, E2E 경로 필터를 fail-open 허용 목록으로 만들었고, 배포 smoke가 배포 SHA를 secrets와 함께 checkout하게 뒀다. 셋 다 그럴듯했고 CI는 초록이었다. 그래서 지금은 리뷰 지적을 문서가 아니라 게이트로 받는다 — 경로 판정은 12개 케이스로, workflow의 권한·트리거·action 핀·Dockerfile 기본값은 `ci:audit`으로 고정했다. AI 출력은 가설로 받고 실패 주입과 Actions 로그로 확인한 뒤 채택한다.
