# CONVENTIONS.md

## 1. 타입

- 모든 함수·컴포넌트에 명시적 반환 타입 작성
- 객체 형태는 `interface`, 유니언·인터섹션은 `type`
- `any` · `!` 사용이 불가피하면 반드시 사유 주석 작성

```ts
// ⚠️ 서버 API 응답 타입 미확정 — 3주차에 교체 예정
const data = res as any
```

## 2. 컴포넌트

- 컴포넌트는 named export (default export 금지)
- 파일당 컴포넌트 1개, 파일명과 컴포넌트명 일치
- Props 타입은 `interface ComponentNameProps` 형식
- 파생값은 state/effect 동기화 말고 렌더 중 계산

```tsx
// Good — 렌더 중 계산
const total = items.reduce((sum, item) => sum + item.price, 0)

// Bad — 불필요한 state
const [total, setTotal] = useState(0)
useEffect(() => setTotal(items.reduce(...)), [items])
```

## 3. 네이밍

| 대상              | 규칙                   | 예시              |
| ----------------- | ---------------------- | ----------------- |
| 컴포넌트          | PascalCase             | `ProductCard`     |
| 훅                | camelCase + use 접두사 | `useCartTotal`    |
| 유틸 함수         | camelCase              | `formatPrice`     |
| 타입 / 인터페이스 | PascalCase             | `OrderItem`       |
| 상수              | UPPER_SNAKE_CASE       | `MAX_RETRY_COUNT` |

## 4. 기타

- 조건부 얼리리턴은 모든 분기에서 통일
- 의미없는 숫자 리터럴 금지 — 상수로 추출
