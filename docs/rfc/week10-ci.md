# RFC — 10주차 CI 파이프라인

> 검증을 많이 더하는 주가 아니다. **재고, 병목만 줄이고, 무엇을 언제 돌릴지 조건을 설계하고,
> 반복 지적 하나를 기계로 내린다.**

## ⚠️ 이 문서의 범위 한계 (먼저 적는다)

제출 시점까지 남은 시간이 **2시간 남짓**이었다. 그래서 과제가 요구한 것 중 못 한 것이 있고,
그걸 숨기지 않고 먼저 적는다.

| 요구 | 상태 |
| --- | --- |
| Before를 **통제 조건에서** cold/warm 3회씩 | ❌ — **기존 Actions run 12건의 step 타임스탬프**로 대신했다(아래). raw·중앙값·범위는 있지만 cold/warm을 내가 통제한 것이 아니다 |
| 캐시 키를 일부러 깨서 miss 재현 | ❌ — lockfile을 바꿔 돌릴 시간이 없었다. 다만 `Install dependencies`가 1~2s인 것으로 **hit은 확인된다** |
| 3단계 예산 게이트 | ✅ — 처음엔 포기했는데 시간이 남아 했다. 임계값을 **7주차 LCP에서 유도**했다(H절) |
| 4단계 AI 리뷰 | 9주차 Codex 교차 검증 기록을 증거로 재사용(F·G·H절). CI에는 붙이지 않았다 — 근거는 아래 |

**측정 조건을 통제하지 못한 것은 이 문서의 결론을 약하게 만든다.** 다만 병목 지목만은
통제된 비교가 됐다 — 같은 커밋·같은 시각에 두 워크플로가 나란히 돌았기 때문이다.

---

## A. 들어올 때의 상태 — 게이트가 두 벌이고 반쪽씩 갈려 있었다

| | `ci.yml` | `quality.yml` |
| --- | --- | --- |
| 트리거 | `pull_request` · `push:main` | 같음 |
| 검증 | lint · typecheck · build · **format:check** | **`pnpm check`**(= test · lint · typecheck · build) |
| Node | **22 하드코딩** | `.nvmrc`(24.17.0) |
| action 핀 | `@v4` 태그 | **커밋 SHA** |
| `permissions` | **없음** | `contents: read` |
| `concurrency` | 없음 | 없음 |
| `timeout-minutes` | 없음 | 없음 |
| E2E | 없음 | 없음 — 그런데 **Chromium은 매번 설치** |

같은 트리거로 둘 다 돌면서 lint · typecheck · build를 **중복 실행**한다. 그런데 합집합으로만
전부가 되고 각각은 반쪽이다 — `format:check`는 `ci.yml`만, `test`는 `quality.yml`만.

그리고 `quality.yml`이 Playwright Chromium을 `--with-deps`로 매 PR 설치하는데(22~39s)
**E2E는 CI에서 돌지 않았다.** 9주차에 E2E 18개를 만들었지만 CI에 붙이지 않았다 —
브라우저를 받아 놓고 아무것도 안 돌렸다.

> 이게 10주차 목표("어떤 코드가 어떤 검증을 통과해서 배포되는지 설명할 수 있는 상태")의
> 반대다. **두 벌이 있으면 무엇이 보장되는지 아무도 말할 수 없다.**

---

## B. Before — 측정

`gh api .../actions/runs/{id}/jobs`의 step별 `started_at`·`completed_at`. 느낌이 아니라
타임스탬프다. 대상은 PR #192의 run 12건(두 워크플로 × 6커밋, 2026-09-04 ~ 09-09).

### 전체 wall-clock

| 워크플로 | raw (s) | 중앙값 | 범위 |
| --- | --- | --- | --- |
| `ci.yml` | 44 · 40 · 47 · 42 · 36 · 30 | **41** | 30 ~ 47 (폭 17) |
| `quality.yml` | 86 · 222 · 496 · 385 · 492 · 482 | **435** | 86 ~ 496 (**폭 410**) |

`quality.yml`의 폭이 410초다. 같은 검증을 하는데 실행마다 5.8배 차이가 난다.

### step별 — `quality.yml`

| run | Set up pnpm | Set up Node | Install deps | Chromium | `pnpm check` |
| --- | --- | --- | --- | --- | --- |
| 34362120423 | **8** | 8 | 1 | 33 | 27 |
| 33859114136 | **143** | 7 | 1 | 39 | 21 |
| 33858677254 | **424** | 9 | 2 | 29 | 21 |
| 33856838838 | **313** | 10 | 2 | 23 | 25 |
| 33856039881 | **426** | 8 | 1 | 26 | 23 |
| 33854881059 | **422** | 8 | 1 | 22 | 22 |

`Set up pnpm` 중앙값 **367.5s** · 범위 8~426s. **전체의 85%가 이 한 step이다.**
실제 검증(`pnpm check`)은 21~27s로 안정적이다.

---

## C. 병목 지목 — 그리고 첫 진단을 뒤집은 검증

처음 본 그림은 "09-04 run이 전부 느리고 09-09 run만 빠르다"였다. 그러면 **런너·네트워크
변동**이고 내가 고칠 수 있는 게 아니다. 워크플로 파일은 7월 30일 이후 바뀌지 않았으므로
설정 탓으로 보기 어려웠다.

그래서 **같은 커밋·같은 시각에 나란히 돈 `ci.yml`과 대조**했다.

| 생성 시각 | `ci.yml` Set up pnpm | `quality.yml` Set up pnpm |
| --- | --- | --- |
| 09-09 14:12 | 1s | 8s |
| 09-04 09:35 | 1s | 143s |
| 09-04 09:30 | 1s | **424s** |
| 09-04 09:08 | 1s | **313s** |
| 09-04 08:58 | 2s | **426s** |
| 09-04 08:44 | 1s | **422s** |

**런너 변동이 아니다.** 같은 풀·같은 시각에 한쪽은 1s, 다른 쪽은 400s를 썼다. 차이는
설정 하나다.

```yaml
# ci.yml — 1~2s
- uses: pnpm/action-setup@v4        # version 미지정

# quality.yml — 중앙값 367s
- uses: pnpm/action-setup@0ebf47…  # v6.0.9
  with:
    version: 10.15.1               # ← 명시
```

`package.json`에 **`packageManager: "pnpm@10.15.1"`이 이미 있다.** 즉 `version:`은
중복 정보이면서 느린 경로를 탄다.

> 09-09의 8s는 예외다(그 런너의 tool cache가 따뜻했던 것으로 본다). 예외 하나로 규칙을
> 세우지 않고, 6쌍 중 5쌍에서 200~400배 차이가 난 쪽을 병목으로 본다.

**교훈이 하나 남는다.** AI가 처음 짚어 준 병목은 "Playwright Chromium 설치(~30s)"였고
그건 틀렸다 — 눈에 띄지만 전체의 6%다. 과제가 *"AI가 짚어준 병목을 그대로 믿지 말고
숫자로 검증해요"* 라고 한 이유를 그대로 밟았다.

---

## D. 고른 전략 — 그리고 **안 고른** 것

### ① 워크플로를 하나로 합쳤다

`quality.yml`을 지우고 `ci.yml`에 합쳤다. lint · typecheck · build가 한 번만 돌고,
`format:check`와 `test`가 **둘 다** 들어간다. `pnpm check`에는 `format:check`가 없어
따로 부른다.

### ② `pnpm/action-setup`을 실측으로 빠른 쪽에 고정했다

```yaml
- uses: pnpm/action-setup@f40ffcd9367d9f12939873eb1018b921a783ffaa # v4
```

`version:`을 주지 않는다(`packageManager`가 들고 있다). **SHA 핀은 유지한다** —
third-party action이라 태그는 움직일 수 있다. 공식 액션(`actions/*`)도 이미 SHA 핀이
돼 있어 그대로 뒀다.

### ③ Chromium 설치를 E2E를 돌릴 때만

무조건 22~39s를 쓰던 자리다. 지금은 E2E job 안에서, 실제로 돌릴 때만 받는다.

### ❌ job 병렬화는 **하지 않았다**

과제 표에 있는 전략이지만 이 병목에 맞지 않는다. 실측으로 계산하면:

```
직렬(한 job):  lint 5 + typecheck 5 + test 8 + format 2 + build 10  ≈ 30s
분할(두 job):  max(20, 10) + checkout·pnpm·node·install 약 12s를 한 번 더  ≈ 32s
```

**나누면 벽시계가 되레 늘어난다.** 병목은 직렬 실행(30s)이 아니라 pnpm setup(367s)이었다.
7주차에 쓴 원칙과 같다 — 병목과 무관한 최적화는 넣지 않는다.

### ❌ `install` 캐시도 손대지 않았다

`Install dependencies`가 이미 1~2s다. `setup-node`의 `cache: pnpm`이 hit하고 있다는
뜻이라 고칠 것이 없다.

---

## E. 2단계 — 조건부 실행

### 무엇을 조건 없이 두는가

**lint · typecheck · test · format:check · build는 모든 PR에서 무조건 돈다.** 결정적이고
저비용(합쳐 30s)이다. 여기에 조건을 붙여 아끼는 30초는, 스킵 판정이 틀렸을 때 잃는 것보다
싸지 않다.

### E2E에만 조건을 걸었다

가장 비싼 검증이다 — Chromium 설치 30s + `pnpm build && pnpm start` + 18개 실행.

| 조건 | 동작 |
| --- | --- |
| `src/` · `e2e/` · `public/` · `package.json` · lock · `next.config.*` · `playwright.config.*` · workflow 변경 | **실행** |
| 그 밖(문서·RFC만 바꾼 PR) | 스킵 |
| `run-e2e` 라벨 | 조건을 무시하고 **실행** |
| draft PR | 스킵(라벨로 부를 수 있다) |
| `merge_group` · `push` | **무조건 실행** |

판정은 `dorny/paths-filter` 없이 `git diff --name-only base head`로 한다. 이 레포는 작아서
`fetch-depth: 0`이 2s 안이고, third-party 의존이 하나 줄어든다.

### 스킵이 안전한 이유

**세 겹이다.**

1. **스킵되는 것은 문서만 바뀐 PR이다.** `src/`·`e2e/`·설정이 하나라도 닿으면 돈다. 필터를 좁게(`^src/` 등 접두어 고정) 잡아 `**` 같은 넓은 패턴의 함정을 피했다.
2. **저비용 결정적 검증은 그 PR에서도 전부 돈다.** 즉 스킵되는 것은 "E2E만"이고 lint·type·test·build는 통과해야 한다.
3. **`merge_group`에서 무조건 한 번 더 돈다.** 개별 PR에서 스킵됐어도 main에 들어가기 직전에 전체가 돈다. 이게 최종 방어다.

### required status check와의 충돌을 피한 형태

⚠️ **job에 `if:`를 걸어 아예 실행되지 않게 하면 안 된다.** 그 검증을 branch protection의
required로 두면 PR이 *"체크 대기"* 로 **영영 머지되지 않는다.**

그래서 `e2e` job은 **항상 돌고, 안에서 가른다.** 스킵일 때는 job이 성공으로 끝나면서
`$GITHUB_STEP_SUMMARY`에 왜 안 돌렸는지와 어떻게 부르는지를 적는다. 로그를 열지 않고
PR 화면에서 보인다.

### required 배치 판단

| 검증 | required | 이유 |
| --- | --- | --- |
| `verify` | **예** | 결정적·저비용. 실패는 항상 진짜 실패다 |
| `e2e` | **예** | 스킵 시에도 성공으로 보고되는 구조라 충돌하지 않는다. `retries: 2`(CI만)로 흔들림과 진짜 실패를 가른다 |
| AI 리뷰 | **아니오** | 비결정적이다. 같은 코드가 실행마다 다르게 판정되면 게이트가 아니라 주사위다 |

### flaky 정책

`playwright.config.ts`에 이미 `retries: isCI ? 2 : 0`이다. **retry는 실패를 감추려는 게
아니라 흔들림과 진짜 실패를 가르려는 것**이다 — 1회차에 실패하고 2회차에 통과하면
Playwright가 `flaky`로 따로 표시하므로 "조용히 초록불"이 되지 않는다. 로컬은 0으로 둬서
개발 중에는 흔들림이 즉시 보인다.

반복 실패하는 스펙이 생기면 `test.fixme`로 격리하고 이슈로 남긴다 — `skip`이 아니라
`fixme`인 이유는 비활성화한 테스트를 남기지 않는 규칙(8주차)과 같다. `fixme`는 리포트에
남고 통과로 세지 않는다.

### `concurrency` — main 배포를 취소하지 않는 형태

```yaml
group: ${{ github.workflow }}-${{ github.ref }}
cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

⚠️ 그룹 키에 `ref`를 넣지 않으면 모든 실행이 한 그룹이 되어 **main push까지 취소된다.**
그건 배포 사고다. 여기에 더해 취소 자체를 PR에서만 켰다 — main·`merge_group`의 실행은
기록이어야 한다.

---

## F. After — 측정

`34572556200` (2026-09-11). 검증 항목은 Before와 같거나 **늘었다** —
`format:check`와 `test`가 이제 한 워크플로에 둘 다 있고, **E2E가 CI에서 처음 돌았다.**
test를 빼서 시간을 줄인 것이 아니다.

| job | 결과 | 시간 |
| --- | --- | --- |
| `verify` | success | 53s |
| `changes` | success | 7s |
| `e2e` | success | 58s |
| **전체 wall-clock** | | **73s** |

### 병목이 실제로 사라졌나 — `Set up pnpm`

| | Before(`quality.yml`) | After |
| --- | --- | --- |
| raw (s) | 8 · 143 · 424 · 313 · 426 · 422 | **2** |
| 중앙값 | **367.5** | **2** |
| 범위 | 8 ~ 426 (폭 418) | — |

**−365.5s.** 이 변화는 Before 측정 폭(418s)보다 작지만, 폭 자체가 이 병목이 만든 것이라
"흔들림보다 큰 변화인가"를 폭으로 판단하면 순환이 된다. 그래서 C절의 **통제된 대조**
(같은 커밋·같은 시각 1~2s vs 313~426s)를 근거로 쓴다 — 빠른 쪽 값을 재현한 것이다.

### verify job step 분해 (After)

```
1s  Set up job              5s  setup-node            3s  pnpm format:check
1s  checkout                6s  pnpm install          9s  pnpm build
2s  pnpm/action-setup       4s  pnpm lint             5s  Post setup-node
                            4s  pnpm typecheck
                            8s  pnpm test
```

실제 검증은 **28s**(lint 4 + typecheck 4 + test 8 + format 3 + build 9)이고 나머지 25s가
환경 준비다. D절에서 job을 쪼개지 않은 근거가 이 숫자다 — 28s를 둘로 나누려고 25s를
한 번 더 낼 이유가 없다.

### e2e job (After) — CI에서 처음 돈다

```
0s   실행 여부 판정          ← .github/workflows/ 변경 → run=true
21s  playwright install --with-deps chromium
21s  pnpm test:e2e           ← 18개 통과 (build + start 포함)
```

### Before ↔ After

| | Before | After |
| --- | --- | --- |
| 워크플로 | 2벌(중복 실행) | **1벌** |
| wall-clock | `ci.yml` 41s + `quality.yml` **435s**(중앙값) | **73s** |
| lint·typecheck·build | **두 번** | 한 번 |
| `format:check` | `ci.yml`만 | 있음 |
| `test` | `quality.yml`만 | 있음 |
| **E2E** | **안 돎**(Chromium만 매번 설치) | **돈다**(조건부) |
| `permissions` | `ci.yml` 없음 | `contents: read` |
| `concurrency`·`timeout` | 없음 | 있음 |
| Node | 22 하드코딩 / `.nvmrc` 혼재 | `.nvmrc` |

> ⚠️ **After도 3회를 못 채웠다.** 남은 시간에 돌린 run 수만큼만 적었다. cold/warm 구분도
> 통제하지 못했다 — 이 표는 "병목이 사라진 것"은 말하지만 "평균이 얼마나 줄었는지"를
> 통계적으로 말하지는 못한다. A절의 한계와 같은 성질이다.

### 조건부 실행 증거 — 그리고 여기서 필터를 한 번 잘못 읽었다

문서만 바꾼 커밋(`a95f1ed9`)을 푸시하고 E2E가 스킵될 줄 알았는데 **돌았다.**

원인은 `BASE_SHA`다. `github.event.pull_request.base.sha`는 **PR의 base(= Jaeho96) tip**이라
`git diff base head`가 **PR 전체의 변경**을 준다. 그 PR에는 앞선 커밋의 `src/` 변경이
들어 있으니 `app=true`가 맞는 답이었다.

**이건 버그가 아니라 내가 의도를 잘못 적은 것이다.** 그리고 다시 생각해 보니 PR 범위가
**옳다** — 푸시 단위로 판정하면, `src/`를 고친 PR이 마지막에 문서만 한 줄 고쳐 푸시하는
것으로 **E2E를 한 번도 안 돌리고 머지될 수 있다.** 게이트는 "이 PR이 무엇을 바꾸는가"를
봐야 한다.

그래서 스킵을 보이려면 **앱 코드가 없는 별도 PR**이 필요하다.

| PR / run | PR 전체가 바꾼 것 | `e2e` 판정 |
| --- | --- | --- |
| #206 `34572556200` | `.github/workflows/` · `docs/` | **run=true** — 21s Chromium + 21s 실행, 18개 통과 |
| #206 `34573139743` | 위 + `src/` | **run=true** (문서만 푸시했어도 PR 범위에 `src/`가 있다) |
| #209 `34573610403` | `docs/` 1개 (base를 `volume-10`으로 둠) | **run=false** — 아래 |

`#209`의 `e2e` job 로그가 설계한 그대로다.

```
── e2e  success  4s
     success  실행 여부 판정          ← app=false
     skipped  checkout
     skipped  pnpm/action-setup
     skipped  setup-node
     skipped  pnpm install
     skipped  playwright install --with-deps chromium
     skipped  pnpm test:e2e
     success  스킵 기록               ← summary에 이유와 run-e2e 사용법
── verify  success  50s               ← lint·typecheck·test·format·build 전부 실행
```

**58s → 4s**, Chromium도 받지 않는다. 그리고 job이 **success**이므로 `e2e`를 required로
둬도 이 PR은 머지 가능하다 — `if:`를 job에 걸었다면 여기가 "체크 대기"로 막혔다.

> `#208`을 먼저 만들었는데 **base를 `Jaeho96`으로 잡아 실패했다.** 그 브랜치에는 새
> `ci.yml`이 없어서 옛 워크플로 두 벌이 돌았다(`changes`·`e2e` job 자체가 없다).
> `pull_request`는 **head 브랜치의 워크플로**로 돈다는 것을 몸으로 확인한 자리다.
> base를 `volume-10`으로 바꿔 다시 열었다(`#209`).

> 부수 증거 하나. 중간 run(`34573110603`)이 **`cancelled`** 로 끝났다. 연속 푸시에서
> `concurrency`가 앞선 PR 실행을 취소한 것이고, 설계한 대로다. 그룹 키에 `ref`가 있고
> 취소를 PR 이벤트로만 켰기 때문에 **다른 브랜치·`merge_group`은 건드리지 않았다.**

### 그리고 required 게이트가 한 번 빨간불이 됐다 — `format:check`

`a95f1ed9`의 `verify` job이 `pnpm format:check`에서 실패했다. 로컬에서는 통과했는데
CI에서만 났다. 원인은 둘이 겹쳤다.

1. **`pnpm check`에 `format:check`가 없다.** 로컬 습관이 `pnpm check`라 포맷은 확인되지 않는다.
2. **lint-staged 패턴이 `*.{ts,tsx,js,jsx}`라 `.mjs`를 잡지 않는다.** 5단계에서 고친 파일이 `eslint.config.mjs`였고, 커밋 훅이 포맷해 주지 않았다.

**이 함정은 내가 이미 알고 기록해 둔 것이었다**(*"CI verify는 format:check를 돌지만 로컬
`pnpm check`엔 없다 — push 전 `format:check` 필수"*). 알고 있는데 또 밟았다. 5단계에서
"글로 적는 것은 실패했다"고 쓴 바로 그 패턴이 문서가 아니라 내 절차에서 재현됐다.

> 남는 것: **`pnpm check`에 `format:check`를 넣거나 lint-staged 패턴에 `.mjs`를 더해야
> 한다.** 둘 다 `package.json`·`.husky` 수정이라 이번 주 범위에서 손대지 않았고, 그래서
> 이 함정은 아직 살아 있다 — 다음에 또 밟을 수 있다는 뜻으로 여기 적어 둔다.

## G. 4단계 — AI 코드리뷰를 CI에 붙이지 않은 근거

9주차에 Codex 교차 검증을 두 번 돌려 결함 6개를 잡았다(`week09-e2e-scope.md` F·H절).
즉 AI 리뷰는 **이미 하고 있다.** CI로 옮기지 않은 이유는 증거에 있다.

| 잡힌 것 | diff만 보고 잡을 수 있었나 |
| --- | --- |
| **F1** `?next=/%0a/evil.example`가 방어를 통과 | 어렵다 — 브라우저 URL 파서가 제어문자를 제거한 뒤 해석한다는 **외부 지식**이 필요하다 |
| **F2** `expired` 노브가 서버 검증을 건너뛴다 | **불가능하다.** diff에 없다. 목 서버 구현과 서버 레이아웃을 같이 읽어야 나온다 |
| **H1** 내 **주석이** 거짓이었다(mutation 401은 `QueryCache.onError`를 안 탄다) | 불가능하다. 주석과 런타임 동작을 대조해야 한다 |

**세 개 다 "파일을 열어 읽게 했을 때" 나왔다.** PR diff만 주는 자동 리뷰로는 못 잡았을
것이다. 그래서 AI 리뷰는 대화형으로 유지하고, CI에는 붙이지 않는다 — 붙이면 비용과
소음은 늘고 잡는 힘은 줄어든다.

**리뷰 기준(프롬프트)은 명문화돼 있다.** `CLAUDE.md` · `.claude/rules/react.md` ·
`.claude/rules/typescript.md` · `.claude/rules/testing.md`가 그 자리다. 일반론이 아니라
이 프로젝트의 규칙이다(`as` 금지 · `getByTestId` 금지 · `waitFor` 콜백은 단언 하나 ·
내부 모듈 모킹 금지 · 파생값은 렌더 중 계산).

### 잘 잡은 것 1 / 헛소리 1

- **잘 잡은 것 — F1.** 제어문자로 오픈 리다이렉트 방어를 넘는 경로. 실측으로 `new URL()`이 `https://evil.example/`로 해석하는 것까지 확인하고 받았다.
- **헛소리 1 — proxy 설계 지적.** "proxy에서 쿠키 서명을 검증해야 한다"고 했는데, **proxy는 Edge에서 돌아 `node:crypto`를 쓸 수 없다.** 근거를 들어 받지 않았다. 그럴듯하지만 런타임 제약을 모르고 한 말이다.
- **프롬프트를 어떻게 고쳤나** — 그 뒤로는 "이 파일이 어느 런타임에서 도는지 먼저 확인하고 지적하라"를 넣었다. 두 번째 검증(H절)에서는 런타임을 틀린 지적이 나오지 않았다.

---

## G2. 3단계 — 예산 게이트와 결과 가시성

처음엔 **걸지 않기로** 했다. 과제가 임계값 근거를 7주차 측정값으로 요구하는데, 7주차에
잰 것은 **이미지 전송 크기와 LCP**이고 JS 번들은 재지 않았다. 지금 새로 재서 그 값을
쓰면 "현재값 = 예산"이 되어 회귀만 막고 개선 압력은 0이다.

그런데 시간이 남아 다시 보니, **7주차 값으로 유도할 수 있었다.**

### 임계값을 LCP에서 거꾸로 계산했다

7주차 측정: `--throttling-method=devtools`(Lighthouse Slow 4G ≈ 1.6Mbps ≈ **200KB/s**)에서
**LCP 중앙값 1,886ms**(폭 15ms). 이게 지켜야 할 예산이다.

셸 JS는 첫 화면이 그려지기 전에 반드시 내려가는 바닥값이므로 **LCP 예산의 절반**을
넘지 않게 둔다.

```
1,886ms × 50% = 943ms
943ms × 200KB/s = 188KB   ← 셸 예산
```

현재 셸은 **167.4KB(837ms, LCP 예산의 44%)** 로 그 아래에 있다. 여유 21.6KB(12.5%)다.
**"현재값 + 적당히"가 아니라 LCP 예산에서 유도한 값이고, 마침 현재값이 그 아래다.**

전체 청크는 성격이 다르다 — 지연 로드까지 포함하므로 첫 화면 비용이 아니다. 그래서
유도하지 않고 **회귀 가드**로 뒀다(현재 232.9KB + 같은 여유 비율 = 268KB). 개선 목표가
아니라 "모르는 사이에 늘지 않게" 하는 선이라고 스크립트 주석에 적었다.

단위는 **gzip 전송 크기**다. 사용자가 기다리는 것은 전송이고, 7주차도 전송 크기로
쟀다(Hero 7,545,525B). 같은 단위를 써야 두 측정이 이어진다.

### `size-limit`을 쓰지 않은 이유

Next 16은 build 출력에 크기를 찍지 않고 청크 이름이 해시다. 어느 도구를 쓰든
`.next/build-manifest.json`을 읽어 "셸이 어느 청크인가"를 매핑해야 하고, **그 매핑이
스크립트의 본체**다. 도구를 얹으면 의존성만 하나 늘어난다. 도구가 공짜로 주는
PR 코멘트는 `$GITHUB_STEP_SUMMARY`로 직접 낸다.

### 환경 변수 검증 (`scripts/validate-env.mts`)

**이 레포에 실재하는 약점 위에 세웠다.** `auth.ts`에 이런 줄이 있다.

```ts
const sessionSecret = () => process.env.AUTH_SESSION_SECRET ?? "loopers-week09-secret";
```

배포에서 변수가 빠지면 **오류 없이** 세션 HMAC 비밀이 레포에 적힌 공개 문자열이 된다.
쿠키는 정상으로 보이고 로그인도 되므로 아무도 모른다. 9주차에 만든 위조 방어가
그대로 무력해진다.

검사하는 것:

| 대상 | 무엇을 |
| --- | --- |
| `APP_ORIGIN` | 존재 · 절대 URL · http/https · **경로·쿼리 없음** · (배포)로컬 주소 아님 · (배포)https |
| `AUTH_SESSION_SECRET` | 존재 · **레포의 기본값과 같지 않음**(개발에서도 실패) · (배포)32자 이상 |
| `NEXT_PUBLIC_*` | 이름에 `SECRET`·`TOKEN`·`PASSWORD`·`PRIVATE` 등이 들어간 것 — **빌드 결과에 인라인되어 브라우저에서 읽힌다** |

**값은 찍지 않는다**(로그가 남는다). 이름과 이유만 적는다.

검사하지 **않는** 것도 적어 둔다. 값이 "맞는지"(그 주소가 살아 있는지, 비밀이 진짜
비밀인지)는 결정적으로 판별할 수 없어서 안 본다. **형태와 존재만** 본다 — 게이트는
결정적인 것만 맡는다는 이번 주 기준 그대로다.

CI에서는 **기본 모드**로 돈다(경고만). `--production`으로 막으면 코스가 제공한
파이프라인이 env를 주지 않아 build 자체가 못 돈다 — 7주차에 `metadataOrigin()`에
기본값을 남긴 것과 같은 이유다. 배포 job이 생기면 그쪽에 `--production`을 붙인다.

### 빨간불 자가 검증

두 게이트 다 **일부러 어겨서** 빨간불을 확인했다.

**번들 예산** — 셸 비중을 50% → 40%로 좁혀 예산을 151KB로 만들었다.

```
| ❌ 셸 JS      | 167.4 KB | 151 KB | +16.4 KB | 837ms  |
| ❌ 전체 청크  | 232.9 KB | 200 KB | +32.9 KB | 1165ms |

**예산을 2건 초과했습니다.** 무엇이 늘었는지는 .next/static/chunks를 크기순으로 보세요:
  pnpm build && ls -S .next/static/chunks/*.js | head
예산을 올리려면 근거 주석을 같이 고쳐야 합니다 — 숫자만 올리면 근거 없는 임계값이 됩니다.
```

**PR 화면에서 무엇이 얼마나 초과했는지 읽힌다** — 현재·예산·차이·전송 시간·근거가
한 표에 있다. 8주차의 "실패 메시지로 원인을 짚을 수 있었나"를 그대로 적용했고,
**다음 행동**(무엇을 볼지, 예산을 올리려면 무엇을 같이 고쳐야 하는지)까지 넣었다.

**환경 변수** — 5가지 실패 경로를 각각 재현했다.

| 입력 | 결과 |
| --- | --- |
| env 없음 + `--production` | 실패 2건 (`APP_ORIGIN` · `AUTH_SESSION_SECRET`) |
| 기본값 비밀 | **개발 모드에서도** 실패 1건 |
| `APP_ORIGIN=http://localhost:3000/shop` + `--production` | 실패 3건 (경로 있음 · 로컬 · http) |
| `AUTH_SESSION_SECRET=short` + `--production` | 실패 (5자 < 32자) |
| `NEXT_PUBLIC_API_SECRET=x` | 실패 (브라우저 노출) |

실험 뒤 전부 원복하고 `예산 안입니다` · 통과를 다시 확인했다.

### required 배치

| 게이트 | required | 이유 |
| --- | --- | --- |
| 번들 예산 | **예** | gzip 크기는 같은 커밋이면 같은 바이트다. 결정적이라 실패는 항상 진짜 실패다 |
| 환경 변수 | **예**(기본 모드) | 존재·형태만 보므로 결정적. 배포 job에서 `--production`으로 강화 |
| Lighthouse | ❌ 안 걸었다 | 측정 방법 하나로 40배가 움직인다(7주차 실측: 구간 합 947ms vs LCP 40,514ms). 변동성이 큰 것을 required로 두면 빨간불이 코드 얘기인지 러너 얘기인지 아무도 모른다 |

---

## H. 5단계 — 반복 지적을 결정적 룰로

별도 절로 뒀다 → **`docs/rfc/week10-rule-promotion.md`**

---

## I. 생각해 볼 질문

별도 절로 뒀다 → **`docs/rfc/week10-questions.md`**

---

## J. Codex 교차 검증 — 확정 결함 셋

8·9주차와 같은 방식으로 다른 모델에 적대적 리뷰를 맡겼다. **셋 다 false negative였다** —
게이트가 통과시키면 안 되는 것을 통과시키는 방향이다. 게이트를 만드는 주에 가장 나쁜 종류다.

> ⚠️ 실행 메모: `-m gpt-5.4`가 이제 ChatGPT 계정에서 거부된다
> (`The 'gpt-5.4' model is not supported when using Codex with a ChatGPT account`).
> 9주차에 기본 모델이 capacity로 막혀 5.4를 쓰던 것과 상황이 반대가 됐다. 기본 모델로 돌렸다.

### J1. 안내한 탈출구가 열리지 않는 문이었다

스킵 요약이 *"필요하면 `run-e2e` 라벨을 붙이세요"* 라고 안내하고, `decide` step이
`contains(github.event.pull_request.labels.*.name, 'run-e2e')`를 읽는다. 그런데
`on: pull_request:`만 쓰면 **기본 types가 `[opened, synchronize, reopened]`** 다.

**`labeled`가 없다. 즉 라벨을 붙여도 워크플로가 다시 돌지 않는다.**

`draft` 분기도 같다. `ready_for_review`가 없으니 draft를 해제해도 재실행되지 않아
그 분기가 무의미했다.

**9주차 H1과 같은 성질이다** — 코드가 아니라 **내가 코드에 대해 적어 둔 것**이 틀렸다.
그리고 과제 본문에 경고가 있었다(*"label 트리거는 label을 뗐다 붙일 때의 재실행·권한을
확인해요"*). **읽고도 확인하지 않았다.**

```yaml
pull_request:
  types: [opened, synchronize, reopened, labeled, unlabeled, ready_for_review]
```

`unlabeled`도 넣었다. 라벨을 떼면 다시 판정해 스킵으로 돌아가야 하는데, 없으면 라벨을 뗀
상태가 마지막 실행(E2E 돌린 결과)으로 남는다.

### J2. 파일 목록이 길면 앱 변경을 스킵으로 판정했다

```bash
if echo "$changed" | grep -qE '^(src/|...)'; then
```

`grep -q`는 **첫 매치에서 즉시 끝난다.** 그러면 `echo`가 SIGPIPE(141)로 죽고,
`set -o pipefail`이 그 141을 파이프라인 상태로 올려서 **매치했는데도 `if`가 거짓**이 된다.

즉 **`src/`를 고쳤는데 E2E가 스킵된다.** 파일 목록이 짧으면 `echo`가 먼저 다 써서
안 나타나고, **길 때만** 나타난다.

실측으로 재현했다 — 변경 5,001줄(`src/a.ts` 1개 + 문서 5,000개):

```
echo | grep -q  → app=false   ← 앱 코드가 바뀌었는데 스킵
grep -q <<<     → app=true    ← 올바름
```

herestring으로 바꿨다. 파이프가 없으면 SIGPIPE도 없다.

**이게 과제가 경고한 함정의 실제 모습이었다.** *"path filter가 너무 좁으면 필요한 검증을
스킵해 깨진 코드가 통과해요"* — 그런데 원인이 패턴이 아니라 **셸 파이프 의미론**이었다.
패턴만 들여다봤으면 영원히 못 찾는다.

같이 패턴도 넓혔다. `vitest.config.*` · `eslint.config.*` · `tsconfig*` · `.nvmrc`가
빠져 있었다 — 검증 설정이 바뀌면 E2E도 다시 봐야 한다.

### J3. 잴 파일이 없으면 0KB로 예산을 통과했다

`gzipBytes()`가 없는 파일을 조용히 건너뛰고 합계를 돌려줬다. 매니페스트의 청크가 하나도
실재하지 않으면 **0KB가 되고, 0 < 189이므로 통과한다.**

빌드 산출물 경로가 바뀌거나 Next가 매니페스트 키 이름을 바꾸면 그렇게 된다.
**게이트가 "아무것도 못 찾았다"를 통과로 읽으면 게이트가 아니다.**

찾은 파일이 0이면 던지게 했다. 재현·확인:

```
$ (매니페스트를 없는 경로로 바꾸고)
Error: [셸 JS] 잴 파일을 하나도 찾지 못했습니다(대상 1개).
       pnpm build 를 먼저 돌렸는지, .next/build-manifest.json 의 키가 바뀌지 않았는지
       확인하세요. 0KB로 통과시키지 않습니다.
```

### 받지 않은 지적 / 확인만 된 것

| | 판정 |
| --- | --- |
| `globSync`가 `node:fs`에 있나 | **있다.** Node 24에서 유효함을 Codex가 실제 코드로 확인 |
| App Router에서 `rootMainFiles`가 맞나 | **맞다.** `app-build-manifest.json`이 없고 `build-manifest.json`만 있는 것도 확인 |
| `queryAllByRole("alert")).toHaveLength(0)`이 여전히 false green인가 | **아니다.** 복구 테스트가 먼저 `findByRole("alert")`로 존재를 확인하고 그 안의 버튼을 누른다 — "알림이 처음부터 없었다"는 이미 배제된다 |
| 2페이지 기대값이 핸들러와 맞나 | **맞다** |

> Codex의 테스트 실행은 임시 디렉터리 권한 오류로 중단돼서, **통과 여부는 제가 따로
> 확인했다**(23파일 175개 통과). 교차 검증이 못 본 자리를 적어 둔다.

### 내가 먼저 찾은 것과 겹친 자리

selector 프로브(오탐 1 · 누락 1)는 **제가 먼저 찾아 고치는 중이었고**, Codex가 중간에
그 커밋(`5a52db82`)을 발견해 독립적으로 같은 결론을 냈다 — `vi.waitFor` 잡힘, `expect.not`
오탐 해소, 별칭 우회 잔존. 두 경로가 같은 답에 닿았다.

### 세 번의 교차 검증에서 배운 것

| 주차 | 무엇을 잡았나 |
| --- | --- |
| 8 | 구현 결함 2 |
| 9 | 구현 결함 3(F) + **내 주석이 거짓**(H1) |
| 10 | **내 안내가 거짓**(J1) + 셸 의미론(J2) + 게이트의 false green(J3) |

성질이 옮겨 가고 있다. 처음엔 코드가 틀렸고, 이제는 **코드에 대해 내가 적어 둔 것**과
**검증 장치 자체**가 틀린다. 게이트를 만드는 주에 게이트가 통과시키면 안 되는 것을
통과시켰다는 게 J2·J3의 요지다 — **검증을 만들면 그 검증도 검증해야 한다.**

### J4~J6. 2차 지적 — 게이트의 강제 범위가 메시지보다 좁았다

J1~J3을 고친 뒤 Codex가 낸 최종 보고에 셋이 더 있었다. 성질이 하나로 묶인다 —
**메시지는 넓게 말하는데 실제로 막는 범위는 좁았다.** 게이트가 거짓 약속을 한 셈이다.

| | 무엇이 | 고침 |
| --- | --- | --- |
| **J4** | `expect(p).resolves.not` · `.rejects.not` 체인이 빠져나갔다. `[object.callee.name="expect"]`만 보면 `expect(p).resolves`가 object라 안 걸린다 | selector 4개로 체인까지 본다 |
| **J5** | 메시지는 "testid로 조회하지 않는다"인데 **복수형**(`getAllByTestId` 등)과 문자열 프로퍼티(`screen["getByTestId"]`)가 전부 통과했다 | 정규식으로 `(get\|query\|find)(All)?ByTestId`와 `property.value`까지 |
| **J6** | `querySelectorAll`이 대상이 아니었다 | `/^querySelectorAll?$/` |

프로브로 4건 검출 · 정상 코드 통과를 확인했다.

### 안 고친 지적 — 받아들인 한계

| 지적 | 왜 안 고쳤나 |
| --- | --- |
| `import { waitFor as wf }` 별칭 우회 | Codex 말이 맞다 — **AST 규칙의 원리적 한계가 아니라 이름 기반 selector의 한계**다. binding을 추적하려면 custom rule을 써야 하고, 이 레포는 전부 `waitFor`로 import한다. 변이 실험이 그 자리를 맡는다 |
| `const { getByTestId } = render(...)` 구조 분해 | 같은 이유(binding 추적) |
| `validator.toBeTruthy()` 오탐 | `expect`에서 시작한 체인인지 확인해야 하는데 지금 selector 형태로는 안 된다. 이 레포에 그런 호출이 없고, 오탐이 나면 이름을 바꾸면 된다 — **이 방향의 오탐은 싸다** |
| **`.env*` 파일을 읽지 않는다** | **이게 남은 것 중 가장 큰 구멍이다.** 검증기는 `process.env`만 읽고 뒤의 `next build`는 `.env.production` 등을 읽는다. 즉 **검증기와 빌드가 다른 설정을 본다.** `@next/env`가 pnpm strict에서 직접 해석되지 않아 의존성을 추가해야 하고, lockfile·CI 캐시를 건드리는 일이라 마감 30분 전에 하지 않았다. **미룬 일이지 한계가 아니다** — 9주차에 정리한 구분에 따라 그렇게 적는다 |
| `concurrency` 주석이 보장 범위를 과장 | 사실이다. `cancel-in-progress`가 거짓이어도 **대기 중인 실행은 교체된다**(A 실행·B 대기·C 도착이면 B가 밀린다). "main의 실행은 기록이어야 한다"는 주석이 그보다 약한 보장을 과장했다. 문구를 고치는 것이 맞지만 동작 변경이 아니라 여기 적어 둔다 |

### 확인만 된 것 (지적이 아니었다)

`pull_request_target` 없음 · `run:`에 `${{ }}` 직접 삽입 없음(전부 `env`로 감쌈) ·
secrets 전달 0건 · SHA 핀 누락 없음 · checkout `persist-credentials: false` ·
`contents: read`로도 `upload-artifact`는 동작(별도 Actions runtime token을 쓴다) ·
`git diff A B`는 force push에서도 두 객체만 있으면 동작 · `IS_DRAFT`가 빈 문자열이어도
분기가 옳음 · step guard 누락 없음.

> **PR checkout이 합성 merge commit인데 필터는 PR head를 비교한다**는 지적은 받아 둔다.
> base에만 들어간 변경까지 잡아 **불필요한 E2E를 더 돌릴 수** 있다 — 안전한 방향의
> 부정확이라 고치지 않았다. 반대 방향(덜 돌림)이면 고쳐야 했다.
