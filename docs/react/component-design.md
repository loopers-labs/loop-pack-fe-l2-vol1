# 컴포넌트 설계 & Props 전략

> `.claude/rules/component-design.md`가 가리키는 근거 문서. 컴포넌트·Props를 설계할 때 읽고, 상황에 맞게 적용한다. 각 판단의 "왜"를 Before/After로 보여준다.
>
> 전제: 컴포넌트는 **"재사용 가능하게" 만들기 전에 "읽기 쉽게"** 만드는 것이 먼저다.

## 경계 — 어디서 자를까

Props를 어떻게 설계할지(계약)는 그다음 문제다. 먼저 **무엇을 한 컴포넌트로 볼지**를 정한다. 나누는 기준은 "크기"가 아니라 **"무엇이 함께 바뀌는가"**다.

### 변경 이유로 경계 긋기

좋은 경계는 **변경의 경계**다. 한 컴포넌트가 서로 다른 이유로 바뀐다면, 그 이유의 수만큼 잘릴 후보다. 단일 책임을 "기능 1개"가 아니라 "**변경 이유(reason to change) 1개**"로 읽는다.

```tsx
// ❌ 세 변경 이유(가격 정책 / 추천 / 채팅)가 한 파일에 엉켜 있다
function ProductPage({ product }: { product: Product }) {
  const priceLabel = product.isAuction
    ? `최고가 ${format(product.bidPrice)}` // (A) 가격 표기 정책이 바뀌면 여기
    : format(product.price);
  const related = product.tags
    .flatMap((tag) => findByTag(tag)) // (B) 추천 알고리즘이 바뀌면 여기
    .filter((p) => p.id !== product.id)
    .slice(0, 6);
  return (
    <div>
      <h1>{product.title}</h1>
      <strong>{priceLabel}</strong>
      <RelatedGrid items={related} />
      <button onClick={() => openChat(product.sellerId)}>채팅하기</button> {/* (C) 채팅 정책 */}
    </div>
  );
}

// ✅ 경계 = 변경의 경계. 가격이 바뀌면 ProductHeader만, 추천이 바뀌면 RelatedProducts만 연다
function ProductPage({ product }: { product: Product }) {
  return (
    <div>
      <ProductHeader product={product} />
      <RelatedProducts product={product} />
      <ChatCta sellerId={product.sellerId} />
    </div>
  );
}
```

분리의 효과는 "재사용"이 아니라 **"수정할 때 열어야 할 파일 수"**로 잰다 — "이 컴포넌트는 누구 때문에, 며칠에 한 번 바뀌나?"를 물으면 자를 축이 보인다.

### 구현 vs 조합을 섞지 말기

한 컴포넌트는 **직접 구현하는 것**이거나 **여러 컴포넌트를 조합하는 것**이어야 한다. 둘을 한 파일에 섞으면 읽는 사람이 추상화 고도를 계속 오르내려야 한다. 조합 컴포넌트는 화면의 "목차", 구현 컴포넌트는 "본문"이다 — 목차에 본문 문장이 끼면 안 된다.

```tsx
// ❌ 조합을 하다가 갑자기 카드 '내부 구현'이 통째로 인라인 — 고도가 섞인다
function FeedList({ posts }: { posts: Post[] }) {
  return (
    <ul>
      <FeedHeader />
      {posts.map((post) => (
        <li key={post.id}>
          <article className="card">
            <img src={post.thumbnail} alt="" />
            <h3>{post.title}</h3>
            <p>
              {post.region} · {timeAgo(post.createdAt)}
            </p>
          </article>
        </li>
      ))}
      <FeedFooter />
    </ul>
  );
}

// ✅ 구현은 아래로 위임 — FeedList는 화면의 '목차'로만 읽힌다
function FeedList({ posts }: { posts: Post[] }) {
  return (
    <ul>
      <FeedHeader />
      {posts.map((post) => (
        <li key={post.id}>
          <FeedCard post={post} />
        </li>
      ))}
      <FeedFooter />
    </ul>
  );
}
```

### 무관한 상태는 추출 신호

거대 컴포넌트(God Component)의 첫째 신호: **한 컴포넌트가 서로 무관한 상태를 함께 들고 있다**(예: 목록 정렬 상태 + 모달 열림 상태).

```tsx
// ❌ ProductSection이 섹션과 무관한 '모달 열림' 상태를 들고 있다
function ProductSection({ products }: { products: Product[] }) {
  const [showShortcutModal, setShowShortcutModal] = useState(false); // ← 이질적
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  // ...수백 줄
}

// ✅ 무관한 상태는 그 상태를 쓰는 UI와 함께 떼어낸다
function ProductSection({ products }: { products: Product[] }) {
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  return (
    <>
      <SortableProductGrid products={products} sortBy={sortBy} onSort={setSortBy} />
      <ShortcutModalButton /> {/* showShortcutModal는 여기로 이사 */}
    </>
  );
}
```

상태를 보면 경계가 보인다. 상태를 **어디에 둘지**의 판단은 [`react.md`](../../.claude/rules/react.md)에 있다.

### 중복 > 잘못된 추상화

자르는 것보다 **아직 자르지 않는 것**이 더 어렵다. 비슷해 보인다고 성급히 합치면, 추상화가 곧 `if`문 더미가 된다.

```tsx
// ❌ 상품 카드와 모임 카드가 '비슷해 보여서' 하나로 합침 → 타입마다 if가 늘어난다
function Card({ type, title, price, host, memberCount, thumbnail, isAuction, region }: CardProps) {
  return (
    <div>
      <img src={thumbnail} alt="" />
      <h3>{title}</h3>
      {type === "product" && <strong>{isAuction ? "경매" : price}</strong>}
      {type === "group" && (
        <span>
          {host} · {memberCount}명
        </span>
      )}
      {type === "product" && <small>{region}</small>}
      {/* 새 타입이 생길 때마다 if가 늘어남 → "앱 전체가 if문 안에" */}
    </div>
  );
}

// ✅ 공통은 '진짜 같은 것'(껍데기)만, 도메인 차이는 각자 구현 — 중복을 허용한다
function CardShell({ thumbnail, title, children }: CardShellProps) {
  return (
    <div className="card">
      <img src={thumbnail} alt="" />
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <CardShell thumbnail={product.thumbnail} title={product.title}>
      <strong>{product.isAuction ? "경매" : format(product.price)}</strong>
      <small>{product.region}</small>
    </CardShell>
  );
}

function GroupCard({ group }: { group: Group }) {
  return (
    <CardShell thumbnail={group.thumbnail} title={group.title}>
      <span>
        {group.host} · {group.memberCount}명
      </span>
    </CardShell>
  );
}
```

> "prefer duplication over the wrong abstraction." — 잘못된 추상화는 중복보다 비싸다.

추상화는 규칙이 아니라 "feels right"일 때 한다. **세 번째 중복**에서 공통점이 또렷해지면 그때 뽑는다(rule of three). "언제 공통화할지"의 구체 기준은 아래 [공통 컴포넌트 설계 → 도입 시점](#도입-시점--yagni) 표에 있다.

## Props는 적을수록 좋다

Props가 많아지면 사용하는 쪽에서 "어떤 조합이 유효한지" 읽어낼 수 없다. Props를 늘리는 대신 `children`으로 합성한다. 구체적인 Before/After는 아래 [children 합성의 감각](#children-합성의-감각) 예시를 참고한다.

| Props 수 | 판단      | 대응                                |
| -------- | --------- | ----------------------------------- |
| 1~3개    | ✅ 깔끔   | 유지                                |
| 4~5개    | ⚠️ 주의   | 관련 Props를 객체로 그룹화 검토     |
| 6개 이상 | ❌ 재설계 | Composition 패턴 또는 컴포넌트 분리 |

절대 기준은 아니다. HTML 속성을 그대로 넘기는 래퍼(`ComponentPropsWithoutRef` 확장)처럼, 개수가 많아도 의미가 한 묶음이면 괜찮다. 기준이 잡으려는 건 "**서로 무관한 제어 손잡이가 흩어져 조합 규칙이 사라지는**" 상태다.

## Props 네이밍

| 접두사    | 의미                    | 예시                          |
| --------- | ----------------------- | ----------------------------- |
| `onX`     | 외부에서 주입받는 콜백  | `onSearch`, `onClear`         |
| `handleX` | 이 컴포넌트가 직접 처리 | `handleSubmit`, `handleClick` |

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
    if (emailRef.current) login(emailRef.current.value);
  };
  return (
    <form onSubmit={handleSubmit}>
      <input ref={emailRef} defaultValue="" placeholder="이메일" />
      <button type="submit">로그인</button>
    </form>
  );
}
```

```tsx
// value가 있으면 Controlled, 없으면 Uncontrolled로 분기한다
interface InputProps {
  value?: string; // Controlled
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  defaultValue?: string; // Uncontrolled
}

function Input({ value, onChange, defaultValue, ...rest }: InputProps) {
  return value !== undefined ? (
    <input value={value} onChange={onChange} {...rest} />
  ) : (
    <input defaultValue={defaultValue} {...rest} />
  );
}
```

## Props Drilling vs Context

Props Drilling은 데이터 흐름을 추적할 수 있는 **가장 단순한 방법** — 무조건 나쁘지 않다. 핵심은 언제 Context로 전환하는가다.

| 상황                                 | 판단       | 이유                                   |
| ------------------------------------ | ---------- | -------------------------------------- |
| 2단계 전달(부모→자식→손자)           | ✅ 유지    | 흐름이 명확하고 추적 가능              |
| 3단계 이상 + 중간이 그 Props를 안 씀 | ⚠️ 검토    | 중간 컴포넌트가 불필요한 의존성을 가짐 |
| 여러 트리에서 동일 상태 공유         | ❌ Context | 트리 구조상 전달이 불가능하거나 비효율 |

```tsx
// ❌ 4단계 전달 — 중간 Layout·ProductSection은 category를 쓰지 않고 넘기기만 한다
function App() {
  const [category, setCategory] = useState("all");
  return <Layout category={category} onCategoryChange={setCategory} />;
}
function Layout({ category, onCategoryChange }) {
  return <ProductSection category={category} onCategoryChange={onCategoryChange} />; // 전달만
}
// ProductSection도 동일하게 전달만 — category 타입이 바뀌면 쓰지도 않는 중간 컴포넌트 전체 수정 필요

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

Context는 앱 전역 스토어 대용이 아니라 **서브트리 단위 상태 공유** 도구다. 다음 셋에서 고려한다.

1. **Props Drilling 해소** — 중간 컴포넌트들이 데이터를 쓰지 않고 전달만 할 때
2. **서브트리 상태 공유** — 특정 계층 아래 여러 컴포넌트가 같은 상태를 공유할 때(Tabs, Form)
3. **테마/언어 설정** — 거의 변하지 않는 전역 값

자주 바뀌는 값과 드물게 바뀌는 값을 한 Context에 넣지 않는다 — Context 값이 바뀌면 구독 하위 전체가 리렌더된다.

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

### 스타일 확장은 prop 말고 className 위임

스타일 미세조정마다 prop을 새로 파면 공통 컴포넌트가 끝없이 부푼다 — 외양 확장은 **`className`을 받아 사용처에 위임**한다.

```tsx
// ❌ 디자인 요청 하나 = prop 하나 → Button이 끝없이 부푼다
<Button fullWidth rounded shadow uppercase marginTop />;

// ✅ className을 받아 자체 클래스와 병합 — 사용처에서만 조정
interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary" | "ghost";
}
function Button({ variant = "primary", className, ...rest }: ButtonProps) {
  // lazy: 문자열 병합으로 충분 — 클래스 충돌·우선순위가 잦아지면 clsx + tailwind-merge 도입
  return <button className={`btn btn--${variant} ${className ?? ""}`} {...rest} />;
}

<Button variant="primary" className="checkout-cta" />; // 이 한 곳만, Button은 그대로
```

원칙은 "**더 많은 prop**" 대신 "**더 열린 확장 지점**" — 확장을 사용처에 위임하면 공통 컴포넌트가 부풀지 않는다.

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

기존 컴포넌트를 수정하지 않고 확장하는 것이 핵심 — Context 기반 Compound Component(`<Tabs><Tabs.Trigger/></Tabs>`)는 이 감각의 확장이다.

### children vs slot

`children`은 구멍이 하나일 때다. **이름 붙은 자리가 여럿이고 순서 고정**이면 각 자리를 element prop으로 받는 **slot**이 더 안전하다(React는 네이티브 slot이 없어 prop으로 구현).

```tsx
// children 하나로 충분 — 자유롭게 채운다
<Dialog>
  <p>정말 삭제할까요?</p>
</Dialog>;

// 자리가 여럿이고 순서가 고정 → slot(이름 있는 element props)
<Dialog
  title={<h2>판매 종료</h2>}
  footer={
    <>
      <Button variant="ghost">취소</Button>
      <Button variant="danger">종료</Button>
    </>
  }
>
  이 글을 끌올할 수 없게 됩니다.
</Dialog>;
```

`children`은 자유, slot은 구조다 — "footer가 header 위로 가면 안 되는" UI엔 slot으로 자리를 고정하고, 상태까지 암시적으로 공유해야 하면 Context 기반 Compound Component로 넘어간다.

## TypeScript Props — 고급 패턴

### 조건부 Props는 Discriminated Union으로

"`variant`가 `'icon'`일 때만 `icon`이 필수" 같은 조건은 타입으로 강제한다 — 전부 optional은 잘못된 조합을 막지 못한다.

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

> 설계 어휘로 알아두되 레이어 강제는 맹신하지 않는다. 분류 기준이 모호해 "Atom인가 Molecule인가" 논쟁으로 시간을 쓰기 쉽고, 레이어가 많아 복잡해질 수 있다(Atoms→Molecules→Organisms→Templates/Pages).
