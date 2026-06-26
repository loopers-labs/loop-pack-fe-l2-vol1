# CLAUDE.md

> AI가 코드를 생성·수정할 때 따르는 행동 규칙. 규칙의 "왜"와 프로젝트 구조 설명은 `CONTRIBUTING.md` 참고.

## 💡 제1원칙

- **설명할 수 없는 코드는 커밋 금지.** AI 코드의 버그도 최종 책임은 1차 작성자(인간).
- **책임 분리.** 도구(Lint/Format)는 컨벤션·타입만 보장. 비즈니스 로직 판별은 인간이.

## 🛠️ 핵심 코드 품질 기준 (ESLint 강제 불가)

1. **의도적 네이밍.** `data`/`temp`/`flag` 등 모호한 이름 금지. (`flag` → `isAdult`)
2. **단일 책임.** 한 함수/컴포넌트는 한 가지만. 이름에 'and'가 필요하면 분리.
3. **파생 값은 계산.** `useState`+`useEffect` 동기화 금지, 렌더 시점에 직접 계산.
4. **Early Return.** 실패 케이스를 먼저 걸러내고(early return) 성공 케이스를 아래에. 단 모든 hook 호출부 아래에 배치.
5. **기존 코드 재사용.** 새로 만들기 전 `src/` 검색 먼저.
6. **가드가 필요하면 `as`보다 `satisfies`.** 값이 확실하면 `as`로 충분하나, 타입 일치를 단단히 보장할 곳(상수 목록 등)은 검증을 쓴다.

```ts
const METHODS = ["card", "kakao"] as const satisfies readonly PaymentMethod[];
```

## 🧩 컴포넌트 설계 전략 (ESLint 강제 불가)

### 경계

1. **변화의 경계.** 함께 바뀌면 같은 컴포넌트, 따로 바뀌면 분리.
2. **구현 vs 조합.** 내부 구현 늘리기 전 기존 컴포넌트 조합으로 가능한지 먼저.
3. **God Component.** 상태 5개 이상이거나 이름에 'and'가 필요하면 분리 신호.
4. **성급한 추상화 금지.** 2번 이상 반복될 때 추상화. 1회용 추상화·빈 래퍼 금지.

### 계약

5. **props는 적게.** 5개 초과면 분리 또는 객체화 검토. 이름은 의미 단위(`isLoading`).
6. **boolean 폭발 → enum.** boolean 3개 이상 공존하면 enum으로.

```ts
// isPaid / isPreparing / isShipped  →  status: OrderStatus
```

7. **파생 상태 + key.** 계산 가능한 값은 `useState` 금지. 리스트 리셋엔 `key`.
8. **확장은 위임으로.** 변형 로직을 내부에 쌓지 말고 콜백·render prop으로 호출자에게.

### 합성

9. **Context 전에 composition.** drilling 2단계 이하면 composition 먼저.
10. **children vs slot.** 단순 포함은 `children`, 고정 영역은 named slot. 구성이 케이스마다 다르면 compound.
11. **Drilling vs Context.** 3단계 이상 + 여러 컴포넌트가 같은 값 읽으면 Context.

## 🗂️ 상태 소유권

- **"이 값을 누가 읽는가"로 위치 결정.** 한 곳만 읽으면 그 컴포넌트, 여럿이 읽으면 공통 부모.
- **입력값은 자식, 결과값은 부모.** 타이핑 중 임시값은 자식이, 다른 곳이 읽는 확정값만 부모로. 단 "입력이 곧 결과"(실시간 반영)면 입력값도 부모.
- **setter 전달 시 prop 이름은 `on~`.** 부가 로직 없으면 setter를 그대로 넘기되 prop은 `set~`이 아니라 `on~`. 부가 로직 있으면 `handle~`로 감쌈.
- **자식엔 필요한 만큼만.** 객체 전체 대신 쓰는 형태로 변환. (`appliedCoupon` → `couponCode`)

## ✍️ 네이밍

- **콜백 prop은 `on~`, 핸들러는 `handle~`.** 부모의 `handle~`을 자식의 `on~`에 연결.

```tsx
<CouponCard onApply={handleApplyCoupon} />
```

- **props 타입은 `컴포넌트명+Props`로 분리.** 인라인 타입 금지. 외부에서 안 쓰면 `export` 안 함.

```ts
  interface CouponCardProps { ... }
```

- **의미 기반 네이밍.** 구현(`input`/`section`)이 아니라 의미(`amount`/`card`)로.

## 💬 주석

- **"왜"만.** 코드가 말하는 무엇/어떻게는 생략. 설계 의도·판단 근거만.
- **`//` vs `/** _/`.** 설계 의도는 라인 주석(`//`), API 사용법만 JSDoc(`/\*\* _/`).
- **주석이 아닌 것:** "안 한 일의 이유", 변경 이력, 시간·출처 표시 → git/커밋 메시지의 몫.
- **컨벤션 따른 것엔 주석 불필요.** (`type→interface`, `XxxProps` 등)

## 🔀 커밋 분리

- **한 커밋에 한 가지.** 리팩토링·기능·버그수정 안 섞음. type(`fix`/`refactor`/`feat`) 갈리면 커밋도 분리.
- **이동과 수정 분리.** 순수 이동 먼저 커밋(git이 이동으로 추적) 후 수정.
- **작업은 함께, 커밋은 분리.** `git add -p`로 성격별로. 단 얽혀서 한 조각씩 떼면 깨지는 작업(CSS 분리 등)은 한 단위로.
- **이유는 본문에.** 제목은 "무엇을 했나"만. 모호한 수식("직관적으로") 금지.

## 🚫 하네스

ESLint 강제 룰은 `eslint.config.js`에서 관리. 우회(`eslint-disable`, `ts-ignore`, `--no-verify`) 금지.

## 🚀 Git & PR 규칙

- **브랜치:** `feature/weekN-기능명` 또는 `fix/weekN-버그명`. `main` 기준.
- **커밋 게이트:** husky(`lint-staged`) 통과 필수. `--no-verify` 금지.
- **커밋 메시지:** `type: 동사 + 대상` (예: `feat: 로그인 기능 구현`)
- **PR:** 제목에 `[volume-n]`. 본문 핵심 리뷰 포인트 3개 이내 + 하단 문구 필수:
  > `"○○는 AI로 생성 후 직접 검토·수정했습니다."`
