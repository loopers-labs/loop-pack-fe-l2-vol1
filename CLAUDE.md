# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ● 프로젝트 개요

Loopers 프론트엔드 과정(TypeScript · React · Next.js)의 과제 제출 레포입니다.
현재 스택: React 19 + Vite + TypeScript. 4주차부터 Next.js로 전환 예정.
패키지 매니저는 **pnpm** 전용 — `npm`/`yarn` 사용 금지.

## ● 주요 명령어

```bash
pnpm install       # 의존성 설치
pnpm dev           # 개발 서버 (Vite HMR)
pnpm build         # tsc -b && vite build
pnpm preview       # 빌드 결과물 미리보기
```

## ● 코드 규칙

- `eslint.config.js` 기준으로 커밋 시 자동 검사
- 새 `any` / `as` / `@ts-ignore` / `eslint-disable` 추가 금지 — 경고를 우회하지 말 것

## ● 네이밍 규칙

- 컴포넌트: PascalCase + 역할이 드러나는 이름 (`ProductCard` ✅ `Card1` ❌)
- 함수: 동사+목적어 (`getFilteredProducts`, `formatPrice`)
- 상수: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `ITEMS_PER_PAGE`)
- boolean: `is/has/should/can` 접두사, 이중 부정 금지 (`notDisabled` ❌)

## ● 컴포넌트 규칙

- 파일 하나에 하나의 export
- Props interface는 컴포넌트 파일 상단에 정의
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

### º 매직 넘버에 이름 붙이기 (네이밍 규칙의 상수 규칙과 동일)

```text
// ❌
if (retryCount > 3) { /* ... */ }

// ✅
const MAX_RETRY_COUNT = 3;
if (retryCount > MAX_RETRY_COUNT) { /* ... */ }
```

### º 로직의 시점 이동 줄이기

- 추상화 레이어는 View → ViewModel → Model 3단계를 기본으로 유지한다.
- 레이어를 타고 들어가야만 로직을 이해할 수 있는 구조를 피한다.
- API 호출 + 비즈니스 로직 + UI 렌더링을 한 컴포넌트에 혼재시키지 않는다.

```text
// ✅ ViewModel과 View 분리
function useUserVM(id: string) {
  const { data, isLoading } = useQuery(userQueries.detail(id));
  const displayName = data ? data.name.toUpperCase() : '';
  return { displayName, isLoading };
}

function UserProfile({ id }: Props) {
  const { displayName, isLoading } = useUserVM(id);
  if (isLoading) return <Loading />;
  return <div>{displayName}</div>;
}
```

### º 기타

- 이름에 의도가 드러나야 한다 (`data` / `temp` / `flag` 지양)
- 한 함수/컴포넌트는 한 가지 책임
- `catch(e) {}` 빈 catch 금지 — 에러를 명시적으로 처리
- 기존 유틸 재사용 — 유사한 코드 중복 생성 금지
- `any` 타입 사용 금지 — 명시적 타입 정의

## ● 보안 규칙

- `target="_blank"` 사용 시 반드시 `rel="noreferrer"` 함께 명시 — 탭내빙(tabnabbing) 방지 (`react/jsx-no-target-blank`: **error**)
- `dangerouslySetInnerHTML` 사용 금지 — XSS 취약점 (`react/no-danger`: **error**)

## ● Never Do

- 의도 없는 네이밍 금지 (`data`, `temp`, `doStuff`, `Comp`, `Card1`)
- 삼항 연산자 3중 중첩 금지
- 역할 없는 pass-through 레이어 추가 금지
