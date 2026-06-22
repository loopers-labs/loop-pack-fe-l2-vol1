---
name: conventions
description: 프로젝트 컨벤션
allowed-tools: Read
model: sonnet
---

# Conventions

> 이 파일은 프로젝트에 독립적인 공통 규칙을 담습니다.
> 프로젝트별 컨벤션은 이 파일을 확장하여 작성합니다.

---

## 좋은 코드 기준 (공통 품질 기준표)

> "잘 돌아가는 코드"와 "좋은 코드"는 다르다. 작성·리뷰 시 항상 이 기준으로 판별한다.

- 의도가 이름에 드러난다 (`data`/`temp`/`flag` 금지)
- 한 함수/컴포넌트가 한 가지 일을 한다
- **파생 가능한 값은 계산한다** — `useState` + `useEffect`로 동기화하지 않는다 _(최중요 패턴)_
- 타입이 코드를 설명한다 (`any`로 회피 금지)
- 조건부 렌더링은 early return으로 (단, **모든 hook 호출 뒤에서**)
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

### 함수명 패턴

```
이벤트 핸들러: handle{Action}   (예: handleClick, handleSubmit)
데이터 정제:   get{Target}CleansingData
```

---

## TypeScript 규칙

- `any` 사용 **금지**
- `as` 타입 단언은 불가피한 경우에만 최소 사용
- 매개변수가 2개 이상이면 **객체**로 전달
- 모든 함수, props, 반환값에 타입 명시
- 복잡한 로직은 JSDoc으로 설명 추가
- 공통 타입 위치: `/src/types/{feature}/index.ts`
- API 응답 타입은 response object 유무와 관계없이 **API 명세 기준** 유지

---

## Export 규칙

- 외부에서 사용되지 않는 함수/타입은 export 금지
- `index.ts`는 외부에 노출할 항목만 re-export
- named as export 사용 예시:

```typescript
export { default as HistoryModal } from './History';
```
