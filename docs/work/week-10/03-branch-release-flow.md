# 2단계 결정 — 브랜치 구조와 릴리즈 흐름

- 대상: `docs/assignments/week-10-quests.md` 1번(62~82번 줄) 릴리즈 흐름 문서화
- 선행 결정: [01-env-variable-decisions.md](./01-env-variable-decisions.md), [02-env-validation-decisions.md](./02-env-validation-decisions.md)
- 이 문서가 다루는 범위: **브랜치를 어떻게 두고 각 단계에서 무엇을 확인할지까지.** 어떤 검증을 required로 둘지와 CI job을 어떻게 구성할지는 [04-quality-gate-ci-jobs.md](./04-quality-gate-ci-jobs.md)에 있다. rollback 절차와 릴리즈 추적 기록 위치(과제 1번의 나머지 항목)는 아직 정하지 않았다.
- 상태: **결정 확정, 일부 구현됨** (2026-09-10 작성 / 2026-09-11 갱신). `origin/develop`·`origin/main`은 생성돼 있고 Vercel Production 배포가 `main`에서 이루어지는 것까지 확인했다. branch protection은 아직 걸지 않았다.

## 목차

1. [브랜치 흐름](#1-브랜치-흐름)
2. [단계별 확인 대상](#2-단계별-확인-대상)
3. [develop은 배포가 들어오면서 도입한다](#3-develop은-배포가-들어오면서-도입한다)
4. [origin/main의 역할 충돌을 해소한다](#4-originmain의-역할-충돌을-해소한다)
5. [보호는 upstream이 아니라 origin에 건다](#5-보호는-upstream이-아니라-origin에-건다)
6. [실행 시점과 차단 시점은 다르다](#6-실행-시점과-차단-시점은-다르다)
7. [upstream PR에서는 CI를 실행하지 않는다](#7-upstream-pr에서는-ci를-실행하지-않는다)
8. [제출은 main에서 나간다](#8-제출은-main에서-나간다)
9. [아직 정하지 않은 것](#9-아직-정하지-않은-것)
10. [References](#10-references)

## 1. 브랜치 흐름

```
upstream/main ──(과제 스타터)──> origin/develop

feat/week-10 ──PR──> origin/develop ──> origin/main ──PR──> upstream/Hyeondoonge
                     │                  │                    │
                     검증 게이트         Production 배포        최종 제출
                     Preview 배포        smoke test           CI 실행 안 함
```

한 방향으로만 흐르는 선형 구조다.

| 브랜치 | 역할 |
| --- | --- |
| `feat/week-10` | 작업 브랜치 |
| `origin/develop` | 통합 브랜치. branch protection 적용. Preview 배포 대상 |
| `origin/main` | 배포된 상태. Vercel Production Branch |
| `upstream/Hyeondoonge` | 최종 제출 대상. 저장소 소유자가 아니라 규칙 설정 불가 |

저장소 구성 실측:

- `origin`: `https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1.git`
- `upstream`: `https://github.com/loopers-labs/loop-pack-fe-l2-vol1.git`

## 2. 단계별 확인 대상

| 단계 | 확인 대상 | 차단 |
| --- | --- | --- |
| `feat/week-10` → `origin/develop` PR | 환경 변수 검증 · lint · typecheck · unit · integration · build · E2E(spec 4개 전부) | required status check로 머지 차단 |
| `origin/develop` push 이후 | Preview 배포 → `DEPLOYMENT_URL` 대상 smoke test | 차단하지 않음 |
| `origin/develop` → `origin/main` | 없음. 검증은 새로 실행하지 않음 | main은 게이트가 아니라 배포 트리거 |
| `origin/main` push 이후 | Production 배포 → smoke test | 차단 불가(배포 후). rollback 판단 입력 |
| `origin/main` → `upstream/Hyeondoonge` | 없음 (7번 참조) | — |

각 게이트를 그 위치에 둔 근거와 채택하지 않은 선택지는 [04-quality-gate-ci-jobs.md](./04-quality-gate-ci-jobs.md) 2·4·5번에 있다. main에 required를 두지 않는 이유는 같은 문서 5번에 있다.

## 3. develop은 배포가 들어오면서 도입한다

- 질문: `feat/week-10` 위에 통합 브랜치를 따로 둘 것인가
- 최초 판단: **두지 않는다.** `upstream/Hyeondoonge`가 이미 주차 결과를 누적하는 통합 브랜치 역할을 하고 있어, 중간 계층을 하나 더 넣어도 차단하는 것이 없었다.
- 변경된 결정: **둔다.** 배포가 범위에 들어오면서 전제가 바뀌었다.

develop이 의미를 갖는 조건은 develop과 main의 상태가 달라질 수 있는 것이다.

| 브랜치 | 상태 |
| --- | --- |
| develop | 통합됐지만 아직 배포되지 않음 |
| main | 실제로 배포된 것 |

배포가 없으면 이 차이가 생기지 않으므로 develop은 여전히 불필요하다. 결정이 뒤집힌 것이 아니라 전제가 달라진 것이다.

## 4. origin/main의 역할 충돌을 해소한다

`origin/main`은 이미 존재하며 upstream의 과제 스타터를 받아오는 통로로 쓰이고 있었다.

```
4e71fc16 Merge remote-tracking branch 'upstream/main'
```

여기에 "develop이 머지되는 main" 역할을 겹치면 위에서 내려오는 스타터와 아래에서 올라오는 작업이 한 브랜치에서 만나 히스토리가 섞인다.

- 결정: **스타터 동기화 대상을 develop으로 옮긴다.** main에는 develop에서만 올라오게 유지한다.

```bash
git fetch upstream
git switch develop && git merge upstream/main
```

## 5. 보호는 upstream이 아니라 origin에 건다

- 질문: required status check를 어디에 걸 것인가
- 제약: PR base가 `loopers-labs` 소유 저장소의 브랜치다. Branch protection과 required status check는 저장소 관리자만 설정할 수 있으므로, upstream PR에서는 CI가 실패해도 머지 버튼이 잠기지 않는다.
- 결정: **내가 관리자인 origin에 branch protection을 건다.** 이 저장소는 퍼블릭이라 유료 플랜 없이 가능하다.

검토한 다른 방향은 브랜치를 추가하지 않고 "이 검증들을 required로 걸 것이다"를 문서로만 남기는 것이었다.

| | origin에 보호를 건다 | 문서로만 남긴다 |
| --- | --- | --- |
| 게이트 존재 | 존재. 사람이 건너뛸 수 있음 | 존재하지 않음 |
| 차단 실증 | 가능 | 불가능 |
| 추가 비용 | fork 설정 작업, PR 단계 증가 | 없음 |

문서로만 남기는 쪽은 보호를 거는 쪽에서 방어를 제거한 상태다. 후자가 전자를 포함하며 추가 비용은 설정 작업 수준이다. 또한 아무것도 차단하지 않으면서 차단되는 것처럼 보이게 만든다는 문제가 있다.

**남는 한계.** 작업 브랜치에서 origin PR을 건너뛰고 upstream으로 바로 PR을 여는 우회가 가능하다. 즉 이 보호는 강제가 아니라 스스로 지키는 절차다. 관리자 우회 금지 설정을 켜더라도 내가 관리자이므로 스스로 해제할 수 있다. fork 안에서는 이것이 상한이므로 그대로 인정한다.

8번의 브랜치 이름 분리가 이 우회 위험을 일부 줄인다.

## 6. 실행 시점과 차단 시점은 다르다

| 구분 | 무엇이 | 언제 |
| --- | --- | --- |
| 실행 | GitHub Actions 워크플로 | PR에 커밋을 push할 때마다 (`pull_request`의 `synchronize`) |
| 차단 | Branch protection의 required status check | 머지 시도 시점에, PR 최신 커밋의 기록된 결과를 조회 |

머지 직전에 CI를 새로 실행하는 것이 아니라 이미 기록된 결과를 보고 머지 버튼을 잠근다.

`Require branches to be up to date before merging` 옵션을 켜면 base 브랜치가 앞서간 경우 PR 최신화가 필요해지고, 그때 새 커밋이 생기므로 CI가 한 번 더 실행된다. 이것이 실질적인 머지 직전 재검증에 해당한다.

## 7. upstream PR에서는 CI를 실행하지 않는다

- 실측 확인: fork에서 upstream으로 올린 PR에서도 워크플로는 실제로 실행된다. PR #187의 `quality` 체크가 upstream 저장소의 Actions에서 성공했다 (run 34137271093, 2026-09-07, 1분 37초). `pull_request` 이벤트는 PR head의 워크플로 파일을 사용하기 때문이다.
- 즉 upstream에서 못 하는 것은 워크플로 실행이 아니라 **실패 시 머지 차단**이다.
- 결정: **실행하지 않는다.** origin/main에서 이미 전부 통과한 동일 커밋이라 새로운 정보가 나오지 않는다. 일부만 골라 실행하는 것도 이미 실행한 것의 부분집합이다.

성립 조건은 origin/develop이 upstream 최신을 반영하고 있을 것 하나다. upstream에 들어오는 변경은 과제 문서 커밋 수준이므로 동기화 후 작업하면 충족된다.

**브랜치 필터로 처리한다.** 워크플로 하나로 두 PR 경로를 구분하려면 `github.event.pull_request.base.repo.full_name` 조건문이 필요하지만, base 브랜치 필터를 쓰면 조건문 없이 해결된다.

```yaml
on:
  pull_request:
    branches: [develop, main]
  push:
    branches: [develop, main]
```

upstream PR은 base가 `Hyeondoonge`라 필터에 걸리지 않는다.

기존 `quality.yml`의 `push: branches: [main]` 트리거는 작업 코드가 `origin/main`에 도달하지 않아 실질적으로 실행되지 않았다. 위 구조에서는 main이 배포 대상이 되므로 의미를 갖는다.

## 8. 제출은 main에서 나간다

- 질문: upstream PR을 develop에서 열 것인가 main에서 열 것인가
- 결정: **main에서 연다.** main이 배포 검증까지 끝난 상태이므로 제출도 그 지점에서 이루어져야 한다. develop에서 제출하면 배포가 확인되지 않은 상태를 제출하게 된다.

**부수 효과.** head가 `origin/main`, base가 `upstream/Hyeondoonge`가 되어 브랜치 이름이 달라진다. `origin/Hyeondoonge`와 `upstream/Hyeondoonge`가 동명일 때 발생하는 혼동 — `git push upstream HEAD:Hyeondoonge` 한 번으로 게이트를 건너뛰는 위험 — 이 사라진다.

기존에는 작업 브랜치에서 upstream으로 직접 PR을 올려 왔다. PR #187의 head는 `test/week-09`이며 통합 브랜치를 거치지 않았다.

## 9. 아직 정하지 않은 것

과제 1번이 요구하는 항목 중 이 문서에서 다루지 않은 것:

- rollback 절차 — 직전 정상 배포를 찾는 방법, rollback 후 확인할 smoke test
- 배포 실패 시 로그 위치
- commit SHA · CI run URL · Preview URL · Production URL을 어디에 기록할지

브랜치 구조와 관련해 남은 것:

- **`origin/Hyeondoonge` 처리** — 1주차 시점(`8432942a`)에 멈춰 있다. 8번에서 제출 경로를 `origin/main`으로 정했으므로 이 브랜치는 쓰이지 않는다. 삭제할지 남길지 미정.
- **Vercel Preview 대상 브랜치** — 모든 브랜치인지 `develop`만인지 확인되지 않았다.

2026-09-11 시점에 해소된 항목:

- **`origin/develop` 생성** — `5151e57c chore: develop에 upstream/main(과제 스타터) 반영`으로 만들어져 로컬·origin 양쪽에 있다. 4번의 결정을 그대로 실행한 커밋이다.
- **Vercel Production Branch** — `main`으로 확인했다. 2026-09-09 Production 배포의 ref가 `5e20da86`이며 현재 `origin/main` HEAD와 같다.

## 10. References

| 구분 | 출처 |
| --- | --- |
| 과제 | `docs/assignments/week-10-quests.md` 1번 (62~82번 줄) |
| 발제 | `docs/mentor-notes/round10-cicd-자동화-배포.md` |
| 실측 | `git remote -v`, `git branch -vv`, `git log origin/main` |
| 실측 | `gh pr view 187 --repo loopers-labs/loop-pack-fe-l2-vol1` |
