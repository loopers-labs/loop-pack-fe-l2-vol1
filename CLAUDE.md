# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ● 프로젝트 개요

Loopers 프론트엔드 과정(TypeScript · React · Next.js)의 과제 제출 레포입니다.
React 19 + Vite + TypeScript.
패키지 매니저는 **pnpm** 전용 — `npm`/`yarn` 사용 금지.

## ● 주요 명령어

```bash
pnpm install       # 의존성 설치
pnpm dev           # 개발 서버 (Vite HMR)
pnpm build         # tsc -b && vite build
pnpm preview       # 빌드 결과물 미리보기
```

## ● 코드 규칙

- 코드 변경 전 어떻게 변경할 것인가에 대한 브리핑을 먼저 한다.
- 변경한 코드에 대해 OK를 하지 않으면 적용하지 않는다.
- 브리핑에서 이야기한 코드 위치 외에는 추가 수정하지 않는다.
- 수정한 파일 제일 상단에 `/* AI-generated */` 로 주석 달기
- `eslint.config.js` 기준으로 커밋 시 자동 검사

## ● 네이밍 규칙

- 컴포넌트: PascalCase + 역할이 드러나는 이름 (`ProductCard` ✅ `Card1` ❌)
- 함수: 동사+목적어 (`getFilteredProducts`, `formatPrice`)
- 상수: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `ITEMS_PER_PAGE`)
- boolean: `is/has/should/can` 접두사, 이중 부정 금지 (`notDisabled` ❌)

## ● 상태 분류 기준

- UI 전용 (모달 열림, 탭 선택) → 로컬 상태 (useState)
- URL에 반영되어야 하는 것 (필터, 페이지, 검색어) → URL 상태
- 여러 컴포넌트가 공유해야 하는 것 → Context 또는 전역 상태

## ● 컴포넌트 설계 원칙

- 컴포넌트의 Props가 5개를 넘으면 설계를 재검토
- children을 적극 활용해 합성(Composition) 우선
- Props Drilling이 3단계 이상이면 Context 또는 상태 관리 도입 검토
- HTML 태그를 컴포넌트화 하는 경우, HTML 속성을 확장한다.
- props에 대해서 반드시 JSDoc 주석(/\*\* \*/)을 단다.

## ● 공통 컴포넌트 설계 원칙

- `컴포넌트 설계 원칙`을 따른다.
- 공통 컴포넌트에 비즈니스 로직 포함 금지
- 같은 UI가 3곳 이상 발견시 고려한다.
- 컴포넌트명으로 도메인 용어를 사용하지 않는다.

## ● 컴포넌트 규칙

- 파일 하나에 하나의 export
- Props interface는 컴포넌트 파일 상단에 정의
  - boolean type의 props는 긍정형만 사용한다. : ex) disabled, isOpen
- 이벤트 핸들러: `on{Event}` (Props), `handle{Event}` (내부)
- 조건부 렌더링은 early return 우선 (모든 hook 호출 뒤에서)
- `React.FC` 사용 금지 — Props 타입 직접 정의
  - ❌ `const Component: React.FC<Props> = ({ name }) => ...`
  - ✅ `const Component = ({ name }: Props) => ...`

## ● 코드 리뷰 규칙

- AI가 생성한 코드는 "왜 이렇게 짰는가"를 설명할 수 있어야 함
- 설명할 수 없는 코드는 직접 재작성
- 리뷰 반영 없이 다음 단계로 넘어가지 않음

## ● 코드 품질 기준

- 레이어를 타고 들어가야만 로직을 이해할 수 있는 구조를 피한다.

### º 파생 가능한 값은 계산한다 (최중요 패턴)

`useState` + `useEffect` 동기화 대신 파생값으로 처리한다.

```text
// ❌
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// ✅
const fullName = `${firstName} ${lastName}`;
```

### º 복잡한 조건에 이름 붙이기

```text
// ❌
if (user.age >= 18 && user.hasVerifiedEmail && !user.isBanned) { /* ... */ }

// ✅
const canPurchase = user.age >= 18 && user.hasVerifiedEmail && !user.isBanned;
if (canPurchase) { /* ... */ }
```

### º early return 패턴을 활용

```text
// ✅
if(typeof user.age === 'number') return;
```

### º JSX에서 분기 케이스가 3개 이상일 때 IIFE(즉시 실행 함수 표현) 사용

```text
// ✅
{(() => {
    switch (choice) {
      case 'pizza': return <FastFoodInfo />;
      case 'candy': return <DessertInfo />;
      default: return <div>선택된 항목이 없습니다.</div>;
    }
})()}
```

### º 기타

- 이름에 의도가 드러나야 한다 (`data` / `temp` / `flag` 지양)
- 한 함수/컴포넌트는 한 가지 책임
- 기존 유틸 재사용 — 유사한 코드 중복 생성 금지

## ● Never Do

- 의도 없는 네이밍 금지 (`data`, `temp`, `doStuff`, `Comp`, `Card1`)
- 역할 없는 pass-through 레이어 추가 금지
