## 💡 제1원칙

- **설명할 수 없는 코드는 커밋하지 않는다.**
- AI가 작성한 코드도 머지하는 순간 작성자의 코드이며, "AI가 짜줬다"는 변명이 되지 않는다.
- AI 시대의 병목은 '쓰는 속도'가 아니라 **'그럴듯하게 틀린 코드를 읽고 판별하는 능력'**이다.
- **책임 모델**:
  - 👤 **작성자**: 정확성·버그·동작의 1차 책임 전부 (최종 책임)
  - 🔍 **리뷰어**: 설계 조언·리스크 식별·지식 공유 (버그 부재 보장 ✗)
  - 🤖 **기계 (ESLint/Format)**: 컨벤션·포맷·타입·테스트 통과 보장 (정확한 동작 보장 ✗)
- ※ 아래 기준들은 기계가 잡을 수 없는 **'의미 판단'**의 영역이므로, AI와 사람 모두 스스로 점검해야 한다.

---

## 🛠️ 7개 코드 품질 기준

### 1. 의도가 이름에 드러난다

- `data`, `temp`, `flag`, `value` 같은 모호한 이름은 절대 사용 금지.

```ts
// ❌ 나쁜 예
const flag = user.age >= 18;

// ✅ 좋은 예
const isAdult = user.age >= 18;
```

### 2. 한 함수/컴포넌트가 한 가지 일을 한다

- **점검 질문**: 함수 이름 뒤에 "and"를 붙여도 자연스럽게 말이 되는가? (예: `validateAndSubmit` ➡️ 분리 필요)

### 3. 파생 가능한 값은 계산한다 (최중요)

- `useState` + `useEffect`로 상태를 중복 동기화하지 말고, 렌더링 시점에 직접 계산할 것.

```tsx
// ❌ 나쁜 예
const [first, setFirst] = useState("");
const [last, setLast] = useState("");
const [fullName, setFullName] = useState("");
useEffect(() => setFullName(`${first} ${last}`), [first, last]);

// ✅ 좋은 예
const [first, setFirst] = useState("");
const [last, setLast] = useState("");
const fullName = `${first} ${last}`;
```

### 4. 타입이 코드를 설명한다

- `any`로 타입을 회피하지 않고, 도메인의 의미를 담아 명확하게 선언할 것.

```ts
// ❌ 나쁜 예
function getUser(id: any): any { ... }

// ✅ 좋은 예
function getUser(id: UserId): User { ... }
```

### 5. 조건부 렌더링은 early return으로

- 단, React Hooks 규칙 준수를 위해 모든 hook 호출이 끝난 직후에 배치할 것.

```tsx
// ❌ 나쁜 예
function Profile({ userId }: Props) {
  if (!userId) return null;
  const [user, setUser] = useState<User | null>(null);
}

// ✅ 좋은 예
function Profile({ userId }: Props) {
  const [user, setUser] = useState<User | null>(null);
  if (!userId) return null;
}
```

### 6. 에러를 명시적으로 처리한다

- `catch (e) {}`와 같이 에러를 침묵시키지 말고, 로그를 남기거나 사용자에게 명확히 알릴 것.

```ts
// ❌ 나쁜 예
try {
  await saveUser(user);
} catch (e) {}

// ✅ 좋은 예
try {
  await saveUser(user);
} catch (e) {
  console.error("사용자 저장 실패:", e);
  setError("저장에 실패했습니다. 다시 시도해주세요.");
}
```

### 7. 기존 코드를 재사용한다

- **AI 지침**: 새 유틸/헬퍼를 만들기 전에 반드시 `src/` 전체를 검색하여 비슷한 기능이 있는지 확인하고 재사용할 것.

---

## 🚫 기계가 강제하는 규칙 & 금지 사항

- **자동 차단 (ESLint Error)**: `rules-of-hooks`, `exhaustive-deps`, `no-explicit-any`, `no-unused-vars`, `ban-ts-comment`, `jsx-key`, `no-empty`
- **불필요한 코드 방치 금지**: 디버깅 로그(`console.log`), 사용하지 않는 클래스/메서드/변수/주석은 커밋 전 반드시 제거할 것.
- **AI 절대 금지 코드**: 아래 주석으로 경고를 우회하지 말고 근본 원인을 수정할 것.
  - `// eslint-disable-next-line`
  - `// eslint-disable`
  - `// @ts-ignore`
  - `// @ts-nocheck`

---

## 🚀 브랜치, 커밋 및 PR 규칙

### 브랜치 생성 규칙

- 항상 `main` 또는 `master` 기준으로 생성하며, **기능 단위**로 브랜치명을 부여한다.
- _형식_: `feature/weekN-기능명`, `fix/weekN-버그명` (예: `feature/week3-order-cancel`)

### 커밋 게이트 & 메시지 규칙

- **커밋 게이트**: Husky `pre-commit` hook (`lint-staged`) 필수 통과 (`--no-verify` 우회 절대 금지).
- **커밋 메시지**: `type: 명확한 동사 + 작업 대상` 구조로 작성 (예: `feat: 주문 생성 기능 구현`, `test: 주문 생성 테스트 코드 추가`).

### PR (Pull Request) 규칙

- **PR 제목**: `[volume-n] 작업 내용 요약` 형식 준수 (예: `[volume-1] 회원가입, 로그인 구현`)
- **PR 필수 본문 작성**: 💬 리뷰 포인트(멘토 집중 검토 사항 3개 이내)를 구체적으로 작성하고, 하단에 다음 문구를 반드시 포함한다.
  > `"○○는 AI로 생성 후 직접 검토·수정했습니다."`

### PR 전 셀프 체크리스트

1. **동작**: Happy path 외에 로딩 / 에러 / 빈 상태 및 **상태 전이**(있다 ➡️ 없다, 성공 ➡️ 실패)까지 검증했는가?
2. **의존성**: import 패키지의 실재 여부, 중복 유틸 생성 여부, hook 의존성 배열의 완전성을 확인했는가?
3. **클린**: 새 any / as / 우회 주석 / eslint-disable / 디버깅 로그가 제거되었는가?
4. **보안/품질**: `dangerouslySetInnerHTML` 또는 입력 무검증 렌더링이 없으며, 기능 구현에 따른 **단위/통합 테스트 코드**가 포함되었는가?


