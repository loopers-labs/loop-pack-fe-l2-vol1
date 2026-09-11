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

## 5. 다음 (미완)

- [ ] 병목에 맞는 전략만 골라 적용하고 근거 남기기. lint·typecheck·test는 서로 독립이므로 job 분리가 후보고,
      pnpm store 캐시는 **이미 켜져 있고 버는 게 한 자릿수 초**라 더 손댈 이유가 없다는 쪽으로 기운다.
- [ ] `concurrency` 그룹. 키에 ref를 넣어 `main` push까지 취소하지 않도록.
- [ ] lockfile 해시를 깨서 miss 재현 (3절에 남긴 것).
- [ ] 같은 cold/warm 조건에서 After 3회씩 재고 Before와 비교.
