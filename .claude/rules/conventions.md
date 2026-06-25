# Code Conventions

> 이 파일은 프로젝트에 독립적인 공통 규칙을 담습니다.

---

## 좋은 코드 기준 (공통 품질 기준표)

> "잘 돌아가는 코드"와 "좋은 코드"는 다르다. 작성·리뷰 시 항상 이 기준으로 판별한다.

- 의도가 이름에 드러난다 (`data`/`temp`/`flag` 금지)
- 한 함수/컴포넌트가 한 가지 일을 한다
- **파생 가능한 값은 계산한다** — `useState` + `useEffect`로 동기화하지 않는다 _(최중요 패턴)_
- 조건부 렌더링은 early return으로 진행한다.
- 에러를 명시적으로 처리한다 (`catch(e) {}` 금지)
- 기존 코드를 재사용한다 (예: 비슷한 유틸을 매번 새로 생성 하지않는다.)

---

## 네이밍 규칙

| 대상            | 규칙             | 예시                    |
| --------------- | ---------------- | ----------------------- |
| 클래스          | PascalCase       | `UserService`           |
| 함수/변수       | camelCase        | `getUserById`           |
| 상수            | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`       |
| 타입/인터페이스 | PascalCase       | `CreateUserDto`         |
| 환경변수        | UPPER_SNAKE_CASE | `VITE_API_BASE_URL`     |
| 그 외 폴더      | camelCase        | `components/`, `hooks/` |

- 컴포넌트 내부 핸들러는 _handle_{Action} 형태로 사용한다 (예: handleClick, handleSubmit)
- 핸들러 Props 네이밍은 _on_{Action} 형태로 사용한다
- 매개변수가 2개 초과 시, **객체**로 전달한다

---

## TypeScript 규칙

- `as` 타입 단언은 불가피한 경우에만 최소 사용
- 모든 함수, props, 반환값에 타입 명시
- 복잡한 로직은 JSDoc으로 설명 추가
- 공통 타입 위치: `/src/types/{Domain}/index.ts`

## 최중요 컴포넌트 설계 원칙

> 아래 룰을 판단함에 있어서 모호하면 물어본다

- Props가 5개를 초과하면 설계 재검토를 수행한다
  - 새로운 Props를 추가하기 전에 합성(Composition)으로 해결 가능한지 검토한다
- boolean Props는 반드시 긍정형 네이밍을 사용한다 (예: isOpen, isLoading, hasError)
- 공통 컴포넌트는 비즈니스 로직을 포함하지 않는다
- 공통 컴포넌트는 특정 도메인에 종속되지 않는다
- Props Drilling이 3단계를 초과하면 Context 도입 여부를 검토한다
- 상태 저장 위치를 결정하기 전에 상태 유형(UI, URL, 서버, 공유 상태)을 먼저 분류한다
- 조건부 Props는 optional Props보다 Discriminated Union을 우선 사용한다
- HTML 요소를 확장하는 컴포넌트는 ComponentPropsWithoutRef 사용을 우선 고려한다
- 동일한 코드가 3회 이상 반복되면 리팩토링 또는 공통화를 검토한다
