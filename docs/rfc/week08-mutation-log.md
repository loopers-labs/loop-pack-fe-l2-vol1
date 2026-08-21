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
