# 8주차 Advanced 결과 — Stryker로 돌린 mutation testing

> **관련 문서**
>
> - 과제 — [week-08.md](../assignments/week-08.md) Advanced
> - 이 결과의 계획 — [advanced-plan.md](./advanced-plan.md)
> - 3단계 — [실험 결과](./step3-result.md)
> - 앞으로 쓸 절차 — [mutation-testing/SKILL.md](../../.agents/skills/mutation-testing/SKILL.md)
>
> 아래 §3의 분류표가 그 스킬이 참조하는 목록이다.

3단계에서 손으로 세 곳을 망가뜨렸다. 여기서는 같은 일을 Stryker 10.0.0이 전수로 돌렸다.

---

## 요약

| 항목           | 값                                           |
| -------------- | -------------------------------------------- |
| 변형 대상      | 4개 파일 107줄                               |
| 생성된 변형    | 72개                                         |
| 실행 시간      | 22초 (변형당 평균 6.14개 테스트)             |
| 보강 전 점수   | 86.11% (죽음 62 / 생존 10)                   |
| 보강 후 점수   | **94.44%** (죽음 68 / 생존 4)                |
| 보강한 테스트  | 2개 추가 (`create-collection-store.test.ts`) |
| 남은 생존 변형 | 4개 — 동등 변형 2 / 범위 밖 2                |

---

## 1. 변형 대상을 좁힌 근거

1단계에서 **단위로 분류한 항목의 구현 파일만** 넣었다(과제 212행).

| 파일                                        | 1단계 항목 | 넣은 이유                                    |
| ------------------------------------------- | ---------- | -------------------------------------------- |
| `src/shared/lib/get-total-pages.ts`         | 3번        | 순수 계산, 경계가 여럿                       |
| `src/entities/product/api/query-schema.ts`  | 2번        | 직접 쓴 parser라 라이브러리가 대신 안 지킨다 |
| `src/entities/product/api/queries.ts`       | 2·6번      | 에러 분류와 queryKey 조립                    |
| `src/shared/lib/create-collection-store.ts` | 1번        | persist 저장·복원 검증                       |

제외: `_pages`·`widgets`·`features`(통합 테스트가 걸린다), `app/api`(1단계 단위 분류 밖), `shared/ui`·스타일·설정(로직 없음).

---

## 2. 실행에서 계획과 어긋난 것

### 2-1. 샌드박스 복사가 심볼릭 링크에서 죽었다

첫 실행이 곧바로 실패했다.

```
ERROR Stryker Unexpected error occurred while running Stryker
Error: ENOTSUP: operation not supported on socket, copyfile
  '.../.claude/skills' -> '.../.stryker-tmp/sandbox-48moJ5/.claude/skills'
```

Stryker는 프로젝트 전체를 `.stryker-tmp/sandbox-*`로 **복사**한 뒤 그 안에서 변형을 적용한다. 이 저장소의 `.claude/skills`가 `../.agents/skills` 심볼릭 링크라 복사에서 걸렸다. `ignorePatterns`로 테스트와 무관한 디렉터리를 빼서 해결했다.

```json
"ignorePatterns": [".claude", ".agents", "docs", "e2e", "public", ".next", "playwright-report", "test-results"]
```

부수 효과가 하나 더 있었다. 중단된 실행이 샌드박스를 지우지 않고 남겨서 다음 `pnpm lint`가 샌드박스 안의 복사본까지 검사해 24개 에러를 냈다. `.gitignore`와 `eslint.config.mjs` 양쪽에 `.stryker-tmp`·`reports`를 넣었다. 정상 종료하면 Stryker가 알아서 지우므로 이건 중단 상황 대비다.

### 2-2. 계획한 전용 vitest 설정은 필요 없었다

계획 §2-3은 `vitest.config.ts`의 `projects`(node/jsdom) 때문에 jsdom 통합 테스트가 매 변형마다 돌아 "끝나지 않는다"고 봤고, `vitest.stryker.config.ts`를 따로 두기로 했다. **실측에서 이 전제가 틀렸다.**

좁히지 않은 채 `get-total-pages.ts` 한 파일로 돌린 첫 성공 실행:

```
INFO DryRunExecutor Initial test run succeeded. Ran 13 tests in 1 second
Ran 4.00 tests per mutant on average.
Done in 3 seconds.
```

13개는 `get-total-pages.test.ts` 4개 + `ProductListContent.test.tsx` 9개다. 전체 79개가 아니라 **변형 대상을 import하는 테스트만** 돌았다. Stryker의 vitest 러너가 알아서 관련 테스트로 좁히므로 project를 나눌 이유가 없었다. 4개 파일로 확장해도 22초다.

전용 설정 파일을 만들지 않기로 했다. 없어도 되는 파일이고, 있으면 "왜 이 파일이 있는가"를 나중에 다시 설명해야 한다.

---

## 3. 살아남은 변형 10개와 분류

| #   | 위치                            | 변형                                              | 분류      |
| --- | ------------------------------- | ------------------------------------------------- | --------- |
| 1   | `create-collection-store.ts:19` | `A && persisted !== null && C` → `A && true && C` | 진짜 구멍 |
| 2   | `create-collection-store.ts:19` | 조건 전체 → `true`                                | 진짜 구멍 |
| 3   | `create-collection-store.ts:19` | `A && B && C` → `A && B \|\| C`                   | 진짜 구멍 |
| 4   | `create-collection-store.ts:19` | → `true && C`                                     | 진짜 구멍 |
| 5   | `create-collection-store.ts:19` | → `true && B && C`                                | 진짜 구멍 |
| 6   | `create-collection-store.ts:19` | → `A \|\| B && C`                                 | 진짜 구멍 |
| 7   | `create-collection-store.ts:28` | `ids: []` → `ids: ["Stryker was here"]`           | 동등 변형 |
| 8   | `query-schema.ts:32`            | `parsedValue >= 1` → `parsedValue > 1`            | 동등 변형 |
| 9   | `queries.ts:22`                 | `5 * 60 * 1000` → `5 / 60 * 1000`                 | 범위 밖   |
| 10  | `queries.ts:22`                 | `5 * 60 * 1000` → `5 * 60 / 1000`                 | 범위 밖   |

`get-total-pages.ts`는 변형 3개가 전부 죽어 100%였다. 생성된 것은 `totalCount * pageSize`(산술), `Math.min(1, ...)`(메서드), `() => undefined`(반환값)다.

`Math.ceil` → `Math.floor`는 **도구가 만들지 않았다.** Stryker의 메서드 변형은 `Math.max`를 `Math.min`으로 뒤집는 쪽으로 갔다. 3단계에서 남겨뒀다고 적은 자리(`step3-result.md` 마지막 절)가 도구를 돌린 뒤에도 그대로 비어 있다는 뜻이라, 3단계 방식으로 직접 확인했다.

| 망가뜨린 곳          | 어떻게                     | 결과 | 실패한 테스트                                               |
| -------------------- | -------------------------- | ---- | ----------------------------------------------------------- |
| `get-total-pages.ts` | `Math.ceil` → `Math.floor` | 잡힘 | `상품 13개를 페이지당 12개로 나누면 2페이지다` (4개 중 1개) |

```
AssertionError: expected 1 to be 2 // Object.is equality
```

딱 나누어떨어지지 않는 경계만 빨개졌다. 24÷12처럼 떨어지는 케이스는 `ceil`이든 `floor`든 같은 값이라 통과한다. 원복 후 4개 통과를 확인했다.

**여기서 확인한 것.** 전수라고 해도 Stryker가 도는 건 **자기 mutator 카탈로그 안에서의 전수**다. "의미가 바뀌는 모든 변경"이 아니다. 도구를 돌렸다고 손으로 볼 자리가 없어지지 않는다.

### 1~6번이 왜 살아남았나

`readIds`의 가드 세 조건이다.

```ts
const readIds = (persisted: unknown): string[] =>
  typeof persisted === 'object' && persisted !== null && 'ids' in persisted
    ? toValidIds(persisted.ids)
    : []
```

기존 손상 케이스 테스트가 넘기는 값은 `{ ids: ['p1', 42] }` 하나뿐이었다. **객체이면서 `ids` 키가 있는** 값이라 가드 세 조건을 전부 통과해 버린다. 저장값이 `null`이거나 객체가 아닌 경로는 어떤 테스트도 밟지 않았다.

3단계에서 이 파일의 `partialize`를 손으로 망가뜨렸을 때는 E2E가 잡았다. 같은 파일인데 바로 옆 `readIds`의 가드는 아무도 안 보고 있었다 — **손으로 고른 한 자리와 파일 전체의 차이**가 여기서 드러난다.

### 7번이 동등 변형인 이유

초기 상태 `ids: []`를 `['x']`로 바꾸고 **전체 79개**를 돌렸는데 전부 통과했다.

zustand `persist`는 store 생성 시 hydration을 돌리면서 저장값이 없어도 `merge(undefined, current)`를 호출한다. `merge`가 `{ ...current, ids: readIds(persisted) }`를 돌려주므로 `ids`는 항상 덮어써진다. 동기 storage라 이 과정이 `create()` 안에서 끝나고, 초기값이 밖에서 관측되는 순간이 없다. 공개 동작으로는 죽일 수 없다.

### 8번이 동등 변형인 이유

```ts
return Number.isSafeInteger(parsedValue) && parsedValue >= 1 ? parsedValue : 1
```

`>=`와 `>`가 갈리는 입력은 `parsedValue === 1`뿐이다. `>=`면 `parsedValue`(= 1)를 반환하고, `>`면 조건이 거짓이라 fallback `1`을 반환한다. **양쪽 다 1이다.** 어떤 입력으로도 결과가 달라지지 않는다.

### 9·10번을 범위 밖으로 둔 이유

`staleTime`은 값이 실제로 바뀐다(300000 → 0.0833 / 300). 죽이려면 `productQueries.list(params).staleTime`을 값으로 단언해야 하는데, 그건 캐시 정책 수치를 테스트가 고정하는 것이다. 정책을 조정할 때마다 테스트를 같이 고쳐야 하고, 사용자에게 보이는 동작이 아니라 설정값을 지키게 된다. 1단계에서 정한 검증 대상이 아니라 잡지 않는 쪽을 택했다.

---

## 4. 보강 — 두 번 시도했고 첫 번째가 실패했다

이 절이 이번 Advanced에서 제일 값어치 있는 기록이다.

### 첫 시도 — 통과했지만 아무것도 못 죽였다

`null`과 문자열 저장값을 넘기는 테스트 2개를 추가했다. 7개 전부 통과했다. 그런데 다시 돌리니 **점수가 86.11 그대로**였고 생존 10개도 그대로였다.

변형을 손으로 적용하고 돌려봐도 통과했다. `merge`가 실제로 `null`을 받는지 별도 probe로 확인했더니 받고 있었다(`[null, null]`). 그러면 `'ids' in null`에서 TypeError가 나야 한다.

원인은 zustand였다. **hydration 중 발생한 예외를 zustand가 삼킨다** — `onRehydrateStorage`의 에러 콜백으로 넘기고 rehydrate 자체는 정상 종료한다. 그래서 변형이 터져도 복원만 중단되고, 초기값이 `[]`라 결과가 원본과 똑같이 빈 목록이 된다. 단언이 구분할 수가 없다.

### 두 번째 시도 — 이미 담긴 상태에서 복원한다

값 차이를 만들려면 복원 실패가 관측돼야 한다. 빈 상태가 아니라 **이미 담긴 상태**에서 손상된 값을 복원시켰다.

```ts
it('담긴 상태에서 저장값이 null이면 빈 목록으로 복구한다', async () => {
  const store = createCollectionStore('null-state-test')
  store.getState().toggle('p1')
  localStorage.setItem('null-state-test', JSON.stringify({ state: null, version: 1 }))

  await store.persist.rehydrate()

  expect(store.getState().ids).toEqual([])
})
```

원본은 가드가 거짓이라 `[]`를 반환해 `['p1']`을 지운다. 변형은 예외로 복원이 중단돼 `['p1']`이 남는다. 이제 갈린다.

`null`로 죽는 것이 1~5번이고, 6번(`true && B && C`)은 `null`이면 `B`가 거짓이라 원본과 같아진다. 6번을 죽이려면 객체가 아닌 값이 필요해서(`'ids' in '문자열'`이 TypeError) 문자열 케이스를 따로 뒀다.

### 결과

|                              | 보강 전          | 보강 후             |
| ---------------------------- | ---------------- | ------------------- |
| `create-collection-store.ts` | 84.09% (생존 7)  | **97.73%** (생존 1) |
| 전체                         | 86.11% (생존 10) | **94.44%** (생존 4) |

`readIds` 가드 6개가 전부 죽었다. 남은 1개가 7번 동등 변형이다.

**여기서 확인한 것.** 테스트가 초록에서 빨강으로 바뀌는 것과, 테스트가 그 변경을 **구분할 수 있는가**는 다르다. 첫 시도의 테스트는 "손상값이면 빈 목록"이라는 문장을 그대로 옮겼는데도 가드의 존재를 검증하지 못했다. 도구가 없었으면 통과하는 초록불을 보고 검증됐다고 믿었을 자리다.

---

## 5. 3단계(손)와 비교

|            | 3단계                         | Advanced                                  |
| ---------- | ----------------------------- | ----------------------------------------- |
| 실험 수    | 3                             | 72                                        |
| 자리 선택  | 사람이 고른다                 | 전수                                      |
| 걸린 시간  | 실험당 수 분(E2E는 빌드 포함) | 전체 22초                                 |
| 찾은 것    | 계층 분리가 값을 한다는 확인  | `readIds` 가드 미검증, 동등 변형 2건      |
| 못 하는 것 | 파일 전체를 못 훑는다         | 계층 간 관계와 카탈로그 밖 변형을 못 본다 |

**겹치는 자리.** `create-collection-store.ts`를 양쪽 다 봤다. 3단계는 `partialize`를 골라 E2E로 잡았고, 도구는 바로 옆 `readIds`가 안 잡힌다는 걸 찾았다. 같은 파일에서 사람은 하나만 보고 도구는 전부 본다.

**도구만 찾은 것.** `readIds` 가드 6개와 동등 변형 2건. 특히 `>= 1` → `> 1`은 사람이 골랐어도 "1일 때 어떻게 되지?"를 끝까지 따라가야 동등하다는 걸 알 수 있다.

**손으로만 할 수 있었던 것.** 3단계 실험 3에서 같은 변형에 12번 RTL은 통과하고 15번 E2E는 실패한다는 걸 확인했다. Stryker는 E2E를 돌리지 않고 계층별로 결과를 갈라 보여주지도 않는다. "이 검증을 어느 계층에 둘 것인가"는 도구가 답하지 않는다.

`Math.ceil` → `Math.floor`도 여기 들어간다. 도구가 만들지 않아 §3에서 손으로 돌렸다. 어떤 변경이 의미를 바꾸는지는 mutator 목록이 아니라 도메인이 정한다.

---

## 6. 상시로 쓸 것인가

**별도 명령으로 둔다.** `pnpm check`에는 넣지 않는다.

```json
"test:mutation": "stryker run"
```

22초는 견딜 만한 시간이라 속도가 이유는 아니다. 점수를 매 커밋 지표로 삼으면 "살아남은 변형을 판단한다"가 "숫자를 올린다"로 바뀐다(과제 218행). 이번에 남긴 4개 중 2개는 죽일 수 없고 2개는 안 잡는 게 맞다고 판단한 것이라, 게이트를 걸면 잘못된 테스트를 쓰게 만든다. `thresholds`도 넣지 않은 이유가 같다.

쓸 시점은 정해뒀다 — **단위 로직을 새로 쓰거나 고칠 때 그 파일만 `mutate`에 넣고 한 번 돌린다.** 이번에 22초가 나온 것도 범위를 4개 파일로 한정했기 때문이다.

---

## 7. 남은 것

- 생존 4개는 위 분류대로 두고 보강하지 않는다.
- `mutate` 범위를 통합 계층으로 넓히면 실행 시간이 어떻게 되는지는 재보지 않았다. Stryker가 관련 테스트만 고른다는 걸 확인했으므로 계획이 걱정한 만큼 나쁘지 않을 수 있다.
- `@stryker-mutator/vitest-runner`의 peer는 `vitest: '>=2.0.0'`이고 이 저장소는 4.1.10이다. 실행에 문제는 없었다.

## 최종 확인

- `pnpm verify` 통과 (13파일 79개 — 보강으로 77 → 79)
- 변형이 소스에 남아 있지 않다 (`git diff`로 확인)
- `.stryker-tmp` 삭제됨

---

## 8. 재실행 — 7주차 코드가 들어온 뒤

이 문서의 위 내용은 **7주차 작업이 머지되지 않은 코드** 위에서 돌린 결과다. 8주차를 잘못된 베이스에서 시작한 탓이고, 경위는 [`step2-review.md`](./step2-review.md) 6장에 있다. `mutate` 범위의 `queries.ts`는 당시 `getLatestProductList`가 없는 버전이었다.

머지하고 6·7번에 갱신 실패 테스트를 추가한 뒤 같은 설정으로 다시 돌렸다.

| 항목        | 이전 실행 | 재실행         |
| ----------- | --------- | -------------- |
| 생성된 변형 | 72개      | **83개** (+11) |
| 점수        | 94.44%    | **92.77%**     |
| 생존        | 4개       | **6개**        |
| 실행 시간   | 22초      | 28초           |
| 전체 테스트 | 79개      | 92개           |

늘어난 변형 11개는 전부 `getLatestProductList`에서 나왔다. 점수가 내려간 것은 테스트가 나빠져서가 아니라 **한 번도 변형된 적 없던 코드가 범위에 들어왔기** 때문이다. 점수를 게이트로 걸지 않기로 한 판단(6장)이 여기서 한 번 더 확인된다 — 코드가 늘면 점수는 내려간다.

### 신규 생존 2개

| #   | 위치            | 변형                                      | 분류      |
| --- | --------------- | ----------------------------------------- | --------- |
| 11  | `queries.ts:37` | `.filter(...)` 체인을 통째로 제거         | 동등 변형 |
| 12  | `queries.ts:40` | `query.state.data !== undefined` → `true` | 동등 변형 |

둘은 같은 자리다.

```ts
.filter((query) => query.state.data !== undefined)
.sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt)
.at(0)?.queryKey

return latestKey ? queryClient.getQueryData<GetProductListResponse>(latestKey) : undefined
```

처음에는 진짜 구멍으로 봤다. 캐시에 실패했거나 진행 중인 query가 섞이면 그걸 "최신 목록"으로 골라버릴 것 같았고, 그러면 갱신 실패 화면이 최초 실패 화면으로 잘못 나온다.

**틀렸다.** 필터를 지워도 결과가 달라지지 않는다.

- data가 없는 query는 `dataUpdatedAt`이 `0`이다. `dataUpdatedAt`은 데이터가 실제로 들어올 때만 갱신되므로, data 없는 항목이 data 있는 항목보다 앞에 오는 경우가 없다. 정렬이 이미 필터의 일을 한다.
- 캐시에 data 있는 query가 하나도 없으면 필터 없는 쪽은 `latestKey`를 잡지만, 그 키의 `getQueryData`가 `undefined`라 최종 반환값이 같다.

`setQueryData`로 캐시를 손으로 만드는 대신 **MSW로 진짜 실패 요청을 만들어** 확인했다. 성공 요청 하나로 캐시를 채우고 500을 돌려주는 핸들러로 다른 조건을 실패시킨 뒤, 필터가 있을 때와 없을 때의 반환값을 비교했다. 같았다.

즉 이 필터는 **도달할 수 없는 방어 코드**다. 지금은 그대로 두되, 동등 변형이라는 사실을 여기 적어 다음에 같은 자리를 다시 파지 않게 한다.

### 8번과 다른 점

8번(`>= 1` → `> 1`)은 **한 줄만 보고** 동등하다고 판정할 수 있었다. 11·12번은 그렇지 않다. 바로 다음 줄의 `sort`와 그 다음 줄의 `getQueryData`까지 읽어야 한다. 필터 하나만 보면 "실패한 query를 거르는 코드"로 읽히고, 그러면 안 잡히는 것이 구멍으로 보인다.

**동등 변형 판정에 필요한 시야가 표현식 단위가 아니라 그 값이 흘러가는 끝까지라는 뜻이다.** 이번에는 실측으로 뒤집었지만, 실측하지 않았다면 불필요한 테스트를 하나 더 썼을 자리다.

### 기존 생존 4개

`create-collection-store.ts:28`, `query-schema.ts:32`, `queries.ts` staleTime 2개는 그대로 살아남았다. 분류(동등 2 / 범위 밖 2)와 근거는 3장에서 바뀌지 않는다. `staleTime`의 줄 번호만 22 → 24로 밀렸다.

### 상시 사용 판단은 그대로

6장의 결론을 바꾸지 않는다. 28초도 견딜 만하고, 이번 재실행이 오히려 근거를 보탰다 — **코드가 들어오면 점수는 내려간다.** 게이트를 걸면 이번처럼 "동등 변형 2개 때문에 빨간불"이 되고, 그걸 넘기려고 도달할 수 없는 코드에 테스트를 쓰게 된다.

---

_이 문서는 Claude가 작성했다. Stryker 설치·설정·실행, 심볼릭 링크 문제 해결, 생존 변형 목록 수집, 보강 테스트 작성, 실패한 첫 시도의 원인(zustand의 hydration 예외 처리) 추적이 Claude다._

_8장(재실행)도 Claude가 작성했다. 신규 생존 2개를 처음에 "진짜 구멍"으로 판정했다가, 작성자가 "MSW로 하면 되지 않느냐"고 물어 실제로 MSW 기반 확인을 짜보고 필터가 도달 불가능한 방어 코드임을 확인해 동등 변형으로 뒤집었다. 판정을 바꾼 근거는 추측이 아니라 그 실행 결과다._

_변형 대상 범위는 1단계에서 작성자가 단위로 분류한 항목을 따랐다. 전용 vitest 설정을 두지 않기로 한 것, 어디까지 보강할지, `pnpm check`에 넣지 않기로 한 것은 Claude가 실측치와 선택지를 제시하고 작성자가 정했다. 9·10번을 "범위 밖"으로, 7·8번을 "동등 변형"으로 가른 판단도 작성자가 확인했다. 재실행으로 늘어난 11·12번의 분류는 §8에 있다._
