# Week 04 Component Design Notes

## Select 설계

### 과제 요구사항 요약

4주차 Select 과제의 핵심은 "생김새"가 아니라 "동작"을 직접 설계하는 것이다.

- 네이티브 `select`나 외부 라이브러리를 사용하지 않는다.
- `value`는 문자열이 아니라 옵션 객체 전체를 다룬다.
- 열기/닫기, 선택값, 키보드 이동, 품절 옵션 스킵 로직은 한 벌로 유지한다.
- 옵션 UI는 텍스트, 사이즈, 썸네일처럼 사용처가 자유롭게 그릴 수 있어야 한다.
- 사용처는 각 옵션의 `selected`, `highlighted`, `disabled` 상태를 알 수 있어야 한다.

### 패턴 선택

Select는 **Headless + Compound + 최소 Collection** 조합으로 설계한다.

| 판단 기준                                              | 선택한 패턴     | 근거                                                                                               |
| ------------------------------------------------------ | --------------- | -------------------------------------------------------------------------------------------------- |
| 같은 로직으로 서로 다른 UI를 2곳 이상 그려야 한다      | Headless        | 텍스트 옵션, 사이즈 옵션, 썸네일 옵션이 모두 같은 선택 로직을 사용해야 한다.                       |
| 사용처가 구조와 생김새를 바꾸고 싶다                   | Compound        | `Trigger`, `Value`, `Content`, `Item`을 조립해 사용처가 구조를 제어할 수 있게 한다.                |
| 옵션이 어디에 렌더되더라도 키보드 이동 기준이 필요하다 | 최소 Collection | `Item`의 option, disabled, ref 정보를 내부 registry에 모아 키보드 이동과 disabled skip에 사용한다. |

### Headless로 가져가는 책임

Select 내부는 옵션 UI를 직접 정하지 않는다. 대신 다음 동작과 상태만 책임진다.

- 열기/닫기 상태
- 선택된 옵션 객체
- 현재 하이라이트된 옵션
- 방향키 이동
- Enter 선택
- Escape 닫기
- disabled 옵션 클릭/선택 방지
- disabled 옵션 키보드 이동 스킵

사용처는 `Select.Item`이 넘겨주는 상태를 기준으로 UI를 직접 그린다.

```tsx
<Select.Item option={option}>
  {({ option, selected, highlighted, disabled }) => (
    <div className={highlighted ? "highlighted" : ""}>
      <span>{option.label}</span>
      {selected && <span>선택됨</span>}
      {disabled && <span>품절</span>}
    </div>
  )}
</Select.Item>
```

이 구조에서는 Select가 옵션이 텍스트인지, 사이즈 칩인지, 썸네일 카드인지 알 필요가 없다.

### Compound로 가져가는 책임

Select는 하나의 컴포넌트에 모든 props를 몰아넣지 않고, 역할별 하위 컴포넌트로 조립한다.

```tsx
<Select.Root value={selectedOption} onValueChange={setSelectedOption}>
  <Select.Trigger>
    <Select.Value placeholder="옵션 선택" />
  </Select.Trigger>

  <Select.Content>
    {options.map((option) => (
      <Select.Item key={option.id} option={option}>
        {({ option, selected, highlighted, disabled }) => <div>{option.label}</div>}
      </Select.Item>
    ))}
  </Select.Content>
</Select.Root>
```

각 컴포넌트의 책임은 다음과 같이 둔다.

| 컴포넌트         | 책임                                                                         |
| ---------------- | ---------------------------------------------------------------------------- |
| `Select.Root`    | value, open, highlighted option 상태와 context를 제공한다.                   |
| `Select.Trigger` | 클릭과 키보드 입력으로 Select를 열고 닫는 진입점이다.                        |
| `Select.Value`   | 현재 선택된 옵션을 표시한다.                                                 |
| `Select.Content` | 열린 상태에서 옵션 목록을 렌더한다.                                          |
| `Select.Item`    | 옵션 하나의 selected, highlighted, disabled 상태를 계산해 사용처에 노출한다. |

### 최소 Collection을 두는 이유

Radix Select는 `createCollection`으로 흩어진 `Item`들의 metadata를 수집한다. `Item`이 `Group`, `Label`, `Separator` 사이에 있어도 키보드 이동과 typeahead 검색이 동작해야 하기 때문이다.

이번 과제에서는 Radix 수준의 범용 Collection을 그대로 구현하지 않는다. 대신 학습 목적에 맞춰 `Item` 등록/해제와 키보드 이동에 필요한 최소 Collection만 둔다.

Collection에는 다음 정보만 저장한다.

- option 객체
- disabled 여부
- item id
- item ref

Collection은 렌더링 상태가 아니라 내부 registry이므로 `useRef` 기반으로 관리한다. `Item` 등록/해제가 UI를 직접 바꾸는 상태가 아니기 때문에, 등록 시마다 불필요한 리렌더링을 만들지 않기 위함이다.

```ts
type SelectCollectionItem<Option> = {
  id: string;
  option: Option;
  disabled: boolean;
  ref: React.RefObject<HTMLElement | null>;
};
```

키보드 이동은 Collection에서 disabled가 아닌 item만 읽어서 처리한다.

```ts
const enabledItems = getItems().filter((item) => !item.disabled);
```

### 구현 범위

이번 Select에서 구현할 범위는 다음으로 제한한다.

- `Root`, `Trigger`, `Value`, `Content`, `Item`
- controlled value: `value`, `onValueChange`
- 내부 open 상태
- 내부 highlighted option 상태
- Item render prop
- 클릭 선택
- 키보드 열기/이동/선택/닫기
- disabled 옵션 선택 방지
- disabled 옵션 키보드 이동 스킵
- 텍스트 옵션, 사이즈 옵션, 썸네일 옵션 예제

### 구현하지 않는 범위

아래 항목은 이번 과제의 핵심이 아니므로 구현하지 않는다.

- Popper 위치 계산
- `@floating-ui/react` 연동
- Portal
- Typeahead 검색
- Group, Label, Separator 전용 컴포넌트
- Native select fallback
- Form submit 연동
- Focus trap

위치 계산은 과제 안내에서도 직접 구현 대상이 아니라고 되어 있으므로 인라인 펼침으로 처리한다.

### 설계 근거

Select는 열기/닫기, 선택값, 키보드 이동, disabled skip 로직은 공통이지만 옵션 UI는 텍스트, 사이즈, 썸네일로 달라져야 한다. 따라서 Select 내부는 동작과 상태만 관리하고, 사용처가 `selected`, `highlighted`, `disabled` 상태를 받아 UI를 직접 그릴 수 있도록 Headless하게 설계한다.

또한 `Trigger`, `Value`, `Content`, `Item`은 하나의 Select 상태를 공유하면서도 사용처가 구조를 조립해야 하므로 Compound 구조를 사용한다. Item이 어디에 렌더되더라도 키보드 이동 기준을 일관되게 유지하기 위해 내부에는 최소 Collection registry를 둔다.

### 검증 기준

- 클릭으로 Select가 열리고 닫힌다.
- ArrowDown, ArrowUp으로 옵션 하이라이트가 이동한다.
- Enter로 하이라이트된 옵션 객체가 선택된다.
- Escape로 목록이 닫힌다.
- disabled 옵션은 클릭해도 선택되지 않는다.
- disabled 옵션은 키보드 이동에서 건너뛴다.
- 사용처에서 `selected`, `highlighted`, `disabled` 상태를 기준으로 옵션 UI를 다르게 그릴 수 있다.
- 텍스트 옵션, 사이즈 옵션, 썸네일 옵션이 같은 Select 로직으로 렌더된다.
