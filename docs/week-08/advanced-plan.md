# 8주차 Advanced 실행 계획 — mutation testing을 기계에 맡긴다

> **관련 문서**
>
> - 과제 — [week-08.md](../assignments/week-08.md) Advanced
> - 1단계 — [테스트 계획](../rfc/week08-test-plan.md)
> - 3단계 — [실험 결과](./step3-result.md)
> - **이 계획의 결과 — [advanced-result.md](./advanced-result.md)**
>
> §2-3의 전용 vitest 설정은 실측에서 불필요한 것으로 확인돼 만들지 않았다.

3단계에서 손으로 세 곳을 망가뜨렸다. Advanced는 같은 일을 Stryker가 전수로 돌린다. 결과는 `docs/week-08/advanced-result.md`에 쓴다.

**과제가 요구하는 건 점수가 아니라 판단이다**(과제 218행). 살아남은 변형을 하나씩 보면서 "이건 진짜 문제인가"를 가르는 게 목적이고, 100%는 목표가 아니다.

---

## 0. 시작 전에 확인한 것

| 항목                             | 확인 결과                             |
| -------------------------------- | ------------------------------------- |
| `@stryker-mutator/core` 최신     | 10.0.0                                |
| `@stryker-mutator/vitest-runner` | 10.0.0                                |
| vitest-runner의 peer             | `vitest: '>=2.0.0'`, `core: '10.0.0'` |
| 이 저장소의 vitest               | 4.1.10                                |

peer 범위상 막히지는 않는다. 다만 `>=2.0.0`은 열린 범위라 vitest 4에서 검증됐다는 뜻은 아니다. 실행이 깨지면 그건 이 조합 때문일 가능성이 높으니 결과 문서에 적는다.

### 이 저장소 고유의 걸림돌

`vitest.config.ts`가 `projects`로 node/jsdom을 나눠 놓았다. Stryker가 어느 project를 도는지에 따라 결과가 달라진다.

- jsdom project까지 돌면 통합 테스트가 매 변형마다 실행되어 끝나지 않는다(과제 212행이 경고하는 상황).
- `vitest.setup.ts`가 두 project 공통이라 MSW `setupServer`도 매번 뜬다.

그래서 **범위 한정은 mutate 파일 목록만이 아니라 실행할 테스트 범위까지 포함해야 한다.** 이게 이번 Advanced의 실질적인 난점이다.

---

## 1. 변형 대상 범위와 근거

1단계에서 **단위로 분류한 항목(1·2·3번)의 구현 파일만** 넣는다.

| 파일                                        | 1단계 항목 | 왜 넣나                                                                                                               |
| ------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| `src/shared/lib/get-total-pages.ts`         | 3번        | 순수 계산. 경계가 여럿이고 3단계에서 손으로 한 자리와 겹친다                                                          |
| `src/entities/product/api/query-schema.ts`  | 2번        | `parseAsPositiveInteger`의 `Number.isSafeInteger`와 `>= 1` 조건. 직접 쓴 parser라 라이브러리가 대신 검증해주지 않는다 |
| `src/entities/product/api/queries.ts`       | 2·6번      | `shouldThrowProductListError`의 `!(error instanceof ApiError)`와 `productQueryKeys.list` 조립                         |
| `src/shared/lib/create-collection-store.ts` | 1번        | `readIds` 검증, `migrate`, `merge`, `partialize`. 3단계 실험 3의 자리이기도 하다                                      |

네 파일 합쳐 107줄이다.

**제외하는 것과 이유:**

- `src/_pages/**`, `src/widgets/**`, `src/features/**` — 통합 테스트(RTL + jsdom + MSW)가 걸린다. 변형 하나마다 jsdom과 MSW를 세우면 실행 시간이 감당이 안 된다.
- `app/api/**` — Route Handler는 node 테스트가 덮고 있지만 1단계에서 단위로 분류한 항목이 아니다. 이번 주 검증 대상 밖이다.
- `src/shared/ui/**`, 스타일, 설정 — 테스트가 없거나 로직이 없다.

이 범위 선정은 과제 212행("1단계에서 단위로 분류한 로직 위주로 한정하고, 그렇게 정한 근거를 남겨요")에 대한 답이다.

---

## 2. 설정

### 2-1. 설치

```bash
pnpm add -D @stryker-mutator/core @stryker-mutator/vitest-runner
```

### 2-2. `stryker.config.json`

과제 220행이 경고한 `Cannot find TestRunner plugin "vitest"`를 피하려면 pnpm 환경에서 `plugins`를 명시한다.

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "pnpm",
  "testRunner": "vitest",
  "plugins": ["@stryker-mutator/vitest-runner"],
  "reporters": ["html", "clear-text", "progress"],
  "mutate": [
    "src/shared/lib/get-total-pages.ts",
    "src/shared/lib/create-collection-store.ts",
    "src/entities/product/api/query-schema.ts",
    "src/entities/product/api/queries.ts"
  ],
  "vitest": { "configFile": "vitest.stryker.config.ts" },
  "timeoutMS": 10000,
  "coverageAnalysis": "perTest"
}
```

`thresholds`는 넣지 않는다. 점수를 게이트로 만드는 순간 "살아남은 변형을 판단한다"가 "숫자를 올린다"로 바뀐다(과제 218행).

### 2-3. Stryker 전용 vitest 설정

node project만 남긴 설정을 따로 둔다. 위 「걸림돌」의 대응이다.

```ts
// vitest.stryker.config.ts — Stryker 실행에서만 쓴다.
// 변형 대상이 전부 단위 테스트로 덮이므로 jsdom project를 뺀다.
```

`vitest.config.ts`를 복사해 node project만 남기고, 그 이유를 파일 주석에 적는다. **본 설정은 건드리지 않는다** — `pnpm test`가 여전히 13파일 77개를 다 돌아야 한다.

이 분리가 잘 돌아가지 않으면 대안은 `mutate`는 그대로 두고 Stryker가 도는 테스트만 좁히는 다른 방법을 찾는 것이다. 어느 쪽이든 결과 문서에 방법과 이유를 적는다.

### 2-4. 스크립트

```json
"test:mutation": "stryker run"
```

`pnpm check`에는 넣지 않는다. 근거는 0단계에서 E2E를 별도 명령으로 뺀 것과 같다 — 매 커밋마다 돌릴 물건이 아니다. 이 판단 자체가 과제가 요구하는 "상시로 쓸지 말지"의 일부이므로, 실행 시간을 재본 뒤 결과 문서에서 다시 확정한다.

---

## 3. 실행 순서

1. 시작 전 `git status`로 워킹트리가 깨끗한지 확인한다.
2. 설치 → 설정 파일 두 개 작성.
3. **먼저 `get-total-pages.ts` 한 파일만** `mutate`에 넣고 돌려본다. 도구가 뜨는지, 어느 project를 도는지, 실행 시간이 얼마인지 여기서 확인한다.
4. 잘 돌면 네 파일로 확장한다.
5. 전체 실행 시간을 기록한다(`stryker run` 출력의 소요 시간).
6. HTML 리포트에서 살아남은 변형을 전부 훑는다.
7. 살아남은 변형을 아래 세 종류로 분류한다.
   - **진짜 구멍** — 의미가 바뀌는데 테스트가 못 잡는다 → 보강 대상
   - **동등 변형(equivalent mutant)** — 의미가 안 바뀌어서 원래 못 죽인다 → 왜 그런지 적는다
   - **범위 밖** — 검증하기로 정한 공개 동작이 아니다 → 안 잡는 게 맞다는 근거를 적는다
8. 진짜 구멍 중 **2개 이상**을 골라 테스트를 보강한다.
9. 보강 후 다시 `stryker run`해서 그 변형이 죽는지 확인한다.
10. `pnpm check`로 기존 77개가 그대로 통과하는지 확인한다.

---

## 4. 기록할 것 (완료조건 대응)

| 과제 요구                        | 결과 문서에 쓸 것                                             |
| -------------------------------- | ------------------------------------------------------------- |
| 범위를 한정한 근거               | §1의 표와 제외 목록. 실행 범위를 node project로 좁힌 이유도   |
| 살아남은 변형 2개 이상 보강      | 변형 내용 / 왜 못 잡았나 / 어떤 단언을 추가했나 / 재실행 결과 |
| 죽일 수 없는 변형                | 동등 변형으로 분류한 것과 그 근거                             |
| 3단계와 비교해 도구가 더 찾은 것 | 손으로 한 세 실험과 겹치는 것 / 도구만 찾은 것                |
| 전체 실행 시간                   | `stryker run` 출력 수치                                       |
| 상시 사용 판단                   | 실행 시간과 찾아낸 것의 값어치를 놓고 결론                    |

3단계 실험과의 비교는 이번 Advanced에서 제일 값어치 있는 자리다. 3단계에서 `getTotalPages`의 `Math.max`는 손으로 잡았지만 `Math.ceil` → `Math.floor`는 안 봤다고 `step3-result.md`에 적어뒀다. 도구가 그걸 잡아내는지가 "손으로 한 실험의 한계"를 보여준다.

---

## 5. 예상되는 것

미리 적어두고 실제 결과와 대조한다. 빗나가면 그 자체가 기록거리다.

| 파일                         | 살아남을 것 같은 자리                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `get-total-pages.ts`         | 없을 것 같다. 2줄이고 4개 테스트가 경계를 나눠 덮는다                                                         |
| `query-schema.ts`            | `Number.isSafeInteger`를 `Number.isInteger`로 바꾸는 변형. 안전 정수 경계를 넘는 입력을 단위 테스트가 안 본다 |
| `queries.ts`                 | `productQueryKeys.list`의 객체 조립 순서처럼 의미가 안 바뀌는 동등 변형                                       |
| `create-collection-store.ts` | `migrate`와 `merge`가 둘 다 `readIds`를 부르는데, 한쪽만 지워도 다른 쪽이 덮어서 살아남을 수 있다             |

---

## 6. 판단이 필요한 자리

아래는 실행 중에 갈리는 지점이다. **결론은 작성자가 정한다.**

### ① 실행 범위를 좁히는 방법

| 선택지                                    | 결과                                                        |
| ----------------------------------------- | ----------------------------------------------------------- |
| A. `vitest.stryker.config.ts`를 따로 둔다 | 설정 파일이 하나 늘지만 본 설정을 안 건드린다. 위 §2-3 기준 |
| B. 본 설정에 project 필터를 넘긴다        | 파일은 안 늘지만 Stryker 실행 조건이 본 설정에 섞인다       |
| C. 좁히지 않고 그냥 돌려본다              | 실행 시간이 얼마나 나쁜지 수치로 얻는다. 대신 오래 걸린다   |

C는 "왜 좁혀야 하는가"의 근거를 실측으로 만든다는 값어치가 있다. §3의 3번 단계에서 한 파일로 재볼 때 같이 확인할 수 있다.

### ② 살아남은 변형을 어디까지 보강할 것인가

과제는 2개 이상을 요구한다. 그보다 많이 나왔을 때 전부 보강할지, 2~3개만 고르고 나머지는 "안 잡는 게 맞다"로 판단할지가 갈린다. 이번 주 원칙(전부 테스트하겠다는 계획은 계획이 아니다, 과제 119행)에 비춰보면 후자에 가깝지만, 어느 선에서 끊을지는 실제 목록을 보고 정한다.

### ③ `test:mutation`을 CI에 넣을지

실행 시간을 재본 뒤 판단한다. E2E를 `pnpm check`에서 뺀 것과 같은 종류의 결정이다.

---

## 7. 남아 있는 위험

- **vitest 4 조합** — peer 범위는 통과하지만 실측되지 않은 조합이다. 러너가 안 뜨면 여기부터 의심한다.
- **`create-collection-store.ts`의 `persist`** — Stryker가 이 파일을 변형할 때 `localStorage` 스텁을 쓰는 기존 단위 테스트가 어떻게 반응할지 예측이 안 된다. 타임아웃이 나면 `timeoutMS`를 올리기 전에 원인을 먼저 본다.
- **설치 자체가 되돌릴 대상** — Advanced를 접기로 하면 `package.json`과 설정 파일을 원복해야 한다. 별도 커밋으로 두면 되돌리기 쉽다.
- **런타임 실행 권한** — 이 계획은 설치와 실행이 필요하다. 실행 전에 허가를 확인한다.

---

_이 문서는 Claude가 작성했다. Stryker 10.0.0의 peer 범위와 이 저장소의 vitest 버전을 확인하고, `vitest.config.ts`의 projects 구성이 실행 범위에 걸린다는 점을 찾아 §2-3으로 분리한 것이 Claude다._

_§1의 변형 대상은 1단계에서 작성자가 단위로 분류한 항목을 그대로 따랐다. §6의 세 가지는 Claude가 선택지만 제시했고 작성자가 정했다. 살아남은 변형 중 무엇을 "진짜 구멍"으로 볼지는 곧 "무엇을 지킬 것인가"라 과제가 넘기지 말라고 한 결정이고(과제 43행), 판정 결과는 [`advanced-result.md`](./advanced-result.md) §3·§8에 있다._
