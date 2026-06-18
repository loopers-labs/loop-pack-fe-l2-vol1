---
paths:
  - "src/**/*.{ts,tsx}"
---

# React 규칙

React 19 + Vite + TS 환경의 React 코드 규칙. `.ts/.tsx` 작업 시에만 로드된다.
Next 전용 구문은 금지 — `CLAUDE.md` 의 **스택** 참조.

## Escape Hatch 대원칙

`useRef` / `useEffect` 는 React 밖으로 나가는 **탈출구(escape hatch)** 다. 앱 로직·데이터 흐름의 다수가 여기 의존하면 접근 방식을 다시 본다.

> "Most of your application logic and data flow should not rely on these features."
> — React, [Escape Hatches](https://react.dev/learn/escape-hatches)

## 파생 가능한 값은 계산한다 (최중요 패턴)

`useState` + `useEffect` 로 props/state 를 다른 state 에 동기화하지 않는다. 렌더 중 계산하거나 `useMemo` 로 도출한다.

## useRef — 렌더에 쓰이는 값은 ref 가 아니라 state

렌더링 중 `ref.current` 를 읽거나 쓰지 않는다. 화면에 반영돼야 하는 값은 ref 가 아니라 state 로 둔다.

> "Don't read or write ref.current during rendering. This makes your component hard to predict."
> "Treat refs as an escape hatch. … If much of your application logic and data flow relies on refs, you might want to rethink your approach."
> — React, [Referencing Values with Refs](https://react.dev/learn/referencing-values-with-refs)

## useEffect — 외부 시스템 동기화에만

파생값 계산이나 이벤트 처리엔 Effect 가 필요 없다. Effect 는 외부 시스템(DOM·네트워크·구독 등) 동기화에만 쓴다.

> "If there is no external system involved … you shouldn't need an Effect. Removing unnecessary Effects will make your code easier to follow, faster to run, and less error-prone."
> — React, [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

## 조건부 렌더링은 early return — 단, 모든 hook 호출 뒤에서

early return 으로 조건부 렌더링하되 **모든 hook 호출 뒤**에서 한다. hook 호출 순서가 바뀌면 `react-hooks/rules-of-hooks` 위반.

## 조건부 렌더링은 읽기 쉽게 — 삼항 3중 중첩 금지

분기를 삼항 연산자로 2단계 이상 중첩하지 않는다. JSX 안에 중첩 삼항이 쌓이면 어떤 조건에서 무엇이 그려지는지 추적이 어려워진다. early return, 변수로 추출, 혹은 상태→컴포넌트 매핑으로 평탄하게 푼다.

## 컴포넌트 네이밍

PascalCase + 역할이 드러나는 이름. "무엇을 그리는 컴포넌트인지" 이름만 보고 알 수 있어야 한다.

```tsx
ProductCard        ✅  // "상품 카드구나"
Card1              ❌  // "1번 카드? 무슨 카드?"
Comp               ❌  // "컴포넌트? 뭔데?"
ProductCardWrapper ⚠️  // "Wrapper? 뭘 감싸는데?" — 역할이 모호
```

## 이벤트 핸들러 네이밍 — `on~` vs `handle~`

Props 로 받는 콜백은 `on + Event`, 컴포넌트 내부에서 정의하는 함수는 `handle + Event`.

```tsx
interface ButtonProps {
  onClick: () => void       // Props: on~
  onHover?: () => void
}

function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const handleSubmit = () => {     // 내부: handle~
    onSearch(query)                // Props 콜백 호출
  }
}
```

> **왜 구분하는가?** `on~` 을 보면 "외부에서 주입된 콜백이구나", `handle~` 을 보면 "이 컴포넌트가 직접 처리하는 로직이구나" 를 즉시 구분할 수 있다. `handleClick1`, `handleClick2` 처럼 숫자만 붙인 이름은 무엇을 처리하는지 드러나지 않으니 금지.
