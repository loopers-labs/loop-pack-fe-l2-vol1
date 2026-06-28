# 컴포넌트 설계 & Props 전략

> `.claude/rules/component-design.md`가 가리키는 근거 문서. 컴포넌트·Props를 설계할 때 읽고, 상황에 맞게 적용한다. 각 판단의 "왜"를 Before/After로 보여준다.
>
> 전제: 컴포넌트는 **"재사용 가능하게" 만들기 전에 "읽기 쉽게"** 만드는 것이 먼저다.

## Props는 적을수록 좋다

Props가 많아지면 사용하는 쪽에서 "어떤 조합이 유효한지" 읽어낼 수 없다. Props를 늘리는 대신 `children`으로 합성한다.

```tsx
// ❌ Props 10개 — 유효한 조합을 읽을 수 없다
<Card
  title={title} subtitle={subtitle} image={image}
  badge={badge} badgeColor={badgeColor}
  onClick={onClick} onHover={onHover}
  isNew={isNew} isSoldOut={isSoldOut} isLiked={isLiked}
/>
// badge가 없으면 badgeColor는 무시되나? isNew와 isSoldOut이 동시에 true면?
// onHover 없이 onClick만 있어도 되나? — 타입만 봐선 알 수 없다.

// ✅ Composition — 필요한 것만 조합하므로 유효 조합이 곧 코드다
<Card onClick={onClick}>
  <Card.Image src={image} />
  <Card.Badge variant={isNew ? 'new' : 'default'}>{badge}</Card.Badge>
  <Card.Title>{title}</Card.Title>
  <Card.Price value={price} />
</Card>
// Badge가 필요 없으면 그 줄을 안 쓴다. 좋아요 버튼이 필요하면 children에 <LikeButton/>을 더한다.
```

### Props 개수의 경험적 기준

| Props 수 | 판단      | 대응                                |
| -------- | --------- | ----------------------------------- |
| 1~3개    | ✅ 깔끔   | 유지                                |
| 4~5개    | ⚠️ 주의   | 관련 Props를 객체로 그룹화 검토     |
| 6개 이상 | ❌ 재설계 | Composition 패턴 또는 컴포넌트 분리 |

절대 기준은 아니다. HTML 속성을 그대로 넘기는 래퍼(`ComponentPropsWithoutRef` 확장)처럼, 개수가 많아도 의미가 한 묶음이면 괜찮다. 기준이 잡으려는 건 "**서로 무관한 제어 손잡이가 흩어져 조합 규칙이 사라지는**" 상태다.

## Props 네이밍

이벤트 네이밍(`onX`/`handleX`)과 `children` 합성의 강제 규칙은 [`react.md`](../../.claude/rules/react.md)에 있다. 여기서는 그 적용 예시만 둔다.

```tsx
interface SearchBarProps {
  onSearch: (query: string) => void; // on~ : 외부에서 주입받는 콜백
  onClear?: () => void;
}

function SearchBar({ onSearch, onClear }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const handleSubmit = (e: FormEvent) => {
    // handle~ : 이 컴포넌트가 직접 처리
    e.preventDefault();
    onSearch(query); // 내부 처리 끝에서 외부 콜백 호출
  };
  // ...
}
```

`on~`이면 "외부에서 주입된 콜백", `handle~`이면 "이 컴포넌트가 직접 처리하는 로직"임을 이름만으로 구분한다.

### boolean Props는 긍정형 + `is` 접두

```tsx
<Button notDisabled={false} />  // ❌ 이중 부정 — "비활성화가 아닌 게 거짓"?
<Button disabled={true} />      // ✅ 긍정형

<Modal show={true} />           // ❌ show? visible? 컨벤션이 흔들린다
<Modal isOpen={true} />         // ✅ is + 형용사로 통일
```

## Controlled vs Uncontrolled

값의 주인이 **부모**인지 **컴포넌트 자신**인지를 먼저 정한다. 이 선택이 Props 모양(`value` vs `defaultValue`)을 결정한다.

|             | Controlled                             | Uncontrolled                             |
| ----------- | -------------------------------------- | ---------------------------------------- |
| 상태 위치   | 부모가 `value`·`onChange`로 제어       | 컴포넌트 내부에서 자체 관리              |
| 초기값      | `value` prop                           | `defaultValue` prop                      |
| 값 접근     | 부모 state에서 직접                    | `ref`로 접근                             |
| 적합한 경우 | 폼 검증, 실시간 미리보기, 입력 간 연동 | 단순 입력, 파일 업로드, 성능이 중요할 때 |

```tsx
// Controlled — 타이핑마다 값이 필요할 때(실시간 미리보기·연동)
function SearchWithPreview() {
  const [query, setQuery] = useState("");
  return (
    <div>
      <Input value={query} onChange={(e) => setQuery(e.target.value)} />
      <p>검색 중: "{query}"</p>
      <SearchResults query={query} />
    </div>
  );
}

// Uncontrolled — 제출할 때만 값이 필요할 때
function SimpleLoginForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!emailRef.current) return;
    login(emailRef.current.value /* ... */);
  };
  return (
    <form onSubmit={handleSubmit}>
      <input ref={emailRef} defaultValue="" placeholder="이메일" />
      <button type="submit">로그인</button>
    </form>
  );
}
```

### 공통 컴포넌트는 둘 다 지원한다

`value`가 들어오면 Controlled, 없으면 Uncontrolled로 분기한다.

```tsx
interface InputProps {
  value?: string; // Controlled
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  defaultValue?: string; // Uncontrolled
  placeholder?: string;
  disabled?: boolean;
}

function Input({ value, onChange, defaultValue, ...rest }: InputProps) {
  const isControlled = value !== undefined;
  return isControlled ? (
    <input value={value} onChange={onChange} {...rest} />
  ) : (
    <input defaultValue={defaultValue} {...rest} />
  );
}
```

## Props Drilling vs Context

Props Drilling은 무조건 나쁘지 않다. 데이터 흐름을 추적할 수 있는 **가장 단순한 방법**이다. 핵심은 "언제 유지하고 언제 Context로 바꾸는가"의 판단이다.

| 상황                                 | 판단       | 이유                                   |
| ------------------------------------ | ---------- | -------------------------------------- |
| 2단계 전달(부모→자식→손자)           | ✅ 유지    | 흐름이 명확하고 추적 가능              |
| 3단계 이상 + 중간이 그 Props를 안 씀 | ⚠️ 검토    | 중간 컴포넌트가 불필요한 의존성을 가짐 |
| 여러 트리에서 동일 상태 공유         | ❌ Context | 트리 구조상 전달이 불가능하거나 비효율 |

```tsx
// ❌ 4단계 전달 — Layout·ProductSection은 category를 쓰지 않고 넘기기만 한다
function App() {
  const [category, setCategory] = useState("all");
  return <Layout category={category} onCategoryChange={setCategory} />;
}
function Layout({ category, onCategoryChange }) {
  // 전달만
  return <ProductSection category={category} onCategoryChange={onCategoryChange} />;
}
function ProductSection({ category, onCategoryChange }) {
  // 전달만
  return <FilterBar category={category} onCategoryChange={onCategoryChange} />;
}
function FilterBar({ category, onCategoryChange }) {
  // 여기서야 사용
  return (
    <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
      ...
    </select>
  );
}
// category 타입이 바뀌면 쓰지도 않는 4곳을 모두 고쳐야 한다.

// ✅ Context — 중간 컴포넌트는 category를 모른다
const CategoryContext = createContext<{
  category: string;
  setCategory: (c: string) => void;
} | null>(null);

function App() {
  const [category, setCategory] = useState("all");
  return (
    <CategoryContext.Provider value={{ category, setCategory }}>
      <Layout />
    </CategoryContext.Provider>
  );
}
function Layout() {
  return <ProductSection />;
} // 전달 안 함
function FilterBar() {
  const { category, setCategory } = useCategoryContext();
  return (
    <select value={category} onChange={(e) => setCategory(e.target.value)}>
      ...
    </select>
  );
}
```

### Context의 올바른 포지셔닝

Context는 앱 전역 스토어의 대용이 아니다. 다만 **서브트리 단위의 상태 공유**는 React 공식 문서가 권장하는 패턴이다(Scaling up with reducer and context). 다음 셋에서 고려한다.

1. **Props Drilling 해소** — 중간 컴포넌트들이 데이터를 쓰지 않고 전달만 할 때
2. **서브트리 상태 공유** — 특정 계층 아래 여러 컴포넌트가 같은 상태를 공유할 때(Tabs, Form)
3. **테마/언어 설정** — 거의 변하지 않는 전역 값

### 변경 빈도가 다른 값은 Context를 분리한다

Context 값이 바뀌면 그 값을 구독하는 하위 전체가 리렌더된다. 자주 바뀌는 값과 드물게 바뀌는 값을 한 Context에 넣지 않는다.

```tsx
// ❌ 드물게 바뀌는 theme과 타이핑마다 바뀌는 inputValue가 한 Context에
const AppContext = createContext({ theme: "light", inputValue: "" });
// inputValue가 바뀔 때마다 theme만 쓰는 컴포넌트까지 전부 리렌더된다.

// ✅ 변경 빈도로 Context를 쪼갠다
const ThemeContext = createContext({ theme: "light" });
const SearchContext = createContext({ inputValue: "" });
```

## 공통 컴포넌트 설계

### 도입 시점 — YAGNI

"나중에 쓸 것 같아서" 미리 만들지 않는다. 예측은 대부분 틀린다.

| 상황                            | 판단      | 이유                        |
| ------------------------------- | --------- | --------------------------- |
| 같은 UI가 3곳 이상에서 반복     | ✅ 공통화 | 중복 제거 효과가 명확       |
| 2곳이지만 확장이 확실           | ✅ 공통화 | 지금 만들면 확장 비용 절감  |
| 1곳뿐인데 "나중에 쓸 것 같아서" | ❌ 안 함  | 예측은 대부분 틀린다(YAGNI) |

### 3가지 원칙

**1. 비즈니스 로직을 포함하지 않는다.** 비즈니스 판단은 사용하는 쪽에서 한다.

```tsx
// ❌ 공통 컴포넌트에 도메인 판단(stock·status)이 섞임
function ProductButton({ product }: { product: Product }) {
  const isAvailable = product.stock > 0 && product.status === 'active'
  return <button disabled={!isAvailable}>{product.name} 구매</button>
}

// ✅ 공통 컴포넌트는 UI만. 판단은 사용처에서
function Button({ disabled, children, ...props }: ButtonProps) {
  return <button disabled={disabled} {...props}>{children}</button>
}
const isAvailable = product.stock > 0 && product.status === 'active'
<Button disabled={!isAvailable}>{product.name} 구매</Button>
```

**2. 도메인 용어를 이름에 쓰지 않는다.** 이름에 도메인이 박히면 그 맥락에서만 쓸 수 있다.

```
ProductButton    ❌  // "상품 구매" 맥락 전용
OrderSubmitForm  ❌  // "주문" 맥락 전용
Button / Form    ✅  // 어디서든 쓸 수 있다
```

**3. `variant`/`size`로 외양을 제어한다.** Props에 JSDoc(`/** */`)을 달면 IDE 자동완성에 설명이 떠 별도 문서 없이도 용도를 안다.

```tsx
interface ButtonProps {
  /** 버튼 스타일 변형 */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** 버튼 크기 */
  size?: "sm" | "md" | "lg";
  /** 로딩 상태 — true일 때 스피너 표시, 클릭 비활성화 */
  loading?: boolean;
  children: React.ReactNode;
}
```

### children 합성의 감각

Props가 늘어날 때의 대안은 `children`에 JSX를 넘겨받는 합성이다. 변형이 늘어도 컴포넌트를 수정하지 않고 사용처에서 조립한다.

```tsx
// ❌ Props로 전부 제어 — 변형이 늘 때마다 Props도 는다
<Card title="원목 스탠드 조명" price={45000} badge="신상품"
  showLikeButton likeCount={128} showReviewCount reviewCount={42} imageHeight={200} />
// showShareButton도 추가? → Props +2개...

// ✅ Composition — 사용처에서 필요한 것만 조립
<Card>
  <Card.Image src="/lamp.jpg" alt="원목 스탠드 조명" height={200} />
  <Card.Body>
    <Card.Badge>신상품</Card.Badge>
    <Card.Title>원목 스탠드 조명</Card.Title>
    <Card.Price value={45000} />
  </Card.Body>
  <Card.Footer>
    <LikeButton count={128} />
    <ReviewCount count={42} />
  </Card.Footer>
</Card>
// ShareButton이 필요하면 Card.Footer에 추가한다 — Card는 손대지 않는다.
```

핵심 장점은 **기존 컴포넌트를 수정하지 않고 확장**할 수 있다는 것이다. Context 기반으로 상태까지 암시적으로 공유하는 Compound Component(`<Tabs><Tabs.Trigger/></Tabs>`)는 이 감각의 확장이다.

## TypeScript Props — 고급 패턴

### 조건부 Props는 Discriminated Union으로

"`variant`가 `'icon'`일 때만 `icon`이 필수" 같은 조건은 타입으로 강제한다. 모두 optional로 두면 잘못된 조합을 못 막는다.

```tsx
// ❌ 전부 optional — 잘못된 조합을 컴파일 타임에 못 막는다
interface ButtonProps {
  variant: 'text' | 'icon'
  label?: string   // text일 땐 필수인데 optional
  icon?: ReactNode // icon일 땐 필수인데 optional
}

// ✅ Discriminated Union — 잘못된 조합이 컴파일 에러가 된다
type ButtonProps =
  | { variant: 'text'; label: string; icon?: never }
  | { variant: 'icon'; icon: ReactNode; label?: never }

<Button variant="text" label="확인" />   // ✅
<Button variant="icon" icon={<X />} />   // ✅
<Button variant="text" icon={<X />} />   // ❌ 컴파일 에러
<Button variant="icon" />                // ❌ icon 누락 에러
```

> discriminated union의 기본기(optional 자루 대신 태그 유니온, `switch`의 `never` 처리)는 [`typescript.md`](../../.claude/rules/typescript.md)에 있다. 위는 그것을 Props에 적용한 형태다.

### HTML 속성 확장은 `ComponentPropsWithoutRef`

`<button>`의 모든 HTML 속성(`type`, `aria-label` 등)을 그대로 받으려면 손으로 나열하지 말고 확장한다.

```tsx
interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

function Button({ variant = "primary", loading, children, ...rest }: ButtonProps) {
  return (
    <button disabled={loading || rest.disabled} {...rest}>
      {loading ? <Spinner /> : children}
    </button>
  );
}

<Button type="submit" aria-label="주문하기" variant="primary">
  주문
</Button>;
```

## 참고: Atomic Design

설계 어휘로 알아두되 레이어 강제는 맹신하지 않는다. 분류 기준이 모호해 "이건 Atom인가 Molecule인가" 논쟁으로 시간을 쓰기 쉽고, 레이어가 많아 오히려 복잡해질 수 있다.

| 레벨            | 예시                  | 메모                                 |
| --------------- | --------------------- | ------------------------------------ |
| Atoms           | Button, Input, Badge  | 재사용성 극대화, 단 분류 기준 모호   |
| Molecules       | SearchBar, FilterChip | 조합 단위는 명확                     |
| Organisms       | ProductCard, Header   | 비즈니스 의미 단위, 거대해질 수 있음 |
| Templates/Pages | ProductListPage       | 레이아웃 분리, 레이어 과다 주의      |
