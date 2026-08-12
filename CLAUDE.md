# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ● 프로젝트 개요

Loopers 프론트엔드 과정(TypeScript · React · Next.js)의 과제 제출 레포입니다.
React 19 + Vite + TypeScript.
패키지 매니저는 **pnpm** 전용 — `npm`/`yarn` 사용 금지.

## ● 주요 명령어

```bash
pnpm install       # 의존성 설치
pnpm dev           # 개발 서버 (Vite HMR)
pnpm build         # tsc -b && vite build
pnpm preview       # 빌드 결과물 미리보기
```

## ● 코드 규칙

- 코드 변경 전 어떻게 변경할 것인가에 대한 브리핑을 먼저 한다.
- 변경한 코드에 대해 OK를 하지 않으면 적용하지 않는다.
- 브리핑에서 이야기한 코드 위치 외에는 추가 수정하지 않는다.
- 수정한 코드를 함수단위로 `/* AI-generated */` 주석 달기
- `/* AI-generated */`는 파일을 수정서 지우지 않는다.
- `eslint.config.js` 기준으로 커밋 시 자동 검사

## ● 네이밍 규칙

- 컴포넌트: PascalCase + 역할이 드러나는 이름 (`ProductCard` ✅ `Card1` ❌)
- 함수: 동사+목적어 (`getFilteredProducts`, `formatPrice`)
- 상수: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `ITEMS_PER_PAGE`)
- boolean: `is/has/should/can` 접두사, 이중 부정 금지 (`notDisabled` ❌)

## ● 상태 분류 기준

- UI 전용 (모달 열림, 탭 선택) → 로컬 상태 (useState)
- URL에 반영되어야 하는 것 (필터, 페이지, 검색어) → URL 상태
- 여러 컴포넌트가 공유해야 하는 것 → Context 또는 전역 상태

## ● 컴포넌트 설계 원칙

- 컴포넌트의 Props가 5개를 넘으면 설계를 재검토
- children을 적극 활용해 합성(Composition) 우선
- Props Drilling이 3단계 이상이면 Context 또는 상태 관리 도입 검토
- HTML 태그를 컴포넌트화 하는 경우, HTML 속성을 확장한다.
- props에 대해서 반드시 JSDoc 주석(/\*\* \*/)을 단다.

## ● 공통 컴포넌트 설계 원칙

- `컴포넌트 설계 원칙`을 따른다.
- 공통 컴포넌트에 비즈니스 로직 포함 금지
- 같은 UI가 3곳 이상 발견시 고려한다.
- 컴포넌트명으로 도메인 용어를 사용하지 않는다.

## ● 컴포넌트 규칙

- 파일 하나에 하나의 export
- Props interface는 컴포넌트 파일 상단에 정의
  - boolean type의 props는 긍정형만 사용한다. : ex) disabled, isOpen
- 이벤트 핸들러: `on{Event}` (Props), `handle{Event}` (내부)
- 조건부 렌더링은 early return 우선 (모든 hook 호출 뒤에서)
- `React.FC` 사용 금지 — Props 타입 직접 정의
  - ❌ `const Component: React.FC<Props> = ({ name }) => ...`
  - ✅ `const Component = ({ name }: Props) => ...`

## ● 코드 리뷰 규칙

- AI가 생성한 코드는 "왜 이렇게 짰는가"를 설명할 수 있어야 함
- 설명할 수 없는 코드는 직접 재작성
- 리뷰 반영 없이 다음 단계로 넘어가지 않음

## ● 코드 품질 기준

- 레이어를 타고 들어가야만 로직을 이해할 수 있는 구조를 피한다.
- 파생 가능한 값은 useState + useEffect 대신 변수로 계산한다
- View는 그리기만 한다 — 매핑, 분기, 계산은 호출부가 책임진다
- 복잡한 조건에는 이름을 붙인다
- 조건부 렌더링은 early return 우선
- JSX에서 분기 케이스가 3개 이상이면 IIFE 사용
- 이름에 의도가 드러나야 한다 (`data` / `temp` / `flag` 지양)
- 한 함수/컴포넌트는 한 가지 책임
- 기존 유틸 재사용 — 유사한 코드 중복 생성 금지

> 구체적인 ✅/❌ 예시는 ~/.claude/skills/component-review/SKILL.md 참고

## ● 성능 측정(Lighthouse) 규칙

- **공식 수치는 사용자가 브라우저로 직접 측정한 값이다.** AI가 CLI(headless)로 측정한 값은 참고용·1차 확인용으로만 쓰고, 문서에도 "AI 1차 측정(참고)"처럼 구분해 표기한다 — headless CLI 실행은 확장 프로그램·실제 GPU·실제 캐시 상태가 없는 실제 브라우저 환경과 다를 수 있음이 실측으로 확인됨(같은 코드에서 600~700ms 차이).
- **측정 프로토콜 고정(Part 1 이후 라운드부터 적용)**: 과거 라운드(Part 1의 Round 0~headerfix 등)마다 도구·환경이 달랐던 걸 소급 통일하지 않는다 — 그 시점 기록으로 그대로 두고 서로 ms 단위로 직접 비교하지 않는다. 대신 이후 모든 라운드는 아래로 고정한다:
  - 도구: Lighthouse CLI가 아니라 **크롬 DevTools 패널**에서 사용자가 직접 실행
  - 브라우저 프로필: 항상 **시크릿 창**
  - URL: 홈은 `/`, 상품목록은 `/products`(쿼리 없이) 고정 — 쿼리 변형 테스트는 별도로 라벨링해 구분
  - viewport·throttling: DevTools Performance 패널 기준 **network throttling "Fast 4G"**, 실제 디바이스의 DPR 그대로(에뮬레이션으로 DPR 1 강제하지 않음) — 2026-08-06 상품목록 측정에서 이 조건으로 처음 고정함
  - 포트: 같은 비교 라인 안에서는 항상 동일 포트 유지
  - 타이밍이 걸린 스크린샷(filmstrip 등)도 이 규칙을 따른다 — 사용자가 DevTools Performance 패널의 "Screenshots" 옵션으로 직접 녹화한다. 상태·동작 확인용 스크린샷(에러 배너 노출 여부 등 ms와 무관한 것)은 AI가 캡처해도 무방하다.
- Before/After 모두 production build(`pnpm build && pnpm start`)로 실행한다.
- 홈 cold load 기준으로 같은 viewport, 같은 CPU·network throttling 조건에서 Lighthouse를 5회 실행한다.
- FCP·LCP·CLS는 5회 raw 값과 중앙값·최솟값·최댓값을 모두 남긴다.
- Lighthouse 점수나 향상률에 합격선(threshold)을 두지 않는다.
- 반드시 개선 후 체크할 것:
  - LCP element
  - Performance filmstrip에서 Header·페이지 제목·Hero 표시 순서
  - Network waterfall에서 document·홈 데이터·Hero 이미지의 요청 시작 순서와 전송 크기
  - `/api/products?scenario=slow`에서 "데이터 없는 최초 진입"과 "기존 목록이 있는 갱신"을 각각 녹화
  - 검색·카테고리·정렬·페이지를 빠르게 연속으로 바꾼 뒤: 현재 URL의 active query와 화면 결과가 일치하는지, 이전 요청이 늦게 끝나도 현재 화면을 덮지 않는지 확인하고, 취소된 요청은 별도로 관찰
- 관찰-가설-반증-변경은 각각 한 문장으로 기록한다: 관찰한 사실 / 원인 가설 / 가설을 반증할 방법 / 가장 먼저 시도할 가장 작은 변경.
- Before/After의 commit SHA는 각각 기록한다. SHA를 제외한 나머지 측정 조건(URL·query string, 행동, viewport, CPU·network throttling, 브라우저·Lighthouse 버전, cold/warm navigation, 브라우저 프로필)은 Before/After에서 반드시 동일하게 유지한다.

## ● Never Do

- 의도 없는 네이밍 금지 (`data`, `temp`, `doStuff`, `Comp`, `Card1`)
- 역할 없는 pass-through 레이어 추가 금지
