# Project Rules — commerce (Next.js App Router)

## 컴포넌트 설계 원칙

- 컴포넌트의 Props가 5개를 넘으면 설계를 재검토
- children을 적극 활용해 합성(Composition) 우선
- Props Drilling이 3단계 이상이면 Context 또는 상태 관리 도입 검토
- 공통 컴포넌트는 비즈니스 로직을 포함하지 않음

## Next.js 규칙

- 기본은 서버 컴포넌트. "use client"는 상태/이벤트/브라우저 API가 필요한
  컴포넌트에만, 트리의 말단(leaf)에 가깝게 선언한다
- 내부 이동은 next/link, 이미지는 next/image를 사용한다 (ESLint가 강제)
- 데이터 fetching은 서버 컴포넌트에서 우선 시도하고, 클라이언트 fetch는 근거가 있을 때만

## 상태 분류 기준

- 서버에서 오는 데이터 → 서버 상태 (추후 TanStack Query)
- UI 전용 (모달 열림, 탭 선택) → 로컬 상태 (useState)
- URL에 반영되어야 하는 것 (필터, 페이지, 검색어) → URL 상태
- 여러 컴포넌트가 공유해야 하는 것 → Context 또는 전역 상태

## 도구

- 커밋은 반드시 사전 커밋(lint-staged)을 통과해야 하며,
  `--no-verify` 옵션으로 이를 건너뛸 수 없다.
