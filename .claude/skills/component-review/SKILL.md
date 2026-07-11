---
name: component-review
description: Use when reviewing a data-fetching custom hook or component's fetch `useEffect` for race conditions — checks that every `setState` call inside the effect is completeness-guarded by the cleanup flag (e.g. `if (!ignore)`). Triggers include "race guard 확인", "fetch effect 리뷰", "이 훅 race condition 있어?", "race-guard-completeness".
---

# Component Review — race-guard-completeness

`useEffect`로 직접 비동기 요청을 거는 코드는 컴포넌트가 리렌더되거나 언마운트되는 사이 이전 요청의 응답이 늦게 도착해 최신 상태를 덮어쓰는 race condition에 취약하다. 표준 방어는 클로저 플래그(`let ignore = false`)를 두고 클린업에서 `ignore = true`로 뒤집은 뒤, 응답을 받은 시점마다 `if (!ignore)`로 감싸 이후의 `setState`를 실행하는 것이다.

이 스킬은 그 방어가 **부분적으로만** 적용된 경우를 잡아내는 리뷰 게이트다. 가드 자체가 없는 경우는 눈에 띄지만, 가드가 있어도 `setState` 호출 중 일부가 가드 밖에 남아 있으면 race condition은 그대로 재현된다 — 이건 훑어봐서는 잘 안 보인다.

## 리뷰 대상 판별

다음을 만족하는 `useEffect`가 리뷰 대상이다:

- effect 본문(또는 그 안에서 정의한 async 함수)이 `fetch`/axios/그 밖의 비동기 API 호출을 수행한다.
- effect가 cleanup 함수를 반환하며, 그 안에서 `ignore`/`cancelled`/`isStale` 같은 boolean 플래그를 뒤집는다(또는 `AbortController.abort()`를 호출한다).

이 두 조건이 없으면(예: 동기 계산만 하는 effect, 구독/타이머만 정리하는 effect) 이 리뷰는 해당하지 않는다.

## 체크리스트 — race-guard-completeness

1. effect 본문에서 호출되는 **모든 `setState` 호출(직접 호출한 `set*` 함수)을 나열한다.** await 이전/이후 모두 포함(예: 요청 시작 직후의 `setLoading(true)`, 성공/실패 분기의 `setData`/`setError`).
2. 나열한 각 `setState` 호출에 대해, 그 호출을 감싸는 `if (!ignore)` (또는 동등한 가드)가 실제로 **그 호출의 직계 조상**인지 확인한다 — 같은 함수 안에 가드가 "어딘가에" 있다는 것만으로는 부족하다.
3. `if (!ignore) { ... }` 블록 **바깥**에서 실행되는 `setState`가 하나라도 있으면 FAIL이다. 대표적으로 놓치는 자리:
   - try 블록 진입 직후, 아직 응답을 기다리기 전에 호출하는 `setLoading(true)`/`setStatus("loading")` (가드 밖에 있기 쉽다).
   - `catch` 블록의 `setError(...)` (성공 분기만 가드하고 에러 분기를 빼먹는 경우가 흔하다).
   - `finally` 블록의 `setLoading(false)` (finally는 가드 없이도 항상 실행되어야 한다고 착각하기 쉽지만, stale 요청의 `finally`가 최신 로딩 상태를 `false`로 덮어쓰면 역시 race다).
4. AbortController를 쓰는 경우: `abort()` 자체는 fetch를 취소할 뿐 `setState` 호출부의 가드를 대신하지 못한다. `catch`에서 `AbortError`를 무시하지 않고 그대로 `setError`를 호출하면 여전히 FAIL이다 — `err.name === "AbortError"`를 걸러내거나 `if (!ignore)` 가드를 동일하게 적용해야 한다.
5. deps 배열에 객체/배열 리터럴이 그대로 들어있지 않은지도 함께 확인한다(매 렌더 새 참조 → effect가 매번 재실행돼 race 발생 빈도만 높아진다). 이 항목은 참고 사항이며 PASS/FAIL 판정에는 항목 1–4만 쓴다.

## 판정

- 나열된 **모든** `setState` 호출이 가드 안에 있으면 PASS.
- 하나라도 가드 밖에 있으면 FAIL — 어느 호출이 가드 밖인지 파일:라인으로 지목하고, `if (!ignore) { ... }`(또는 해당 프로젝트의 플래그 이름)로 감싸도록 수정을 제안한다.

## 반복 실행 방법

- 수동: 위 체크리스트 1–4번을 대상 effect마다 순서대로 실행한다. 새 fetch effect가 추가되거나 기존 effect가 수정될 때마다 다시 돈다.
- 에이전트 위임 시: 이 SKILL.md 전체를 리뷰 프롬프트에 포함하고, 대상 파일 경로(예: 이 레포의 `src/productList/useProductList.ts`)를 지정해 체크리스트 1–4번의 결과를 파일:라인 단위로 보고하게 한다.

## 예시 (이 레포 기준)

`src/productList/useProductList.ts`의 fetch effect는 PASS 사례다: `setStatus("loading")`/`setError(null)`(요청 시작 직후), `setProducts`/`setTotalCount`/`setStatus("success")`(성공), `setError`/`setStatus("error")`(실패) 전부가 각각 `if (!ignore) { ... }` 블록 안에 있다(`useProductList.ts:28-44`). 리팩터 이전 원본(`ProductListPage.tsx`의 인라인 fetch effect)은 `ignore` 가드 자체가 없어 이 리뷰 이전 단계(가드 부재)에서 이미 FAIL이었다.
