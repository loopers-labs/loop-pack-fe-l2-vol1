# 7주차 2단계 — 목록의 최초 pending·갱신·CLS

<!-- AI 초안 — 재현·기록 자동화, 검토 필요 -->

Before(0단계)에서 확인한 문제 두 개에만 개입했다: ① 최초 진입 pending이 크기 예상 불가 텍스트 한 줄, ② 갱신 시 기존 목록이 즉시 사라짐. 전략은 **그리드 스켈레톤 + `keepPreviousData`** 두 가지가 전부다.

## 변경 내용

| 파일 | 변경 |
| --- | --- |
| `_pages/products/api/products.queries.ts` | `placeholderData: keepPreviousData` — 키 변경 중 이전 목록 유지 |
| `_pages/products/ui/ProductsSkeleton.tsx` (신설) | 실제 목록과 같은 `week05-grid` + 카드 비율(이미지 1:1 + 텍스트 줄) 12칸 |
| `_pages/products/ui/ProductsPage.tsx` | 상태 6종 분기 재작성 (아래), 0건 문구에 URL 조건 명시, 카테고리 옵션을 select·문구 공용 상수로 |

## 상태 표 여섯 화면 — 담당과 재현 결과 (production, `scenario` 주입은 fetch 래핑·코드 무변경)

| 상태 | 구현 | 재현 결과 |
| --- | --- | --- |
| ① 데이터 없는 최초 진입 | `isPending` → 그리드 스켈레톤 12칸 | 홈→목록 진입 시 스켈레톤 → 실제 목록 교체 (GIF 프레임 1–3) |
| ② 이전 데이터 있는 갱신 | `keepPreviousData` + `isFetching` → 목록 유지 + "· 갱신 중…" | 정렬 변경 0.5s 시점: 기존 12개 유지 + 갱신 중 표시 → 완료 시 새 정렬 결과 (Before: 목록 즉시 소멸) |
| ③ 성공 + 0건 | URL 조건을 문구로 명시 | `검색 "zzz" 조건에 맞는 상품이 없어요. (0개)` + URL `?q=zzz` |
| ④ 최초 실패 | `data === undefined` → 실패 이유 + 다시 시도 | 새 키(q=yyy) 실패 → 알림만, 이전 조건 목록 미유지 |
| ⑤ 갱신 실패 (같은 키) | `isError && data` → 목록 유지 + 실패 배너 + 다시 시도 | staleTime(60s) 경과 후 focus refetch 실패 → "갱신에 실패했어요. 아래는 마지막으로 성공한 결과예요." + 목록 12개 유지 → 다시 시도로 복구 |
| ⑥ 취소/늦은 완료 | 개입 없음 (아래 근거) | price-asc→(120ms)→price-desc 연속 변경: placeholder 목록 유지 + 갱신 중 → 완료 후 URL=select=화면(최고가부터) 일치, 이전 요청이 화면을 덮지 않음 |

**`isPending` vs `isFetching`**: `isPending` = 캐시에 보여줄 데이터가 없는 최초 로딩 — 스켈레톤 담당. `isFetching` = 진행 중인 모든 요청 — "갱신 중…" 담당 (`isPending ⊂ isFetching`). 실패도 같은 축으로 나뉜다: 보여줄 데이터가 없으면 ④(교체), 있으면 ⑤(유지+배너).

**키 변경 실패를 ④로 처리한 이유**: 이전 조건의 목록을 유지하면 URL(새 조건)과 화면(이전 조건)이 어긋난다 — "현재 URL의 active query와 화면 결과 일치"를 우선했다.

## 개입하지 않은 것과 근거 (과제: "이미 조건을 만족하면 코드를 더 만들지 않는다")

- **URL↔query key↔GET 요청 동기화** — 5주차부터 nuqs 파싱 결과가 그대로 queryKey와 fetch 파라미터가 된다. Before 관찰에서 이미 일치 확인.
- **AbortSignal(취소)** — 키 변경 시 이전 요청은 자기 키의 캐시로만 저장되고 화면은 active key만 렌더하므로, 취소 없이도 "오류로 보이거나 화면을 덮는" 문제가 없다(⑥ 재현). slow 응답이 끝까지 가는 낭비는 있으나 mock 전용 시나리오라 개입하지 않는다.
- **prefetch / 서버 hydration** — Before에서 확인된 문제와 무관.
- **서버 응답 복사 없음** — placeholder는 TanStack 캐시의 이전 키 데이터를 그대로 가리키는 것이지 별도 저장소가 아니다. Zustand·useState 복사 없음 유지.

## CLS (fallback ↔ 실제 콘텐츠 교체)

`/products` Lighthouse 3회(0단계와 동일 조건): **CLS 0.000 / 0.000 / 0.000** — 스켈레톤이 실제 목록과 같은 그리드·카드 비율을 선점해 교체 시 shift가 없다. (참고: FCP 904ms, LCP 3387ms — 목록 첫 카드 이미지.)

## 증거

- `docs/perf/assets/after-list-states.gif` (9프레임) — ①→②→③→⑤→④→⑥ 순 재현 녹화
- 원본 Lighthouse JSON: `docs/notes/perf-week07/` (개인 영역)
- SHA: 코드 변경 커밋 참조 (`git log --oneline docs/perf/week07-step2-list.md` 직전 feat 커밋)
