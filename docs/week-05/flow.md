# 5주차 구현 플로우 — 무엇을 어떤 순서로 해야 하나

과제 명세(`docs/assignments/week-05.md`)가 방대해서, "지금 코드가 어떤 상태이고 → 무엇을 → 어떤 순서로" 만들면 되는지 정리한 실행용 문서다.

## 진행 현황 & 남은 작업 (체크리스트 점검 결과)

아래 "빌드 순서" 0~4단계는 **모두 구현 완료**됐고, Advanced A(상태 영속화)·B(서버 프리패치)까지 붙였다. [checklist.md](./checklist.md) 대조에서 **미완으로 남은 항목**은 다음과 같다.

1. ~~[미구현] nuqs `history: "push"`~~ **→ 완료.** `productListParsers`의 q·category·sort·page에 `withOptions({ history: 'push' })`를 적용해, 단일 원본을 쓰는 모든 `useQueryStates` 호출부가 상속하게 했다. q는 300ms debounce가 끝난 확정 검색어만 push하므로 글자마다 히스토리가 쌓이지 않는다. 런타임에서 뒤로/앞으로 시 이전 조건·검색어·select 값이 복원됨을 확인했다.

2. **[부분] staleTime·gcTime 근거** — 현재 staleTime은 자리표시자(홈 5분·목록 1분)이고 gcTime은 기본값 그대로다. 데이터 변경 빈도를 기준으로 값과 근거를 확정해 [state-design.md](./state-design.md)에 남겨야 한다.

3. **[부분] 검증 명령** — `pnpm check` 스크립트는 이 저장소에 없다. 기본 검증(`pnpm lint`, `pnpm exec tsc --noEmit`)은 통과했으나 `pnpm test`(Playwright e2e)와 `pnpm build`는 아직 돌리지 않았다. 제출 전 e2e·빌드를 실행할지 정한다.

> C(사용자 경험 개선)·D(테스트)는 선택하지 않았으므로 해당 체크 항목은 N/A다.

---

## 지금 상태: 두 페이지 다 "가짜 껍데기"

`src/app/page.tsx`와 `src/app/products/page.tsx`는 하드코딩된 가짜 데이터만 그리고 있고, 실제 API와 연결이 하나도 안 돼 있다.

- `page.tsx` — `price: 0`, `brand: '브랜드'`, 같은 이미지 반복. 진짜 데이터 아님
- `products/page.tsx` — `Array.from({ length: 8 })`로 만든 가짜 목록, `총 0개` 고정
- `src/api/home`, `src/api/products`(클라이언트 호출 계층)는 이미 만들어져 있으나 **아무도 안 쓰고 있음**
- `QueryClientProvider`, `NuqsAdapter`, Zustand store → **셋 다 아직 없음** (`searchParams.ts`의 nuqs parser만 있고 미사용)

정적 목업 상태라 플로우가 안 그려지는 게 당연하다. 이 과제는 이 껍데기에 **상태를 흐르게** 만드는 일이다.

## 과제의 본질: 상태를 4개 서랍에 나눠 담기

기능 구현보다 "각 상태를 **어디에** 둘지" 정하는 게 핵심이다.

| 서랍             | 담는 것                                     | 도구           | 예시                           |
| ---------------- | ------------------------------------------- | -------------- | ------------------------------ |
| ① 서버 상태      | 서버가 원본인 데이터                        | TanStack Query | 홈 배너, 상품 목록             |
| ② URL 상태       | 공유·새로고침·뒤로가기로 복원돼야 하는 조건 | nuqs           | 검색어, 카테고리, 정렬, 페이지 |
| ③ 전역 클라 상태 | 여러 페이지가 공유하는 값                   | Zustand        | 장바구니, 위시리스트           |
| ④ 로컬 상태      | 한 화면에서만 쓰는 일시적 값                | `useState`     | 모달 열림 여부                 |

과제의 `상태 · 소유자 · 수명 · 공유 범위 · 선택 이유` 표는 이 4분류를 직접 써보라는 것이다.

## 데이터가 흘러야 하는 그림

```
[① 서버 상태]  상품목록 페이지
   URL(?category=casual&sort=popular&page=2)   ← ② nuqs가 여기 읽고 씀
        │
        ▼
   useGetProductList(params)   ← 이미 만들어둔 src/api/products/service.ts
        └ fetch('/api/products?...') → route.ts → 진짜 데이터
        ▼
   ProductGrid에 진짜 데이터 뿌림 (지금 가짜 배열 자리)

[③ 전역]  상품카드의 [담기] 버튼 → Zustand store에 추가
                                        │
              Header의 장바구니 개수 ◀──┘ (store에서 파생, 따로 저장 X)
```

## 해야 할 일 (빌드 순서)

### 0단계 — 배선 (이게 없으면 나머지 다 안 됨)

- `layout.tsx`에 `QueryClientProvider` + `NuqsAdapter`를 감싼다 → Providers 컴포넌트를 하나 만든다

### 1단계 — 홈 (서버 상태만)

- `page.tsx`의 하드코딩 배열을 삭제하고 `useGetHome()`으로 배너·카테고리·인기상품·신상품을 받아 뿌린다
- 로딩·에러·빈 상태 3개를 구분한다

### 2단계 — 상품 목록 (서버 + URL 상태)

- `products/page.tsx`에서 `useQueryStates(productListParsers)`로 검색·카테고리·정렬·페이지를 URL과 동기화한다
- 그 값을 `useGetProductList()`에 넘겨 진짜 목록·페이지네이션을 표시한다
- 검색·카테고리·정렬이 바뀌면 page를 1로 리셋한다

### 3단계 — 장바구니·위시리스트 (전역 상태)

- Zustand store를 만든다 (담기/빼기)
- 상품 카드 버튼 = 해당 상품 상태 + action만 구독 / Header = 개수만 구독(파생, 별도 저장 X)

### 4단계 — 검증

- URL 공유·새로고침·뒤로가기 시 조건이 복원되는지
- 페이지 이동해도 장바구니가 유지되는지

## 범위 메모

- **Advanced(A~D)는 무시한다.** 기본 과제를 먼저 끝내는 게 우선이다.
- 시작점은 무조건 **0단계 배선**. 그게 돼야 서버 데이터가 화면까지 흐르기 시작한다.
- 상세 장바구니 페이지, 상품 수량, 합계 금액은 이번 범위 밖이다.

---

_이 문서는 사용자와의 대화에서 정리한 구현 플로우를 AI(Claude)가 작성했습니다. 코드 현황 확인(어떤 파일이 연결/미연결인지)도 AI가 조사한 내용입니다._
