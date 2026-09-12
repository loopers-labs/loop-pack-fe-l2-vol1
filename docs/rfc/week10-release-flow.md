# week-10 릴리즈 흐름

<!-- 완료조건(week-10-quests.md 82번 줄): 문서만 읽고도 리뷰어가 "이 프로젝트는 어떤 검증을 통과해야 배포되는가"를 알 수 있어야 한다 -->

## 1. PR 생성부터 Production 배포, rollback까지의 흐름

<!-- 66번 줄: PR 생성 → production 배포 → rollback까지 단계별 흐름과 각 단계의 검증 명령 -->

```
feat/week-10 ──PR──> origin/develop ──PR──> origin/main ──PR──> upstream/Hyeondoonge
                 │                     │                  │                  │
           quality·e2e (차단)      Preview 배포        Production 배포      CI 실행 없음
                                  + smoke (비차단)    + smoke (비차단)
```

| 단계 | 자동으로 실행되는 검증 | 차단 | 사람이 확인하는 명령 |
| --- | --- | --- | --- |
| 1. 로컬 작업 (`feat/week-10`) | pre-commit `pnpm lint-staged`, pre-push `pnpm tsc --noEmit` | push 차단(`--no-verify`로 우회 가능) | `pnpm check` = `test` → `lint` → `typecheck` → `build` → `test:e2e` |
| 2. `feat/week-10` → `origin/develop` PR | Quality 워크플로 — `quality` job(환경 변수 검증·lint·typecheck·test·build), `e2e` job(build·`pnpm test:e2e` spec 4개) | **머지 차단.** `develop` required status check `quality`·`e2e` | `gh pr checks <번호> -R Hyeondoonge/loop-pack-fe-l2-vol1` |
| 3. `origin/develop` push | Vercel Preview 배포 → `vercel.deployment.success`(`environment: preview`) → Smoke 워크플로가 배포 고유 URL 대상 실행 | 차단하지 않음(배포 이후) | `gh run list --workflow smoke.yml -R Hyeondoonge/loop-pack-fe-l2-vol1` |
| 4. `origin/develop` → `origin/main` PR | Quality 워크플로가 한 번 더 실행된다(`pull_request: branches: [develop, main]`) | 차단 없음 — `main`에는 branch protection이 없다 | `gh api /repos/Hyeondoonge/loop-pack-fe-l2-vol1/branches/main/protection` |
| 5. `origin/main` push | Vercel Production 배포 → `vercel.deployment.promoted` → Smoke 워크플로가 Production 도메인 대상 실행 | 차단 불가(배포 완료 후). 실패는 rollback 판단의 입력 | `gh api "/repos/Hyeondoonge/loop-pack-fe-l2-vol1/deployments?environment=Production"`, `curl -s -o /dev/null -w "%{http_code}" https://loop-pack-fe-l2-vol1-gamma.vercel.app` |
| 6. 배포가 깨진 경우 | 자동 rollback 없음 | — | 4절 |
| 7. `origin/main` → `upstream/Hyeondoonge` PR | 없음. base가 `Hyeondoonge`라 워크플로 브랜치 필터에 걸리지 않는다 | 없음(저장소 관리자가 아니라 설정 불가) | — |

4번은 [03-branch-release-flow.md](../work/week-10/03-branch-release-flow.md) 2번이 "검증은 새로 실행하지 않음"으로 적어둔 것과 다르다. 워크플로는 `main`을 대상으로 한 PR에서도 실제로 돌고(아래 run 34660580875), `main`에 required가 없어 **실행은 되지만 차단은 하지 않는다.** 차단하지 않는 이유는 5.2에 있다.

현재 `main` head(`c4cf5406`) 한 건이 이 흐름을 지나간 기록이다.

| 단계 | 실측 |
| --- | --- |
| 2 | [PR #13](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/pull/13) (`feat/week-10` → `develop`, head `e4035f36`) — [run 34660488572](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34660488572) `quality`·`e2e` success |
| 3 | `develop` push `985e388d` → Preview 배포 `6403841268`(`https://loop-pack-fe-l2-vol1-4drcge9hx-hyeodoong2s-projects.vercel.app`) → [smoke run 34660583967](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34660583967) 3 passed |
| 4 | [PR #14](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/pull/14) (`develop` → `main`, head `985e388d`) — [run 34660580875](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34660580875) success |
| 5 | `main` push `c4cf5406` → [run 34660633474](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34660633474) success, Production 배포 `6403854043`(`https://loop-pack-fe-l2-vol1-aqnnuysib-hyeodoong2s-projects.vercel.app`) → [smoke run 34660668651](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34660668651) 3 passed (7.0s) |

## 2. Preview 환경과 Production 환경의 차이

<!-- 67번 줄: Preview 환경과 Production 환경의 차이 -->

| 항목 | Preview | Production |
| --- | --- | --- |
| 배포 트리거 | `develop` push(및 PR 브랜치 push) | `main` push |
| 주소 | 배포마다 새로 생기는 고유 URL + 브랜치 URL | 고정 도메인 `https://loop-pack-fe-l2-vol1-gamma.vercel.app` |
| Deployment Protection | 켜져 있음. 인증 없는 요청은 302 — `…-4drcge9hx-…`에서 확인(2026-09-12) | 없음. 같은 방식으로 도메인 200 확인 |
| `getAppOrigin()`이 주는 origin | `VERCEL_ENV === 'preview'`면 `https://${VERCEL_URL}` 파생 | Vercel Production 스코프에 등록한 `APP_ORIGIN` 고정값 |
| 서버 self-fetch 목적지 | 요청 Host와 `x-forwarded-proto`로 만든 방문자 URL. 방문자 쿠키를 실어 보내고 `redirect: 'manual'`로 보호 리다이렉트를 즉시 실패시킨다(`apiFetch`의 Preview 분기) | `getAppOrigin()`이 준 origin 그대로 |
| smoke 대상 URL | 이벤트가 알려준 배포 고유 URL(`client_payload.url`) | Production 도메인 고정 |
| smoke 인증 헤더 | 대상 호스트가 `-hyeodoong2s-projects.vercel.app`로 끝날 때만 `x-vercel-protection-bypass`와 `x-vercel-set-bypass-cookie` | 붙이지 않는다 |
| smoke 트리거 이벤트 | `vercel.deployment.success` 중 `environment: preview`만 수락 | `vercel.deployment.promoted` |

Preview에서만 방문자 URL로 self-fetch하는 이유와 효과는 [07-preview-self-fetch-protection.md](../work/week-10/07-preview-self-fetch-protection.md)에 있다. `VERCEL_URL`로 self-fetch하던 때는 보호 리다이렉트에 걸려 홈 데이터를 받지 못했고(HTML 응답 완료 중앙값 17.0초, 브라우저가 `api/home` 재요청, `<title>`이 기본값), 방문자 URL과 쿠키로 바꾼 뒤 0.8초·재요청 0건·metadata 정상으로 바뀌었다.

이 분기는 Production에 없다. **두 환경은 서버 self-fetch에서 서로 다른 코드 경로를 탄다.** Preview smoke가 통과해도 Production 경로를 검증한 것이 아니며 그 반대도 같아서, smoke를 양쪽 모두에서 실행한다.

## 3. 배포 실패 시 로그 위치

<!-- 68번 줄: 배포 실패 시 로그 위치 -->

| 실패 지점 | 로그 위치 | 확인 명령 / 실측 |
| --- | --- | --- |
| CI(`quality`·`e2e`) | GitHub Actions run 로그 | `gh run view <run-id> --log-failed -R Hyeondoonge/loop-pack-fe-l2-vol1`. 실측: [run 34508783824](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34508783824) typecheck·build 실패, [run 34580841387](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34580841387) 환경 변수 검증 실패(`[validate-env] APP_ORIGIN이 올바른 URL이 아닙니다: not-a-url`) |
| Vercel 빌드 | Vercel 배포 로그. GitHub deployment status에 `failure`가 남고 description이 조회 명령을 알려준다 | `gh api "/repos/Hyeondoonge/loop-pack-fe-l2-vol1/deployments/<id>/statuses"` → `Deployment has failed — run this Vercel CLI command: npx vercel inspect <dpl_id> --logs`. 실측: deployment `6387774193`(`b466f296`, `dpl_Ff4gg9CnxmsX7bsxkCbQkAsDk9QY`), `6356836945`(`5e20da86`) |
| 배포 후 smoke test | Smoke 워크플로 run. `Record deployment info` step이 대상 URL·deployment id·commit SHA·트리거를 job summary에 표로 남긴다 | `gh run list --workflow smoke.yml`, `gh run view <run-id>` |
| 배포는 성공했는데 화면이 깨진 경우 | Vercel Runtime Logs(함수 실행 로그) | **미실측.** 이번 주차에 Production 함수 런타임 오류를 만들어 확인하지 않았다. [Vercel — Runtime Logs](https://vercel.com/docs/logs/runtime) |
| Docker 컨테이너 실행 | 컨테이너 stdout | `docker logs <container>`. 실측([08-docker-image-run.md](../work/week-10/08-docker-image-run.md)): `-e APP_ORIGIN` 없이 띄우면 기동은 되고 `GET /`가 500, 로그에 `⨯ Error: APP_ORIGIN이 설정되지 않았습니다.` |

빌드 실패는 CI와 Vercel 중 한쪽에만 남을 수 있다. `b466f296`은 CI `quality`가 success였는데([run 34570109965](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34570109965)) Vercel Production 빌드가 실패했다 — CI가 초록이어도 배포 로그를 따로 봐야 하는 경우다.

## 4. rollback

### 4.1 main 배포 오류 시 rollback 방법

<!-- 68번 줄: main 배포 오류 시 rollback 방법 -->

Vercel 대시보드의 Instant Rollback으로 되돌린다. 2026-09-12(KST) Hobby 플랜에서 한 번 실행한 기록이다.

1. 프로젝트 Overview → Production Deployment → **Instant Rollback** → 대상 배포 선택 → **Confirm Rollback**
2. 결과 화면(2026-09-12 01:00:51 KST 캡처)
   - "Rolled back just now by jsi06138-8616"
   - 현재 배포: `loop-pack-fe-l2-vol1-oyjbhak1k-hyeodoong2s-projects.vercel.app` / `7b1a1e9` vercel 기반 CI/CD 환경 설정 (#8)
   - 밀려난 배포(취소선): `loop-pack-fe-l2-vol1-33gmecx3i-hyeodoong2s-projects.vercel.app` / `3e2dbf6` preview 배포 환경 결함 수정 (#12)
   - Domains: `loop-pack-fe-l2-vol1-gamma.vercel.app`
   - 배너: "To undo the rollback promote to production or re-enable auto-assigning custom domains" [Manage]
3. 복구: Deployments 화면의 **Promote** 확인창(01:08:40 KST 캡처)에서 `3e2dbf6` 배포를 promote
   - 확인창 내용: "It will be aliased to the following domains: loop-pack-fe-l2-vol1-gamma.vercel.app", "This action will undo the current Instant Rollback", "Rolled back by jsi06138-8616 8m ago"
4. 복구 후 화면(01:11:37 KST 캡처)
   - 배너 없음
   - Deployment `loop-pack-fe-l2-vol1-33gmecx3i-hyeodoong2s-projects.vercel.app`, Status Ready, Source `main` / `3e2dbf6`
   - "To update your Production Deployment, push to the main branch."

| 시점 | Production 배포 | Vercel deployment id |
| --- | --- | --- |
| rollback 전 | `3e2dbf6b58920a1f2643121f8c2f0f0fad809041` ([PR #12](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/pull/12) 머지 커밋) | `dpl_4zogiK6m59w3r8H9hhYK3jPpAw41` |
| rollback 후 | `7b1a1e9d4c40d26e002c569dface814dd97cf38e` ([PR #8](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/pull/8) 머지 커밋) | `dpl_Dvx5di3sWgJ1xgLsC6RTCTL5YL7k` |
| 복구 후 | `3e2dbf6b58920a1f2643121f8c2f0f0fad809041` | `dpl_4zogiK6m59w3r8H9hhYK3jPpAw41` |

- rollback·복구 전후 git `main` head는 `3e2dbf6b` 그대로(2026-09-11T16:14:46Z 확인)
- rollback·복구로 GitHub deployment 기록은 새로 생기지 않음(Production 최신 기록 `6396625073` 유지, 16:10:27Z 확인)
- 복구 후 `main` push가 Production에 자동 반영되는 것까지 확인함 — 복구(2026-09-11T16:08Z) 이후 `c4cf5406` push로 Production 배포 `6403854043`이 생성되고(2026-09-12T00:09:28Z) Production smoke가 자동 실행돼 3 passed([run 34660668651](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34660668651))

### 4.2 rollback 대상(직전 정상 배포)을 찾는 방법

<!-- 70번 줄: rollback 대상(직전 정상 배포)을 찾는 방법 -->

1. Production 배포 목록을 최신순으로 보고 상태가 성공인 배포를 찾는다. 빌드에 실패한 배포는 Production 도메인에 연결된 적이 없어 대상이 아니다([Vercel Instant Rollback — Eligible deployments](https://vercel.com/docs/instant-rollback#eligible-deployments)). Hobby 플랜은 바로 이전 Production 배포로만 되돌릴 수 있다([같은 문서](https://vercel.com/docs/instant-rollback#who-can-roll-back-deployments)).
2. 그 배포에서 Production smoke test가 통과한 run이 있는지 확인한다.

실행 시 확인한 목록(GitHub `deployments?environment=Production`):

| GitHub deployment | commit | 생성 시각(UTC) | 상태 | smoke |
| --- | --- | --- | --- | --- |
| `6396625073` | `3e2dbf6b` | 2026-09-11T15:47:02Z | success | [run 34618172344](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34618172344) 3 passed — 당시 현재 배포 |
| `6388049431` | `7b1a1e9d` | 2026-09-11T06:51:25Z | success | [run 34571731142](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34571731142) 3 passed — **rollback 대상** |
| `6387774193` | `b466f296` | 2026-09-11T06:29:39Z | failure | — |
| `6356836945` | `5e20da86` | 2026-09-09T18:40:47Z | failure | — |

### 4.3 rollback 후 확인할 smoke test

<!-- 70번 줄: rollback 후 확인할 smoke test -->

rollback은 smoke test를 자동 실행하지 않았다. rollback(01:00:51 KST 캡처 이전)부터 2026-09-11T16:04:48Z까지 `repository_dispatch` run이 생기지 않아 수동으로 실행했다. 복구(promote)는 `vercel.deployment.promoted` 이벤트로 smoke test가 자동 실행됐다.

```bash
# 입력을 비우면 Production 도메인(https://loop-pack-fe-l2-vol1-gamma.vercel.app)이 대상
gh workflow run smoke.yml -R Hyeondoonge/loop-pack-fe-l2-vol1 --ref develop
```

| 시점 | run | 트리거 | 대상 | 결과 |
| --- | --- | --- | --- | --- |
| rollback 전 | [34618172344](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34618172344) | `repository_dispatch` (payload `3e2dbf6b`·`dpl_4zogiK6m59w3r8H9hhYK3jPpAw41`·production·main) | `https://loop-pack-fe-l2-vol1-gamma.vercel.app` | 3 passed (13.5s) |
| rollback 후 | [34619931613](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34619931613) | `workflow_dispatch` (수동, 16:05:07Z) | `https://loop-pack-fe-l2-vol1-gamma.vercel.app` | 3 passed (4.1s) |
| 복구 후 | [34620283569](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34620283569) | `repository_dispatch` (16:08:45Z, payload `3e2dbf6b`·`dpl_4zogiK6m59w3r8H9hhYK3jPpAw41`·production·main) | `https://loop-pack-fe-l2-vol1-gamma.vercel.app` | 3 passed (4.7s) |

- 세 run 모두 기본 브랜치 `develop`(`305494dc`)을 checkout했다. `305494dc`와 `3e2dbf6b`의 트리는 같다(`git diff --stat origin/develop origin/main` 빈 출력).

## 5. 품질 게이트

### 5.1 required로 둔 검증

<!-- 151번 줄: release-flow 문서에 무엇을 required로 둘지 명시 -->

`origin/develop` branch protection의 required status check는 **`quality`와 `e2e` 두 job**이다(2026-09-12 `gh api …/branches/develop/protection` 확인, `strict: false` — 머지 전 base 최신화는 요구하지 않는다). `origin/main`에는 branch protection이 없다(같은 API가 404 `Branch not protected`).

두 job이 실제로 무엇을 돌리는지는 [`quality.yml`](../../.github/workflows/quality.yml) 기준이다.

| required check | 포함 검증 | 실패 시 |
| --- | --- | --- |
| `quality` | 환경 변수 검증(`pnpm validate-env`) → lint → typecheck → test(unit·integration) → build. 각 step에 `if: always()`가 있어 앞 step이 실패해도 나머지를 모두 실행하고 한 번에 보여준다 | `develop` 머지 버튼 잠금 |
| `e2e` | Playwright 설치 → build → `pnpm test:e2e`(spec 4개 전부, `retries: 0`) | 〃 |

차단이 실제로 걸리는지는 실측했다. 일부러 넣은 타입 오류로 [run 34508783824](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34508783824)를 실패시키자 PR 상태가 `BLOCKED`가 되어 머지 버튼이 잠겼고, 오류를 제거한 [run 34509302109](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34509302109)에서 `CLEAN`으로 돌아왔다([05-gate-blocking-verification.md](../work/week-10/05-gate-blocking-verification.md)).

### 5.2 required에서 제외한 검증과 이유

<!-- 151번 줄: 제외한 검증은 실행 비용·변동성·현재 리스크 기준으로 이유 작성 -->

| 제외한 것 | 이유 |
| --- | --- |
| Preview smoke test | 배포가 끝난 뒤에 실행돼 막을 대상이 없다. `develop` push 이벤트의 결과라 `main` PR의 체크로도 잡히지 않는다 |
| Production smoke test | 같은 이유로 차단이 원리적으로 불가능하다. 실패는 워크플로 실패로 남기고 rollback 판단의 입력으로 쓴다. 자동 rollback은 넣지 않았다 — smoke 자체가 잘못됐을 때 정상 배포를 되돌린다 |
| Lighthouse | 변동성이 크다. CI 머신 부하에 따라 흔들리는 지표를 required로 걸면 무관한 PR을 막는 쪽이 잡아내는 회귀보다 많아진다. 배포 후 운영 확인 항목으로 둔다 |
| `develop` → `main` PR의 재검증 | 실행은 되지만 required로 걸지 않는다. `develop` PR에서 전부 통과한 **같은 커밋**이라 새 정보가 없고, `main`은 게이트가 아니라 배포 트리거다 |
| upstream PR | base가 `loopers-labs` 소유라 branch protection을 설정할 권한이 없다. 실행해도 차단되지 않으므로 실행하지 않는다 |

비용은 제외 사유가 되지 못했다. `e2e` job은 고정비 44초(툴체인 21초 + Playwright 설치 23초)가 대부분이고 현재 head 기준 실측이 91초라, spec을 줄이거나 머지 직전으로 미뤄도 줄어드는 시간이 작다. 판단 근거 전체는 [04-quality-gate-ci-jobs.md](../work/week-10/04-quality-gate-ci-jobs.md) 4·5번에 있다.

## 6. 릴리즈 기록

### 6.1 기록 위치

<!-- 69번 줄: commit SHA · CI run URL · Preview URL · Production URL을 어디에 기록할지 정한다 -->

**제출 PR 본문의 "릴리즈 추적 기록" 섹션에 적는다.** 초안은 [pr-description.md](../work/week-10/pr-description.md)에 두고 PR 본문으로 옮긴다.

- 네 값은 한 릴리즈(`main`의 한 커밋)에 묶여 있고, 리뷰어가 그 릴리즈를 보는 화면이 PR이다.
- 별도 release 문서를 두면 같은 값을 두 곳에서 관리하게 된다. 이 문서는 "어떤 검증을 통과해야 배포되는가"를 다루고, 개별 릴리즈의 값은 PR이 갖는다.

### 6.2 기록

<!-- 69번 줄: PR 본문/release 문서에 실제로 기록. PR 본문에 기록하기로 정하면 이 절은 PR 링크로 대체 가능 -->

현재 릴리즈: [upstream PR #213](https://github.com/loopers-labs/loop-pack-fe-l2-vol1/pull/213) 본문.

| 항목 | 값 |
| --- | --- |
| commit SHA | `c4cf5406d57e92b5ebb5b176243d8311601f535d` — PR #14(`develop` → `main`) 머지 커밋, 트리는 `develop` head `985e388d`와 동일 |
| CI run URL | PR 검증 [34660580875](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34660580875) · `main` push [34660633474](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34660633474) · Production smoke [34660668651](https://github.com/Hyeondoonge/loop-pack-fe-l2-vol1/actions/runs/34660668651) |
| Preview URL | `https://loop-pack-fe-l2-vol1-4drcge9hx-hyeodoong2s-projects.vercel.app` (`985e388d`, 보호로 302) |
| Production URL | `https://loop-pack-fe-l2-vol1-gamma.vercel.app`(200) / 배포 고유 URL `https://loop-pack-fe-l2-vol1-aqnnuysib-hyeodoong2s-projects.vercel.app` (`c4cf5406`, 302) |

PR #213 본문은 2026-09-12T00:08:51Z 갱신분까지 직전 head(`7b1a1e9d`) 값이 적혀 있다. 위 값으로 갱신해야 한다.
