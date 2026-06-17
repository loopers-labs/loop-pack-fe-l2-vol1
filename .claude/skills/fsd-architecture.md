# FSD (Feature-Sliced Design) 아키텍처 스킬 가이드

이 프로젝트는 [Feature-Sliced Design](https://fsd.how/kr/docs/get-started/overview/) 방법론을 따른다.

## 레이어 구조

```
src/
├── app/        # 진입점, 라우팅, Provider, 전역 스타일
├── pages/      # 라우트 단위 화면 (1 URL = 1 page)
├── widgets/    # 독립적 UI 블록 (여러 feature/entity 조합)
├── features/   # 사용자 가치를 제공하는 기능 단위
├── entities/   # 비즈니스 엔티티 (User, Post, Product 등)
└── shared/     # 전 레이어 공통 유틸·UI·API·타입
```

### 레이어별 역할

| 레이어 | 역할 | 예시 |
|---------|------|------|
| `app` | 앱 초기화, 라우팅, Provider 조합 | `App.tsx`, `router.tsx`, `providers.tsx` |
| `pages` | URL에 대응하는 화면 조립 | `HomePage`, `ProfilePage` |
| `widgets` | 페이지 내 독립 섹션 | `Header`, `Sidebar`, `PostList` |
| `features` | 유저 인터랙션 단위 기능 | `auth/login`, `post/create`, `comment/add` |
| `entities` | 비즈니스 도메인 모델 | `user`, `post`, `comment` |
| `shared` | 재사용 인프라 | `ui/Button`, `api/client`, `lib/format` |

## 의존성 규칙 (핵심)

```
app → pages → widgets → features → entities → shared
```

- **상위 → 하위 방향만 임포트 허용**
- 같은 레이어 내 슬라이스 간 교차 임포트 금지
  - `features/auth` → `features/post` (금지)
  - `features/auth` → `entities/user` (허용)
- `shared`는 어디서든 임포트 가능
- 역방향 의존이 필요하면 설계를 재검토

## 슬라이스 내부 세그먼트

```
features/auth/
├── ui/         # React 컴포넌트, 스타일
├── api/        # 서버 통신 함수, 요청/응답 타입
├── model/      # 상태 관리, 비즈니스 로직, 스토어
├── lib/        # 슬라이스 내부 유틸리티
├── config/     # 슬라이스 설정값 (선택)
└── index.ts    # 공개 API
```

### 세그먼트별 역할

- `ui/` — 표현 계층. 컴포넌트와 스타일만
- `api/` — 서버 통신. fetch 함수, TanStack Query 훅, 타입
- `model/` — 상태·로직. zustand 스토어, 커스텀 훅, 비즈니스 규칙
- `lib/` — 순수 유틸. 이 슬라이스에서만 쓰는 헬퍼
- `index.ts` — 외부에 노출할 것만 re-export

## 공개 API (`index.ts`) 규칙

```tsx
// features/auth/index.ts
export { LoginForm } from './ui/LoginForm';
export { useAuth } from './model/useAuth';
export type { AuthState } from './model/types';
```

- 슬라이스 외부에서는 반드시 `index.ts`를 통해서만 임포트
- 내부 파일 직접 참조 금지

```tsx
// 금지
import { LoginForm } from '@/features/auth/ui/LoginForm';

// 권장
import { LoginForm } from '@/features/auth';
```

## 새 기능 추가 시 판단 기준

1. **어느 레이어에 속하는가?**
   - 비즈니스 엔티티 → `entities`
   - 유저 인터랙션 → `features`
   - 페이지 내 독립 섹션 → `widgets`
   - URL 단위 화면 → `pages`
   - 범용 유틸·UI → `shared`

2. **기존 슬라이스에 추가할 것인가, 새 슬라이스를 만들 것인가?**
   - 같은 도메인/기능 → 기존 슬라이스에 추가
   - 독립된 관심사 → 새 슬라이스 생성

3. **의존성 방향이 올바른가?**
   - 임포트가 항상 아래 레이어를 향하는지 확인

## shared 레이어 구조 예시

```
shared/
├── ui/         # Button, Input, Modal 등 공통 UI
├── api/        # API 클라이언트, 인터셉터, 공통 타입
├── lib/        # 포맷터, 유효성 검증, 날짜 처리
├── config/     # 환경 변수, 상수
└── types/      # 전역 타입 정의
```

## 안티패턴

- `shared`에 비즈니스 로직 넣기 — entities나 features로 이동
- `features` 간 직접 임포트 — 공통 로직은 entities/shared로 내리기
- 거대한 단일 슬라이스 — 책임이 두 개 이상이면 분리
- `index.ts` 없이 내부 파일 직접 임포트
- `pages`에 비즈니스 로직 작성 — widgets/features로 분리
