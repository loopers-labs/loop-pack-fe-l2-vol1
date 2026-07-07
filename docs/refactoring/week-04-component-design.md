# Week 04 Component Design Notes

## Select 설계

### 과제 요구사항 요약

4주차 Select 과제의 핵심은 "생김새"가 아니라 "동작"을 직접 설계하는 것이다.

- 네이티브 `select`나 외부 라이브러리를 사용하지 않는다.
- `value`는 문자열이 아니라 옵션 객체 전체를 다룬다.
- 열기/닫기, 선택값, 키보드 이동, 품절 옵션 스킵 로직은 한 벌로 유지한다.
- 옵션 UI는 텍스트, 사이즈, 썸네일처럼 사용처가 자유롭게 그릴 수 있어야 한다.
- 사용처는 각 옵션의 `selected`, `highlighted`, `disabled` 상태를 알 수 있어야 한다.

### 레퍼런스 분석: Downshift `useSelect`

과제 문서의 Select 레퍼런스는 Downshift `useSelect`와 Headless UI `Listbox`다. 멘토 피드백 기준으로는 컴파운드 컴포넌트보다 Downshift처럼 **로직을 hook으로 제공하는 방식**이 더 과제 의도에 가깝다고 판단했다.

Downshift `useSelect`의 핵심 구조는 다음과 같다.

```ts
const { isOpen, selectedItem, highlightedIndex, getToggleButtonProps, getMenuProps, getItemProps } =
  useSelect({ items });
```

Downshift는 `Root`, `Trigger`, `Content`, `Item` 같은 컴포넌트를 제공하지 않는다. 대신 hook이 상태와 prop getter를 반환하고, 사용처가 직접 DOM 구조와 UI를 그린다.

| Downshift 요소         | 역할                                         |
| ---------------------- | -------------------------------------------- |
| `items`                | 키보드 이동과 선택의 기준이 되는 option 배열 |
| `selectedItem`         | 선택된 option 객체                           |
| `highlightedIndex`     | 현재 하이라이트된 option index               |
| `getToggleButtonProps` | trigger에 필요한 이벤트/접근성 props 제공    |
| `getMenuProps`         | listbox/menu에 필요한 props 제공             |
| `getItemProps`         | option item에 필요한 이벤트/상태 props 제공  |
| `isItemDisabled`       | disabled option 판별                         |

Downshift 원본도 Item을 자식 컴포넌트로 수집하는 Collection 방식이 아니라, 사용처가 넘긴 `items` 배열과 `getItemProps({ item, index })`를 기준으로 동작한다.

### 패턴 선택

Select는 **Headless Hook + Prop Getter** 방식으로 설계한다.

| 판단 기준                                         | 선택한 방식      | 근거                                                                   |
| ------------------------------------------------- | ---------------- | ---------------------------------------------------------------------- |
| 같은 로직으로 서로 다른 UI를 2곳 이상 그려야 한다 | Headless Hook    | 텍스트, 사이즈, 썸네일 UI가 같은 선택 로직을 공유한다.                 |
| 사용처가 마크업과 스타일을 직접 정해야 한다       | Prop Getter      | hook은 동작 props만 제공하고 button/list/item UI는 사용처가 그린다.    |
| option 객체 전체를 value로 다뤄야 한다            | Generic item     | `selectedItem`과 `onSelectedItemChange`가 option 객체를 그대로 다룬다. |
| disabled option을 키보드 이동에서 제외해야 한다   | `isItemDisabled` | hook 내부 이동 로직이 disabled item을 건너뛴다.                        |

### Compound 구조를 선택하지 않는 이유

초기에는 `Select.Root`, `Select.Trigger`, `Select.Content`, `Select.Item` 조합을 고려했다. 하지만 이번 과제의 핵심 문장은 "로직 한 벌, 생김새는 사용처가"에 가깝고, 레퍼런스도 Downshift `useSelect`다.

Compound 구조는 Select의 조립 형태를 제공한다는 장점이 있지만, 이번 과제에서는 다음 이유로 hook 방식이 더 적절하다.

- 사용처가 button, list, item 구조를 더 자유롭게 바꿀 수 있다.
- 텍스트 옵션, 사이즈 옵션, 썸네일 옵션의 마크업 차이를 hook 바깥에서 명확히 드러낼 수 있다.
- option 목록은 이미 `items` 배열로 존재하므로 자식 `Item`을 수집하는 Collection registry가 필요하지 않다.
- 키보드 이동과 disabled skip은 `items` 배열과 index 기준으로 처리하는 편이 더 단순하다.

### 예상 API

`useSelect`는 option 타입을 generic으로 받는다.

```ts
type UseSelectParams<Item> = {
  items: Item[];
  itemToString: (item: Item | null) => string;
  isItemDisabled?: (item: Item, index: number) => boolean;

  selectedItem?: Item | null;
  defaultSelectedItem?: Item | null;
  onSelectedItemChange?: (item: Item) => void;
};
```

반환값은 상태와 prop getter로 나눈다.

```ts
type UseSelectReturn<Item> = {
  isOpen: boolean;
  selectedItem: Item | null;
  highlightedIndex: number;
  getToggleButtonProps: () => React.ButtonHTMLAttributes<HTMLButtonElement>;
  getMenuProps: () => React.HTMLAttributes<HTMLUListElement>;
  getItemProps: (params: { item: Item; index: number }) => React.LiHTMLAttributes<HTMLLIElement>;
  getItemState: (params: { item: Item; index: number }) => {
    selected: boolean;
    highlighted: boolean;
    disabled: boolean;
  };
};
```

기본 사용처는 uncontrolled 방식으로 시작한다. Downshift 기본 예제처럼 `selectedItem`을 외부에서 주입하지 않으면 hook이 선택 상태를 내부에서 관리한다.

```tsx
const itemToString = (item: ShippingOption | null) => item?.label ?? "";

const select = useSelect({
  items: shippingOptions,
  defaultSelectedItem: shippingOptions[0],
  itemToString,
  isItemDisabled: (item) => item.disabled === true,
});

return (
  <div>
    <button {...select.getToggleButtonProps()}>
      {select.selectedItem ? itemToString(select.selectedItem) : "배송 선택"}
    </button>

    <ul {...select.getMenuProps()}>
      {select.isOpen &&
        shippingOptions.map((item, index) => {
          const state = select.getItemState({ item, index });

          return (
            <li key={item.id} {...select.getItemProps({ item, index })}>
              <div className={state.highlighted ? "highlighted" : ""}>{item.label}</div>
            </li>
          );
        })}
    </ul>
  </div>
);
```

선택값을 가격 계산, 주문 payload, 다른 컴포넌트와 동기화해야 하는 경우에는 controlled 방식으로 사용한다.

```tsx
const [selectedShipping, setSelectedShipping] = useState(shippingOptions[0]);
const itemToString = (item: ShippingOption | null) => item?.label ?? "";

const select = useSelect({
  items: shippingOptions,
  selectedItem: selectedShipping,
  onSelectedItemChange: setSelectedShipping,
  itemToString,
  isItemDisabled: (item) => item.disabled === true,
});
```

### Controlled / Uncontrolled 범위

`useSelect`는 선택값에 대해서만 controlled와 uncontrolled를 모두 지원한다.

| 상태               | 제어 방식                      | 근거                                                                                                                    |
| ------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `selectedItem`     | controlled / uncontrolled 지원 | 가격, 배송비, 주문 payload 등에 필요할 수 있으므로 외부 제어가 가능해야 한다. 단순 UI에서는 내부 상태만으로도 충분하다. |
| `isOpen`           | 내부 상태                      | 열림 상태는 Select의 일시적 상호작용 상태이며 이번 과제의 핵심 요구가 아니다.                                           |
| `highlightedIndex` | 내부 상태                      | 키보드 이동 중에만 필요한 일시적 상호작용 상태이므로 외부 제어를 열지 않는다.                                           |

사용 기준은 다음과 같다.

- 선택값으로 가격 계산, 배송비 계산, API payload 구성, 다른 컴포넌트 동기화를 해야 하면 controlled로 사용한다.
- 선택값이 Select 내부 UI에서만 필요하거나 데모/단순 설정처럼 부모가 매번 알 필요가 없으면 uncontrolled로 사용한다.
- 두 방식 모두 선택이 바뀌면 `onSelectedItemChange`를 호출할 수 있다.

### Hook이 책임지는 것

`useSelect`는 다음 동작만 책임진다.

- 열기/닫기 상태
- 선택된 option 객체
- 현재 하이라이트된 index
- trigger click
- ArrowDown / ArrowUp 이동
- Enter 선택
- Escape 닫기
- disabled option 클릭 방지
- disabled option 키보드 이동 스킵
- item state 계산: `selected`, `highlighted`, `disabled`

### 사용처가 책임지는 것

사용처는 다음 표현을 직접 결정한다.

- trigger 마크업과 선택값 표시 방식
- menu/list 마크업
- option item 마크업
- 텍스트 옵션, 사이즈 옵션, 썸네일 옵션의 생김새
- `selected`, `highlighted`, `disabled` 상태에 따른 className

이렇게 하면 Select hook은 option이 배송 옵션인지, 사이즈 옵션인지, 썸네일 상품인지 알 필요가 없다.

### 구현 범위

이번 Select에서 구현할 범위는 다음으로 제한한다.

- `useSelect` hook
- selected value controlled/uncontrolled 지원: `selectedItem`, `defaultSelectedItem`, `onSelectedItemChange`
- 내부 open 상태
- 내부 highlighted index 상태
- `getToggleButtonProps`
- `getMenuProps`
- `getItemProps`
- `getItemState`
- `isItemDisabled` 기반 disabled skip
- 텍스트 옵션, 사이즈 옵션, 썸네일 옵션 예제

### 구현하지 않는 범위

아래 항목은 이번 과제의 핵심이 아니므로 구현하지 않는다.

- Popper 위치 계산
- `@floating-ui/react` 연동
- Portal
- Typeahead 검색
- PageUp / PageDown / Home / End
- aria live message
- Form submit 연동
- Focus trap

위치 계산은 과제 안내에서도 직접 구현 대상이 아니라고 되어 있으므로 인라인 펼침으로 처리한다.

### 설계 근거

이번 Select는 컴포넌트 조립 구조를 제공하는 것보다, 선택 로직을 hook으로 분리하고 사용처가 UI를 직접 그리게 하는 것이 과제 의도에 더 맞다고 판단했다. Downshift `useSelect`처럼 `items` 배열을 기준으로 상태와 prop getter를 제공하면, 같은 로직으로 텍스트 옵션, 사이즈 옵션, 썸네일 옵션을 모두 렌더할 수 있다.

또한 option 객체 전체를 `selectedItem`으로 다루기 때문에 가격, 배송비, 썸네일 같은 도메인 필드를 사용처에서 타입 안전하게 사용할 수 있다. disabled 여부는 `isItemDisabled`로 hook에 전달하고, hook은 키보드 이동과 선택 로직에서 disabled item을 제외한다.

선택값은 커머스 화면에서 가격과 주문 데이터에 연결될 수 있으므로 controlled 사용을 지원한다. 동시에 hook 자체는 범용 UI 로직이므로 `defaultSelectedItem` 기반 uncontrolled 사용도 지원한다. 다만 `isOpen`과 `highlightedIndex`는 Select 내부 상호작용 상태에 가깝고 이번 과제의 핵심 요구가 아니므로 내부 상태로 제한한다.

### 검증 기준

- 클릭으로 Select가 열리고 닫힌다.
- ArrowDown, ArrowUp으로 옵션 하이라이트가 이동한다.
- Enter로 하이라이트된 option 객체가 선택된다.
- Escape로 목록이 닫힌다.
- disabled option은 클릭해도 선택되지 않는다.
- disabled option은 키보드 이동에서 건너뛴다.
- 사용처에서 `selected`, `highlighted`, `disabled` 상태를 기준으로 옵션 UI를 다르게 그릴 수 있다.
- 텍스트 옵션, 사이즈 옵션, 썸네일 옵션이 같은 `useSelect` 로직으로 렌더된다.
