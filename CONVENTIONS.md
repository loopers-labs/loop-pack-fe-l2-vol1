# CONVENTIONS.md

## 1. 언어 & 타입

- TypeScript strict 모드 필수 (`"strict": true`)
- `any` 타입 사용 금지 — 모르면 `unknown` 사용
- Non-null assertion(`!`) 사용 금지 — 옵셔널 체이닝(`?.`)·타입가드 사용
- 모든 함수·컴포넌트에 명시적 반환 타입 작성
- type vs interface: 객체 형태는 `interface`, 유니언·인터섹션은 `type`

## 2. 컴포넌트

- 컴포넌트는 named export (default export 금지)
- 파일당 컴포넌트 1개, 파일명과 컴포넌트명 일치
- Props 타입은 `interface ComponentNameProps` 형식
- 훅은 컴포넌트 최상단에 선언, 조건부 호출 금지

```tsx
// Good
interface ButtonProps {
  label: string
  onClick: () => void
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>
}
```

## 3. 파일 구조

```
src/
  components/   # 재사용 UI 컴포넌트
  hooks/        # 커스텀 훅 (use 접두사)
  pages/        # 라우트별 페이지 컴포넌트
  types/        # 공유 타입 정의
  utils/        # 순수 함수 유틸리티
```

## 4. 네이밍

| 대상              | 규칙                   | 예시               |
| ----------------- | ---------------------- | ------------------ |
| 컴포넌트          | PascalCase             | `ProductCard`      |
| 훅                | camelCase + use 접두사 | `useCartTotal`     |
| 유틸 함수         | camelCase              | `formatPrice`      |
| 타입 / 인터페이스 | PascalCase             | `OrderItem`        |
| 상수              | UPPER_SNAKE_CASE       | `MAX_RETRY_COUNT`  |
| CSS 파일          | kebab-case             | `product-card.css` |

## 5. 스타일

- Prettier 설정을 따름 (`semi: false`, `singleQuote: true`, `tabWidth: 2`)
- CSS는 컴포넌트와 같은 폴더에 위치
- 인라인 스타일 사용 금지 — CSS 파일 또는 CSS Modules 사용

## 6. 금지 패턴

```tsx
// ❌ any
const data: any = fetchData()

// ❌ Non-null assertion
const el = document.getElementById('root')!

// ❌ console.log (warn/error만 허용)
console.log('debug')

// ❌ == 대신 ===
if (value == null)
  // ❌ default export
  export default function MyComponent() {}
```
