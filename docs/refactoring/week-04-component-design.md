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
const select = useSelect({
  items: shippingOptions,
  defaultSelectedItem: shippingOptions[0],
  isItemDisabled: (item) => item.disabled === true,
});

return (
  <div>
    <button {...select.getToggleButtonProps()}>
      {select.selectedItem ? select.selectedItem.label : "배송 선택"}
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

const select = useSelect({
  items: shippingOptions,
  selectedItem: selectedShipping,
  onSelectedItemChange: setSelectedShipping,
  isItemDisabled: (item) => item.disabled === true,
});
```

Downshift는 `itemToString`을 통해 item의 문자열 표현을 받지만, 이번 구현에서는 사용처가 selected label과 option UI를 직접 렌더링한다. 따라서 hook API에는 실제로 사용하지 않는 `itemToString`을 두지 않는다.

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
- public `selectItem` 호출에서도 disabled option 선택 방지
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

## Dialog 설계

### 과제 요구사항 요약

4주차 Dialog 과제의 핵심은 **compound 조립**과 **controlled/uncontrolled 이중 API**다.

- `Dialog.Root`, `Dialog.Trigger`, `Dialog.Overlay`, `Dialog.Content`, `Dialog.Title`, `Dialog.Description`, `Dialog.Close` 형태로 조립한다.
- `open`, `onOpenChange`를 넘기면 controlled로 동작한다.
- `open`을 넘기지 않으면 uncontrolled로 동작하고 내부에서 열림 상태를 관리한다.
- `Overlay`와 `Content`는 Portal로 렌더한다.
- Escape 키와 overlay click으로 닫을 수 있어야 한다.
- Dialog가 열려 있는 동안 배경 스크롤을 잠근다.
- 이번 과제에서는 포커스 트랩, 포커스 복원, 초기 포커스, ARIA 세부 구현은 다루지 않는다.

### 레퍼런스 분석: Radix Dialog

Dialog 레퍼런스는 Radix UI Dialog다. Radix Dialog는 `Root`가 상태와 공통 참조값을 Context로 제공하고, 하위 compound 컴포넌트가 이 Context를 소비하는 구조다.

Radix에서 참고할 핵심 구조는 다음과 같다.

| Radix 요소      | 참고할 점                                                                 |
| --------------- | ------------------------------------------------------------------------- |
| `Dialog`        | open 상태를 controlled/uncontrolled로 관리하고 Context Provider를 감싼다. |
| `DialogTrigger` | Context의 `onOpenToggle`을 호출해 Dialog를 연다.                          |
| `DialogPortal`  | overlay/content를 DOM 상위 계층으로 렌더한다.                             |
| `DialogOverlay` | 배경 클릭, 시각적 dim 영역을 담당한다.                                    |
| `DialogContent` | 실제 Dialog 본문을 담당한다.                                              |
| `DialogClose`   | Context의 `onOpenChange(false)`를 호출한다.                               |

Radix 원본은 `FocusScope`, `DismissableLayer`, `RemoveScroll`, `aria-hidden`, focus guard, `Slot` 기반 `asChild` 등 접근성과 DOM edge case를 위한 모듈도 함께 사용한다. 하지만 과제 문서에서 포커스 관리와 ARIA는 범위 밖이라고 명시했기 때문에, 이번 구현에서는 Radix의 전체 기능이 아니라 **상태 관리, Context 조립, Portal 렌더링, Slot/Primitive 기반 asChild 방식**만 참고한다.

### 패턴 선택

Dialog는 **Compound Component + Context** 방식으로 설계한다.

| 판단 기준                                           | 선택한 방식        | 근거                                                                      |
| --------------------------------------------------- | ------------------ | ------------------------------------------------------------------------- |
| 여러 조각을 선언적으로 조립해야 한다                | Compound Component | `Trigger`, `Overlay`, `Content`, `Close`가 하나의 Dialog 상태를 공유한다. |
| 하위 컴포넌트가 open 상태와 닫기 함수를 알아야 한다 | Context            | props drilling 없이 하위 조각이 같은 Dialog 상태에 접근한다.              |
| 부모가 Dialog open 상태를 제어할 수 있어야 한다     | controlled 지원    | 결제 확인, 삭제 확인처럼 외부 상태와 연결할 수 있다.                      |
| 단순 사용처에서는 내부 상태만으로 충분하다          | uncontrolled 지원  | `Dialog.Root`만 감싸도 기본 열기/닫기가 가능해야 한다.                    |
| overlay/content가 부모 layout에 갇히면 안 된다      | Portal             | stacking context, overflow, z-index 문제를 줄인다.                        |
| 사용처가 실제 DOM 태그를 바꿀 수 있어야 한다        | `asChild`          | 버튼, 링크, 섹션, 제목 태그를 사용처 의미에 맞게 선택할 수 있다.          |

### 예상 API

기본 사용처는 uncontrolled 방식이다.

```tsx
<Dialog.Root>
  <Dialog.Trigger>구매하기</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>주문을 진행할까요?</Dialog.Title>
      <Dialog.Description>선택한 옵션으로 결제를 진행합니다.</Dialog.Description>
      <Dialog.Close>취소</Dialog.Close>
      <button type="button">확인</button>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

외부 상태와 연결해야 할 때는 controlled 방식으로 사용한다.

```tsx
const [open, setOpen] = useState(false);

return (
  <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger>배송지 변경</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay />
      <Dialog.Content>
        <Dialog.Title>배송지 변경</Dialog.Title>
        <Dialog.Description>새 배송지를 선택해 주세요.</Dialog.Description>
        <Dialog.Close>닫기</Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
```

`asChild`가 필요한 경우에는 Dialog 조각이 직접 DOM을 만들지 않고, 자식 element에 동작 props를 주입한다.

```tsx
<Dialog.Root>
  <Dialog.Trigger asChild>
    <button type="button">쿠폰 적용</button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay asChild>
      <div className="dialog-overlay" />
    </Dialog.Overlay>
    <Dialog.Content asChild>
      <section className="dialog-content">
        <Dialog.Title asChild>
          <h3>쿠폰을 적용할까요?</h3>
        </Dialog.Title>
        <Dialog.Description asChild>
          <p>선택한 쿠폰을 주문에 반영합니다.</p>
        </Dialog.Description>
        <Dialog.Close asChild>
          <button type="button">닫기</button>
        </Dialog.Close>
      </section>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Controlled / Uncontrolled 판별

`Dialog.Root`는 `open` prop의 유무로 controlled 여부를 판별한다.

| 상태           | 제어 방식                         | 근거                                                                     |
| -------------- | --------------------------------- | ------------------------------------------------------------------------ |
| `open`         | controlled / uncontrolled 지원    | 외부 플로우와 연결될 수도 있고 단순 Dialog 내부 상태로 충분할 수도 있다. |
| `onOpenChange` | controlled/uncontrolled 모두 호출 | 상태 변경 알림은 두 방식 모두에서 유용하다.                              |

구현 기준은 다음과 같다.

- `open !== undefined`이면 controlled로 본다.
- controlled일 때는 내부 state를 변경하지 않고 `onOpenChange(nextOpen)`만 호출한다.
- uncontrolled일 때는 내부 state를 변경하고, 추가로 `onOpenChange(nextOpen)`도 호출할 수 있다.
- `defaultOpen`은 uncontrolled 초기값으로만 사용한다.

### Root가 책임지는 것

`Dialog.Root`는 다음 책임을 가진다.

- controlled/uncontrolled open 상태 계산
- open 상태 변경 함수 제공: `onOpenChange`
- 열림 토글 함수 제공: `onOpenToggle`
- 하위 compound 컴포넌트가 사용할 Context Provider 제공
- Dialog가 열렸을 때 body scroll lock 처리

### 하위 컴포넌트가 책임지는 것

각 compound 컴포넌트는 Context를 읽고 자기 역할만 수행한다.

| 컴포넌트             | 책임                                                                            |
| -------------------- | ------------------------------------------------------------------------------- |
| `Dialog.Trigger`     | 클릭 시 Dialog를 연다.                                                          |
| `Dialog.Overlay`     | Portal로 dim 영역을 렌더하고 클릭 시 닫는다.                                    |
| `Dialog.Content`     | Portal로 본문 영역을 렌더하고 내부 클릭이 overlay click으로 전파되지 않게 한다. |
| `Dialog.Title`       | 제목 마크업을 제공한다.                                                         |
| `Dialog.Description` | 설명 마크업을 제공한다.                                                         |
| `Dialog.Close`       | 클릭 시 Dialog를 닫는다.                                                        |

### asChild 구현 전략

Radix의 `asChild`는 컴포넌트가 기본 DOM을 렌더링하는 대신, 사용자가 넘긴 child element를 실제 DOM으로 사용하게 해주는 API다. 예를 들어 `Dialog.Trigger`는 기본적으로 `button`을 렌더링하지만, `asChild`를 사용하면 사용처가 직접 만든 `button`이나 링크에 Dialog 열기 동작을 붙일 수 있다.

이번 구현에서는 이를 위해 `Primitive`와 `Slot`을 나누었다.

| 모듈        | 책임                                                                             |
| ----------- | -------------------------------------------------------------------------------- |
| `Primitive` | `button`, `div`, `h2`, `p` 기본 태그를 렌더하거나 `asChild`면 `Slot`에 위임한다. |
| `Slot`      | 단일 child element를 검사하고, Dialog가 제공한 props를 child에 병합한다.         |

`Slot`은 현재 과제 범위에 맞춰 다음 병합만 처리한다.

- `className`
- `style`
- `onClick`

`onClick`은 child handler를 먼저 실행하고, `event.preventDefault()`가 호출되지 않은 경우에만 Dialog 내부 handler를 실행한다. 이 방식은 사용처가 기본 동작을 막을 수 있게 해준다.

이번 과제에서는 `ref` compose, `onKeyDown` 병합, ARIA 자동 연결까지 구현하지 않는다. Radix 수준의 범용 Slot을 만드는 것이 목적이 아니라, compound 조각의 DOM 의미를 사용처가 바꿀 수 있는 최소 구조를 이해하는 것이 목적이기 때문이다.

### Portal 구현 전략

`Dialog.Portal`은 `createPortal`을 사용해 자식으로 받은 overlay와 content를 `document.body` 아래에 렌더한다.

이 방식은 사용처 JSX 구조는 compound 형태를 유지하면서도, 실제 DOM은 layout/overflow/z-index 영향을 덜 받는 위치에 생성한다.

```tsx
return createPortal(children, document.body);
```

Next App Router 환경이므로 Dialog 구현 파일은 client component여야 한다. `document.body` 접근은 브라우저 환경에서만 가능하므로, `open`이 아닐 때는 `null`을 반환하고 열린 상태에서 Portal을 만든다.

### 닫기 동작

닫기 동작은 모두 `onOpenChange(false)`로 수렴시킨다.

- `Dialog.Close` click
- `Dialog.Overlay` click
- Escape keydown

`Dialog.Content` 내부 click은 overlay click으로 전파되지 않도록 막는다. 이렇게 하면 overlay click은 닫기 동작이지만 content 내부 버튼이나 입력 조작은 닫기 동작이 아니다.

사용자가 넘긴 `onClick`과 Dialog 내부 닫기 handler는 `composeEventHandlers`로 합성한다. 사용처 handler가 `event.preventDefault()`를 호출하면 내부 닫기 동작은 실행하지 않는다.

### Scroll lock 구현 전략

Dialog가 열리면 `document.body.style.overflow = "hidden"`으로 배경 스크롤을 잠근다. 이때 스크롤바가 사라지며 레이아웃이 흔들릴 수 있으므로, 스크롤바 너비만큼 `body`의 `padding-right`를 보정한다.

닫힐 때는 이전 `overflow`, `padding-right` 값을 복원한다. Nested Dialog나 여러 Dialog가 동시에 열리는 경우까지는 이번 과제 범위에서 다루지 않는다.

### 구현 범위

이번 Dialog에서 구현할 범위는 다음으로 제한한다.

- `Dialog.Root`
- `Dialog.Trigger`
- `Dialog.Portal`
- `Dialog.Overlay`
- `Dialog.Content`
- `Dialog.Title`
- `Dialog.Description`
- `Dialog.Close`
- `Primitive`
- `Slot`
- controlled/uncontrolled open 상태
- Portal 렌더링
- Escape 닫기
- overlay click 닫기
- body scroll lock과 scrollbar layout shift 보정
- `asChild` 지원
- uncontrolled 예시, controlled 예시, asChild 예시

### 구현하지 않는 범위

아래 항목은 이번 과제의 핵심이 아니므로 구현하지 않는다.

- Focus trap
- Focus restore
- Initial focus
- `aria-labelledby`, `aria-describedby` 자동 연결
- `aria-hidden` 처리
- Nested Dialog
- Animation presence 제어
- Non-modal Dialog
- 범용 `ref` compose
- 모든 이벤트 핸들러 merge
- 오른쪽 클릭, trigger 재클릭, Safari focus edge case 등 Radix 수준의 dismissable layer 세부 처리

### 설계 근거

Select는 같은 선택 로직을 여러 UI에 적용해야 했으므로 hook 기반 headless API가 적절했다. 반면 Dialog는 여러 조각이 하나의 open 상태를 공유하며 조립되는 구조이므로 compound component가 더 적절하다.

Radix Dialog는 production-grade 접근성과 포커스 처리를 포함하지만, 이번 과제는 compound 조립과 controlled/uncontrolled API를 직접 이해하는 것이 목적이다. 따라서 Radix의 내부 구조 중 `Root -> Context -> Trigger/Portal/Overlay/Content/Close`로 이어지는 상태 흐름을 차용하고, 포커스와 접근성 edge case 처리는 과제 범위 밖으로 둔다.

`asChild`는 Dialog 조각이 항상 정해진 태그만 렌더링하는 문제를 줄이기 위해 추가했다. `Trigger`와 `Close`는 버튼을 기본값으로 두되, 사용처가 이미 가진 버튼 컴포넌트를 그대로 사용할 수 있다. `Overlay`, `Content`, `Title`, `Description`도 `Primitive`를 통해 같은 패턴을 공유한다. 다만 이번 구현의 `Slot`은 학습용 최소 구현이므로 Radix처럼 모든 prop, ref, 접근성 edge case를 처리하지 않는다.

### 검증 기준

- `Dialog.Trigger` click으로 Dialog가 열린다.
- `Dialog.Close` click으로 Dialog가 닫힌다.
- overlay click으로 Dialog가 닫힌다.
- Escape keydown으로 Dialog가 닫힌다.
- Dialog가 열려 있는 동안 body scroll이 잠긴다.
- `Dialog.Overlay`와 `Dialog.Content`가 Portal로 렌더된다.
- `open`, `onOpenChange`를 넘긴 controlled 사용처가 동작한다.
- `defaultOpen` 또는 내부 상태를 사용하는 uncontrolled 사용처가 동작한다.
- `Dialog.Trigger`, `Dialog.Overlay`, `Dialog.Content`, `Dialog.Title`, `Dialog.Description`, `Dialog.Close`가 `asChild`로 child element에 동작 props를 주입할 수 있다.
