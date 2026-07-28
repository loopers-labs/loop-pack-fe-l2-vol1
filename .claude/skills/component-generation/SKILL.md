---
name: component-generation
description: 재사용 컴포넌트의 공개 API, 상태 소유권을 설계할 때 쓴다. "이 컴포넌트 API 어떻게 설계해?", "compound로 쪼갤까 props로 받을까?", "상태를 밖으로 노출해야 하나?", "controlled/uncontrolled 둘 다 지원", "headless로 동작과 생김새 분리", "한 로직으로 여러 UI 커버", "mode별로 유효한 props가 달라짐" 같은 설계 결정에서 활성화된다.
allowed-tools: Read, Grep, Write
model: opus
---

# Component Generation — 재사용 컴포넌트 API 설계

> 전역 공통 컴포넌트뿐 아니라 **비즈니스(도메인) 공통 컴포넌트**의 공개 API 설계에 쓴다.
> **적용 범위**: 상태를 다루는 모든 재사용 컴포넌트 — Select·Combobox·Menu·Tabs·Accordion·Dialog·Popover·Tooltip·DatePicker·Slider·Table·Form field 등. 아래 결정은 라이브러리·컴포넌트 종류와 무관한 **설계 프레임**이다.
> 예시는 원칙을 보여주는 최소 스케치일 뿐 그대로 본뜨라는 게 아니다 — 논리를 프로젝트 맥락에 맞게 직접 적용하라.

## 핵심 원칙

**의미 있는 상태만 노출하고, 일시적 UI 상태는 숨긴다. 밖에서 관리할 수 있게 열어두되 강제하지 않는다.**

API 크기 = 노출한 상태의 수. 노출을 늘릴수록 소비자가 맞춰야 할 계약이 커진다.

---

## 결정 1 — props 컴포넌트냐, compound 냐

**여러 하위 요소가 한 상태를 공유하나?**

- **아니오** → 그냥 props 컴포넌트. 상태 없는 단순 컴포넌트(Button, Badge)를 compound 로 쪼개지 마라 — 오버엔지니어링.
- **예** → 하위 요소를 children 으로 두고 공유 상태는 Context 로 주입. 거대 config 배열 대신.

**이유**: 레이아웃이 JSX 에 남고 하위 요소별 커스텀 렌더가 자유롭다. config 배열은 커스텀 렌더가 필요한 순간 무너진다. (Tabs·Accordion·Dialog·Menu·RadioGroup 등 "부분들이 한 상태를 공유"하는 모든 컴포넌트에 해당)

```tsx
// ❌ config 배열 — 커스텀 렌더 순간 무너짐
<Tabs items={[{ label, content }]} />

// ✅ compound — 레이아웃은 JSX, 상태는 context
<Tabs>
  <Tabs.List><Tabs.Tab value="a">A</Tabs.Tab></Tabs.List>
  <Tabs.Panel value="a">…</Tabs.Panel>
</Tabs>
```

Context 는 provider 밖에서 소비하면 throw 하는 헬퍼로 만든다. 곳곳의 수동 null 체크보다 실수를 일찍 잡는다.

---

## 결정 2 — 상태를 노출할까 (가장 중요)

| 상태 종류                     | 예                              | 노출?       |
| ----------------------------- | ------------------------------- | ----------- |
| 소비자에게 **의미 있는** 상태 | 선택값, 열림 여부, 입력 텍스트  | ✅ 노출     |
| **일시적 UI** 상태            | 하이라이트, roving focus, hover | ❌ 내부에만 |

판단 기준: **"소비자가 이 값을 저장하거나 되돌릴 이유가 있나?"** → 없으면 숨긴다. 일시적 상태를 노출하면 API 만 커지고 오용을 부른다.

---

## 결정 3 — 노출한다면 controlled·uncontrolled 둘 다

노출하기로 한 축은 소비자가 **두 방식 중 아무거나** 쓰게 한다. 목표는 이 두 사용법을 **하나의 컴포넌트**가 다 받아주는 것 (열림 축·선택 축·입력 축 무엇이든 동일):

```tsx
// uncontrolled — 초기값만 주고 상태 관리는 컴포넌트에 맡긴다 (간단히 쓸 때)
<Switch defaultChecked={false} />

// controlled — 소비자가 상태를 직접 들고 변경을 받는다 (폼 연동·검증·동기화)
<Switch checked={isOn} onCheckedChange={setIsOn} />
```

이걸 가능하게 하는 공개 API 규약 — **축 하나당 prop 3종** (이름만 축에 맞게: `value/defaultValue/onChange`, `open/defaultOpen/onOpenChange` …):

```ts
checked?: boolean;                      // controlled — 있으면 이게 이김
defaultChecked?: boolean;               // uncontrolled 초기값
onCheckedChange?: (v: boolean) => void; // 변경 통지 (실제 바뀔 때만)
```

컴포넌트 내부는 이 3종을 받아 "controlled 면 prop, 아니면 내부 state" 를 고르는 작은 훅으로 처리한다. 이 훅은 **프로젝트 공용 유틸로 한 번만** 만들어 재사용한다 — 컴포넌트마다 이 분기를 손코딩하지 마라.

> **실효값은 매 렌더 계산한다.** controlled prop 을 `useEffect` 로 내부 state 에 동기화하지 마라 — 소스가 둘이 되어 버그난다. 파생 가능한 값은 저장이 아니라 계산이 원칙.

> 노출 축이 **0개면 이 훅도 안 쓴다** — 상태를 숨기기로 했으면 그냥 내부 `useState`.
> 노출 축이 여러 개면 축마다 독립 3종 세트. 의미가 다른 상태(선택값 / 입력 텍스트 / 열림)를 한 축으로 합치는 게 대표적 버그.

---

## 결정 4 — mode 가 타입을 바꾸면 Discriminated Union

mode 에 따라 값 타입이나 유효한 props 가 달라지면 optional props 대신 discriminated union 으로 잘못된 조합을 컴파일 에러로 만든다. (단일/다중 선택, sync/async 로딩, icon-only/labeled 버튼 등)

```ts
type SingleProps = { multiple?: false; value?: string; onChange?: (v: string) => void };
type MultiProps = { multiple: true; value?: string[]; onChange?: (v: string[]) => void };
type Props = SingleProps | MultiProps;
```

`multiple` 이 `value` 의 타입을 바꾼다. 잘못 주면 런타임이 아니라 타입 에러.

---

## 결정 5 — 동작과 생김새 분리 (headless)

같은 동작(열기/닫기·선택·키보드 이동·확장/축소)이 **여러 생김새**로 나와야 하면, 생김새를 `variant` prop 으로 무한 분기하지 말고 **동작만 만들고 생김새는 사용처가 그리게** 한다. 로직은 상태를 노출하고, 스타일 판단은 사용처에 넘긴다. 한 로직이 여러 UI 를 커버한다. (Combobox·Menu·Tabs·Tree·Accordion·DatePicker 등 동작이 반복되는 곳 전반)

- **파생 상태를 읽기 전용으로 노출** — 각 항목/패널의 `selected`/`highlighted`/`expanded`/`disabled` 를 준다. 사용처가 이걸 보고 스타일을 정한다.
- **동작은 스프레드용 prop getter 로** — `getTriggerProps()` / `getItemProps(item)` 가 onClick·onKeyDown·ref·필요한 aria 를 담아 돌려준다. 소비자는 자기 마크업에 **스프레드만** 하면 동작이 붙는다.
- **노출 ≠ 제어** — `highlighted`(활성 항목) 같은 일시적 상태는 _제어 prop 으로는 안 연다_(결정 2). 하지만 headless 에선 소비자가 직접 그려야 하니 **렌더용 읽기 값으로는** 노출한다.
- **value 는 소비자가 쓸 형태로** — id 문자열로 납작하게 주지 말고, 후속 작업(계산·연동)에 필요한 **객체(식별자+페이로드)** 로 노출. 객체를 노출하면 선택 비교는 **참조가 아니라 식별자 필드**로 한다 — 매 렌더 새 배열이면 참조가 깨진다.

```tsx
// 동작 훅은 상태·getter 만 돌려주고, 마크업은 사용처가 그린다 (목록형 컴포넌트 공통 형태)
const { isOpen, selected, items, getItemProps, getItemState } = useCollection({ items });

return items.map((item) => {
  const { selected, highlighted, disabled } = getItemState(item);
  return (
    <li key={item.value} {...getItemProps(item)}>
      {/* 위 상태로 자유롭게 스타일링 */}
    </li>
  );
});
```

---

## 결정 6 — 동작 훅 내부: 순수 코어 + 인프라는 합성

동작을 훅으로 뽑을 때 내부를 두 겹으로 나눈다.

**순수 코어 (직접 설계 = 패턴)** — 상태 전이(리듀서/상태 로직)는 순수 함수로. 컬렉션 목록·DOM·부작용(`onChange`)을 모르게 한다.

- **UI 상태만 전이** — 열림 여부·활성 index 등.
- **목록에 의존하는 계산은 핸들러에서** — 비활성 항목 건너뛰기, 열 때 활성 위치 정하기 등은 핸들러가 계산해 **결과만** 넘긴다. 상태 머신은 목록을 몰라도 된다.
- **부작용은 밖에서** — `onChange` 통지는 리듀서가 아니라 핸들러에서 부른다.

**인프라 (도구 = 합성)** — 위치 계산·Portal·focus trap·스크롤 락·가상 스크롤 같은 **인프라는 직접 짜지 말고** 검증된 도구에 맡긴다. 순수 코어를 **감싸는 합성 훅**으로 더하면 코어가 DOM·좌표를 모르게 유지되고 인프라는 opt-in 이 된다.

경계 질문: **"이게 이 컴포넌트를 특별하게 만드나?"** → 아니면 인프라다. 도구를 써라. 순수 코어는 단독 테스트·재사용이 쉬워진다.

---

## 주의 - 같은 컴포넌트 자기 중첩

같은 컴포넌트를 자기 안에 중첩할 수 있으면(예: 트리, 메뉴 안 서브메뉴, 중첩 Accordion) 단일 Context 는 바깥/안쪽이 서로 간섭한다. 이땐 인스턴스마다 Context 를 격리해야 한다.

**필요할 때만.** 자기 중첩이 실제로 나는 컴포넌트에만. 대부분은 plain Context 로 충분 — 미리 하지 마라.

---

## 흔한 실수

| 실수                                                      | 고침                                         |
| --------------------------------------------------------- | -------------------------------------------- |
| 단순 컴포넌트를 compound 로 과분할                        | 상태 공유 없으면 그냥 props 컴포넌트         |
| controlled/uncontrolled 를 `if(value!==undefined)` 손코딩 | 상태훅으로 통일                              |
| controlled prop 을 `useEffect` 로 내부 state 에 동기화    | 파생값은 매 렌더 계산 — 소스는 하나          |
| 의미가 다른 상태를 한 축으로 합침                         | 축마다 독립 3종 세트                         |
| 일시적 UI 상태(하이라이트·focus)를 제어 prop 으로 노출    | 내부 관리. headless 면 렌더용 읽기 값으로만  |
| 여러 생김새를 `variant` prop 으로 무한 분기               | 동작만 노출하고 생김새는 사용처가 (headless) |
| 상태 전이 로직에 목록 계산·부작용을 섞음                  | 순수 코어는 전이만 / 계산·부작용은 핸들러    |
| 노출값을 id 문자열로 납작하게 (참조로 비교)               | 객체로 노출, 비교는 식별자 필드로            |
| 위치 계산·Portal·스크롤락·focus trap 을 직접 구현         | 인프라는 검증된 도구에 합성으로 얹음         |
| 모든 컴포넌트를 자기중첩 대비해 설계                      | 실제 중첩되는 것만 격리                      |

## 참조

- 폴더 구조·파일 위치·컴포넌트 세부 규칙은 각 프로젝트 컨벤션(예: `.claude/rules/`)을 따른다.
- 공통 원칙: Props 5개 초과 시 설계 재검토 / boolean 은 긍정형(`isOpen`, `hasError`) / 조건부 props 는 Discriminated Union 우선 / 바꾸거나 개선 근거가 없다면 오버엔지니어링을 금지한다.
