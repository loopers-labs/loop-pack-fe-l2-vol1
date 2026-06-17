# Tailwind CSS v4 스킬 가이드

이 프로젝트는 Tailwind CSS v4 + Vite 플러그인을 사용한다.

## 설정 방식 (v4)

- `tailwind.config.js` 파일 없음 — CSS 파일 내 `@theme`으로 관리
- Vite 플러그인: `@tailwindcss/vite`
- 진입 CSS: `@import "tailwindcss";`

```css
@import "tailwindcss";

@theme {
  --color-brand: #3b82f6;
  --font-sans: 'Pretendard', sans-serif;
}
```

## v4 주요 변경 사항 (v3 대비)

### 새 유틸리티·변형

- `inset-shadow-*`, `inset-ring-*`: 내부 그림자·링
- `field-sizing-content`: textarea 자동 높이
- `not-*`: `:not()` 선택자 변형
- `in-*`: 부모 상태 기반 스타일링 (`group` 대체 가능)
- `@starting-style`: 진입 애니메이션

### 제거·변경된 것

- `@apply` 사용 가능하나 권장하지 않음 — 유틸리티 클래스 직접 사용 우선
- `theme()` 함수 대신 CSS 변수(`var(--color-brand)`) 사용
- `@tailwind base/components/utilities` → `@import "tailwindcss"` 한 줄로 대체
- `darkMode: 'class'` 설정 → `@custom-variant dark (&:where(.dark, .dark *));`로 대체

### 테마 확장

```css
@theme {
  --color-primary: #2563eb;
  --color-primary-light: #60a5fa;
  --breakpoint-xs: 30rem;
  --spacing-18: 4.5rem;
  --font-display: 'Pretendard', sans-serif;
}
```

토큰 정의 후 `text-primary`, `xs:`, `mt-18`, `font-display` 등으로 사용.

## 클래스 작성 규칙

### 동적 클래스 — `clsx` 또는 `tailwind-merge` 사용

```tsx
import { clsx } from 'clsx';

<button
  className={clsx(
    'rounded px-4 py-2 text-sm font-medium',
    isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700',
  )}
/>
```

### 금지 패턴 — 동적 클래스명 조립

```tsx
// 금지 — 빌드 시 감지 불가
const color = 'blue';
<div className={`text-${color}-600`} />

// 권장 — 완전한 클래스명 사용
const className = isBlue ? 'text-blue-600' : 'text-red-600';
```

### 금지 패턴 — 문자열 보간 조건부

```tsx
// 금지
<button className={`btn ${isActive ? 'bg-blue-600' : ''}`} />

// 권장
<button className={clsx('btn', isActive && 'bg-blue-600')} />
```

## 반응형

- 모바일 우선: `sm:` → `md:` → `lg:` → `xl:` 순서
- 일관된 순서 유지

```tsx
<div className="w-full md:w-1/2 lg:w-1/3" />
```

## 다크모드

- `dark:` 변형 사용

```tsx
<p className="text-gray-900 dark:text-gray-100" />
```

## 컴포넌트 스타일 범위

- 컴포넌트 고유 복잡한 스타일만 CSS Modules(`.module.css`) 허용
- 전역 스타일은 `app/` 레이어 진입 CSS에서만 작성
- Tailwind로 표현 가능한 것은 유틸리티 클래스 우선

## 자주 쓰는 패턴

### 레이아웃

```tsx
// 중앙 정렬 컨테이너
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" />

// Flexbox 중앙
<div className="flex items-center justify-center" />

// Grid
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" />
```

### 트랜지션

```tsx
<div className="transition-colors duration-200 hover:bg-gray-100" />
```

### 스크롤 영역

```tsx
<div className="overflow-y-auto scrollbar-thin" />
```
