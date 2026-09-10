# 10주차 CI 기록

이 문서는 CI 실행 결과와 판단 근거를 모은다. 실행하지 않은 항목은 완료로 적지 않는다.

## 1단계 — CI 파이프라인 측정·최적화

### 0단계 — Before 측정 조건

| 항목          | 고정 조건                                    |
| ------------- | -------------------------------------------- |
| 이벤트        | `pull_request`                               |
| 기준 commit   | `be3a40a408f0384026178cb885245a66953d0eb6`   |
| runner        | `ubuntu-latest`                              |
| Node·pnpm     | `.nvmrc`, `package.json#packageManager`      |
| 검증 순서     | test → lint → typecheck → build              |
| 설치          | `pnpm install --frozen-lockfile`             |
| 브라우저 설치 | 현재 `quality` job의 Chromium 설치 step 포함 |

`pnpm check`를 네 단계로 나눴다. 명령의 순서와 검증 범위는 유지하며, 각 검증의 시간을 Actions 화면에서 구분하기 위한 변경이다. 이 단계에서는 병목을 제거하거나 검증을 생략하지 않는다.

### 표본 분류

- cold: 실행 로그에서 의존성 캐시 복원이 확인되지 않은 실행이다.
- warm: 실행 로그에서 캐시 복원이 확인된 실행이다.
- cache 상태를 로그로 확인하지 못한 실행은 cold 또는 warm 표본에 넣지 않는다.

PR #1의 캐시 참조(`refs/pull/1/merge`)만 조회·삭제했다. `main`의 캐시는 조회하거나 삭제하지 않았고, `main`의 실행 이력도 이 측정값에 사용하지 않았다.

### Before 결과

| 구분   | 실행 URL                                                                                          | 커밋      | 전체 시간 | 의존성 설치 | Chromium | test | lint | typecheck | build | 캐시 상태      |
| ------ | ------------------------------------------------------------------------------------------------- | --------- | --------: | ----------: | -------: | ---: | ---: | --------: | ----: | -------------- |
| cold 1 | [attempt 2](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34497848152/attempts/2) | `be3a40a` |      91초 |         6초 |     26초 | 18초 |  6초 |       4초 |  10초 | 복원 로그 없음 |
| cold 2 | [attempt 3](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34497848152/attempts/3) | `be3a40a` |      85초 |         6초 |     30초 | 14초 |  5초 |       3초 |   8초 | 복원 로그 없음 |
| cold 3 | [attempt 4](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34497848152/attempts/4) | `be3a40a` |      94초 |         6초 |     26초 | 19초 |  6초 |       4초 |  10초 | 복원 로그 없음 |
| warm 1 | [attempt 5](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34497848152/attempts/5) | `be3a40a` |      81초 |         2초 |     24초 | 19초 |  6초 |       4초 |   9초 | 복원 로그 확인 |
| warm 2 | [attempt 6](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34497848152/attempts/6) | `be3a40a` |      88초 |         1초 |     30초 | 19초 |  5초 |       4초 |  10초 | 복원 로그 확인 |
| warm 3 | [attempt 7](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34497848152/attempts/7) | `be3a40a` |      90초 |         2초 |     24초 | 19초 |  6초 |       5초 |  10초 | 복원 로그 확인 |

Actions가 제공한 단계 시작·종료 시각의 초 단위 차이로 시간을 계산했다. job 전체 시간은 job 시작·종료 시각의 차이이며, setup·post 단계도 포함한다.

| 구분           | raw 값           | 중앙값 | 범위 |
| -------------- | ---------------- | -----: | ---: |
| cold 전체 시간 | 91초, 85초, 94초 |   91초 |  9초 |
| warm 전체 시간 | 81초, 88초, 90초 |   88초 |  9초 |

warm에서 install은 1~2초였고 cold에서는 6초였다. 그러나 job 전체 중앙값 차이는 3초로 각 조건의 범위(9초)보다 작다. 따라서 전체 시간만으로 캐시 효과를 단정하지 않는다.

가장 긴 단계는 모든 표본에서 24~30초인 Chromium 설치였다. 현재 `quality` job은 E2E를 실행하지 않지만 이 설치를 수행하므로, 다음 변경 후보는 `quality` job에서 이 설치를 제거하는 것이다. E2E workflow를 만드는 2단계에서는 그 workflow에 필요한 브라우저 설치를 둔다. job 분리는 이 병목과 직접 연결되지 않으므로 이번 단계의 변경 후보에서 제외한다.

로컬의 `pnpm check`는 Corepack이 pnpm 레지스트리 서명을 검증하지 못해 검증 명령을 시작하기 전에 중단됐다. 이 문제를 우회하지 않았으며, 표의 결과는 모두 Actions에서 통과한 실행만 사용했다.

### After 결과

변경 커밋은 `76f332c96f3af24385fac7f203833999c019b386`이다. `quality` job에서 Chromium 설치 단계만 제거했으며, 나머지 검증 순서와 범위는 Before와 같다.

| 구분   | 실행 URL                                                                                          | 커밋      | 전체 시간 | 의존성 설치 | test | lint | typecheck | build | 캐시 상태      |
| ------ | ------------------------------------------------------------------------------------------------- | --------- | --------: | ----------: | ---: | ---: | --------: | ----: | -------------- |
| cold 1 | [attempt 2](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34501622108/attempts/2) | `76f332c` |      62초 |         5초 | 12초 |  4초 |       3초 |   8초 | 복원 로그 없음 |
| cold 2 | [attempt 3](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34501622108/attempts/3) | `76f332c` |      64초 |         6초 | 16초 |  6초 |       3초 |   9초 | 복원 로그 없음 |
| cold 3 | [attempt 4](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34501622108/attempts/4) | `76f332c` |      71초 |         6초 | 20초 |  6초 |       4초 |  10초 | 복원 로그 없음 |
| warm 1 | [attempt 1](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34501622108/attempts/1) | `76f332c` |      68초 |         4초 | 12초 |  5초 |       3초 |   7초 | 복원 로그 확인 |
| warm 2 | [attempt 5](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34501622108/attempts/5) | `76f332c` |      56초 |         2초 | 13초 |  4초 |       3초 |   7초 | 복원 로그 확인 |
| warm 3 | [attempt 6](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34501622108/attempts/6) | `76f332c` |      60초 |         2초 | 19초 |  6초 |       4초 |  10초 | 복원 로그 확인 |

| 구분           | raw 값           | 중앙값 | 범위 |
| -------------- | ---------------- | -----: | ---: |
| cold 전체 시간 | 62초, 64초, 71초 |   64초 |  9초 |
| warm 전체 시간 | 68초, 56초, 60초 |   60초 | 12초 |

Before와 After의 cold 중앙값은 91초에서 64초로 27초 줄었고, warm 중앙값은 88초에서 60초로 28초 줄었다. 두 변화량은 각 조건의 범위보다 크며, 제거한 Chromium 설치가 Before에서 24~30초를 차지했던 사실과 시간 차이가 가깝다. 따라서 이번 변화는 해당 설치 단계 제거와 연결해 설명할 수 있다.

After에서도 모든 검증 단계가 실행됐고 세 cold·세 warm 실행이 모두 통과했다. 캐시 복원 여부는 캐시 삭제와 실행 로그로 확인했으며, lockfile을 임시 변경해 키 불일치와 설치 재실행도 별도로 확인했다.

### 캐시 키 불일치 실험

실험 PR [#4](https://github.com/kate-son/loop-pack-fe-l2-vol1/pull/4)의 커밋 `723e7e552172184fdea3964783130db6a01d8c2c`에서 `pnpm-lock.yaml` 끝에 주석만 추가했다. 이 변경으로 캐시 키가 기존 `node-cache-Linux-x64-pnpm-71d1...`에서 다른 값으로 바뀌었다.

실험 [Actions 실행](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34504209852)에서는 캐시 복원 로그가 없었고, `pnpm install --frozen-lockfile`이 실행됐다. 의존성 설치 단계는 6초였으며 `Lockfile is up to date`가 출력되어 lockfile 내용의 유효성은 유지됐다. 확인 뒤 PR·실험 브랜치·실험 캐시는 삭제했으며, 실험 커밋은 `feat/week-10`에 포함하지 않았다.

### 이후 순서

1. ~~Before cold/warm 표본을 각각 3회 이상 확보한다.~~ 완료
2. ~~가장 긴 단계만 대상으로 변경한다.~~ 완료
3. ~~lockfile을 임시 변경해 캐시 키 불일치와 설치 재실행을 확인한 뒤 원복한다.~~ 완료
4. ~~같은 조건에서 After를 측정한다.~~ 완료
