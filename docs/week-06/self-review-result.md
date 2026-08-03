# 6주차 Self Review 결과

> `/self-review` 실행 결과 기록. `git diff origin/develop...HEAD` 기준, `pnpm build`·`pnpm lint`·`pnpm test`·`pnpm exec tsc --noEmit` 실행.

**최초 판정: PASS → 피드백 재검토: 보완 필요**

## 기능 완성도

- [x] RFC(RADIO) 작성 및 이동 전 커밋 — `docs/rfc/week06-fsd.md` (OK)
- [x] FSD 전환 + 기존 기능 보존 — `pnpm test` 47/47, 홈/목록 동작 diff 상 손실 없음 (OK)
- [x] 애매한 파일 5개 이상 후보 비교 — RFC 결정표 (OK)
- [x] Public API 결정 기록 — 각 슬라이스 `index.ts` + RFC/decisions.md 근거 (OK)
- [x] 에러 처리 경계 설계 + 검증 — 4단계 표, `RootErrorFallback` 실제 재현·복구 확인 완료 (OK)
- [x] 삭제 시나리오 자가 검증 — RFC 5단계 (OK)
- [x] Source of Truth 유지 — persist 키(`cart`/`wishlist`) 그대로, TanStack Query↔Zustand 복사 없음 (OK)
- [x] `pnpm check` 통과 — test/lint/typecheck/build 개별 실행 전부 통과 (OK)

## 정적 검사

- `pnpm build`: PASS
- `pnpm lint`: PASS
- `pnpm test`: PASS (47/47)
- `pnpm exec tsc --noEmit`: PASS

## 지적 사항 (심각도순)

- `[Major / 해결]` `src/entities/product/ui/product-option-select/*`, `src/shared/ui/select/*`, `src/shared/ui/Dialog/*` — decisions가 소비처와 계획이 없다고 결론 내렸는데도 코드를 남긴 것은 과제의 미사용 코드 판단 기준과 충돌했다. 최초 리뷰에서 삭제 대상으로 찾고도 `[개선]`으로 낮추고 `PASS`를 유지한 판정도 잘못이었다. 피드백 반영에서 관련 12개 파일을 삭제했다.
- `[Major / 해결]` `eslint/fsd.config.mjs` — FSD 설정이 존재하지 않는 `src/app`을 가리켜 실제 루트 `app/`이 검사 범위 밖이었다. 루트 라우트를 include하고 `app/api`를 별도 element로 분리해 `_pages` 의존을 차단했다.
- `[Minor / 해결]` `src/entities/product/index.ts` — 외부 소비처가 없는 `PRODUCT_CATEGORY_FILTERS`를 Public API에서 제거했다. parser 내부 정의는 유지한다.
- `[Major / 해결]` `docs/week-06/decisions.md` — ProductCard의 작업 트리 시도와 실제 커밋 이동을 구분해 기록했다.

최초 self-review는 문제를 일부 발견하고도 완료 판정에 반영하지 못했으므로 결과적으로 통과로 볼 수 없다. 피드백 반영 후 정적 검사 결과는 아래에 별도로 기록한다.

## 피드백 반영 후 재검증 (2026-08-03)

**최종 판정: PASS**

- `pnpm lint`: PASS
- `pnpm exec tsc --noEmit`: PASS
- 변경 문서·설정·Public API 파일 Prettier 검사: PASS
- 임시 위반 파일을 이용한 `app/api → _pages` 경계 검사: 의도한 `boundaries/dependencies` 오류 탐지 후 검증 파일 제거
- 삭제 경로의 실행 코드 참조: 0건
- `PRODUCT_CATEGORY_FILTERS`의 슬라이스 외부 소비처: 0건, Public API re-export 제거 완료

이번 재검증에서는 런타임 동작, 빌드, 테스트를 다시 실행하지 않았다. 삭제된 UI는 실행 소비처가 없고 나머지 변경은 lint 하네스·Public API·문서이므로 정적 검사 범위에서 확인했다.

## 피드백 반영 커밋 후 self-review 재실행 (2026-08-03 20:26 KST)

**최종 판정: FAIL** (미해결 Major 2건)

### 검토 범위

- 현재 브랜치: `feat/week-06` / base 브랜치: `origin/develop`
- base commit: `60613a7ff3e21412d48ea4f410a679fdf79ba388`
- HEAD commit: `8f89313592369ab02678a8009c513257c15a35b2`
- `git status --short`: 출력 없음 (작업 트리 clean, staged·untracked 변경 없음)
- 범위: `origin/develop...HEAD` 커밋 diff 전체. 이번 회차의 델타는 `85ad7c6`~`8f89313` 5개 커밋

### 🟠 Major

- `src/entities/product/index.ts:8-9` — `productQueries`·`productQueryKeys`의 슬라이스 외부 소비처가 0건이다. 두 심볼은 `api/service.ts`와 `api/queries.ts` 내부에서만 쓰이는데, "여러 화면이 같은 캐시를 공유해야 하므로 queryOptions를 공개한다"는 주석이 존재하지 않는 소비 관계를 근거로 제시한다. 직전 커밋에서 같은 기준으로 `PRODUCT_CATEGORY_FILTERS`만 제거하고 동일 기준을 어기는 형제 export는 남겼다. (Public API 최소성)
- `src/entities/product/index.ts:12` — `GetProductListParams` 타입도 슬라이스 외부 소비처가 0건이다. 외부는 `useProductListQuery(searchParams)`에 구조적으로 맞는 객체를 넘길 뿐 타입을 import하지 않는다. (Public API 최소성)

### 💡 Suggestions

- `src/widgets/product-card/index.ts:5` — `ProductCardItem`도 현재 외부 import가 없다. 다만 `ProductGrid`의 props 계약 타입이라 위 두 건과 성격이 다르므로, 제거 대신 "props 계약으로 공개한다"는 근거를 주석에 남기는 편이 낫다.
- `docs/week-06/decisions.md:121` — `isSoldOut`을 `shared/lib/is-sold-out.ts`로 복원했다는 서술만 있고, 이후 `8867617`에서 `entities/product/model/product-option.ts`로 흡수됐다가 최종 삭제로 사라진 상태가 명시되어 있지 않다. 151번 절에 한 줄 추가하면 흐름이 닫힌다.

### 별도 실측 항목

| 항목              | 확인 방법                                                                                                                                    | 결과                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 미사용 코드       | 삭제 12개 파일의 심볼·경로를 `rg`로 재검색                                                                                                   | 실행 코드 참조 0건                                                                  |
| Public API 최소성 | 슬라이스 `index.ts`의 각 export별 외부 소비처 검색                                                                                           | 위 Major 2건·Suggestion 1건 발견                                                    |
| 자동화 유효성     | `rg --files src app` 결과와 ESLint `files`·`include`·element pattern 대조 후, `app/api/_probe.ts`·`app/_probe.ts` 임시 파일로 실제 탐지 확인 | `app/api → _pages` 차단, `app → _pages` 허용. 확인 후 두 파일 삭제, 작업 트리 clean |
| 역사적 사실       | `git show --stat 30f0dc3`으로 decisions.md:191 서술 대조                                                                                     | `components → features/product-card` 직접 이동과 일치                               |

### 6단계 통과 요약

| 단계             | 결과                                                               |
| ---------------- | ------------------------------------------------------------------ |
| 동작             | ✅                                                                 |
| 의존성           | ✅                                                                 |
| 타입·린트 침묵   | ✅ (이번 델타의 신규 `any`/`as`/`@ts-ignore`/`eslint-disable` 0건) |
| 표면적           | ✅                                                                 |
| Next 경계        | ✅                                                                 |
| 문서-코드 동기화 | ✅                                                                 |

### 정적 검사

- `pnpm lint`: PASS
- `pnpm exec tsc --noEmit`: PASS
- 실행하지 않음: `pnpm build`, `pnpm test`, `pnpm test:e2e` — 이번 델타가 삭제·lint 설정·Public API re-export·문서에 한정되어 정적 검사로 범위가 닫히고, CLAUDE.md의 검증 기준상 사용자가 요청한 경우에만 실행한다.

### Major 2건 반영 (2026-08-03)

`src/entities/product/index.ts`에서 `productQueries`·`productQueryKeys`·`GetProductListParams` export를 제거하고, queryOptions 공개를 전제로 쓰인 주석을 실제 공개 범위에 맞게 고쳤다. `api/queries.ts`·`api/model.ts`의 내부 정의는 그대로 두고 슬라이스 안에서 계속 사용한다. 반영 후 `pnpm lint`, `pnpm exec tsc --noEmit`, Prettier 검사 모두 PASS.

**반영 후 판정: PASS** (Suggestions 2건은 미반영)

### 남은 위험

- 런타임 확인하지 않음. 다만 이번 델타에 화면 코드 변경은 없다.

_이 회차의 재실행은 AI(Claude)가 수행했습니다. base·HEAD 확정, 삭제 심볼 재검색, export별 외부 소비처 검색, ESLint 경계 규칙의 임시 위반 파일 탐지 확인, `30f0dc3` 커밋 대조는 AI가 실행했고, 발견 사항의 심각도 판단과 후속 조치 여부는 제가 결정합니다._

## 주석 정합성 점검 후 self-review 재실행 (2026-08-03 21:00 KST)

**최종 판정: PASS** (Critical·Major 0건)

### 검토 범위

- 현재 브랜치: `feat/week-06` / base 브랜치: `origin/develop`
- base commit: `60613a7ff3e21412d48ea4f410a679fdf79ba388`
- HEAD commit: `8f89313592369ab02678a8009c513257c15a35b2`
- `git status --short`: 미커밋 수정 6건 (`docs/rfc/week06-fsd.md`, `docs/week-06/self-review-result.md`, `src/_pages/product-list/model/useProductFilters.ts`, `src/entities/product/index.ts`, `src/entities/product/model/category.ts`, `src/shared/api/query-client.ts`)
- 범위: `origin/develop...HEAD` 커밋 diff + 위 미커밋 작업 트리 변경. staged·untracked 변경 없음

### 이번 회차에 해결한 항목

- `src/entities/product/model/category.ts:3` — 존재하지 않는 `docs/week-06/entity-decisions.md`를 근거 문서로 가리켰다. 파일 참조를 빼고 재검토 조건을 주석에 직접 적었다.
- `src/_pages/product-list/model/useProductFilters.ts:11` — FSD 전환으로 사라진 `src/hooks`를 대비 대상으로 서술했다. `shared/lib`의 범용 훅과 대비하도록 고쳤다.
- `src/shared/api/query-client.ts:5` — 클라이언트 QueryClient 위치를 `providers.tsx`로 적었다. 실제 경로 `_app/providers/Providers.tsx`로 고쳤다.
- `docs/rfc/week06-fsd.md:377` — Public API 표가 제거된 `productQueries`를 공개 열에 남겨두고 있었다. 비공개 열로 옮겼다.

### 💡 Suggestions (이월, 미반영)

- `src/widgets/product-card/index.ts:5` — `ProductCardItem`은 외부 import가 없지만 `ProductGrid`의 props 계약 타입이다. 제거 대신 공개 근거를 주석에 남기는 편이 낫다.
- `docs/week-06/decisions.md:121` — `isSoldOut`이 `shared/lib/is-sold-out.ts` 복원 이후 `product-option.ts`로 흡수됐다가 최종 삭제된 상태가 명시되어 있지 않다.

### 별도 실측 항목

| 항목              | 확인 방법                                                                                                                                                                                                                                          | 결과                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 미사용 코드       | 모든 슬라이스 Public API 심볼과 shared 모듈의 실행 코드 소비처를 `rg`로 검색                                                                                                                                                                       | `ProductCardItem` 외 전부 실제 소비처 존재. 소비처 0인 실행 코드 없음 |
| Public API 최소성 | 슬라이스별 `index.ts` export를 소비처와 1:1 대조                                                                                                                                                                                                   | 직전 회차 Major 2건 해소 확인, 신규 위반 0건                          |
| 자동화 유효성     | 이번 회차에 `eslint/fsd.config.mjs` 변경 없음. 직전 회차의 probe 검증 결과를 유지                                                                                                                                                                  | `app/api → _pages` 차단 유효                                          |
| 역사적 사실       | 코드 주석이 가리키는 모든 `docs/`·`src/`·`app/` 경로의 실재 여부를 일괄 확인                                                                                                                                                                       | 위 3건 수정 후 MISSING 0건                                            |
| 주석-코드 정합성  | `useSuspenseHomeQuery` 이름, `CategoryId` 5개 고정, `ProductGridSkeleton`의 index key, `clearOnDefault: false`, `ProductCard`의 Server Component 유지, `app/error.tsx`의 `'use client'` 필요성, `Product`의 `sizes`·`rating`·`createdAt` 필드 언급 | 전부 실제 코드와 일치                                                 |

### 6단계 통과 요약

| 단계             | 결과                                                   |
| ---------------- | ------------------------------------------------------ |
| 동작             | ✅ (실행 로직 변경 없음, 주석·문서·export 제거만)      |
| 의존성           | ✅                                                     |
| 타입·린트 침묵   | ✅ (신규 `any`/`as`/`@ts-ignore`/`eslint-disable` 0건) |
| 표면적           | ✅                                                     |
| Next 경계        | ✅                                                     |
| 문서-코드 동기화 | ✅                                                     |

### 정적 검사

- `pnpm lint`: PASS
- `pnpm exec tsc --noEmit`: PASS
- 변경 6개 파일 Prettier `--check`: PASS
- 실행하지 않음: `pnpm build`, `pnpm test`, `pnpm test:e2e` — 이번 델타에 실행 로직 변경이 없고, CLAUDE.md의 검증 기준상 사용자가 요청한 경우에만 실행한다.

### 남은 위험

- 런타임 확인하지 않음. 이번 델타는 주석·문서와 미사용 export 제거뿐이라 화면 코드 변경이 없다.
- 위 6개 파일은 아직 커밋되지 않았다.

_이 회차도 AI(Claude)가 실행했습니다. 주석 전수 수집, 참조 경로 실재 확인, 주석 서술과 실제 코드 대조, 소비처 재검색은 AI가 했고, 수정 여부와 심각도 판단은 제가 결정했습니다._
