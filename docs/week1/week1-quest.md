> **Phase**: 무기 장착 (독립 카타)
> 

---

## 🤖 AI 활용: CLAUDE.md 작성

### Claude Code 설치 및 CLAUDE.md 작성

프로젝트에 `CLAUDE.md` 파일을 생성하고, 아래 내용을 본인 스타일에 맞게 작성합니다.

- **기술 스택 및 버전** — Claude 프롬프트로 작성 가능
- **컴포넌트 작성 규칙** (예시)
    
    ```markdown
    ## 컴포넌트 규칙
    - 컴포넌트 파일 하나에 하나의 export
    - Props interface는 컴포넌트 파일 상단에 정의
    - 이벤트 핸들러 네이밍: on{Event} (Props) / handle{Event} (내부)
    - 조건부 렌더링은 early return 패턴 우선
    ```
    
- **코드 리뷰 규칙**
    
    ```markdown
    ## 코드 리뷰
    - AI가 생성한 코드는 반드시 "왜 이렇게 짰는가"를 설명할 수 있어야 함
    - 설명할 수 없는 코드는 직접 재작성
    - 리뷰 반영 없이 다음 단계로 넘어가지 않음
    ```
    

---

<aside>
🛠

**Task**

</aside>

## 📝 Implementation Quest

> Phase 0 사전 과제 코드를 본인이 직접 구두 설명하는 세션으로 시작합니다.
> 

> 이후, 멘토가 제공하는 별도 React 프로젝트에서 문제점을 찾아 개선합니다.
> 

### 제공 코드 스펙 (멘토 제작 가이드)

Phase 0의 리팩토링 카타와 다른, **별도의 프로젝트**를 제공합니다.

**규모**: React 컴포넌트 3~5개, 총 600~800줄

**포함해야 할 의도적 문제점:**

| # | 문제 유형 | 구체적 예시 | 학습 포인트 |
| --- | --- | --- | --- |
| 1 | **ESLint/Prettier 미설정** | 들여쓰기 혼재 (탭/스페이스), 세미콜론 불일치 | 팀 코드 품질 도구의 필요성 (ESLint v9 Flat Config 기준) |
| 2 | **네이밍 안티패턴** | `const comp = ()`, `function doStuff()`, `let x` | 의도가 드러나는 네이밍 |
| 3 | **커밋 컨벤션 부재** | git log에 "수정", "작업중", "ㅇㅇ" 같은 메시지 | Conventional Commits |
| 4 | **불필요한 상태** | `const \[isTrue, setIsTrue\] = useState(a > b)` 처럼 파생 가능한 값을 state로 관리 | 파생 상태 vs 독립 상태 |
| 5 | **any 타입 남용** | Props, API 응답, 이벤트 핸들러에 `any` 사용 | TypeScript 타입 안전성 |
| 6 | **컴포넌트 내 직접 fetch** | `useEffect(() => \{ fetch('/api/...') \}, \[\])` | API 레이어 분리 필요성 인지 (R2 복선) |
| 7 | **조건부 렌더링 중첩** | 삼항 연산자 3중 중첩 | 가독성 개선, early return |
| 8 | **console.log 잔재** | 디버깅용 로그가 곳곳에 남아있음 | 코드 정리 습관 |

### 과제

1. 제공된 프로젝트에서 **문제점 5가지 이상** 찾아 개선 PR 제출
2. ESLint/Prettier 팀 설정 적용
3. Conventional Commits 컨벤션으로 커밋
4. PR 설명에 **"왜 이렇게 고쳤는가"** 근거 필수 작성
5. **Claude Code를 활용**하되, AI가 제안한 수정을 그대로 수용하지 말고 "왜 이 수정이 맞는가"를 본인이 판단

---

## ✅ Checklist

### 코드 품질

- [ ]  ESLint/Prettier 팀 설정이 적용되고 에러 없이 통과하는가
- [ ]  의미 없는 변수명/함수명이 의도가 드러나는 이름으로 개선되었는가
- [ ]  불필요한 상태(파생 가능한 값의 useState)가 제거되었는가
- [ ]  any 타입이 적절한 타입으로 대체되었는가
- [ ]  console.log, 디버깅 코드가 제거되었는가

### AI 활용

- [ ]  CLAUDE.md에 기술 스택, 컴포넌트 규칙, 코드 리뷰 규칙 3개 섹션이 작성되어 있는가

### 프로세스

- [ ]  Conventional Commits 컨벤션을 따르는가
- [ ]  PR 본문에 각 변경의 근거가 작성되어 있는가

### 동료 리뷰

- [ ]  동료 2인 이상의 PR에 질문형 리뷰를 작성했는가
- [ ]  받은 리뷰를 반영한 리팩토링 커밋이 있는가

---

## ✍️ Technical Writing Quest

### Feature Suggestions

- "잘 짠 코드"와 "돌아가는 코드"의 차이 — 이번 주 경험을 기반으로
- ESLint 룰 하나를 깊이 파보기 (예: `no-unused-vars`가 왜 중요한가)
- AI가 생성한 코드를 검증하면서 느낀 점 — 어떤 부분에서 AI를 신뢰할 수 있고, 어디서 못 하는가
- Conventional Commits를 도입해보니 달라진 점