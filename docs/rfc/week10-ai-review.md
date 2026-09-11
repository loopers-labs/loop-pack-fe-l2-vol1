# 10주차 4단계 — AI 코드리뷰 활용과 판별

팀 컨벤션을 리뷰 기준으로 명문화한 뒤 실제로 돌려, 잘 잡은 지적과 헛소리를 작성자가 갈라내고 프롬프트를 고친 기록이다.

## 실행 조건

| 항목 | 값 |
| --- | --- |
| 도구 | Claude Code (Opus 5), 로컬 실행 |
| 리뷰 기준 | `.claude/skills/*`(analyze-component · component-review · state-design-review · test-review · architecture-review) + `.claude/rules/*`(state-data · rendering · performance · testing) + `CONVENTIONS.md` |
| 대상 | `feat/week10-review-evidence` `f38d5831` |
| 실행 건수 | 리뷰 10건 (스킬 5종 × 대상 9 + 프롬프트 v2 재실행 1) |
| 게이트 배치 | **advisory** — required·PR guard·배포 조건 어디에도 넣지 않는다 |

리뷰 기준은 일반론이 아니라 이 프로젝트가 10주간 합의한 규칙이다. 예를 들어 아래 「잘 잡은 리뷰」가 인용한 조항은 5주차 상태 설계 논의에서 나와 4단계에 `state-data.md`로 명문화한 것이다.

### 이 문서의 쌍은 로컬 리뷰다 — 성격을 먼저 밝힌다

이 저장소에는 AI 리뷰가 **두 형태**로 있고 둘 다 이번 단계에서 정비한 기준으로 돌았다.

| | 이 문서의 쌍 (로컬) | CI AI 리뷰 |
| --- | --- | --- |
| 대상 | 고정 SHA `f38d5831`의 **파일·흐름** — PR diff가 아니다 | 고정 base→head **PR diff** |
| 도구 | Claude Code (Opus 5) + `.claude/skills/*` | gpt-5.6-luna + `scripts/week-10-ci/pr-review.md` (`ai-review.yml`) |
| 프롬프트 버전 고정 | SKILL.md SHA-256 | `promptHash` (결과 JSON·PR 댓글에 기록) |
| 외부 확인 수단 | 커밋 히스토리 + **아래 재현 명령** | PR 댓글 · run ID · 아티팩트 |
| v1/v2 전후 비교 | **수행** | 미수행 — `OPENAI_API_KEY`가 저장소 secret에만 있어 로컬 재실행 불가 |

판별 쌍을 로컬에서 고른 이유는 **프롬프트 v1/v2 전후 비교를 같은 조건으로 실행할 수 있는 쪽이 여기뿐**이기 때문이다. 대신 로컬 리뷰는 PR 댓글 같은 외부 기록이 없으므로, 검증 수단으로 재현 명령을 아래에 남긴다. CI 쪽 판별 쌍(유효: `CurrencySelect.tsx:37` hydration / 오탐: `quality.yml` `!cancelled()`)은 이 문서 끝에 함께 적는다.

CI 리뷰의 안전장치·트리거·한도·required 제외 근거는 [week10-decisions.md](week10-decisions.md)의 ADR에, 첫 댓글 캡처도 같은 문서에 있다.

### 재현 명령

```bash
# 프롬프트 v1 / v2 (v1은 이 문서 커밋의 직전 상태)
git show f38d5831:.claude/skills/test-review/SKILL.md | shasum -a 256   # 32672c0a…
shasum -a 256 .claude/skills/test-review/SKILL.md                       # 868f02e7…

# 헛소리가 인용한 CI 명령이 실재하지 않음을 확인
grep -n "playwright test --grep" .github/workflows/quality.yml   # --workers 없음
grep -n "workers" playwright.config.ts                            # 설정 자체가 없음
grep -rn -- "--workers" docs/ specs/                              # 비용 측정·과제 문서에만

# 잘 잡은 리뷰의 비대칭 확인
grep -n "clearCheckoutDraft" src/features/auth/ui/LogoutButton.tsx src/app/query-client.ts

# 리뷰가 근거로 쓴 뮤테이션 (각각 돌린 뒤 git checkout -- <file>로 원복)
pnpm vitest run src/features/auth src/_pages/login src/entities/session tests/session-expired.dom.test.tsx
#   → 35 passed. LoginForm.tsx:38의 toSafeNextPath(...)를 ?? '/'로 바꾸면 35개가 그대로 통과한다
#   → entities/session/api/queries.ts:53의 cancelQueries를 지우면 17개가 그대로 통과한다
```

---

## 잘 잡은 리뷰

**출처**: `state-design-review` / `src` 전체 클라이언트 상태
**인용한 기준**: `.claude/rules/state-data.md` 「저장해 두는 상태」
**판정**: **수용** — 공용 PC에서 남의 주문을 확정할 수 있는 경로다. 두 출구를 같이 처리하는 방향으로 고친다.

### 리뷰 원문

> **checkout `draftItems`** (`src/entities/order/model/checkout-store.ts:70-93`)
>
> *이 자리가 맞으려면*: 구매 의사가 **계정의 것**이거나 **기기의 것**이거나, 둘 중 하나로 일관돼야 한다.
>
> *반례*: 로그아웃은 지우고(`src/features/auth/ui/LogoutButton.tsx:19-21`) 만료는 안 지운다(`src/app/query-client.ts:34-52`). A가 `/orders/new`에서 만료 → 같은 탭 로그인 화면에서 B가 로그인 → `replaceDocument(next='/orders/new')`(`src/features/auth/ui/LoginForm.tsx:38`) → `useRestoreCheckoutDraft`가 같은 탭 sessionStorage에서 A의 draft를 복원(`src/_pages/order-new/ui/OrderNewPage.tsx:10`)
>
> *무너지면 생기는 일*: B가 A가 고른 상품·수량을 그대로 확정 주문한다. 조항 「저장해 두는 상태」 — *계정 범위 데이터가 기기 저장소에 남는다. 사용자가 바뀔 때 남길 값인지 지울 값인지 정한다.* 두 출구가 서로 다른 답을 내고 있어 아직 안 정해진 상태다

### 작성자가 확인한 코드 근거

두 출구를 나란히 놓으면 비대칭이 드러난다.

```ts
// LogoutButton.tsx:19-25 — draft를 계정 범위로 보고 지운다
onSuccess: async () => {
  // 장바구니·위시리스트는 브라우저가 유일한 원본이라 두고, 계정 범위 상태만 정리한다
  clearCheckoutDraft();
  await replaceSessionUser(queryClient, null);
  ...
}

// query-client.ts:34-52 — 같은 "계정이 끊겼다"인데 정리가 없다
const handleSessionExpired = async () => {
  if (isHandlingSessionExpiry) return;
  isHandlingSessionExpiry = true;
  await replaceSessionUser(queryClient, null);
  reset();
  identifiedUserId = undefined;
  // clearCheckoutDraft() 없음
  ...
};
```

draft는 sessionStorage에 있고(`checkout-store.ts:67` — "같은 탭의 새로고침·**로그인 왕복**에 살아남고") 이는 **탭 수명**이다. 로그인은 `replaceDocument`로 문서를 갈아끼우지만 같은 탭이라 sessionStorage가 남는다. `skipHydration`과 `createValidatedStorage`가 있으나 둘 다 **형태 검증이지 소유자 검증이 아니고**, draft에 userId가 없어 누구 것인지 알 방법이 없다.

### 이 지적이 좋은 이유

- 코드 한 곳이 아니라 **두 출구의 불일치**를 짚었다. 각각만 보면 둘 다 말이 된다.
- 인용한 조항이 주장을 정확히 관장한다. 그 조항은 "지워라"가 아니라 "**정하라**"이고, 리뷰도 정답 대신 미결정임을 지적했다.
- 실제 사용자 피해 시나리오를 파일·줄과 함께 재현 가능한 순서로 적었다.

---

## 헛소리

**출처**: `test-review` v1 / 로그인·세션 만료 테스트
**등급**: `[blocker]` (리뷰가 스스로 매긴 최고 등급)
**판정**: **근거 반려, 관찰만 수용** — 지적이 선 자리는 맞지만 blocker 등급을 지탱하던 사실이 저장소에 없다.

### 리뷰 원문

> `[blocker]` **`e2e/auth.spec.ts:5`** — 근거: 「E2E · 계정·데이터 격리」. 모든 워커가 `getTestAccount(0)`(looper1) 고정으로 로그인한다. 같은 성격의 `e2e/session-expired.spec.ts:27`은 `test.info().parallelIndex`를 쓴다. **CI는 `--workers=2 --grep @critical`로 auth·order를 동시에 돌리고** `e2e/order.spec.ts`는 worker 0에서 같은 looper1로 주문을 만든다. 지금은 auth.spec이 주문 데이터를 만들거나 개수에 기대지 않아 실패로 드러나지 않는 잠복 상태다

### 반증

| 확인한 것 | 결과 |
| --- | --- |
| `.github/workflows/quality.yml:252` | `pnpm exec playwright test --grep @critical` — **`--workers=2` 없음** |
| `playwright.config.ts` | `workers` 설정 자체가 없다 (retries · reporter · use · projects · webServer만) |
| 저장소 전체 `--workers` 검색 | `docs/rfc/week10-e2e-cost.md:32`의 **로컬 비용 측정 명령**, 그 evidence JSON, 9주차 과제 문서뿐 |

즉 **다른 문서(비용 측정)의 명령을 CI 명령으로 옮겨 적었다.** 실제 CI의 워커 수는 Playwright 기본값(코어 절반)에 딸려 오는 값이고 러너 스펙이 바뀌면 같이 바뀐다 — 설정 근거가 아니다.

### 갈라서 본 결과

- **사실**: `auth.spec.ts:5`가 `const account = getTestAccount(0)`으로 모듈 최상단 고정, `session-expired.spec.ts:27`은 `parallelIndex` 사용. 같은 성격인데 한쪽만 다르다.
- **근거 없음**: "CI가 명시적으로 2 워커로 동시 실행한다"가 저장소에 없다.
- **리뷰 스스로 인정**: "실패로 드러나지 않는 잠복 상태" — 맞다. `auth.spec`은 주문을 만들지도 개수에 기대지도 않아 계정이 겹쳐도 관측 가능한 충돌이 없다.

**결론**: blocker → 개선으로 내려 관찰만 수용한다. 근거 서술은 반려.

### 이 헛소리가 위험한 이유

결론이 통째로 틀린 게 아니라 **근거 하나가 다른 파일에서 옮겨 왔다.** 파일명·줄번호·인용 형식이 다 갖춰져 있어 검증 없이는 진짜처럼 읽힌다. 등급까지 최고였다.

같은 시기 CI AI 리뷰(gpt-5.6-luna)가 낸 오탐도 **같은 실패 모드**였다 — GitHub Actions의 `!cancelled()` 의미론을 지어냈고 실제 run이 반증했다(아래 [CI AI 리뷰 쪽 판별 쌍](#ci-ai-리뷰-쪽-판별-쌍-pr-diff)).

**두 오탐의 공통점: 자료에 없는 사실을 전제로 삼았다.** 하나는 플랫폼 동작 규칙을 지어냈고, 하나는 다른 문서의 명령을 옮겼다.

---

## 프롬프트를 어떻게 고쳤나

### 진단

`test-review` v1에는 억제 조항이 **없었다** — 「미검토 범위」 칸만 있고 무엇을 거기로 보낼지 정하는 문장이 없었다. 잘 작동하던 다른 스킬은 근거의 출처로 거른다:

- `architecture-review:83` — "추측으로 위반을 만들지 않는다(불확실하면 회색 지대로)"
- `analyze-component` 절차 4 — "사용 예시·테스트가 없으면 단정하지 말고 판단을 보류"
- `component-review:19` — "없는 입력은 추측으로 채우지 않는다"

CI 쪽 `pr-review.md` 2항에는 조항이 있었지만 "**확신이 낮으면** limitations에 질문으로 남긴다"로 **모델의 자기 확신도**에 기댄다. 확신 있게 틀리면 안 걸린다 — 실제로 `confidence: high`로 나왔다.

### 수정

`.claude/skills/test-review/SKILL.md`에 「지적의 근거」 절 신설 (+6줄):

> 지적의 근거는 **직접 읽은 파일에서 인용해 확인한 것만** 쓴다. 다른 파일·문서에서 본 명령·설정·값을 대상 파일의 사실로 옮기지 않는다 — CI 실행 명령은 workflow에서, 실행 옵션은 그 도구의 설정 파일에서 직접 읽는다. 확인하지 못한 전제는 지적으로 만들지 말고 미검토 범위에 적는다.

확신도가 아니라 **근거의 출처**를 기준으로 잡았다.

| 버전 | SHA-256 |
| --- | --- |
| v1 | `32672c0ab68c85a54f43c875b041909a0aa95f64cebb62292206197359519481` |
| v2 | `868f02e76f5c26f318cd16ff1bddce53595c273d7e9254b48a9a661d249bd320` |

### 같은 조건 재실행

대상 파일 목록 · 요청문 · 실행 명령 · 모델 모두 동일. 바뀐 것은 SKILL.md 6줄뿐.

| | v1 | v2 |
| --- | --- | --- |
| 판정 | FAIL (blocker 3) | FAIL (blocker 2) |
| 테스트 실행 | 35/35 통과 | 35/35 통과 |

**① 목표한 오탐: 사라졌다**

| | 서술 |
| --- | --- |
| v1 | "**CI는 `--workers=2 --grep @critical`로** auth·order를 동시에 돌리고…" |
| v2 | "`getTestAccount(0)`으로 계정을 모듈 최상단에 고정해 **worker 0의 fixture 계정(`looper1`)과 그대로 겹친다**. `session-expired.spec.ts:27`은 `parallelIndex`를 쓰는데 이 파일만 다르다" |

저장소에 없는 CI 명령이 빠지고 파일에서 직접 읽은 사실로 교체됐다. 나아가 v2는 같은 플래그를 **실제 출처에 귀속**시켰다 — "스펙 C6(`--workers=4` · `--workers=1` · `--repeat-each=3`)의 실제 통과 여부는 확인하지 못했다"를 미검토 범위에 적었고, 이는 `specs/260902-week09-step4-e2e.spec.md:46`에 실제로 있는 내용이다. "위 계정 격리 지적도 **실행 증거가 아니라 코드 근거**다"도 스스로 덧붙였다.

**② 기존 유효 지적: 5개 중 5개 유지** (등급 일부 변동 — `queries.test.ts`의 "이름과 실제 보장 불일치"가 blocker → 개선으로, 다른 뮤테이션으로 같은 결론에 도달)

**③ v1 유효 지적 3건이 v2에서 누락됐다** — 개선이 아니라 손실이다. 주문 201 응답이 제출한 `p9` 대신 `p1`을 돌려주는 불가능한 응답, `setQueryData(productQueries.all(), 'public-products')` 유령 쿼리, `auth.fixture.ts`가 계정 정보를 정본에서 파생하지 않는 것. 셋 다 작성자가 코드로 확인했을 때 사실이었다.

**④ v2 신규 blocker 1건이 참이었다** — `LoginForm.tsx:38`은 `replaceDocument(toSafeNextPath(redirectPathAfterLogin))`인데 테스트가 넣는 값은 `'/my'`·`next=/orders?status=pending`뿐이라 전부 이미 안전해 open redirect 가드를 지나가지 않는다. 뮤테이션(`toSafeNextPath(...)` → `?? '/'`)이 35/35 초록불로 생존했다.

### 이 비교로 주장하지 않는 것

- **한 번의 비교다.** 모델이 비결정적이라 프롬프트 효과와 샘플링 변동을 분리할 수 없다. 목표 오탐이 사라진 것과 v1 지적 3건이 누락된 것이 **같은 실행의 결과**이며, 어느 쪽도 조항 하나로 귀속시킬 수 없다.
- 따라서 "프롬프트 v2가 정확도를 높였다"로 일반화하지 않는다. 기록하는 것은 **특정 오탐 하나가 특정 조항 추가 후 같은 조건 재실행에서 재현되지 않았다**는 사실뿐이다.
- v2 신규 blocker가 조항 덕인지 재실행 변동인지도 구별할 수 없다. 다만 그 지적 자체가 참인 것은 뮤테이션 실행과 코드 확인으로 따로 확인했다.

---

## 함께 수용한 지적

| 지적 | 출처 | 판정 |
| --- | --- | --- |
| `ProductList.tsx:39-58`의 `lastSuccessfulQueryKey`는 컴포넌트 수명인데 그 키의 데이터는 gcTime 5분 수명이다. 5분 넘게 실패하면 이전 목록이 다음 렌더에서 오류 화면으로 바뀐다 | `state-design-review` | 수용 |
| `useSelect.ts:123`의 `highlightedIndex`가 인덱스 저장이라 `items`가 바뀌면 `getItemProps`(348)와 `aria-activedescendant`(313)가 어긋난다 | `analyze-component` | 수용 (현 사용처는 `items` 정적이라 미발현) |
| `toSafeNextPath` 적용을 지나가는 테스트가 없다 (open redirect 경계) | `test-review` v2 | 수용 |

수정은 이 문서의 범위가 아니다. 리뷰 결과를 기록하는 것과 코드를 고치는 것을 구별한다.

## 판별 과정에서 확인한 것

헛소리를 찾으려고 리뷰 27건의 지적을 코드로 훑었고, **오히려 8건이 확증됐다** — `SessionMenu.tsx:33`의 분기 순서(확인된 비로그인에서 재조회 실패 시 로그인 링크 소실), `Dialog.tsx`에 포커스 코드 0건인데 `aria-modal="true"` 선언, `use-order-draft.ts:45`의 `isError` 위치, `OrdersPage`의 같은 파일 내 실패 정책 분열, `role="status"` 누락, 타임존 고정 없는 `toLocaleString` 단언, 픽스처의 `p01`/`p1` 두 세계, `split('/')[1] || 'direct'` 두 벌.

정반대 결론이 난 자리도 하나 있었다 — 같은 `component-review` 스킬이 `productById` Map 중복을 장바구니에서는 `[major]` 공통화하라고, 주문 흐름에서는 공통화하지 말라고 냈다. 코드를 놓고 보니 **사실 다툼이 아니라 판단 다툼**이었다(세 곳의 폴백이 실제로 2종). 기계에 내릴 수 없는 판단의 사례로 남긴다.

## CI AI 리뷰 쪽 판별 쌍 (PR diff)

로컬 쌍과 별개로, 진짜 PR diff를 대상으로 한 쌍도 같은 기간에 확보했다. 프롬프트 v1/v2 전후 비교는 이쪽에서 수행하지 못했다(`OPENAI_API_KEY`가 저장소 secret에만 있다).

**잘 잡은 리뷰** — PR #35 · [run 34519398473](https://github.com/heeji289/loop-pack-fe-l2-vol1/actions/runs/34519398473) · base `247e44d3` → head `af6d63ad` · `promptHash ee511404…` · confidence high

> `src/features/product/ui/CurrencySelect.tsx:37` [`.claude/rules/state-data.md#저장해 두는 상태`] `CurrencySelect`는 서버 컴포넌트 트리에서 렌더되는 `'use client'` 컴포넌트인데, `useState(readStoredCurrency)`가 초기 렌더 중 `window.localStorage`를 읽는다. 서버에서는 `window`가 없어 `catch`를 통해 KRW를 그리지만, 브라우저 hydration에서는 저장된 USD/JPY를 읽어 다른 `value`를 계산한다. … 복원 전과 복원 후를 구분하는 상태도 없고 관련 테스트도 제공되지 않았다.

인용한 조항(「복원은 첫 렌더 뒤에 시작해 서버 HTML과 어긋나지 않게 한다. **복원 전**과 **값이 없음**은 다른 상태」)이 주장을 정확히 관장한다. **4단계에서 새로 만든 rule이 실제 지적을 만들어낸 사례**다.

**헛소리** — PR #34 · [run 34517159942](https://github.com/heeji289/loop-pack-fe-l2-vol1/actions/runs/34517159942) · confidence high ×2

> `.github/workflows/quality.yml:228` … `if: ${{ !cancelled() && steps.build.outcome == 'success' }}` … 이 조건에는 `always()` 같은 status check 함수가 없어 GitHub Actions의 암묵적 `success()`가 함께 적용되므로, build는 성공했지만 예산 검사만 실패한 경우에도 env lifecycle이 skipped될 수 있다.

반증 — [run 34518767357](https://github.com/heeji289/loop-pack-fe-l2-vol1/actions/runs/34518767357)(번들 예산 빨간불 실험)의 `build-e2e` job:

```
- Bundle budget: failure
- Server env lifecycle: success   ← 실행됨
- Upload gate reports: success    ← 실행됨
```

`!cancelled()`는 status check 함수이므로 암묵 `success()`가 적용되지 않는다. AI가 플랫폼 동작 규칙을 지어냈고 같은 저장소의 실제 run이 반증한다.

## 책임 배치

| 담당 | 맡는 것 |
| --- | --- |
| 기계 (CI·lint·type·test) | 레이어 import 방향·슬라이스 격리·순환 · 테스트 비활성화/단언 없음 · 타입 · 번들 예산 · Lighthouse 임계값 · env 생명주기 · E2E 실행 수 |
| AI 리뷰 | 설계 냄새와 반례 제안, 규칙 위반 후보 지목, 룰 초안. 비결정적이라 **advisory** |
| 작성자 | 지적의 수용·반려 · 단언 문구와 모킹 경계 · E2E 범위 · 예산과 required 배치 · 승격할 규칙 선택 · 최종 검증 |

기계에 못 내리는 것으로 확인된 것: 테스트 이름과 단언의 의미 대조, 중복의 공통화 여부. 5단계는 이 표의 한 칸을 「AI」에서 「기계」로 옮긴다.

상세 집계와 리뷰 원문 10건은 `.scratch/week10-step4-5-ai-review-and-rule-promotion/verification/`에, 규칙·스킬 배치 결정은 [요구사항 감사](week10-ai-review-requirements-audit.md)에 있다.
