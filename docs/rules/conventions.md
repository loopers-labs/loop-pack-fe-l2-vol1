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
- 배열 타입은 `string[]`나 `Foo[]` 대신 `Array<string>`, `Array<Foo>`처럼 제네릭 표기를 사용한다. 불변 배열은 `ReadonlyArray<Foo>`를 사용한다.
- 객체 리터럴의 타입을 맞추기 위해 `as`로 밀어 넣지 않는다. 값이 타입 계약을 만족하는지 확인할 때는 `satisfies`를 우선한다.
- UI 상태가 여러 필드를 함께 바꾸는 상태 기계라면 단순 string union보다 discriminated union을 우선한다. 예: `{ status: 'success'; data: Data } | { status: 'error'; error: Error }`.
- 타입만 사용하는 import는 `import type`을 사용한다.
- 사용하지 않는 변수와 매개변수는 제거한다. 의도적으로 사용하지 않는 매개변수는 `_name` 형태로 표시한다.

## 데이터와 런타임 검증

- 외부에서 들어오는 데이터는 신뢰하지 않는다. 서버 응답, route/search params, form payload, localStorage/sessionStorage, 환경 변수처럼 런타임에 깨질 수 있는 값은 경계에서 Zod schema로 검증한다.
- Zod는 런타임 검증 라이브러리이므로 `dependencies`에 둔다. 기본 import는 공식 문서와 맞춰 `import * as z from 'zod'`를 사용한다.
- 검증 실패를 즉시 예외로 처리해도 되는 경계에서는 `schema.parse(input)`을 사용한다. 사용자 피드백이나 분기 처리가 필요한 흐름에서는 `schema.safeParse(input)`으로 성공/실패를 명시적으로 나눈다.
- schema에서 파생되는 타입은 `z.infer<typeof Schema>`로 만든다. schema와 별도의 수동 타입을 중복 선언하지 않는다.
- API 응답 형태는 DTO/plain object로 표현한다. DTO는 전송 형식의 이름과 모양을 보존하고, 도메인 규칙이나 메서드를 갖지 않는다.
- 금액, 기간, 장바구니 항목, 상품 가격처럼 검증/계산/포맷/비교/상태 전이가 있는 데이터는 domain model 또는 value object로 감싼다.
- DTO를 domain model/value object로 바꾸는 일은 API adapter, entity model, custom hook 같은 경계 근처에서 처리한다. React 컴포넌트 본문에서 `new Product(...)`, `new Money(...)`처럼 직접 인스턴스화하지 않는다.
- TanStack Query cache에는 기본적으로 검증된 DTO/plain object를 둔다. class instance를 cache 전반에 퍼뜨리면 직렬화, devtools, structural sharing, hydration 동작을 이해하기 어려워지므로 필요한 사용 지점에서 domain object로 변환한다.

## React

- 이 프로젝트는 React Compiler를 Vite 빌드 파이프라인에 연결해 둔다. 컴포넌트와 훅은 먼저 순수하고 예측 가능하게 작성하고, 수동 memoization을 기본값으로 삼지 않는다.
- `useMemo`, `useCallback`, `React.memo`는 기본 성능 습관으로 추가하지 않는다. 측정된 렌더링 병목이 있거나, memoized child/context value/custom hook 반환값처럼 참조 안정성이 실제 계약인 경우에만 사용하고 이유를 설명한다.
- React 컴포넌트는 `function ComponentName()` 선언을 기본으로 한다. 화살표 함수 컴포넌트는 HOC callback처럼 이름 없는 함수가 필요한 경우에만 사용한다.
- 재사용 가능한 컴포넌트는 명확한 props 타입을 가진다. props 타입은 인라인 객체 타입 대신 컴포넌트 위에 이름 있는 type alias로 분리한다. 예: `type ProductCardProps = { ... }`.
- 상태와 그 상태를 사용하는 로직이 함께 생기면 커스텀 훅으로 분리한다. 컴포넌트 본문에는 JSX를 이해하는 데 필요한 최소한의 분기와 이벤트 연결만 두고, 상태 전이, 파생값 계산, effect, 비동기 호출, 여러 핸들러가 엮인 로직은 `useFeatureName` 형태의 훅으로 이동한다.
- boolean prop이 늘어나 컴포넌트 상태 조합이 복잡해지면 컴포넌트 분리나 composition을 우선 검토한다.
- 이벤트 핸들러는 동작 의도가 드러나는 이름을 사용한다. 예: `handleSubmit`, `handleIncrement`.
- 조건부 렌더링은 JSX 안에서 `&&`, `||`, `??`, 중첩 ternary를 섞지 않는다. 조건을 화면에 드러내야 하면 `@ilokesto/utilinent`의 `Show`를 사용한다.
- 목록 렌더링은 JSX 안에서 직접 `.map()`을 펼치지 않고 `@ilokesto/utilinent`의 `For`를 사용한다. 렌더링되는 item에는 안정적인 key를 제공한다. index key는 순서가 절대 바뀌지 않는 정적 목록에만 허용한다.
- suspense boundary와 error boundary는 `@suspensive/react`의 `Suspense`, `ErrorBoundary`를 사용한다. `React.Suspense`, class 기반 error boundary, `react-error-boundary`를 새로 도입하지 않는다.
- TanStack Query의 suspense data fetching은 `@suspensive/react-query`의 `SuspenseQuery`, `SuspenseQueries`, `SuspenseInfiniteQuery` 컴포넌트를 우선 사용한다. 이 프로젝트는 TanStack Query v5를 쓰므로 `@suspensive/react-query` import를 `@suspensive/react-query-5` npm alias로 설치한다. `useSuspenseQuery`/`useSuspenseInfiniteQuery` 훅으로 suspense 발생 지점을 내부 컴포넌트에 숨기지 않는다.
- `dangerouslySetInnerHTML`은 기본적으로 금지한다. 꼭 필요하면 입력 신뢰 경계와 sanitizing 근거를 코드 리뷰에서 설명해야 한다.

## 파일과 export

- 하나의 컴포넌트나 동작만을 위해 함께 움직이는 타입, 상수, 작은 helper는 같은 파일에 둔다. 파일이 커지거나 재사용성이 생길 때만 폴더로 승격하고 내부 파일로 나눈다.
- 재사용 모듈은 named export를 사용한다.
- default export는 거의 허용하지 않는다. 프레임워크가 요구하는 entry point, Vite/ESLint 설정 파일처럼 외부 도구가 default export를 요구하는 파일만 예외로 둔다.
- FSD slice 외부에서 접근해야 하는 API는 slice의 public API(`index.ts`)로 노출한다.
- `index.ts` public API는 `export { Name } from './path'`처럼 명시적으로 나열한다. `export * from './path'`는 slice 경계를 흐리므로 금지한다.
- 내부 구현 파일을 다른 slice나 상위 레이어에서 deep import하지 않는다.
- 공용 유틸리티는 비슷한 동작끼리 namespace class의 static method로 묶는다. 예: `MoneyUtils.format`, `DateRangeUtils.contains`. 외부로 공개되는 유틸리티를 top-level standalone 함수로 흩뿌리지 않는다.

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
