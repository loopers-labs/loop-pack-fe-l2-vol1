# 프로젝트 컨벤션

이 저장소는 Loopers 프론트엔드 과정의 과제 제출과 피드백을 위한 React/TypeScript 프로젝트입니다. 현재는 React 19 + Vite + TypeScript 기반이며, 이후 Next.js로 전환될 수 있습니다.

## 제1원칙

**본인이 설명할 수 없는 코드는 제출하지 않는다.**

AI가 생성한 코드도 머지하는 순간 작성자의 코드입니다. 코드의 의도, 타입, 상태 전이, 에러 처리, 접근성 영향, 검증 결과를 설명할 수 있어야 합니다.

## 코드 작성 원칙

- 이름은 의도를 드러내야 한다. `data`, `temp`, `flag`, `value`처럼 맥락 없는 이름을 피한다.
- 함수와 컴포넌트는 한 가지 책임을 가져야 한다.
- 파생 가능한 값은 상태로 저장하지 말고 계산한다.
- `useEffect`는 외부 시스템과 동기화할 때만 사용한다. 렌더링 가능한 값을 맞추기 위한 동기화 effect를 만들지 않는다.
- 조건부 렌더링은 가능한 한 early return을 사용하되, React Hook 호출 순서는 항상 보존한다.
- 비슷한 유틸리티, 훅, 컴포넌트를 새로 만들기 전에 기존 구현을 먼저 찾는다.
- 에러는 삼키지 않는다. 처리하거나, 사용자에게 보여주거나, 상위 계층으로 명시적으로 전파한다.

## TypeScript

- `any`, `as any`, 타입 주석 우회(`@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`)를 사용하지 않는다.
- 타입은 구현을 설명해야 한다. 불명확한 union, 과도한 optional, 의미 없는 `Record<string, unknown>` 남용을 피한다.
- 타입만 사용하는 import는 `import type`을 사용한다.
- 사용하지 않는 변수와 매개변수는 제거한다. 의도적으로 사용하지 않는 매개변수는 `_name` 형태로 표시한다.

## React

- 재사용 가능한 컴포넌트는 명확한 props 타입을 가진다.
- boolean prop이 늘어나 컴포넌트 상태 조합이 복잡해지면 컴포넌트 분리나 composition을 우선 검토한다.
- 이벤트 핸들러는 동작 의도가 드러나는 이름을 사용한다. 예: `handleSubmit`, `handleIncrement`.
- 리스트 렌더링에는 안정적인 key를 사용한다. index key는 순서가 절대 바뀌지 않는 정적 목록에만 허용한다.
- `dangerouslySetInnerHTML`은 기본적으로 금지한다. 꼭 필요하면 입력 신뢰 경계와 sanitizing 근거를 코드 리뷰에서 설명해야 한다.

## 파일과 export

- 재사용 모듈은 named export를 우선한다.
- 프레임워크가 요구하는 entry point나 현재 `App.tsx` 같은 bootstrap 파일은 default export를 허용한다.
- FSD slice 외부에서 접근해야 하는 API는 slice의 public API(`index.ts`)로 노출한다.
- 내부 구현 파일을 다른 slice나 상위 레이어에서 deep import하지 않는다.

## 스타일링

- 현재 프로젝트는 전역 CSS와 일반 CSS 파일을 사용한다.
- 색상, 폰트, 공통 토큰은 가능한 한 CSS custom properties로 표현한다.
- focus 스타일은 제거하지 않는다. 커스텀 interaction을 만들면 `:focus-visible`을 함께 설계한다.
- 반응형 처리는 컴포넌트/섹션 스타일 근처에 배치해 변경 맥락을 유지한다.
- inline style은 런타임 계산값처럼 CSS로 표현하기 어려운 경우에만 사용한다.

## AI 협업 규칙

- AI가 만든 코드는 직접 읽고 설명 가능해야 한다.
- AI가 추가한 의존성, 유틸리티, 상태, effect는 왜 필요한지 검증한다.
- PR이나 리뷰 요청에는 AI가 생성한 부분과 직접 수정한 부분을 명시한다.
