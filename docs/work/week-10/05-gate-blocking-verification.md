# 게이트 차단 검증 기록

- 대상: [04-quality-gate-ci-jobs.md](./04-quality-gate-ci-jobs.md)에서 정한 게이트가 실제로 동작하는지 확인한 결과
- 과제 근거: `docs/assignments/week-10-quests.md` 116번 줄 — "실패한 CI를 한 번 만들어 어느 단계에서 왜 실패했는지 PR 본문에 기록"
- 실행: 2026-09-11, PR #6 / run 34508783824

## 무엇을 확인했나

`develop`에 branch protection을 걸고(`quality`·`e2e` required) 일부러 실패하는 PR을 올렸다.

실패 소재는 **타입 오류 하나**다. 하나의 원인으로 여러 지점이 동시에 실패해 여러 설계를 한 번에 확인할 수 있기 때문이다.

```ts
// src/shared/config/ciGateProbe.ts
export function probeGate(count: number): string {
  return count; // TS2322: Type 'number' is not assignable to type 'string'
}
```

## 결과

| job | step | 결과 |
| --- | --- | --- |
| `quality` | 환경 변수 검증 | success |
| `quality` | Lint | success |
| `quality` | Typecheck | **failure** |
| `quality` | Test | success |
| `quality` | Build | **failure** |
| `e2e` | Build | **failure** |
| `e2e` | Run E2E | skipped |

PR 상태: `mergeable: MERGEABLE / mergeStateStatus: BLOCKED`. GitHub UI에서 `Merge pull request` 버튼이 비활성화되고 두 체크에 `Required` 배지가 붙었다.

## 확인된 설계 4가지

| # | 설계 | 근거가 되는 04의 절 | 확인 방법 |
| --- | --- | --- | --- |
| 1 | required가 머지를 막는다 | 5번, [03](./03-branch-release-flow.md) 5번 | 머지 버튼 비활성화, `BLOCKED` |
| 2 | `if: always()`가 작동한다 | 6-1 | Typecheck 실패 후에도 Test가 실행되어 통과 확인. 한 번의 실행으로 모든 실패를 봄 |
| 3 | `e2e`가 `quality`와 독립이다 | 6-1 | `needs` 없이 자체 build에서 같은 지점에 실패. quality를 기다리지 않음 |
| 4 | 체크 이름이 분리돼 있다 | 6-1 | `Quality / quality`, `Quality / e2e` 두 개가 각각 required로 잡힘 |

## 부수 발견 — 로컬에도 게이트가 있다

`.husky/pre-push`가 `tsc --noEmit`을 돌린다. 타입 오류는 push 단계에서 이미 막혀, 이번 검증에서는 `--no-verify`로 우회해야 했다.

```
.husky/pre-commit   pnpm lint-staged
.husky/pre-push     pnpm tsc --noEmit
```

CI 게이트와 겹치지만 피드백 시점이 다르다 — 로컬 훅은 push 전에, CI는 push 후에 잡는다. 04는 CI 게이트만 다루고 있어 이 계층이 문서에 없다.

Vercel Preview 배포도 같은 타입 오류로 실패했다. 빌드가 깨지는 변경은 CI와 배포 양쪽에서 걸린다.

## 수정 후 통과 확인 (run 34509302109)

타입 오류를 만든 임시 파일을 제거하고 같은 브랜치에 push했다.

| 확인 | 결과 |
| --- | --- |
| `.husky/pre-push` | `컴파일 성공🥳` — 우회 없이 통과 |
| `quality` | success (61초) |
| `e2e` | success (75초) |
| PR 상태 | `BLOCKED` → **`CLEAN`**, `Merge pull request` 버튼 활성화 |

같은 PR에서 차단과 통과를 모두 확인했으므로 과제 116번 줄("실패한 CI를 한 번 만들어 기록 → 수정 후 통과까지 확인")을 충족한다. 실패 시점의 기록은 PR #6 코멘트에 남아 있다.

이 실행에서 두 job의 시작 시각이 `17:37:02`로 동일해 병렬 실행이 다시 확인됐다.

## 아직 하지 않은 것

- `strict`(base 최신화 강제)를 켰을 때의 동작 — 현재 `false`로 설정돼 있다.
- PR #6과 `test/ci-gate-check` 브랜치 정리 — 검증 기록이 PR 코멘트에 있어 남겨 두었다.
