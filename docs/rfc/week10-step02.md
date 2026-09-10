# 2단계 — 조건부 E2E 실행 설계

## 목표와 검증 경계

E2E는 `playwright.config.ts`의 `webServer`가 로컬 production build를 띄워 실행하므로 CI CUT에 둔다. 배포 URL이 필요한 smoke test는 이 workflow의 대상이 아니다.

lint·typecheck·unit test·production build는 `quality` workflow에서 모든 PR에 실행한다. E2E는 실행 비용이 크고 브라우저 설치가 필요하므로 변경 파일에 따라 실행 여부를 나눈다.

## 실행 조건

workflow는 모든 PR에서 시작한다. `changes` job이 PR 파일 목록을 GitHub API로 받아 다음 경로만 E2E 스킵 대상으로 분류한다.

- `docs/rfc/**`
- `docs/assignments/**`
- `docs/images/**`
- 하위 디렉터리가 아닌 `docs/*.md`
- `README.md`

> **수정 기록 (4단계)** — 초기 설계에는 추적하지 않는 로컬 전용 문서 디렉터리도 스킵 목록에 넣었다. 그 경로는 `.gitignore` 대상이라 PR 변경 목록에 나타나지 않으므로 판정에 관여할 일이 없고, 스킵 정책의 경계만 넓혔다. 4단계 AI 리뷰에서 지적돼 workflow와 이 목록에서 함께 제거했다. 제거 전후로 판정 결과가 달라진 사례는 확인되지 않았다.

위 목록에 없는 경로가 하나라도 있으면 E2E를 실행한다. `docs/assets/**`, `docs/examples/**`, `docs/fixtures/**`, `.github/**`, `.claude/**`는 실행 대상으로 남긴다. 이 경로들은 실행 영향 여부를 이 workflow에서 확인하지 않았거나, 테스트 데이터·설정으로 사용될 가능성이 있기 때문이다. 파일 이름 변경은 새 경로와 이전 경로를 모두 판정한다.

PR 파일 API의 반환 수가 이벤트의 `changed_files`와 다르면 목록이 불완전할 수 있으므로 E2E를 실행한다. API 오류, 빈 출력, 판정 출력 누락도 성공으로 처리하지 않는다.

## required check와 guard

`e2e` job은 조건에 따라 실행되거나 스킵된다. 따라서 이 job 자체를 required로 지정하지 않고, 항상 결과를 보고하는 `e2e-required` job을 required 대상으로 둔다.

| 경로 판정               | `e2e` 결과     | `e2e-required` |
| ----------------------- | -------------- | -------------- |
| `false`                 | `skipped`      | 성공           |
| `true`                  | `success`      | 성공           |
| `false`                 | 그 밖의 결과   | 실패           |
| `true`                  | `success` 이외 | 실패           |
| 판정 job 실패·출력 누락 | 모든 결과      | 실패           |

이 구조에서는 문서만 바뀐 PR도 `e2e-required`가 성공 결과를 보고한다. E2E가 실패·취소되거나 경로 판정이 실패하면 guard가 실패하므로, 의도하지 않은 스킵을 통과로 처리하지 않는다. 현재 저장소에는 branch protection과 ruleset이 없으므로 required 설정과 머지 차단은 workflow 동작 확인 뒤 별도로 수행한다. `merge_group`은 병합 대기열 설정이 필요한 범위라 이번 단계에서는 도입하지 않는다.

## 재시도 정책

`playwright.config.ts`의 `retries: process.env.CI ? 2 : 0`을 유지한다. 로컬에서는 첫 실패를 즉시 확인하고, CI에서는 일시적인 네트워크·렌더링 변동을 한 번 더 확인할 기회를 두기 위해 최대 두 번 재시도한다. JSON·HTML 리포트를 14일 동안 보관하고, 재시도 후 통과한 테스트는 `test.results[].retry > 0` 및 통과 상태를 기준으로 Actions 실행 요약에 기록한다. 자동으로 `test.fixme`로 격리하지 않는다.

## 보안과 비용

새 action은 기존 workflow와 같은 커밋 SHA 고정 방식을 사용한다. `changes` job에는 PR 파일 API 조회에 필요한 `pull-requests: read`만 추가하고, 나머지 job은 `contents: read`를 유지한다. `checkout`에는 `persist-credentials: false`를 적용한다. 브라우저 캐시는 복원 비용과 시스템 의존성 설치 범위를 비교하지 않았으므로 이번 단계에서 추가하지 않는다.

## 확인할 사례

실제 PR에서 다음 결과를 확인했다.

| 사례                                                                                                              | 결과                               |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `src/**` 변경, [PR #1 Actions](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34505122659)         | E2E 실행·성공, `e2e-required` 성공 |
| 문서 스킵 목록만 변경, [PR #5 Actions](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34505784698) | E2E `skipped`, `e2e-required` 성공 |
| 의도적 실패 assertion, [PR #6 Actions](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34506508566) | E2E 실패, `e2e-required` 실패      |

| `changes` 성공·`run` 출력 누락, [PR #7 Actions](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34507233336) | E2E `skipped`, `e2e-required` 실패 |

PR #5와 PR #6은 검증 후 닫고 브랜치를 삭제했으며 머지하지 않았다. PR #1은 작업 브랜치의 실행 대상 사례로 유지한다.

### 이전 시도에서 남아 있던 실험 PR

이 단계를 다시 진행하기 전에 만든 실험 PR 두 건이 닫히지 않은 채 남아 있었다. 6단계 최종 점검에서 확인하고 닫았으며 브랜치도 지웠다. 결과는 위 표의 같은 경로와 어긋나지 않는다.

| PR                                                            | 브랜치           | run                                                                                      | 결과                               |
| ------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------- | ---------------------------------- |
| [#2](https://github.com/kate-son/loop-pack-fe-l2-vol1/pull/2) | `e2e-skip-check` | [34482509266](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34482509266) | E2E `skipped`, `e2e-required` 성공 |
| [#3](https://github.com/kate-son/loop-pack-fe-l2-vol1/pull/3) | `e2e-fail-check` | [34483215563](https://github.com/kate-son/loop-pack-fe-l2-vol1/actions/runs/34483215563) | E2E 실패, `e2e-required` 실패      |

3단계 예산 실험에 쓴 `bundle-budget-check` 브랜치도 [PR #10](https://github.com/kate-son/loop-pack-fe-l2-vol1/pull/10)이 닫힌 뒤 남아 있어 같이 지웠다. 현재 이 저장소에 열린 PR은 작업 PR [#1](https://github.com/kate-son/loop-pack-fe-l2-vol1/pull/1)뿐이고, 실험용 브랜치는 남아 있지 않다.

## required check 확인

`main`에 영향을 주지 않기 위해 임시 보호 브랜치 `experiment/week10-protected-base`에만 `quality`와 `e2e-required`를 required로 설정했다. 문서 전용 성공 PR [#8](https://github.com/kate-son/loop-pack-fe-l2-vol1/pull/8)은 두 required check가 성공한 뒤 `mergeStateStatus: CLEAN`이 됐다. 의도적 E2E 실패 PR [#9](https://github.com/kate-son/loop-pack-fe-l2-vol1/pull/9)은 `e2e-required`가 실패하고 `mergeStateStatus: BLOCKED`가 됐다.

확인 뒤 보호 설정과 임시 브랜치를 삭제했다. 따라서 현재 `main`과 `feat/week-10`에는 branch protection required 설정을 추가하지 않았다.

이 시점에서는 문서 전용 스킵과 E2E 실패 두 경로만 봤다. E2E 실행·통과까지 포함한 세 경로와 예산·환경 변수 검증이 들어간 `quality` 기준의 확인은 `week10-step03.md`의 「required 배치와 확인」에 있다.

정상 실행·정상 스킵·E2E 실패·출력 누락과 임시 보호 브랜치에서의 머지 차단을 확인했다. 판정 오류를 실제 API 오류로 재현하지는 않았으며, workflow job 실패가 guard 실패로 전파되는 구조와 출력 누락 실패를 확인한 범위로 기록한다.
