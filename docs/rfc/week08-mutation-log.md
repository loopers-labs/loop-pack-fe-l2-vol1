# 3단계 — 변이 실험 기록

내 테스트가 실제로 무엇을 잡는지 확인한다. 규칙은 셋이다. 구현 한 곳만 바꾼다. 테스트 코드는 손대지 않는다. 측정이 끝나면 원복하고 작업 트리가 깨끗한지 확인한다.

기준선은 단위·통합 102개(node 77 · dom 25)와 E2E 6개다. 변이마다 해당 프로젝트만 돌렸다.

## 결과

| | 방법론 | 망가뜨린 곳 | 어떻게 | 결과 | 실패한 테스트 |
| --- | --- | --- | --- | --- | --- |
| M1 | 단위 | `resolveProductListQuery` | `page >= 1` → `page >= 0` | 잡힘 | 4개 (3번) |
| M2 | 단위 | `resolveProductListQuery` | `Number.isSafeInteger` 가드 제거 | 잡힘 | 3개 (3번) |
| M3 | 단위 | `idSet.toggleId` | 새 객체 대신 원본을 제자리에서 고침 | 잡힘 | 1개 (1번) |
| M4 | 통합 | `ProductListPage` | `setParams({ category, page: 1 })`에서 `page: 1` 제거 | 잡힘 | 2개 (8번·11번) |
| M5 | 통합 | `isServerFault` | `status >= 500` → `>= 600` | 잡힘 | 1개 (6번) |
| M6 | 통합 | `useIsInCart` | id를 무시하고 "하나라도 담겼으면 담김" | 잡힘 | 1개 (12번) |
| M7 | 통합 | `productListQuery` | `placeholderData: keepPreviousData` 제거 | 살아남음 | 없음 |
| M8 | E2E | `useProductListQuery` | `history: "push"` → `"replace"` | 잡힘 | 2개 (13번) |

M1·M4·M8은 1단계에서 미리 후보로 적어 둔 것이고, M2·M3·M5·M6·M7은 그 뒤에 더한 것이다. 후보만 돌리면 잡힐 것을 알고 고른 자리만 확인하게 된다.

M4에서 8번과 함께 11번이 깨진 것은 예상 밖이었다. 11번은 URL 기록을 보는 항목인데, `page: 1` 리셋이 사라지면 URL에 `page=3`이 남아 기본값 생략 단언이 함께 깨진다. 같은 계약을 두 방향에서 보고 있었던 셈이다.

## 살아남은 하나 — M7

`placeholderData: keepPreviousData`를 지워도 통합 25개가 전부 통과했다.

살아남는 것 자체는 예상했지만, 처음 적은 이유가 틀렸다. "이 옵션이 갱신 중 이전 목록을 화면에 남긴다"고 썼는데 코드가 그렇지 않다. `ProductListPage`는 마지막으로 성공한 조건(`lastLoadedParams`)으로 캐시에서 목록을 다시 읽는 `cachedList`를 따로 갖고 있고 `list = productsQuery.data ?? cachedList`이므로, 옵션이 없어도 이전 목록은 그대로 남는다. 7주차에 이 경로를 두 번 고친 결과물이 여기서 방어막으로 작동했다.

실제로 무엇이 달라지는지 임시 프로브로 관찰했다. 카테고리를 바꾸고 응답을 400ms 지연시킨 뒤, 갱신이 진행되는 동안의 화면을 그대로 읽었다.

| | `aria-busy` | 최초 로딩 문구·스켈레톤 | 이전 목록 | 그려진 카드 |
| --- | --- | --- | --- | --- |
| 원본 | `false` | 없음 | 있음 | 12장 |
| M7 변이 | `true` | 있음 | 있음 | 12장 + 스켈레톤 12칸 |

`isFirstLoad`는 `productsQuery.isPending`이고, `placeholderData`가 없으면 조건이 바뀔 때 쿼리가 다시 pending으로 떨어진다. 그런데 `isFirstLoad` 블록과 `hasList` 블록은 서로 배타적이지 않다. 그래서 스켈레톤 12칸과 실제 카드 12장이 동시에 그려지고, `aria-busy`도 갱신 중에 켜져서 보조기술에는 최초 로딩과 구분되지 않는다.

이걸 잡는 테스트가 없는 이유는 갱신이 진행되는 중간 화면을 보는 항목이 15개에 없기 때문이다. 4번은 최초 로딩만 보고, 8·9·10번은 `waitFor`로 갱신이 끝난 뒤의 목록을 본다. 1단계에서 `updateFailed` 경로를 "다음에 하면 좋겠다"로 분류한 것과 같은 빈칸인데, 프로브가 보여준 것은 그보다 넓다. 실패할 때만이 아니라 정상적인 조건 변경에서도 드러난다.

이번 주에 항목을 늘리지는 않는다. 1단계에서 범위를 정한 근거가 그대로 유효하고, 여기서 16번째를 끼워 넣으면 문서가 정한 범위와 코드가 어긋난다. 대신 다음에 할 것의 이름을 "갱신 실패 때 이전 목록 유지"에서 "갱신 중의 화면"으로 넓혀 둔다. 지켜야 할 것은 갱신 중에 최초 로딩 UI가 뜨지 않는 것이고 `updateFailed`는 그 안의 한 갈래다.

프로브는 관찰용이라 지웠다. 커밋에 남지 않는다.

> **채점 이후 처리됨** — 아래 「채점 피드백 반영」 절을 보라. 멘토 지적은 순서였다: 이건 테스트가 없어서 생긴 문제가 아니라 구현의 상태 분기가 겹쳐서 생긴 문제이므로, 테스트를 먼저 붙이면 겹친 상태를 정답으로 고정한다.

## 실패 메시지를 믿을 수 없던 세 자리

변이가 잡혔는지만 보면 8개 중 7개가 잡혔고 끝이다. 실제로 알고 싶었던 것은 빨간불을 보고 원인을 짚을 수 있는지였고, 세 곳이 걸렸다.

### 11번 — boolean 단언은 아무것도 말하지 않는다

`expect(params?.has("page")).toBe(false)`가 남긴 메시지는 `expected true to be false` 한 줄이다. 어떤 키가 남았는지, 값이 무엇인지 나오지 않는다.

키 목록을 그대로 대조하는 쪽으로 바꿨다.

```ts
expect([...(params?.keys() ?? [])]).not.toContain("page");
```

재측정한 메시지는 `expected [ 'category', 'page' ] to not include 'page'`다. URL에 무엇이 실려 있는지가 메시지에 들어온다.

### 6번 — 없는 것을 기다리면 있는 것을 못 본다

`findByText(BOUNDARY_FALLBACK)`으로 경계 fallback을 기다리고 있었다. 500이 인라인으로 새면 이 기다림은 타임아웃으로 끝나고, 메시지는 `Unable to find an element with the text: 경계가 오류를 받았습니다`와 DOM 전체 덤프다. 무엇이 없는지는 말하지만 대신 무엇이 그려졌는지는 덤프를 읽어야 나온다.

인라인 에러와 경계 fallback이 둘 다 `role="alert"`라는 점을 이용했다. 알림 하나를 잡고 문구로 가른다.

```tsx
expect(await screen.findByRole("alert")).toHaveTextContent(BOUNDARY_FALLBACK);
```

재측정한 메시지는 이렇다.

```
Expected element to have text content:
  경계가 오류를 받았습니다
Received:
  상품 목록을 불러오지 못했습니다. 검색 조건을 확인해 주세요.다시 시도
```

500이 인라인으로 내려오고 "다시 시도" 버튼까지 붙었다는 것이 한눈에 보인다. 타임아웃을 기다리지 않으므로 15ms에 끝난다.

### 13번 — 셀렉터 실패로 위장한 히스토리 실패

두 번째 E2E 테스트는 `page.goBack()` 뒤에 곧바로 `getByLabel("정렬")`을 조회했다. `replace`로 바뀌면 뒤로 가기가 앱 밖으로 나가버려서 메시지가 `element(s) not found`가 된다. 라벨을 못 찾은 것처럼 읽히지 실제 원인인 히스토리는 나오지 않는다.

돌아간 자리를 URL로 먼저 확인하도록 한 줄을 앞에 놓았다.

```ts
await page.goBack();
await expect(page).toHaveURL(/category=digital/);
```

재측정한 메시지는 `Expected pattern: /category=digital/` · `Received string: "about:blank"`다. 히스토리가 앱 밖으로 나갔다는 사실이 그대로 찍힌다.

## 메시지만으로 원인이 보였는가

| | 처음 | 고친 뒤 |
| --- | --- | --- |
| M1 | `expected +0 to be 1` — 보인다 | — |
| M2 | `expected 1.5 to be 1` · `expected Infinity to be 1` — 보인다 | — |
| M3 | `expected { p1: true, p2: true } to deeply equal { p1: true }` — 보인다 | — |
| M4 (8번) | `expected '3' to be '1'` — 보인다 | — |
| M4 (11번) | `expected true to be false` — 안 보인다 | 키 목록이 찍힌다 |
| M5 | 없는 문구와 DOM 덤프 — 절반만 보인다 | 인라인 문구가 찍힌다 |
| M6 | `aria-pressed` 기대 `"false"`, 받은 값 `"true"` — 보인다 | — |
| M8 (첫째) | `Received string: "about:blank"` — 보인다 | — |
| M8 (둘째) | `element(s) not found` — 오해를 부른다 | URL이 찍힌다 |

세 자리 모두 공통점이 있다. 단언이 "없음"이나 boolean을 향하고 있었다. 없음을 단언하면 통과할 때는 정확하지만 실패할 때 대신 무엇이 있었는지 말할 수 없다. 있는 것을 잡아 값으로 대조하면 두 경우 모두 말한다.

## 설계 문서에서 바뀐 것

단언을 고치면서 1단계 문서(`week08-test-plan.md`)의 두 줄이 코드와 어긋났다. 3단계 커밋에서 함께 고쳤다.

| 자리 | 1단계에 적은 것 | 3단계 이후 |
| --- | --- | --- |
| 6번 500 방향 | 인라인 문구가 보이지 않는 것을 `queryBy*`로 함께 단언한다 | 알림 하나를 잡아 문구로 가른다 |
| 11번 기본값 생략 | `has("page")`가 `false`인지 단언한다 | 키 목록을 `not.toContain`으로 대조한다 |

둘 다 지키려는 것은 그대로다. 바뀐 것은 빨간불이 무엇을 말해주는지다.

## 원복 확인

변이는 전부 `git checkout --`로 되돌렸고 작업 트리는 깨끗하다. 남은 변경은 위 세 테스트의 단언 교체와 설계 문서 두 줄뿐이다. 원복 후 `pnpm test` 102개와 `pnpm test:e2e` 6개가 다시 통과한다.

## 채점 피드백 반영 (2026-09-03)

멘토 피드백 네 건을 반영했다. M7을 남긴 판단 자체는 잘못이 아니라고 했지만, 다음 주로 넘기면 갱신 중 화면을 만지는 사람이 겹친 렌더를 정상으로 받아들인다는 지적이 붙었다.

### ① 분기를 배타적으로 — 구현 먼저, 테스트 나중

```ts
- const isFirstLoad = productsQuery.isPending;
+ const isFirstLoad = !hasList && productsQuery.isPending;
```

`!hasList`가 붙으면 `isFirstLoad`와 `hasList` 블록이 **구성상** 배타적이다. 전에는 배타성이 `placeholderData`에 딸린 우연이었다 — 그 옵션이 `data`를 채워주는 동안만 `isPending`이 false였고, 옵션이 빠지는 순간 두 블록이 함께 그려졌다.

한 줄이 두 증상을 같이 고친다. `aria-busy={isFirstLoad}`도 이제 갱신 중에 켜지지 않는다. 뿌리가 하나였다.

### ② `aria-busy`의 의미 분리

별도 수정이 필요하지 않았다. ①이 `aria-busy`를 최초 로딩 전용으로 만들고, 갱신은 이미 있던 `role="status"`("목록을 갱신하는 중입니다…")가 알린다. 신호를 둘로 가른 근거를 코드에 적었다 — `aria-busy`는 "읽을 콘텐츠가 아직 없다"는 뜻이라 이전 목록이 그대로 읽히는 갱신 중에는 참이 아니다.

### ③ 붙인 테스트 한 줄

`ProductListPage.states.dom.test.tsx`에 "갱신 중에는 최초 로딩 UI를 그리지 않고 이전 목록을 유지한다"를 넣었다. 스켈레톤은 `aria-hidden="true"`라 역할로 잡히지 않으므로, 항상 함께 그려지는 "불러오는 중" 문구로 본다.

단언 넷 — `role="status"`가 갱신을 알리는가 · 최초 로딩 문구가 없는가 · `aria-busy`가 `false`인가 · 이전 목록의 `총 30개`가 남아 있는가.

**이 테스트가 무엇을 잡는지 변이로 확인했다.**

| 변이 | 결과 | 실패 메시지 |
| --- | --- | --- |
| `isFirstLoad` → `productsQuery.isFetching` | **잡힘** | `expected document not to contain element, found <p>상품을 불러오는 중입니다…` |
| M7 재실행(`placeholderData` 제거) | 살아남음 — **이번엔 맞다** | 통합 26개 전부 통과 |

M7이 다시 살아남았지만 이유가 뒤집혔다. 전에는 "결함이 있는데 아무도 안 본다"였고 지금은 "**변이가 화면을 바꾸지 못한다**"다. `isFirstLoad`가 `hasList`를 보므로 옵션이 없어도 `cachedList`가 목록을 대고 최초 로딩 UI는 뜨지 않는다. 결함이 테스트로 덮인 게 아니라 없어졌다.

부수 결과로 `placeholderData: keepPreviousData`는 이제 화면상 관찰 가능한 차이를 만들지 않는다. 죽은 코드는 아니다 — `list`가 `cachedList` 대신 `data`에서 오게 하고 `isPlaceholderData`가 `lastLoadedParams` 갱신에 쓰인다. 다만 지워도 화면이 같다는 사실은 기록해 둔다.

### ④ 1초 실대기의 비중 — 재보고 남긴다

4번의 1.5초 창 테스트가 실제로 1초를 기다린다. 비중을 재라는 지적이라 벽시계를 두 번씩 측정했다.

| | 벽시계 | 집계 `tests` 시간 |
| --- | --- | --- |
| 전체 스위트 (103개) | **3.00s** / 3.01s | 2.87s |
| 그 한 건 제외 | **1.41s** / 1.40s | — |
| 그 한 건 단독 | — | 1.58s |

**한 건이 스위트 벽시계의 53%다**(1.6초). 비중은 분명히 크다.

가짜 타이머로 바꿔보고 되돌렸다. `vi.advanceTimersByTimeAsync`로 1.5초 창을 뛰어넘는 프로토타입은 통과하고 0.84s로 끝났다. 그런데 **`vi.useFakeTimers({ shouldAdvanceTime: true })`가 있어야만 통과한다** — RTL의 `waitFor`는 jest 가짜 타이머만 감지해 자동으로 감아주고 vitest 것은 감지하지 않아서, 옵션 없이 돌리면 `findByText`가 5초 타임아웃으로 죽는다(실측).

그 옵션은 가짜 시계를 실시간에 맞춰 함께 흘린다. 즉 "실시간 의존을 없애려고 바꿨는데 실시간 의존이 남는" 형태가 되고, 첫 단언 전에 실시간 500ms가 지나면 응답이 조기에 도착해 갈린다. 9주차 발제가 지적한 flaky의 정확한 모양이다.

그래서 **실제 타이머를 유지하고 전환 조건을 정해 둔다.** 절대값 1.6초를 결정론과 바꾸기에는 스위트가 3초라 아직 이득이 없다. 다시 볼 시점은 둘 중 먼저 오는 쪽이다 — **스위트 벽시계가 10초를 넘거나, 실시간을 기다리는 테스트가 2건 이상이 되는 때.** 그때는 RTL의 `asyncWrapper`로 vitest 타이머를 감는 어댑터를 먼저 확인한다(옵션 없이 되면 위 문제가 사라진다).
