---
name: analyze-component
description: React 컴포넌트와 공통 UI API를 디자인 패턴 관점으로 분석한다. Headless, Compound, Controlled/Uncontrolled, Provider vs Singleton, Portal 적용 여부와 리렌더 경로, 책임 범위, 상태 소유권, props/합성 경계, 사용처 코드 단순성을 검토할 때 사용한다. Radix UI, Headless UI, downshift 같은 라이브러리 소스 분석, Dialog/Select/Tabs/Accordion/Toast 설계 리뷰, 커머스 공통 컴포넌트 과제의 패턴 선택 근거 점검에 사용한다.
---

# /analyze-component 컴포넌트 패턴 분석

React 공통 컴포넌트나 라이브러리 구현을 패턴 관점으로 읽는 스킬.
목표는 "어떤 패턴을 썼는가"가 아니라, **그 패턴 덕분에 사용처 코드가 더 단순해졌는가**를 판단하는 것이다.

---

## 절차

1. 분석 대상 파일과 사용 예시를 확인한다. 로컬 코드면 컴포넌트, hook, context/store, story/test, 실제 call site를 함께 읽는다.
2. 컴포넌트의 공개 API를 먼저 적는다. props, children/slot, compound child, controlled prop, callback, imperative 함수가 무엇인지 정리한다.
3. 상태 소유권을 분류한다. 서버 상태, 클라이언트 상태, 파생값, 외부 store 상태를 구분한다.
4. 사용처 코드가 패턴 적용 전보다 단순해졌는지 확인한다. 사용 예시가 없으면 "사용처 판단 보류"로 표시하고 구현만 보고 단정하지 않는다.
5. 아래 패턴 선택 가이드로 실제 요구와 패턴이 맞는지 매핑한다.
6. 리렌더 경로와 책임 범위를 추적한다.
7. 더 단순한 대안이 있으면 함께 비교한다.
8. 문제는 심각도순으로 보고하고, 패턴을 쓰지 않아도 되는 단순 UI는 그대로 두라고 판단한다.

---

## 패턴 선택 가이드

| 상황 | 우선 검토할 패턴 | 핵심 질문 |
| --- | --- | --- |
| 같은 동작 로직을 유지한 채 UI가 완전히 달라진다 | Headless | 로직과 DOM/스타일을 분리하면 사용처가 쉬워지는가? |
| 사용처가 내부 구조를 직접 조합해야 한다 | Compound | 부모-자식 관계와 공유 상태가 API에서 자연스럽게 드러나는가? |
| `open`, `value`, `selected` 같은 상태를 안팎에서 모두 다뤄야 한다 | Controlled/Uncontrolled | 내부 state와 외부 prop 중 단일 출처가 명확한가? |
| 토스트, 확인창처럼 어디서든 호출해야 한다 | Provider vs Singleton | React 트리 스코프가 필요한가, 비-React 코드에서도 불러야 하는가? |
| 부모의 `overflow`, `z-index`, stacking context를 벗어나야 한다 | Portal | 렌더 위치와 상태 소유권을 혼동하지 않았는가? |
| props 3개 이하의 단순 표시 UI다 | 패턴 적용 안 함 | 패턴이 오히려 사용처를 복잡하게 만들지 않는가? |

---

## 리뷰 관점

### 1) 패턴 적합성

- 패턴 선택의 이유가 실제 변경 가능성과 연결되는가?
- 패턴 이름을 맞히는 데서 끝내지 말고, 사용처 코드가 더 읽기 쉬워졌는지 판단하는가?
- Headless는 UI 다양성이 있을 때만 제안한다. 단일 UI를 억지로 hook으로 쪼개지 않는다.
- Compound는 구조 변경 자유도가 필요할 때만 제안한다. 단순 옵션 나열이면 props가 더 낫다.
- Controlled/Uncontrolled 이중 API는 라이브러리형 컴포넌트에 유용하지만, 앱 내부 전용 컴포넌트라면 한 방식만으로 충분할 수 있다.
- Provider와 Singleton은 호출 위치, 스코프, SSR 요청 격리를 함께 비교한다.

### 2) 책임 범위

- 컴포넌트, hook, context/store, service의 책임을 각각 한 문장으로 설명할 수 있는가?
- 한 문장에 "그리고"가 여러 번 들어가면 분리 후보로 본다.
- UI 렌더링과 상태 전이, DOM 이벤트 처리와 도메인 정책이 과하게 섞이지 않았는가?
- API 호출부 순수성 등 책임 분리의 일반 원칙은 CONVENTIONS.md 3장을 기준으로 적용한다.

### 3) 상태 소유권

- controlled prop이 넘어오면 외부 값을 단일 출처로 삼고, 아니면 내부 state를 단일 출처로 삼는가?
- `defaultValue`, `defaultOpen`은 초기값으로만 쓰고 이후 동기화 state로 복제하지 않는가?
- props, URL search param, 서버 응답에서 계산 가능한 값을 별도 state로 복사하지 않았는가?
- 외부 store singleton은 SSR, 테스트 격리, 중복 mount 상황에서 상태가 새지 않는가?

### 4) 리렌더 경로

- 어떤 state 변경이 어떤 컴포넌트 subtree를 다시 렌더하는지 설명할 수 있는가?
- Context value 객체, callback, 배열/객체 파생값이 매 렌더 새로 만들어져 불필요한 전파를 만들지 않는가?
- Headless hook이 반환하는 값이 지나치게 넓어 작은 변경에도 모든 UI가 다시 렌더되지 않는가?
- 외부 store를 쓰면 `useSyncExternalStore` 또는 동등한 구독 방식으로 React와 일관되게 연결되는가?

### 5) API와 합성 경계

- boolean props 조합으로 불가능한 상태가 생기면 union, variant, slot, compound API를 제안한다.
- 정해진 위치에 UI를 끼우는 경우는 slot/ReactNode, 내부 상태를 넘겨 사용처가 렌더를 결정해야 하는 경우는 render prop으로 구분한다.
- Compound child가 부모 context 밖에서 쓰일 때의 에러 메시지나 fallback이 명확한가?
- Portal은 렌더 위치 문제만 해결하고, open 상태나 호출 API의 책임까지 떠안지 않는가?

### 6) 사용처 단순성

- 같은 화면을 구현할 때 사용처가 알아야 하는 상태, 이벤트, DOM 구조가 줄었는가?
- 사용처에서 패턴 내부 규칙을 외워야 한다면 API가 충분히 직관적인지 다시 본다.
- 필수 prop, render prop, compound child가 많아져 기본 사용법이 무거워지면 더 단순한 props API를 대안으로 비교한다.
- 사용처가 1곳뿐이면 추상화 비용이 이득보다 큰지 확인한다.

---

## 결과 형식

```
## Analyze Component 결과

**판정: PASS / NEEDS_WORK** (설계 리뷰 대상일 때만. 라이브러리 소스 학습 분석이면 생략)

### 요약
- {공개 API와 선택된 패턴을 2-3줄로 요약}

### 패턴 매핑
| 영역 | 관찰 | 판단 |
| --- | --- | --- |
| {컴포넌트/API} | {코드에서 본 사실} | {적합/과함/부족} |

### 사용처 단순성
| 사용 시나리오 | 현재 사용처 코드 | 더 단순해진 점 | 남은 부담 |
| --- | --- | --- | --- |
| {예: 기본 Dialog 열기} | {call site/story/test에서 본 형태} | {상태/구조/이벤트가 줄어든 부분} | {사용자가 여전히 알아야 하는 규칙} |

### 대안 비교
| 선택지 | 장점 | 비용 | 판단 |
| --- | --- | --- | --- |
| 현재 패턴 | {장점} | {복잡도} | {유지/수정} |
| 더 단순한 대안 | {장점} | {잃는 유연성} | {채택/보류} |

### 리렌더 경로
| 상태 변경 | 상태 소유자 | 전달/구독 경로 | 다시 렌더되는 범위 | 판단 |
| --- | --- | --- | --- | --- |
| {open 변경} | {내부 state/부모/external store} | {props/context/store} | {subtree} | {괜찮음/개선 필요} |

### 지적 사항
- [blocker] {파일:줄} - {문제} -> {수정 제안}
- [major] {파일:줄} - {문제} -> {수정 제안}
- [minor] {파일:줄} - {문제} -> {수정 제안}

### 유지할 선택
- {패턴을 적용하지 않아도 되는 부분이나 현재 설계를 유지할 근거}

### 질문
- {사람 리뷰어 또는 구현자에게 확인하면 좋은 설계 질문}
```

---

## 판정 기준

- blocker: 상태 소유권 충돌, 잘못된 controlled 구현, Portal/외부 store로 인한 동작 오류처럼 사용자가 겪는 버그가 생김
- major: 패턴 선택이나 책임 경계가 맞지 않아 확장 시 변경 비용이 커질 가능성이 큼
- minor: 이름, props API, 리렌더 범위, 에러 메시지를 다듬으면 좋아짐
