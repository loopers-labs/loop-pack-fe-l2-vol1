코드리뷰-AI협업환경구축-1주차-발제.html

> "잘 돌아가는 코드"와 "좋은 코드"는 다르다.
그 차이를 구분하는 눈을 먼저 키우고, AI와 함께 코드를 검증하는 환경을 만든다.
> 

<aside>
🎯

**Summary**

</aside>

- 기능 구현보다 먼저, **"좋은 코드란 무엇인가"**의 기준을 세운다.
- Phase 0 사전 과제 코드를 본인이 구두로 설명하며, "왜 이렇게 고쳤는가"를 방어하는 경험을 한다.
- AI 생성 코드를 검증하고 통제하는 능력을 훈련한다.
- 팀 코드 품질 도구(ESLint/Prettier)와 커밋 컨벤션을 통일한다.

<aside>
📌

**Keywords**

</aside>

- 코드 리뷰 문화, 질문형 리뷰
- 네이밍 전략 (변수명, 함수명, 컴포넌트명)
- ESLint v9 Flat Config, Prettier
- Conventional Commits
- Claude Code, CLAUDE.md

<aside>
🧠

**Learning**

</aside>

# 🌍 개발 환경의 변화

## 🤖 최근 소프트웨어 개발 풍조: LLM · Agent-based 개발

<aside>
💡

최근 개발 현장에서는 더 이상 **"코드를 직접 얼마나 잘 치느냐"**가 생산성의 병목이 아닙니다.
LLM은 이미 반복적인 코드를 사람보다 빠르게 만들어내고 있습니다.
Agent 기반 도구들은 요구사항을 작업 단위로 나누고, 테스트 결과를 기준으로 코드를 수정합니다.

**사람이 AI의 보조를 받아 직접 구현하던 시대**는 빠르게 지나고, **사람이 의도를 정의하고 AI가 구현하는 시대**로 넘어왔습니다.

</aside>

### ⚠️ 문제는 속도가 아니라 통제다

<aside>
💡

AI는 코드를 빠르게 생성할 수 있지만, **우리 프로젝트의 컨벤션, 코드의 의도, 변경 영향과 책임**에 대해서는 지속적으로 컨텍스트를 유지할 수 없습니다.

명확하게 코드에 대한 의도를 분명히 하고, **달리는 자동차의 바퀴를 갈아끼울 수 있도록** 안내하고 조율할 수 있어야 합니다.

</aside>

### 🧠 그래서 프론트엔드 개발자의 역할은 어떻게 바뀌고 있는가

- AI를 활용해 **반복적인 구현 비용을 줄이고**, 설계와 판단에 집중
- 컴포넌트의 **구조적 결정**(분리 기준, 상태 위치, 패턴 선택)은 여전히 사람의 몫
- AI가 만든 코드가 **팀 컨벤션과 설계 의도에 부합하는지** 검증하는 능력이 핵심 역량으로 부상

---

# 💬 코드 리뷰 — 왜 이 과정의 핵심인가

## 🧱 코드 리뷰는 "검사"가 아니라 "대화"다

> 코드 리뷰를 "내 코드에 틀린 데가 없나 확인받는 절차"로 이해하면, 성장하기 어렵습니다.
코드 리뷰는 **"왜 이렇게 짰는가"를 동료와 함께 탐구하는 설계 토론**입니다.
> 

<aside>
💡

이 과정에서는 코드 리뷰를 통해 아래를 훈련합니다:
- **의도를 읽는 힘** — 코드를 이해하고 질문하는 능력
- **설계와 구현의 이유를 묻는 습관**
- **좋은 동료가 되는 태도** — 피드백을 명확하고 존중 있게 전달

</aside>

### 📌 실무에서 왜 중요할까?

- 코드 리뷰 문화가 없는 팀에서는 "돌아가니까 머지"가 반복되고, 기술 부채가 쌓입니다
- 반대로 리뷰가 잘 돌아가는 팀에서는 **한 사람의 실수가 팀의 학습으로 전환**됩니다
- 면접에서도 "코드 리뷰 경험"과 "리뷰를 통해 성장한 사례"를 자주 묻습니다

### ❌ 나쁜 리뷰 vs ✅ 좋은 리뷰

| ❌ 나쁜 리뷰 | ✅ 좋은 리뷰 (질문형) |
| --- | --- |
| "잘했습니다" | "이 Hook을 이 위치에 둔 이유가 궁금합니다. components/에 두지 않은 이유가 있나요?" |
| "이거 틀렸어요" | "이 부분에서 `useMemo` 대신 계산으로 처리하면 어떨까요? 리렌더링 빈도가 낮아 보여서요" |
| "리팩토링 하세요" | "이 컴포넌트가 필터 로직과 렌더링을 동시에 하고 있는데, Hook으로 분리하면 테스트가 쉬워질 것 같습니다" |
| "왜 이렇게 짰어요?" | "이 방식은 처음 보는데, 어떤 장점이 있어서 선택하신 건가요? 다른 방식으로는 ~도 있을 것 같아서요" |

> **"잘했습니다"는 이 과정에서 금지입니다.** 구체적 근거와 대안을 제시하는 리뷰만 허용됩니다.
> 

### 🔍 리뷰 진행 순서

1. **PR 메시지를 먼저 읽고** 전체 맥락을 파악
2. 컨텍스트가 부족한 부분에 **질문 또는 제안** 남기기
3. 파일 단위 또는 커밋 단위로 코드 리뷰
4. 리뷰할 포인트와 단순 코멘트를 **구분**해서 남기기
5. 마무리로 **리뷰 요약** 또는 총평 남기기

> 💬 현업에서는 **커밋 단위 리뷰**는 작업 흐름 파악에 좋고, **파일 단위 리뷰**는 최종 구조 확인에 적합합니다.
> 

---

# 💯 좋은 코드의 기준

## 📋 "좋은 코드"란 무엇인가

> 좋은 코드의 정의는 팀마다 다를 수 있지만, **공통적으로 적용되는 기준**이 있습니다.
이 기준을 이번 주에 세우고, 10주 동안 과제와 리뷰에 적용합니다.
> 

| 좋은 코드 | 나쁜 코드 |
| --- | --- |
| 의도가 이름에 드러난다 | `data`, `temp`, `flag`, `handleClick1` |
| 한 함수/컴포넌트가 한 가지 일을 한다 | 300줄짜리 컴포넌트에 API 호출 + 비즈니스 로직 + UI 렌더링 |
| 파생 가능한 값은 계산한다 | `const [isValid, setIsValid] = useState(a > b)` — useEffect로 동기화 |
| 타입이 코드를 설명한다 | `any`로 모든 타입을 회피 |
| 조건부 렌더링이 읽기 쉽다 | 삼항 연산자 3중 중첩 |
| 에러 상태를 명시적으로 처리한다 | `catch(e) {}` — 에러를 삼켜버림 |

### 📌 실무 사례로 알아보기 — 파생 상태 함정

> 실무에서 가장 많이 보이는 안티패턴 중 하나가 **파생 가능한 값을 useState로 관리**하는 것입니다.
> 

```tsx
// ❌ 안티패턴: 파생 상태를 useEffect + useState로 관리
function ProductList({ products }: { products: Product[] }) {
  const [filteredCount, setFilteredCount] = useState(0)
  const [hasExpensive, setHasExpensive] = useState(false)

  useEffect(() => {
    setFilteredCount(products.filter(p => p.inStock).length)
  }, [products])

  useEffect(() => {
    setHasExpensive(products.some(p => p.price > 100000))
  }, [products])

  // 문제: 불필요한 리렌더링 2회 + useEffect 2개 + 상태 동기화 위험
}
```

```tsx
// ✅ 개선: 파생 값은 렌더링 중에 계산
function ProductList({ products }: { products: Product[] }) {
  const filteredCount = products.filter(p => p.inStock).length
  const hasExpensive = products.some(p => p.price > 100000)

  // useState도, useEffect도 필요 없다.
  // products가 바뀌면 자동으로 재계산된다.
}
```

- **QNA — useMemo를 써야 하는 건 아닌가요?**
    
    상품이 10만 개가 아닌 이상, `filter`와 `some`은 충분히 빠릅니다. **성능 문제가 실제로 측정되기 전에** `useMemo`를 넣는 것은 불필요한 최적화입니다. R9(성능 최적화)에서 "언제 메모이제이션이 필요한가"를 다룹니다.
    

---

## 🏷 네이밍 전략

> 네이밍은 코드의 **첫 번째 문서화**입니다. 이름만 보고 "이게 뭘 하는 코드인지" 알 수 있어야 합니다.
> 

### 컴포넌트 네이밍

```tsx
// PascalCase + 역할이 드러나는 이름
ProductCard        ✅  // "상품 카드구나"
Card1              ❌  // "1번 카드? 무슨 카드?"
Comp               ❌  // "컴포넌트? 뭔데?"
ProductCardWrapper ⚠️  // "Wrapper? 뭘 감싸는데?" — 역할이 모호
```

### 함수 네이밍

```tsx
// 동사 + 목적어 — "이 함수가 뭘 하는지" 바로 알 수 있어야
formatPrice(45000)        ✅  // "가격을 포맷하는구나"
getFilteredProducts()     ✅  // "필터된 상품을 가져오는구나"
doStuff()                 ❌  // "뭘 하는데?"
process()                 ❌  // "뭘 처리하는데?"
```

### 이벤트 핸들러 네이밍

```tsx
// Props로 받는 콜백: on + Event
// 컴포넌트 내부 함수: handle + Event
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

> **왜 구분하는가?** 코드를 읽을 때 `on~`을 보면 "외부에서 주입된 콜백이구나", `handle~`을 보면 "이 컴포넌트가 직접 처리하는 로직이구나"를 즉시 구분할 수 있습니다.
> 

### boolean 네이밍

```tsx
isLoading          ✅  // is + 형용사
hasError           ✅  // has + 명사
shouldRefetch      ✅  // should + 동사
canSubmit          ✅  // can + 동사

loading            △  // 관례상 허용 (useState 이름으로 흔함)
notDisabled        ❌  // 이중 부정 — if (!notDisabled) → ???
```

### 상수 네이밍

```tsx
const MAX_RETRY_COUNT = 3          ✅  // UPPER_SNAKE_CASE
const ITEMS_PER_PAGE = 20          ✅
const defaultPageSize = 20         ❌  // 상수인데 camelCase
```

- **QNA — 네이밍에 시간을 많이 쓰는 게 맞나요?**
    
    네. 코드는 쓰는 시간보다 **읽히는 시간이 10배** 이상입니다. 이름을 잘 지으면 주석이 필요 없어지고, 코드 리뷰도 빨라지고, 버그도 줄어듭니다. "나중에 고치지 뭐"라고 미루면, 그 이름을 읽는 모든 동료가 매번 "이게 뭐지?"를 떠올리게 됩니다.
    

---

## 🔍 조건부 렌더링 — 읽기 쉽게 만들기

### 📌 실무에서 겪는 문제

> 삼항 연산자가 중첩되면 코드를 읽을 수 없게 됩니다.
> 

```tsx
// ❌ 삼항 3중 중첩 — 무슨 뜻인지 읽을 수 없다
return (
  <div>
    {isLoading ? (
      <Spinner />
    ) : error ? (
      isNetworkError ? (
        <NetworkErrorMessage />
      ) : (
        <GenericErrorMessage />
      )
    ) : data.length === 0 ? (
      <EmptyState />
    ) : (
      <ProductList products={data} />
    )}
  </div>
)
```

```tsx
// ✅ early return 패턴 — 각 상태를 명확히 분리
function ProductListPage() {
  const { data, isLoading, error } = useProducts()

  if (isLoading) return <Spinner />

  if (error) {
    return isNetworkError(error)
      ? <NetworkErrorMessage />
      : <GenericErrorMessage error={error} />
  }

  if (data.length === 0) return <EmptyState />

  return <ProductList products={data} />
}
```

> **early return을 쓰면** 각 분기가 독립적이고, 새로운 상태(예: "부분 로딩")를 추가할 때도 한 줄만 추가하면 됩니다.
> 

---

# 🤖 AI 협업 환경 구축

## Claude Code — 개발 환경의 확장

<aside>
💡

**Loopers**에서는 **Claude Code**를 기반으로 과정을 진행합니다.

</aside>

- 많은 AI 도구들이 존재하지만, Claude Code는 근래 가장 많이 사용되고 있는 Anthropic이 개발한 터미널 기반의 **에이전트 코딩 도구**
- CLI 환경에서 동작하므로 bash / git / project 등에도 제약없이 접근 가능
- Claude Code가 제공하는 기능:
    - **개발자가 제공한 프롬프트** → 해석 → 계획 수립 → 코드 작성 → 동작 확인
    - **버그에 관련한 프롬프트** → 코드베이스 분석 및 문제 식별, 수정
    - **코드베이스 탐색** → 전체 프로젝트 구조를 인식하고, 탐색 가능

### ⚠️ AI가 잘하는 것과 못하는 것

| ✅ AI가 잘하는 것 | ❌ AI가 못하는 것 |
| --- | --- |
| 반복적인 보일러플레이트 코드 생성 | 우리 팀의 컨벤션을 **알아서** 따르기 |
| ESLint/Prettier 설정 초안 작성 | "이 규칙이 왜 필요한가" 판단 |
| 에러 메시지 원인 설명 | 비즈니스 맥락에 맞는 에러 처리 결정 |
| TypeScript 타입 초안 생성 | 도메인 의미에 맞는 타입 이름 짓기 |
| 테스트 코드 초안 작성 | "무엇을 테스트해야 하는가" 판단 |

> **핵심**: AI는 **도구**입니다. 망치를 잘 쓰려면 어디에 못을 박아야 하는지 아는 사람이 있어야 합니다.
> 

### CLAUDE.md — AI의 행동 규칙서

> 프로젝트 루트에 `CLAUDE.md`를 작성하면, Claude Code가 이 규칙을 따릅니다. 팀 컨벤션을 한 번 정의해두면 AI가 일관된 코드를 생성합니다.
> 

```bash
# Claude Code에게 현재 프로젝트를 분석시켜 초안 만들기
> 현재 프로젝트를 분석해 CLAUDE.md를 만들어줘.
  package.json, tsconfig.json 등을 참고해 현재 프로젝트의 주요 기술 스택 및 버전, 모듈 구조를 포함해줘.
```

```markdown
# CLAUDE.md 작성 예시

## 기술 스택
- React 18, TypeScript 5.x, Vite 6.x
- Tailwind CSS 4.x
- ESLint v9 (Flat Config), Prettier

## 컴포넌트 규칙
- 파일 하나에 하나의 export default
- Props interface는 컴포넌트 파일 상단에 정의
- 이벤트 핸들러: on{Event} (Props), handle{Event} (내부)
- 조건부 렌더링은 early return 패턴 우선

## 개발 Workflow — 증강 코딩
- **대원칙**: 방향성 및 주요 의사 결정은 개발자에게 제안만 할 수 있으며, 최종 승인된 사항을 기반으로 작업
- **설계 주도권 유지**: AI가 임의판단을 하지 않고, 방향성에 대한 제안을 진행할 수 있으나 개발자의 승인을 받은 후 수행

## 주의사항
### Never Do
- 불필요한 추상화, 과도한 메모이제이션 금지
- any 타입 사용 금지
- console.log 잔재 남기지 않기

### Recommendation
- 컴포넌트 분리 시 "이 컴포넌트의 책임은 무엇인가" 먼저 정의
- Props가 5개를 넘으면 설계를 재검토
```

### AI 생성 코드 검증 — 실전 예시

> AI가 생성한 코드를 그대로 쓰지 않는다. 반드시 **"왜 이 코드가 맞는가"**를 본인이 판단한다.
> 

```tsx
// AI가 생성한 코드
function ProductCard({ product }: { product: any }) {  // ← any?
  const [isHovered, setIsHovered] = useState(false)

  const formattedPrice = useMemo(                       // ← useMemo 필요?
    () => product.price.toLocaleString(),
    [product.price]
  )

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ opacity: isHovered ? 0.8 : 1 }}          // ← 인라인 스타일?
    >
      <h3>{product.name}</h3>
      <p>{formattedPrice}원</p>
    </div>
  )
}
```

**검증 체크포인트:**

- `any` 타입 → `Product` interface를 정의해야 함
- `useMemo`로 `toLocaleString()` → 이 연산은 가벼워서 메모이제이션 불필요
- 인라인 스타일로 hover 처리 → CSS `:hover` 또는 Tailwind `hover:opacity-80`이 더 적절
- 컴포넌트가 **hover 상태를 위해 useState를 쓰고 있음** → CSS로 해결 가능한 것을 JS로 처리

> **AI에게 "고쳐줘"라고 하지 말고, 위의 판단을 먼저 한 뒤 직접 수정하세요.**
> 

---

# 🛠 개발 환경 세팅

## ESLint v9 Flat Config

> ESLint v9부터 `.eslintrc.*` 형식은 deprecated됐습니다. 새 프로젝트에서는 `eslint.config.mjs` (Flat Config)를 사용합니다.
> 

```jsx
// eslint.config.mjs
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      'no-unused-vars': 'off',                       // TS가 처리
      '@typescript-eslint/no-unused-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',         // Hook 규칙 필수
      'react-hooks/exhaustive-deps': 'warn',          // 의존성 배열 경고
      'react/jsx-no-target-blank': 'error',
    },
  },
]
```

- **QNA — Flat Config가 뭐가 다른가요?**
    
    기존 `.eslintrc`는 파일 확장자(`.js`, `.json`, `.yml`)마다 다른 형식이었고, `extends`와 `overrides`로 복잡하게 설정을 합쳤습니다. Flat Config는 **JS 배열 하나**로 모든 설정을 표현합니다. 더 직관적이고, IDE 자동완성도 잘 됩니다.
    

## lint/format 자동화 — husky + lint-staged

> 커밋할 때마다 자동으로 lint/format을 실행하면, 코드 리뷰에서 스타일 논쟁이 사라집니다.
> 

```bash
# AI에게 설정을 요청하는 예시
> husky + lint-staged를 설정해줘.
> pre-commit hook에서 eslint --fix와 prettier --write가 staged 파일에만 실행되도록.
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,json,md}": ["prettier --write"]
  }
}
```

> **왜 lint-staged인가?** 전체 프로젝트가 아니라 **커밋하려는 파일에만** lint를 돌립니다. 대규모 프로젝트에서도 커밋 속도가 느려지지 않습니다.
> 

## 에러 메시지 해석 습관

ESLint나 TypeScript 에러가 나면 AI에게 설명을 요청하세요. 단, **에러를 이해한 후 직접 수정**합니다.

```bash
# ✅ 좋은 사용법
> 이 ESLint 에러가 왜 나는지 설명해줘: "React Hook useEffect has a missing dependency"
> 이 에러의 원인과 해결 방법 2가지를 알려줘. 각각의 트레이드오프도.

# ❌ 나쁜 사용법
> 이 에러 고쳐줘  ← 이해 없이 수정만 하면 같은 실수를 반복
```

- **QNA — "exhaustive-deps" 경고, 무시해도 되나요?**
    
    무시하면 안 됩니다. 이 규칙은 useEffect의 의존성 배열이 불완전하면 **stale closure**(오래된 값을 참조하는 클로저)가 발생할 수 있다고 경고합니다. 대부분의 경우 경고대로 의존성을 추가하면 됩니다. 하지만 "의존성을 추가하면 무한 루프가 발생하는데?"라는 상황이 오면, **그건 useEffect의 사용 자체가 잘못된 것**일 가능성이 높습니다.
    

## 커밋 컨벤션

```
feat: 상품 목록 페이지 구현
fix: 필터 초기화 시 정렬 상태 유지되는 버그 수정
refactor: ProductCard 컴포넌트 분리
style: Prettier 포맷팅 적용
test: 상품 목록 로딩 상태 테스트 추가
chore: ESLint 팀 설정 적용
docs: README에 폴더 구조 설명 추가
```

> **커밋 메시지는 "이 커밋이 왜 필요한가"를 설명해야 합니다.** `fix: 버그 수정`은 나쁜 메시지입니다. "어떤 버그를 어떻게 고쳤는지"가 메시지에 드러나야 합니다.
> 

---

<aside>
📚

**References**

</aside>

| 구분 | 링크 |
| --- | --- |
| 🔢 ESLint v9 Flat Config | ESLint Configuration Files |
| ✍️ Conventional Commits | conventionalcommits.org |
| 🧰 Clean Code JavaScript | Ryan McDermott - Clean Code JavaScript |
| 📖 React 공식 문서 | react.dev — You Might Not Need an Effect |
| 🧵 네이밍 가이드 | Naming cheatsheet |
| ⚙️ Claude Code | claude.com/product/claude-code |

> 과제 진행 중 막히면 References를 먼저 참고하고, 그래도 해결되지 않으면 슬랙 스레드에 질문하세요.
> 

<aside>
🌟

**Next Week Preview**

</aside>

> 다음 주에는 **"500줄짜리 컴포넌트"**와 싸웁니다.
UI, 비즈니스 로직, API 호출이 한 파일에 뒤섞인 코드를 분리하며,
**관심사 분리**와 **Custom Hook 설계**의 감각을 키웁니다.
>