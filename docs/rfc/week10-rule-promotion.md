# 10주차 5단계 — 반복 지적을 결정적 룰로 승격

## 무엇을 골랐나

10주간 **같은 결함을 네 번** 만들었다. 전부 하나의 뿌리다 —
**단언이 "없음"이나 boolean을 향하면, 실패할 때 대신 무엇이 있었는지 말하지 못한다.**

| 언제 | 무엇이 | 기록 |
| --- | --- | --- |
| 8주차 3단계 | `findByText(경계 문구)`로 기다림 — 무엇이 없는지만 말하고 무엇이 그려졌는지는 DOM 덤프 | `week08-mutation-log.md` |
| 9주차 G절 | `refetchQueries` 직후 `findByText("expired")` — React 리렌더 전이라 **변이를 넣어도 초록불** | `week09-e2e-scope.md` G |
| 9주차 H절 | 메커니즘만 보고 호출부를 빠뜨려 mutation 4종이 변이를 통과 | 같은 문서 H |
| 9주차 I절 | `aria-label` 하나에 두 의미가 겹쳐 실패 원인이 안 갈림 (채점 nit) | 같은 문서 I |

8주차 라이팅에 이렇게 적어 뒀다.

> 세 자리의 공통점이 있다. **단언이 "없음"이나 boolean을 향하고 있었다.** (…)
> 이번 주에 배운 것 중 다음 주에도 쓸 것은 이 한 줄이다.

**그리고 다음 주에 또 틀렸다.** 글로 적는 것으로는 안 고쳐졌다.

## 무엇을 기계로 내리고 무엇을 남겼나

네 건 전부를 룰로 만들 수는 없다. **결정적으로 참·거짓을 가를 수 있는 것만** 내린다.

| 항목 | 어디로 | 왜 |
| --- | --- | --- |
| `waitFor` 안의 부정 단언 | **기계** | AST로 판별된다. 폴링으로 "없음"을 보는 것은 형태만 보고 틀렸다고 말할 수 있다 |
| `toBeTruthy` · `toBeFalsy` | **기계** | 호출 이름 하나다 |
| `getByTestId` · `container.querySelector` | **기계** | `.claude/rules/testing.md`에 글로만 있던 것 |
| 신호 하나에 두 의미가 겹쳤는가 (9주차 I) | **사람·AI** | `aria-label`이 무엇을 뜻하는지는 의미 판단이다. 문자열을 보고 기계가 알 수 없다 |
| 호출부까지 봤는가 (9주차 H) | **사람·AI** | "이 테스트가 실제 호출 경로를 지나가는가"는 설계 판단이다 |

> 아래 둘은 결정적으로 판별할 수 없어서 안 내렸다. 대신 **변이 실험**이 그 자리를
> 맡는다 — 기계가 형태로 못 보는 것은 "망가뜨려서 잡히는지"로 본다.

## 승격한 룰

`eslint.config.mjs`의 `no-restricted-syntax`. 범위는 `**/*.test.{ts,tsx}`와 `e2e/**/*.ts`다 —
제품 코드에는 해당 없고, 테스트에만 거는 게 정확하다.

```js
{
  selector: 'CallExpression[callee.name="waitFor"] MemberExpression[property.name="not"]',
  message: "waitFor 안에서 부정 단언을 쓰지 않는다. 폴링은 '아직 안 바뀜'과 '바뀌지 않는 게 맞음'을 구분하지 못해서, 구현을 망가뜨려도 초록불이 된다(8주차·9주차 G절에서 실측). 사라지는 것은 waitForElementToBeRemoved로, 바뀌지 않는 것은 값을 직접 대조해서 확인한다.",
}
```

**메시지에 무엇을 대신 쓰라는지 적었다.** 8주차에 배운 것이 여기도 적용된다 —
빨간불이 원인만 말하고 다음 행동을 말하지 않으면 반쪽이다.

## 자가 검증

### ① 위반 코드를 막는가 — **잡았다. 그런데 기존 코드에서 잡았다**

룰을 켜자마자 **이미 머지된 코드에서 위반 2건**이 나왔다. 오탐이 아니라 진짜 위반이다.

```
ProductListPage.filters.dom.test.tsx:177
  await waitFor(() => { expect(renderedNames()).not.toEqual(firstPage); });

ProductListPage.states.dom.test.tsx:245
  await waitFor(() => { expect(screen.queryByRole("alert")).not.toBeInTheDocument(); });
```

**네 번 반복했다고 적어 놓고, 다섯 번째와 여섯 번째가 레포에 살아 있었다.**
이게 승격의 값을 가장 잘 보여준다 — 나는 이 결함을 알고 있었고 문서에 두 번 썼는데도
내 코드에 남아 있었다.

### ② 고쳤다 — 룰을 끄지 않고

**filters:177** — "첫 페이지와 다르다"를 폴링했다. `paged` 핸들러가
`products.slice(start, start + PAGE_SIZE)`를 주므로 2페이지 목록은 결정적이다.
**값으로 대조**하도록 바꿨다.

```ts
const secondPage = products.slice(PAGE_SIZE, PAGE_SIZE * 2).map((product) => product.name);
await waitFor(() => {
  expect(renderedNames()).toEqual(secondPage);
});
// 대조군이 실제로 다른지 고정한다 — 같으면 위 단언이 아무것도 검증하지 않는다.
expect(secondPage).not.toEqual(firstPage);
```

**states:245 — 여기서 하나 더 나왔다.** 룰 메시지가 말한 대로
`waitForElementToBeRemoved`로 바꿨더니 **도구가 거부했다.**

```
Error: The element(s) given to waitForElementToBeRemoved are already removed.
```

`user.click`을 `await`하는 동안 React가 리렌더하면서 refetch가 시작되고 `isError`가
즉시 꺼져, **클릭이 끝나기 전에 알림이 언마운트된다.** 제거를 관찰할 창이 없다.

즉 **옛 단언은 알림이 "있었다가 없어진" 것을 한 번도 증명하지 않았다.** 그냥
"지금 없다"를 확인하고 통과했다. 재시도 버튼이 아예 안 그려졌어도 초록불이었을 것이다.

그래서 목록이 그려진 **정착된 순간에 개수를 값으로** 센다.

```ts
expect(await screen.findByText(/총 \d+개/)).toBeInTheDocument();
// 폴링이 아니라 단발이고, 실패하면 몇 개가 있었는지 메시지가 말한다(0을 기대했는데 1).
expect(screen.queryAllByRole("alert")).toHaveLength(0);
```

> **부정 단언 자체가 금지가 아니다.** 금지는 **폴링 안의** 부정 단언이다.
> 정착된 순간의 단발 부정은 정확하다 — 룰의 selector가 `waitFor` 안으로 한정된 이유다.

### ③ 정상 코드를 막지 않는가 — 오탐 0

| | 결과 |
| --- | --- |
| 테스트 파일 23개 + E2E 4스펙 전수 | 고친 2건 외 **위반 0** |
| `pnpm lint` | 통과 |
| `pnpm typecheck` | 통과 |
| `pnpm test` | **23파일 175개 통과** |

### ④ selector를 프로브로 때려 봤다 — 오탐 1건 · 누락 1건이 나왔다

룰이 "기존 코드를 통과시키고 위반을 막는다"까지는 확인했는데, 그건 **내가 쓴 형태만**
본 것이다. selector는 구문을 보므로 다른 형태로 쓰면 빠져나갈 수 있다. 그래서 경계
케이스를 파일 하나에 모아 돌렸다.

첫 판 selector는 `CallExpression[callee.name="waitFor"] MemberExpression[property.name="not"]`
이었고, 둘이 틀렸다.

| | 코드 | 첫 판 | 왜 |
| --- | --- | --- | --- |
| **오탐** | `waitFor(() => expect(v).toEqual(expect.not.objectContaining({...})))` | **막았다** ❌ | `expect.not`은 부정 단언이 아니라 **matcher 헬퍼**다. 정상 코드를 막았다 |
| **누락** | `vi.waitFor(() => expect(1).not.toBe(2))` | **놓쳤다** ❌ | callee가 MemberExpression이라 `callee.name`에 안 걸린다 |

가르는 지점이 있었다. **`expect.not`의 object는 식별자 `expect`고, 막아야 하는
`expect(x).not`의 object는 호출식이다.** 그래서 `[object.callee.name="expect"]`로 좁히고,
멤버 호출용 selector를 하나 더 붙였다.

```js
selector:
  'CallExpression[callee.name="waitFor"] MemberExpression[object.callee.name="expect"][property.name="not"],' +
  'CallExpression[callee.property.name="waitFor"] MemberExpression[object.callee.name="expect"][property.name="not"]',
```

고친 뒤 프로브 9개 결과:

| 잡혀야 하는 것 | 결과 |
| --- | --- |
| `toBeTruthy` · `toBeFalsy` | ✅ |
| `waitFor` 블록 안 부정 · 한 줄 부정 | ✅ |
| `vi.waitFor` 안 부정 | ✅ **(고쳐서 잡힘)** |

| 통과해야 하는 것 | 결과 |
| --- | --- |
| `waitFor` 밖의 단발 부정 | ✅ 통과 |
| `waitFor` 안의 긍정 단언 | ✅ 통과 |
| `waitFor` 안의 `expect.not` 헬퍼 | ✅ **통과(오탐 고쳐짐)** |

**5건 검출 · 오탐 0.**

남는 한계 하나는 고치지 않았다. `import { waitFor as wf }`처럼 **이름을 바꾸면 못 잡는다.**
구문 규칙의 원리적 한계이고, 이 레포는 전부 `waitFor`로 import한다. 이건 원인을 알고
**받아들이기로 한 트레이드오프**라 「한계」로 쓴다 — 9주차에 배운 구분(원인을 모르는 것이
한계, 아는데 안 고친 것은 미룬 일)에 따르면 이쪽이다. 그 자리는 변이 실험이 맡는다.

> **교훈.** 룰을 켜서 초록불인 것으로는 룰이 맞다고 말할 수 없다. 8주차에 테스트를
> 변이로 때려 봤던 것과 같은 절차가 **룰에도 필요하다** — 룰도 코드이고, 내가 쓴 형태만
> 확인하면 내가 안 쓰는 형태는 검증 밖이다.

### ④ 룰을 껐다 켜서 확인

고친 코드를 **일부러 옛 형태로 되돌려** 돌렸다.

```
위반 검출: 1건     → 되돌리면 막는다
원복 후: 통과       → 고친 형태는 통과한다
```

8주차 변이 실험과 같은 절차다. **켜 놓고 초록불인 것만으로는 룰이 동작한다고 말할 수 없다.**

## 왜 이게 결론인가

AI 리뷰와 사람 리뷰는 **매번 다시 물어야 한다.** 룰은 한 번 적으면 매 PR에 자동으로
적용된다. 같은 지적을 네 번 받았다면 리뷰가 부족한 게 아니라 **하네스가 비어 있다**는 뜻이다.

그 증거가 두 겹으로 있다.

1. **글로 적는 것은 실패했다.** `.claude/rules/testing.md`에 "`waitFor` 콜백엔 assertion 하나만"이 적혀 있었고, 8주차 라이팅에 "다음 주에도 쓸 것은 이 한 줄"이라고 썼다. 그런데 9주차에 세 번 더 틀렸다.
2. **룰을 켜니 즉시 2건이 나왔다.** 내가 안다고 생각한 것과 내 레포에 있는 것이 달랐다.

같은 패턴을 문서 쪽에서도 봤다 — RFC 표와 코드가 갈린다는 지적을 **R6 · R7 · R9 세 번**
받았고 세 번 다 "다음엔 대조하겠다"로 끝냈다. 그건 아직 룰이 아니라 규칙(커밋 관례)으로만
적어 뒀는데, 오탐이 커서 결정적으로 만들기 어렵다고 판단했다(문구 수정에도 걸린다).
**결정적으로 못 가르는 것을 억지로 내리면 그때부터 게이트를 무시하기 시작한다.**
그 경계가 이번 주에 배운 것이다.
