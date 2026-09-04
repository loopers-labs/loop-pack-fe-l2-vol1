# 9주차 화면 작업으로 깨진 테스트

9주차에서 인증 화면(장바구니·주문서·주문 내역·위시리스트·마이페이지·로그인)을 붙이면서 기존 테스트가 두 번 깨졌다. 1·2단계에서 단위·통합 11건, 4단계에서 E2E 1건이다. 이 문서는 무엇이 깨졌고 왜 깨졌는지, 어떤 선택지가 있었고 무엇을 골랐는지를 적어 둔 기록이다. 둘 다 해결됐다.

## TL;DR

- 처음 상태는 `pnpm verify` 기준 **11 failed / 135 passed**, 3개 파일. 지금은 **146 passed / 146**이다.
- 원인은 사실상 하나다. `AddCartButton`이 담은 뒤 장바구니로 보내려고 `useRouter()`를 쓰기 시작했고, 상품 카드를 실제로 그리는 테스트가 전부 App Router를 요구하게 됐다.
- 계측(2단계) 작업 때문이 아니다. 작업 트리를 모두 stash하고 HEAD에서 돌려도 같은 11건이 실패한다.
- 테스트가 검증하려던 동작 자체는 그대로다. 깨진 것은 단언이 아니라 렌더 환경이다.

## 실패 목록

### `src/widgets/header/Header.test.tsx` — 2건 (파일 전체)

| 테스트                                                        | 에러                                                             |
| ------------------------------------------------------------- | ---------------------------------------------------------------- |
| 서로 다른 상품을 담으면 헤더 개수가 담은 상품 수만큼 늘어난다 | `No "useRouter" export is defined on the "next/navigation" mock` |
| 찜을 눌러도 장바구니 개수는 그대로다                          | 〃                                                               |

이 파일은 `vi.mock('next/navigation', () => ({ usePathname: () => '/products' }))`로 `usePathname`만 돌려준다. 모듈을 통째로 대체하는 mock이라 새로 필요해진 `useRouter`가 없어서 곧바로 터진다.

### `src/_pages/product-list/ui/ProductListContent.test.tsx` — 8건 / 11건 중

| 테스트                                                                                    | 에러                                                       |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 상품 목록 응답을 받으면 상품을 표시한다                                                   | `Unable to find role="heading" and name "캐주얼 신상품"`   |
| 요청이 끝나기 전에는 상품이 없고 응답 후에는 상품을 표시한다                              | 〃                                                         |
| 재시도도 실패하면 오류를 유지하고 다음 재시도가 성공하면 상품을 표시한다                  | 〃                                                         |
| 직전 목록이 있는 상태에서 조건 변경이 실패하면 이전 목록과 갱신 실패 알림을 함께 보여준다 | 〃                                                         |
| 갱신 실패에서 다시 시도가 성공하면 알림이 사라지고 새 조건의 목록으로 바뀐다              | 〃                                                         |
| 페이지를 이동해도 선택한 카테고리를 유지한다                                              | 〃                                                         |
| 3페이지에서 카테고리를 바꾸면 1페이지의 해당 상품을 요청한다                              | `Unable to find role="heading" and name "디지털 실속상품"` |
| 정렬을 바꾸면 새 순서의 상품 목록을 표시한다                                              | `Unable to find an element with the text: 2 / 2`           |

이 파일에는 `next/navigation` mock이 없다. 진짜 원인은 상품을 못 찾는 것이 아니라 그 앞에서 `invariant expected app router to be mounted`로 렌더가 죽는 것이고, 화면에 아무것도 남지 않아 "상품이 없다"는 모양으로 보인다.

통과하는 3건(`전체 결과가 0건이면 빈 결과를 표시하고 페이지 이동을 숨긴다`, `전체 결과는 있지만 현재 페이지가 비었으면 이전 페이지로 돌아갈 수 있다`, `500 응답이면 오류 안내와 재시도 동작을 표시한다`)은 상품 카드가 하나도 그려지지 않는 경우다.

### `src/_pages/product-list/ui/ProductListResults.test.tsx` — 1건 / 4건 중

| 테스트                                                              | 에러                                          |
| ------------------------------------------------------------------- | --------------------------------------------- |
| 표시할 데이터가 있는 갱신 실패에는 직전 목록과 알림을 함께 보여준다 | `invariant expected app router to be mounted` |

나머지 3건(최초 skeleton, 캐시가 있어도 최초 진입이면 이전 목록을 그리지 않음, 표시할 데이터 없는 최초 실패)은 통과한다. 이 파일에서도 **상품 카드를 실제로 그리는 케이스 하나만** 깨졌다.

## 원인

`src/features/add-to-cart/ui/AddCartButton.tsx`

```tsx
import { useRouter } from 'next/navigation'
...
const router = useRouter()      // 25행
...
router.push('/cart')            // 78행 — ConfirmDialog에서 "장바구니 이동"을 눌렀을 때
```

담기 직후 확인 창을 띄우고 장바구니로 보내는 기능을 넣으면서 들어왔다(`a35ad28b feat: 담은 뒤 장바구니 이동 확인 창 추가`).

`src/shared/test/render-with-providers.tsx`는 `QueryClientProvider`와 `NuqsTestingAdapter`만 감싼다. 라우터는 세우지 않는다. 그래서 카드를 그리는 순간 App Router를 찾다가 실패한다. 지금까지는 상품 카드에 라우터가 필요 없어서 문제가 드러나지 않았다.

즉 이 11건은 서로 다른 11개의 문제가 아니라, **"공용 테스트 렌더러에 라우터가 없다"는 문제 하나가 카드가 등장하는 모든 테스트에 퍼진 것**이다.

## 재현

```bash
pnpm exec vitest run src/_pages/product-list src/widgets/header
# → 11 failed | 13 passed (24)
```

작업 트리 변경과 무관하다는 확인:

```bash
git stash push -u && pnpm exec vitest run src/_pages/product-list src/widgets/header; git stash pop
# → 같은 11 failed
```

## 수정 방향 후보

세 가지가 보였다. 처음에는 **B와 C**를 함께 택했다가, **C를 되돌리고 A와 B로 최종 결정했다.**

되돌린 이유는 테스트가 아니라 공용 부품의 계약이다. C는 `ConfirmDialog`의 확인 슬롯을 "동작이면 button, 이동이면 link"로 갈랐는데, **같은 부품의 확인이 부르는 쪽에 따라 다른 role이 되는 것**이 문제였다. 이 창의 확인은 "방금 물어본 그것을 실행한다"는 자리라 목적지가 있든 없든 모달의 결정 버튼이고, 이동은 그 결정의 결과다. 전체 비우기의 `전체 삭제`와 담기의 `장바구니 이동`이 같은 role이어야 한다.

C를 제안할 때 "테스트가 함께 고쳐진다"를 근거에 섞은 것이 판단을 흐렸다. 공용 부품의 계약은 테스트 사정으로 정할 문제가 아니다.

### A. 깨진 파일마다 `next/navigation` mock을 손본다

`Header.test.tsx`의 mock에 `useRouter: () => ({ push: vi.fn() })`를 더하고, `ProductListContent.test.tsx`와 `ProductListResults.test.tsx`에도 같은 mock을 추가한다.

- 변경 범위가 테스트 파일 3개로 끝나고 제품 코드를 건드리지 않는다.
- 대신 같은 mock이 세 곳에 복사된다. 다음에 라우터를 쓰는 컴포넌트가 카드에 하나 더 붙으면 또 같은 일을 반복한다.

### B. `renderWithProviders`에 라우터를 공용으로 세운다

`src/shared/test/render-with-providers.tsx`가 이미 QueryClient와 nuqs를 세우고 있으니 라우터도 같은 자리에서 세운다.

- 라우터가 필요한 컴포넌트가 늘어도 테스트 파일은 그대로다. 실패 원인이 한 곳에 모인다.
- 대신 모든 테스트가 라우터를 갖게 되어, 라우터에 의존하는지 여부가 테스트에서 드러나지 않는다. `AppRouterContext`를 직접 채우는 방식은 Next 내부 경로에 기대는 부분이라 버전 변화에 영향을 받을 수 있다.
- 실제로 무엇을 mock으로 넣을지(빈 함수인지, 호출을 검증할 수 있는 형태인지)는 이 문서 밖의 결정이다.

### C. `AddCartButton`에서 라우터 의존을 없앤다

확인 창의 "장바구니 이동"을 `router.push` 대신 `Link`로 바꾸면 훅 자체가 사라진다.

- 테스트를 고치는 게 아니라 원인을 없애는 쪽이다. 화면 이동을 하는 요소가 링크가 되므로 새 탭 열기·키보드 동작 같은 기본 동작도 따라온다.
- 대신 ConfirmDialog가 지금 두 개의 버튼을 받는 모양이라, 한쪽을 링크로 받으려면 공용 컴포넌트의 계약을 바꿔야 한다. 다른 사용처(전체 비우기)에도 영향이 간다.
- 이 방향을 고르면 A/B는 필요 없어지지만, 라우터를 쓰는 다른 컴포넌트가 카드 안에 생기면 같은 문제가 다시 온다.

## 적용 결과

`146 passed / 146`, lint·typecheck 통과. 단언은 한 줄도 고치지 않았다. 각 파일이 무엇으로 살아났는지는 다르다.

| 파일                          | 살아난 이유                                                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProductListContent.test.tsx` | **B.** `renderWithProviders`가 세우는 라우터 context를 그대로 받는다. 이 파일은 손대지 않았다.                                                     |
| `Header.test.tsx`             | **A.** 모듈을 통째로 대체하는 `vi.mock('next/navigation')`이 있어 B의 context가 닿지 않는다. 그 mock에 `useRouter`를 더했다.                       |
| `ProductListResults.test.tsx` | **A.** `@vitest-environment node`에서 `renderToStaticMarkup`으로 돌아 `renderWithProviders`를 아예 쓰지 않는다. 이 파일에 mock을 새로 하나 넣었다. |

A가 두 파일로 줄어든 것이 B의 값이다. B가 없었다면 세 파일에 같은 mock을 넣어야 했고, 앞으로 라우터를 쓰는 컴포넌트가 카드 안에 하나 더 붙어도 `renderWithProviders`를 쓰는 테스트는 그대로 산다.

바꾼 파일:

- `src/shared/test/render-with-providers.tsx` — `AppRouterContext.Provider`에 아무것도 하지 않는 stub 라우터를 세운다. (B)
- `src/widgets/header/Header.test.tsx` — 기존 mock에 `useRouter: () => ({ push: () => {} })` 추가. (A)
- `src/_pages/product-list/ui/ProductListResults.test.tsx` — 같은 모양의 mock 추가. (A)
- `vitest.setup.ts` — 아래 참고.

제품 코드는 결과적으로 그대로다. `AddCartButton`은 `useRouter`로 `/cart`에 가고, `ConfirmDialog`의 확인은 항상 button이다.

### 덤으로 드러난 것: jsdom에는 `showModal`이 없다

라우터 문제를 걷어내자 `Header.test.tsx`가 이번에는 `TypeError: dialog.showModal is not a function`으로 깨졌다. 그동안은 그 앞의 라우터 오류에 가려 보이지 않던 문제다. jsdom 30은 `<dialog>`의 `showModal`/`close`를 구현하지 않는데 `ConfirmDialog`는 이 API로만 열린다.

`vitest.setup.ts`에서 `open` 속성만 뒤집는 최소 구현을 얹어 막았다. 포커스 트랩·백드롭·Esc는 브라우저 기능이라 재현하지 않았고, 그 동작의 검증은 E2E에 남는다.

## 남은 확인거리

- 지금 stub 라우터는 아무것도 하지 않는다. 이동 자체를 단언하려는 테스트가 생기면 이 stub으로는 부족하고, 해당 테스트에서 `next/navigation`을 mock 하거나 stub을 관찰 가능한 형태로 바꿔야 한다. 어느 쪽으로 할지는 그때 정한다.
- `next/dist/shared/lib/app-router-context.shared-runtime`은 Next 내부 경로다. Next 업그레이드 때 이 import가 살아 있는지 확인해야 한다.

## 4단계에서 또 하나 — E2E 1건

단위·통합 11건과 성격이 다르다. 그때는 **렌더 환경**이 없어서 깨졌지만, 이번에는 **화면의 계약이 바뀌어 테스트의 전제가 사라졌다.**

### 실패

`e2e/state-restoration.spec.ts` — `목록에서 찜·담기한 상태가 헤더와 새로고침 후에도 유지된다` (chromium·webkit 둘 다)

```
Error: locator.click: Test timeout of 30000ms exceeded.
  - waiting for getByRole('button', { name: '메이커스 투명케이스 장바구니' })
```

`--workers=1`에서도 같다. 병렬 문제가 아니다.

### 원인

미로그인으로 찜을 누르는 순간 로그인 화면으로 떠나서, 다음 줄의 담기 버튼이 그 문서에 없다. 전제가 셋 깨졌다.

| 깨진 전제                           | 9주차의 어떤 결정 때문인가                                  |
| ----------------------------------- | ----------------------------------------------------------- |
| 미로그인으로 찜·담기를 누를 수 있다 | 소유자가 없으면 담지 않고 로그인으로 보낸다 (OWN-04)        |
| 담기 버튼에 `aria-pressed`가 있다   | 수량이 생기며 토글이 성립하지 않아 add-only가 됐다          |
| 미로그인 헤더에 숫자가 붙는다       | 항상 0이라 정보를 주지 않아 로그인 상태에서만 붙이기로 했다 |

### 고른 방향

**지우고 검증을 두 갈래로 옮겼다.** 테스트를 살리려면 로그인 상태를 세우고 단언을 세 군데 고쳐야 하는데, 그렇게 고치고 나면 이미 있는 것들과 겹친다.

| 원래 보던 것                       | 지금 보는 곳                                                               |
| ---------------------------------- | -------------------------------------------------------------------------- |
| 버튼을 누르면 헤더 숫자가 움직인다 | `src/widgets/header/Header.test.tsx` — **이미 있었다.** 새로 만들지 않았다 |
| 담은 것이 새로고침 후에도 남는다   | `e2e/add-to-cart.spec.ts` — 장바구니 확인 뒤 `reload()`를 붙였다           |

새로고침을 E2E에 남긴 것은 저장(`localStorage`)과 소유자(세션)가 **새 문서에서 다시 만나는지**가 검증 대상이기 때문이다. 저장만이면 통합 테스트가 싸지만, 소유자는 매 로드마다 세션이 정한다(OWN-02). 헤더 숫자 쪽은 반대로 브라우저가 필요 없어 통합에 그대로 뒀다.

지운 자리에는 무엇을 어디로 옮겼는지 주석으로 남겼다. `it.skip`이나 주석 처리로 비활성화하지 않았다.

### 결과

`26 passed / 0 failed`. 전체 실행 시간도 1분 12초에서 30초로 줄었다 — 깨진 테스트 둘이 각각 30초씩 기다리다 죽고 있었다.

---

_「4단계에서 또 하나」 절은 E2E를 붙인 뒤에 덧붙였습니다. 실패 원인 추적과 옮겨 갈 자리(Header.test.tsx에 이미 있다는 것) 확인은 AI가 했고, **지우고 헤더 숫자는 통합에, 새로고침은 담기 시나리오에 두는 결정은 제가 했습니다.**_

_이 문서는 AI(Claude)가 초안을 작성했습니다. 실패 목록과 에러 메시지 수집, `useRouter` 도입 커밋 추적, 작업 트리를 stash하고 HEAD에서 같은 실패가 나는지 확인한 것, 수정 방향 A·B·C의 정리와 적용, jsdom의 `showModal` 미구현을 찾아낸 것은 AI가 했습니다._

_방향 결정은 두 번 제가 했습니다. 처음에는 B와 C를 함께 가기로 했고(AI는 C만으로 11건이 다 통과한다고 봤지만 안전망을 함께 두기로 했습니다), **그 뒤 C를 되돌리고 A와 B로 확정했습니다.** 되돌린 근거는 `ConfirmDialog`가 공용 부품이라는 것입니다 — 확인 슬롯이 부르는 쪽에 따라 button과 link로 갈리면 한 부품이 두 계약을 갖게 됩니다. 이동이라는 이유로 link가 맞다고 본 것이 부품 단위에서는 틀린 판단이었습니다._

_AI가 C를 제안할 때 "테스트가 함께 고쳐진다"를 근거에 섞었던 점도 기록해 둡니다. 공용 부품의 계약은 테스트 사정으로 정할 문제가 아닙니다._
