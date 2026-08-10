# 파일, export, AI 협업 규칙

## When to read

파일을 만들거나 나누고, export를 설계하거나, 공용 유틸리티를 추가하고, AI 생성 코드를 제출할 때 읽는다.

## Source of truth

파일과 export의 정적 제약은 `eslint.config.mjs`가 우선한다. FSD slice의 외부 노출과 import 경계는 [`../architecture/imports-and-public-api.md`](../architecture/imports-and-public-api.md)를 따른다.

## Rules

### 코드 작성과 파일 구성

- **본인이 설명할 수 없는 코드는 제출하지 않는다.**
- AI가 생성한 코드도 머지하는 순간 작성자의 코드다. 코드의 의도, 타입, 상태 전이, 에러 처리, 접근성 영향, 검증 결과를 설명할 수 있어야 한다.
- 이름은 의도를 드러내야 한다. `data`, `temp`, `flag`, `value`처럼 맥락 없는 이름을 피한다.
- 함수와 컴포넌트는 한 가지 책임을 가져야 한다.
- 비슷한 유틸리티, 훅, 컴포넌트를 새로 만들기 전에 기존 구현을 먼저 찾는다.
- 에러는 삼키지 않는다. 처리하거나, 사용자에게 보여주거나, 상위 계층으로 명시적으로 전파한다.
- 하나의 컴포넌트나 동작만을 위해 함께 움직이는 타입, 상수, 작은 helper는 같은 파일에 둔다. 파일이 커지거나 재사용성이 생길 때만 폴더로 승격하고 내부 파일로 나눈다.

### Export와 이름

- 재사용 모듈은 named export를 사용한다.
- 파일 이름은 기본적으로 그 파일에서 내보내는 대표 export 이름을 그대로 따른다. 예: 타입은 `SelectOption.ts`에서 `SelectOption`, 컴포넌트는 `SelectTrigger.tsx`에서 `SelectTrigger`, 훅은 `useSelectRootState.ts`에서 `useSelectRootState`, namespace 유틸은 `OptionNavigation.ts`에서 `OptionNavigation`을 export한다.
- default export는 거의 허용하지 않는다. Next 라우트 파일, ESLint/Next 설정 파일처럼 외부 도구가 default export를 요구하는 파일만 예외로 둔다.
- FSD slice/entity root에는 `index.ts` Public API를 만들지 않는다. 이 저장소의 직접 파일 import 정책과 유일한 컴포넌트 폴더 예외는 [`../architecture/imports-and-public-api.md`](../architecture/imports-and-public-api.md)에만 정의한다.
- 공개 의도가 없는 내부 구현 파일은 다른 slice나 상위 레이어에서 import하지 않는다.
- 공용 유틸리티는 비슷한 동작끼리 namespace class의 static method로 묶는다. 예: `MoneyUtils.format`, `DateRangeUtils.contains`. 외부로 공개되는 유틸리티를 top-level standalone 함수로 흩뿌리지 않는다. React custom hook은 예외로 두되, React 규약이 드러나도록 `use[A-Z0-9]...` 이름의 function으로 공개한다.

### AI 협업

- AI가 만든 코드는 직접 읽고 설명 가능해야 한다.
- AI가 추가한 의존성, 유틸리티, 상태, effect는 왜 필요한지 검증한다.
- PR이나 리뷰 요청에는 AI가 생성한 부분과 직접 수정한 부분을 명시한다.

## Verification

- 새 파일과 대표 export의 이름이 일치하는지 확인한다.
- 기존 구현을 중복하지 않았고, 폴더 승격이 크기·재사용·책임 분리로 정당화되는지 확인한다.
- AI 생성 부분의 의도와 검증 결과를 설명할 수 있는지 확인한다.

```bash
pnpm lint
pnpm typecheck
```
