# 7주차 성능 최적화 — 측정 기록

## 공통 측정 조건 (Before/After 동일하게 유지)

- 브라우저 / 버전: 
  - Chrome 148.0.7778.179 (arm64, macOS 15.1.1)
- Lighthouse 버전: 
  - DevTools 내장 Lighthouse 패널 (Chrome 148 기준 내장 버전, 패널 실행 시 표시되는 버전 확인해서 보완 가능)
- viewport: 
  - Desktop 
- CPU throttling: 
  - Lighthouse 기본 simulated throttling 사용 (패널에서 별도 조정 안 함) 
- Network throttling: 
  - Lighthouse 기본 simulated throttling 사용 (Slow 4G 계열, 패널 기본값 그대로)
- 브라우저 프로필: 
  - 새 Chrome 프로필 생성, 확장 프로그램 미설치, 로그인 없음, 캐시 비움 상태로 매 측정 시작
- 측정 URL: 
  - http://localhost:3000/ (production build, pnpm build && pnpm start)
- load 조건: cold load — 매 회 새 탭에서 열기 (또는 DevTools Lighthouse의 기본 navigation 모드로 자동 cold load 처리됨)

---

## 0단계 — Before

### Commit SHA (Before)
```
1a4c309d9205e9a859f82dbc3dabce00b92aee7f
```

### Lighthouse 5회 raw 값 — 홈 cold load

| 지표 | 1회 | 2회 | 3회 | 4회 | 5회 | 중앙값 | 최솟값 | 최댓값 |
|------|-----|-----|-----|-----|-----|--------|--------|--------|
| FCP  | 273.8ms | 269.5ms | 258.4ms | 258.2ms | 261.0ms | 261.0ms | 258.2ms | 273.8ms |
| LCP  | 6795.3ms | 6783.4ms | 6813.6ms | 6813.0ms | 6824.1ms | 6813.0ms | 6783.4ms | 6824.1ms |
| CLS  | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

### LCP element
- 확인된 LCP element: `<img>` (Hero 이미지, hero-original.jpg, 3840×2160), selector: `body > main.week05-page > section.hero > img.hero__image`
- Lighthouse JSON 5개 저장 완료 (lighthouse-before-1~5.json)

### LCP breakdown (Lighthouse lcp-breakdown-insight, 1회차 기준)
| 구간 | 시간 |
|------|------|
| Time to first byte | 16.4ms |
| Resource load delay | 670.2ms |
| Resource load duration | 92.6ms |
| Element render delay | 113.3ms |
| **구간 합계** | **892.5ms** |
| **실제 LCP 총합** | **~6813ms** |

⚠️ 구간 합계(892.5ms)와 실제 LCP(6813ms) 사이 약 5900ms 차이 있음. 아래 waterfall/인사이트 참고.

### Performance filmstrip 확인
- Header 표시 시점: ~750~770ms 구간 (Hero와 거의 동시)
- 페이지 제목(h1)/Hero 텍스트 표시 시점: ~750~770ms 구간 (Header와 거의 동시)
- Hero 이미지 표시 시점: ~748~770ms 구간

**관찰**: Header, Hero 텍스트, Hero 이미지가 개별 시점으로 나뉘지 않고 거의 동시(750~770ms)에 한꺼번에 나타남. 이는 `HomePage.tsx`가 `isLoading` 상태로 전체를 게이트하고 있어서(`{isLoading && <p>로딩 중...</p>}`), `/api/home` 응답이 오기 전까지는 Header조차 렌더링되지 않고, 응답이 온 순간 전체가 한 번에 그려지기 때문으로 추정됨.
→ 1단계에서 Header/h1을 데이터 대기와 무관하게 먼저 렌더링하도록 분리하면 FCP를 앞당길 수 있는 근거.

### Network waterfall
| 요청 | URL | 시작 시점(문서 기준) | 완료 시점 | 전송 크기 | 비고 |
|------|-----|-----------|--------|-----------|------|
| document | / | 0ms | 8.8ms | 3.1KB | |
| 홈 데이터 (/api/home) | /api/home | 160ms | 671ms | 4.2KB | scenario=slow 미적용, 기본 500ms 지연만 반영됨 |
| Hero 이미지 | /images/week-07/hero-original.jpg | 676ms | 748.5ms (로컬 기준) | 7,545,239 bytes (~7.5MB) | 로컬에서는 72ms만에 전송되지만 실제 병목의 핵심 |

### ⭐ 핵심 인사이트: Lighthouse LCP 6.8초의 정체
로컬 Performance trace(cache disabled, 진짜 cold load)로 재보면 document~Hero 완료까지 전체 750ms밖에 안 걸림. 반면 Lighthouse는 5회 모두 LCP ~6.8초로 일관되게 측정됨. 그 차이(~5.9초)는:

- Lighthouse Desktop 기본 시뮬레이션 네트워크 조건: `throughputKbps: 10240` (10Mbps)
- Hero 원본 7,545,239 bytes ÷ 1,280,000 bytes/s ≈ **5.89초**
- 이 계산값이 정확히 Lighthouse의 LCP breakdown 구간 합계(892ms)와 실제 LCP(6813ms) 사이 차이(~5920ms)와 일치함

**결론**: 로컬에서는 이미지가 빨리 도착해서 문제가 안 보이지만, 일반적인 네트워크 환경을 가정하면 **7.5MB Hero 원본 이미지의 전송 시간 자체가 LCP를 지배하는 가장 큰 요인**이다. 서버 응답 지연이나 렌더링 로직 문제가 아니라 순수하게 이미지 용량 문제 — 1단계 이미지 최적화로 직접 해결 가능한 병목임을 확인.

### 목록 상태 관찰 (/api/products?scenario=slow)
- 최초 진입 (데이터 없음) 녹화: 화면 기록 확인함. 검색/카테고리/정렬 필터 UI는 즉시 보이고, 상품 그리드 영역이 완료 시까지 비어있음
- 기존 목록이 있는 상태에서 갱신 녹화: **문제 확인됨** — 상품 30개가 이미 로딩된 상태에서 재요청이 발생하면, 기존 상품 카드가 전부 사라지고 "로딩 중..." 텍스트만 남음. Header와 필터 UI(검색/카테고리/정렬)는 그대로 유지되지만, 상품 그리드는 완전히 비워짐
- 화면 기록 프레임: 0초(30개 로딩 완료) → ~1.75초(전체 삭제, "로딩 중..."만 표시) → ~3.5초(다시 30개 로딩 완료)
- 검색/카테고리/정렬/페이지 빠르게 변경 시 active query와 화면 결과가 맞는지: **확인 완료** — 카테고리를 "홈"으로, 정렬을 "높은 가격순"으로 연속 변경한 뒤 스크린샷 확인. URL(`?category=home&sort=price-desc`), 필터 UI 표시값, 실제 상품 정렬(240,000원→75,000원→65,000원→44,000원, 내림차순) 세 가지가 모두 일치함. race condition 문제 관찰되지 않음
- 이전 요청이 늦게 끝나도 현재 화면을 덮는지 여부: 위 케이스에서는 문제 없었으나, 두 요청 사이 간격을 더 좁혀서(예: 클릭 간격 200ms 이내) 추가 확인하면 더 확실함. 현재까지는 무개입 근거로 기록
- 취소된 요청 관찰: **확인 완료** — Network 탭에서 카테고리를 goods → fashion으로 빠르게 연속 변경. 두 fetch 요청(`products?category=goods&sort=...`, `products?category=fashion&sort=...`) 모두 상태 200으로 취소 없이 끝까지 완료됨(각각 513ms, 510ms). **AbortSignal 기반 요청 취소가 구현되어 있지 않음을 확인** — 응답 순서가 우연히 맞아서 지금은 문제가 안 보이지만, 먼저 보낸 요청이 나중 요청보다 늦게 도착하면 화면이 이전 상태로 덮일 race condition 가능성이 잠재함
**관찰 요약**: 현재 구현은 `isLoading` 하나로 최초 진입과 갱신을 구분 없이 처리하고 있어, 이미 목록이 있는 상태에서도 재요청 시 기존 목록을 통째로 비움. 이는 2단계에서 `isPending`(최초 로딩, 데이터 없음)과 `isFetching`(갱신 중, 기존 데이터 유지)을 구분해 UX를 나누는 작업의 직접적인 근거가 됨.

### 가설 기록

| 관찰한 사실 | 원인 가설 | 반증 방법 | 가장 작은 변경 |
|------------|-----------|-----------|----------------|
| Lighthouse 5회 LCP가 6.8초대로 일관되게 측정되지만, 로컬 cache-disabled Performance trace에서는 document~Hero 완료까지 750ms밖에 안 걸림 | Hero 원본 이미지(7.5MB)의 전송 크기가 커서, Lighthouse의 시뮬레이션 네트워크 조건(10Mbps)에서는 이미지 전송에만 ~5.9초가 걸리는 것으로 계산되고 있다. 서버 응답 지연이나 렌더링 로직은 병목이 아니다 | Hero 이미지를 임시로 작은 파일(예: 100KB급)로 교체하고 Lighthouse를 다시 돌려서, LCP가 크게 줄어드는지(5.9초 근처만큼) 확인한다 | Hero 이미지를 실제 표시 크기(카드 폭 기준)에 맞는 해상도로 리사이즈하고 WebP/AVIF 등 압축 포맷으로 변환하여 전송 크기를 줄인다 |


---

## 1단계 — Hero LCP

### LCP 구간 분리

| 구간                  | 시간 | 비고 |
| --------------------- | ---- | ---- |
| 서버 응답 대기        |      |      |
| 이미지 요청 시작 대기 |      |      |
| 이미지 전송           |      |      |
| 화면에 그려짐(render) |      |      |

### 이미지 최적화 내역

- 원본: 3840×2160, 7.5MB
- 변경 후 포맷/해상도/압축률:
- 실제 표시 크기 대비 적정성:
- 요청 우선순위 조정 여부 (fetchpriority 등):

### 시도한 방안 비교 (실험 기록)

측정 → 인사이트 고민 → 방안 여러 개 실험 → 비교 후 선택하는 순서로 기록.

먼저 0단계 measurement에서 확인한 인사이트를 적고, 그 인사이트를 바탕으로 방안을 실험한다.

## **인사이트 메모** (LCP가 왜 이 구간에서 느린지, filmstrip/waterfall 관찰에서 든 생각)

-

| 시도한 방안                   | 적용 내용 | 전송 크기 | LCP 변화 | Network 요청 시작 시점 변화 | 채택 여부 |
| ----------------------------- | --------- | --------- | -------- | --------------------------- | --------- |
| 원본 (Before)                 |           |           |          |                             | 기준      |
| next/image 적용               |           |           |          |                             |           |
| 포맷/해상도/압축 조정         |           |           |          |                             |           |
| fetchpriority / preload       |           |           |          |                             |           |
| (특이 패턴 발견 시 추가 실험) |           |           |          |                             |           |

## **최종 채택 이유 / 다른 방안을 채택하지 않은 이유**

### 렌더링 경계

- Header/h1/설명이 Hero와 분리되어 먼저 렌더되는가:
- 적용한 방법 (Suspense 경계 위치 등):

### Hero fallback / CLS

- fallback이 실제 Hero와 같은 공간을 차지하는가:
- Layout shifts track 확인 결과:

---

## 2단계 — 목록 상태 6가지 / CLS

| 상태                               | 구현 여부 | 확인 방법 | 비고 |
| ---------------------------------- | --------- | --------- | ---- |
| 데이터 없는 최초 진입 (pending UI) |           |           |      |
| 이전 데이터 있는 갱신 (isFetching) |           |           |      |
| 성공 + 0건                         |           |           |      |
| 최초 실패                          |           |           |      |
| 갱신 실패 (기존 목록 유지)         |           |           |      |
| 취소 (오류로 안 보임)              |           |           |      |

### 정합성 확인

- active query와 화면 결과 일치 여부:
- 이전 요청 늦은 완료가 현재 화면을 덮지 않는지:
- 서버 응답을 Zustand/로컬 상태에 복사하지 않았는지:

### 선택한 전략과 이유

- placeholderData / prefetch / AbortSignal 중 적용한 것과 이유:
- 적용하지 않은 것과 무개입 근거:

---

## 3단계 — Metadata / Open Graph

### 기본 확인

- 홈 title/description/OG:
- 상품 목록 title/description/OG (검색어→title, category/sort→description, 2페이지 이상 page 번호):
- shallow merge 확인 (siteName/locale/type 유지 여부):

### 케이스별 document 증거

| 상황                                     | title/description | OG image | 비고 |
| ---------------------------------------- | ----------------- | -------- | ---- |
| normal                                   |                   |          |      |
| 정상 empty (0건)                         |                   |          |      |
| metadata query failure (APP_ORIGIN 끊음) |                   |          |      |

### 서버 호출 계수

- 동일 slow Route Handler 호출 횟수 (임시 로그로 확인):
- 계측 제거 여부:

### UA별 응답 시점 비교

```bash
curl -s -o /dev/null -w 'normal start=%{time_starttransfer} total=%{time_total}\n' "$APP_ORIGIN/products"
curl -A 'facebookexternalhit/1.1' -s -o /dev/null -w 'facebook start=%{time_starttransfer} total=%{time_total}\n' "$APP_ORIGIN/products"
```

| UA                  | time_starttransfer | time_total |
| ------------------- | ------------------ | ---------- |
| normal              |                    |            |
| facebookexternalhit |                    |            |

### 접근성 체크

- 주요 콘텐츠/탐색/상품 영역 역할이 마크업에 드러나는가:
- href 링크로 주요 이동 제공되는가:
- 의미 있는 이미지 alt 텍스트:

---

## 4단계 — After / 회귀 확인

### Commit SHA (After)

```
（여기에 SHA）
```

### Lighthouse 5회 raw 값 — 홈 cold load (Before와 동일 조건)

| 지표 | 1회 | 2회 | 3회 | 4회 | 5회 | 중앙값 | 최솟값 | 최댓값 |
| ---- | --- | --- | --- | --- | --- | ------ | ------ | ------ |
| FCP  |     |     |     |     |     |        |        |        |
| LCP  |     |     |     |     |     |        |        |        |
| CLS  |     |     |     |     |     |        |        |        |

### Before vs After 비교

| 지표 | Before 중앙값 | After 중앙값 | 변화 | 측정 흔들림보다 큰 변화인가 |
| ---- | ------------- | ------------ | ---- | --------------------------- |
| FCP  |               |              |      |                             |
| LCP  |               |              |      |                             |
| CLS  |               |              |      |                             |

### LCP 구간 비교

- LCP element 변화:
- Hero 전송 크기 변화:
- 요청 시작 순서 변화:
- 가장 길었던 구간이 어떻게 달라졌는가:

### 회귀 확인 체크리스트

- [ ] 검색/카테고리/정렬/페이지가 URL에서 복원되는가
- [ ] 뒤로가기/앞으로가기 동일 화면 복원
- [ ] 장바구니/위시리스트/Header 개수 유지
- [ ] 로딩/에러/빈 상태/재시도 유지
- [ ] FSD 의존 방향 / Public API 우회 없음
- [ ] `pnpm test` 통과
- [ ] `pnpm check` 통과

### 효과 없었거나 악화된 변경

| 시도한 변경 | 결과 | 되돌림/유지 여부 및 이유 |
| ----------- | ---- | ------------------------ |
|             |      |                          |

---

## AI 활용 기록

| 단계 | AI에게 준 근거 (raw 값/waterfall/URL 등) | AI 제안 | 직접 반증한 방법 | 채택/반려 |
| ---- | ---------------------------------------- | ------- | ---------------- | --------- |
|      |                                          |         |                  |           |

---

## Technical Writing 초안 메모

(제출 문서 작성 전, 여기에 단계별로 "왜 이렇게 판단했는지" 짧게 메모)

- 0단계:
- 1단계:
- 2단계:
- 3단계:
- 4단계:
