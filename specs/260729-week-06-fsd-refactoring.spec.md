# 6주차 FSD 리팩토링 스펙

## 목표

5주차까지 만든 커머스의 동작을 그대로 보존하면서 FSD 구조로 리팩토링한다.
과제 필수 6항목(RFC 선행 → FSD 전환 → Public API 결정 → 에러 경계 설계 → 삭제 시나리오 검증 → PR)에 더해:

- 0단계 동작 기준선을 확인하고 RFC에 기록한다 (버그 발견 시 구조 변경과 커밋 분리, `재현·원인·수정 위치·검증` 기록)
- Advanced A(의존성 하네스)를 단계에 포함한다
- FSD 구조 결정이 서면 그 규칙을 skill/규칙으로 만든다 (architecture-review SKILL 등)

## 비범위

- `processes` 레이어, `src/pages` 디렉터리, 빈 폴더·미사용 `index.ts`
- `src/app/api` mock 백엔드의 FSD 전환 (스타터 보존, 프론트/mock 경계만 RFC에 설명)
- 발생할 수 없는 실패의 억지 처리 (로그인 없음 → 401/403류는 "해당 없음 · 향후 조건" 기록)
- Advanced B(변경 반경 실험) — 기본 완성 후 별도 결정
- 이번 주에 하지 않을 최적화 (RFC O에 기록)

## 확정 목표

단계별 계획을 이 스펙에 명시하고, 각 단계의 검증 기준을 함께 둔다.
FSD 이해가 쌓여 프로젝트 적용 방식이 정해지는 시점에 그 규칙을 ESLint와 skill로 고정한다.

## 조사 결과

현재 구조는 "feature 폴더" 단계다 — 기능별로 모였지만 의존 규칙이 없다.

### 레이어 후보와 현재 위치

- `src/features/products/` — **entity성(ProductCard, queries, api, constants)과 page성(HomeContent, ProductList, ProductListFilters, ProductSearchForm, search-params, product-list-params)이 혼재** (`src/features/products/`)
- `src/features/cart/`, `src/features/wishlist/` — slice + Count + ToggleButton (행위 feature 후보)
- `src/shared/ui/dialog·select/` — 4주차 공통 UI. 이미 FSD `shared/ui` 세그먼트 위치에 부합
- `src/shared/` — api-client, get-query-client (도메인 무관, shared 부합)
- `src/types/commerce.ts` — 통짜 도메인 타입 파일, **12개 파일이 import** (최다 참조). 결정표 대상
- `src/app/` — Next 라우팅 + demos(4주차 데모 페이지) + providers
- `src/examples/week-05-layout/` — 스타터 참고용 예제

### 의존 규칙 위반 지점 (FSD 기준 수술 대상)

- **`ProductCard` → `CartToggleButton`·`WishlistToggleButton` 직접 import** (`src/features/products/ProductCard.tsx:3-4`) — 발제 Case 1의 ❌ 패턴 그대로. entity→feature 역방향이 될 지점. actions 주입 + 상위 조합으로 전환 필요
- **`shared/store.ts` → `features/cart/cart-slice`·`features/wishlist/wishlist-slice` import** (`src/shared/store.ts:5-9`) — shared가 feature를 아는 역방향. bound store(slice 조합) + persist(validatedStorage·migrate·skipHydration) + useSavedStore가 한 파일. store 위치 결정표의 실물 대상
- `app/(home)/page.tsx`·`app/products/page.tsx` → features 직접 조합 — 조합 책임 위치는 맞으나 라우트 파일이 얇지 않음 (Next 명명 규칙: 얇은 진입점 + `_pages` 분리 검토)

### 에러·로딩 처리 현황 (4단계 갭)

- 인라인 처리만 존재: `ProductList.tsx:49-63`·`HomeContent.tsx:22-25`가 `isError` + `error.message` + 재시도 버튼 — **인라인 재시도는 이미 충족**
- **`error.tsx`·`loading.tsx`·`throwOnError`·Error Boundary 없음** — 4단계의 경계 전파/인라인 기준, 라우트 에러 경계는 전부 신규 작업
- `usePageClamp`로 페이지 초과 보정 (`ProductList.tsx:30-39`)

### 하네스·검증 자산

- ESLint flat config (`eslint.config.mjs`) — `eslint-plugin-import-x` 사용 중, `import-x/no-cycle` 이미 켜짐. Advanced A 도구는 조사 후 D3에서 결정 (최종: eslint-plugin-boundaries)
- 테스트: queries·search-params·product-list-params·store 3종·api-client·dialog·select + `e2e/dialog.spec.ts` + api route 테스트 — 이동 후 통과가 동작 보존 증거
- `pnpm check` = test + lint + typecheck + build

## 결정 사항

- D1: **4주차·스타터 자산은 전환 범위 제외** (`src/app/demos`, `src/examples/week-05-layout`, `src/shared/ui/dialog·select`) — shared/ui는 이미 FSD `shared/ui` 세그먼트 위치에 부합하고, demos는 라우트·examples는 스타터 참고물. RFC R의 "하지 않을 것"에 근거와 함께 기록. 삭제 시나리오 검증도 커머스 기능으로 한정.
- D2: **RFC의 "직접 결정" 항목은 후보+트레이드오프를 에이전트가 정리해 제시하고 최종 결정은 사용자가 내린다** — 애매한 파일 5개 결정표·store 위치·Public API 사용 여부·에러 표 등이 과제의 핵심 학습 지점이므로. 발제 Case 2의 논리/유리/리스크 비교 형식.
- D3(개정): **Advanced A 하네스는 `eslint-plugin-boundaries`** — 처음엔 새 의존성 없이 import-x 수제 zone으로 구현했으나 생태계 조사 후 전용 플러그인으로 전환. 근거: 슬라이스 자동 인식, importer별 진입점 제어(fileInternalPath)로 @x 통로와 index.server.ts를 정확히 표현, 파일 시스템 기준 해석이라 상대 경로와 동적 import 우회까지 커버. skill만으로는 "자동 검증" 요건(결정적 게이트)을 충족하지 못하므로 하네스(기계 강제)와 skill(구조 판단 보조)의 분리는 유지.
- D4: **단계 순서는 RFC 확정 → 규칙(하네스)·skill 작성 → 마이그레이션** — 사용자 의도: FSD 이해와 프로젝트 적용 방침이 정해진 시점에 그걸 규칙과 skill로 고정하고, 그 규칙의 가이드를 받으며 이동한다. 이동 완료 전 하네스는 warn 수준(또는 이동한 레이어부터 error)으로 두고 완료 시 error 승격 — 세부는 하네스 단계에서 결정.

## 완료 조건

- [ ] `docs/rfc/week06-fsd.md`가 **파일 이동 전 커밋**에 존재하고 RADIO 5절·0단계 기준선 결과·상태 분류표·파일 매핑표·애매한 파일 5개 이상 결정표·에러 표·Public API 결정을 포함한다
- [ ] src가 RFC에서 결정한 FSD 레이어 구조로 재배치되고, 하위→상위 import 0건·같은 레이어 슬라이스 간 직접 import 0건이다 (entities 간 `@x` 공인 통로만 예외, 하네스 통과로 증명)
- [ ] `ProductCard`가 cart/wishlist 코드를 import하지 않고 action 주입을 받으며, 조합은 상위 레이어에 있다
- [ ] `eslint-plugin-boundaries` 하네스(레이어 방향, 슬라이스 격리, 진입점 제한)가 켜져 있고, error 승격 시점에 위반 재현이 lint를 실패시키는 증거와 최종 통과 증거가 기록된다
- [ ] 에러 표의 "전파하는가" 열과 `throwOnError` 구현이 일치하고, route `error.tsx`의 재시도가 동작하며, 인라인 재시도가 유지되고, 검증용 임시 throw가 제거됐다
- [ ] `loading.tsx`/Suspense와 `isPending`의 로딩 범위 구분(또는 하나만 쓰는 이유)이 기록된다
- [ ] 삭제 시나리오 2건(위시리스트 제거·신상품 뱃지)의 파일 목록 답변이 RFC에 있고 grep 대조와 일치한다
- [ ] FSD 이해 확인 질문 6개에 RFC 또는 PR에서 각 2~4문장으로 답한다
- [ ] architecture-review SKILL이 존재하고, 점검 실행 후 지적의 수용/반려가 근거와 함께 기록된다
- [ ] 기존 테스트가 이동 후에도 전부 통과하고 `pnpm check`(test+lint+typecheck+build)가 통과한다
- [ ] (버그 발견 시) 구조 변경과 분리된 커밋 + `재현·원인·수정 위치·검증` 기록

## 태스크 (단계별 계획)

- T1: **Phase 0 — 동작 기준선 고정**: 기준선 5항목(상태 4종 화면 / 목록 조건 4종 / URL 3종 / cart·wishlist 동기화·유지 / `pnpm check`) 확인, 결과를 RFC 초안에 기록 — fulfills: 완료 조건 1
- T2: **Phase 1 — RFC 작성(RADIO)**: 결정 항목별 후보+트레이드오프 제시 → 사용자 결정(D2) → `docs/rfc/week06-fsd.md` 완성 → **이동 전 커밋** — fulfills: 완료 조건 1
- T3: **Phase 2 — 하네스·skill 작성(D4)**: eslint-plugin-boundaries 정책 작성 + architecture-review SKILL 작성 — fulfills: 완료 조건 4, 9
- T4: **Phase 3 — FSD 마이그레이션**: RFC의 단계별 계획대로 이동, 매 단계 기존 테스트 + `pnpm check` 통과 확인. ProductCard action 주입 전환·store 위치 이동 포함 — fulfills: 완료 조건 2, 3, 10
- T5: **Phase 4 — 에러 경계 구현**: RFC 에러 표 기반 `throwOnError` 기준·`error.tsx`·로딩 경계 구분 구현, 실패 직접 재현 검증 — fulfills: 완료 조건 5, 6
- T6: **Phase 5 — 삭제 시나리오 자가 검증**: 사고실험 답변 작성 → grep 대조 → 파편화 처리 결정 → RFC 기록 — fulfills: 완료 조건 7
- T7: **Phase 6 — AI 점검·마무리**: SKILL로 구조 점검(수용/반려 기록), 이해 질문 6개 답변, 하네스 error 승격 — fulfills: 완료 조건 8, 9
- T8: **Phase 7 — PR**: Before/After 구조·검증 결과·AI 표기 정리 — fulfills: 과제 6번
