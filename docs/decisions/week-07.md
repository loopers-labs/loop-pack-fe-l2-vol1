# 7주차 성능 최적화 — 측정 기록

## 공통 측정 조건 (Before/After 동일하게 유지)

- 브라우저 / 버전:
- Lighthouse 버전:
- viewport:
- CPU throttling:
- Network throttling:
- 브라우저 프로필 (확장 프로그램/캐시/로그인 없는 별도 프로필):
- 측정 URL:
- load 조건 (cold load / warm navigation):

---

## 0단계 — Before

### Commit SHA (Before)

```
（여기에 SHA）
```

### Lighthouse 5회 raw 값 — 홈 cold load

| 지표 | 1회 | 2회 | 3회 | 4회 | 5회 | 중앙값 | 최솟값 | 최댓값 |
| ---- | --- | --- | --- | --- | --- | ------ | ------ | ------ |
| FCP  |     |     |     |     |     |        |        |        |
| LCP  |     |     |     |     |     |        |        |        |
| CLS  |     |     |     |     |     |        |        |        |

### LCP element

- 확인된 LCP element:
- (스크린샷/Lighthouse JSON 첨부)

### Performance filmstrip 확인

- Header 표시 시점:
- 페이지 제목(h1) 표시 시점:
- Hero 표시 시점:
- (trace JSON 첨부)

### Network waterfall

| 요청                  | URL | 시작 시점 | 전송 크기 | 비고 |
| --------------------- | --- | --------- | --------- | ---- |
| document              |     |           |           |      |
| 홈 데이터 (/api/home) |     |           |           |      |
| Hero 이미지           |     |           |           |      |

### 목록 상태 관찰 (/api/products?scenario=slow)

- 최초 진입 (데이터 없음) 녹화:
- 기존 목록 있는 상태에서 갱신 녹화:
- 검색/카테고리/정렬/페이지 빠르게 변경 시 active query와 화면 일치 여부:
- 이전 요청이 늦게 끝나도 현재 화면을 덮는지 여부:
- 취소된 요청 관찰:

### 가설 기록

| 관찰한 사실 | 원인 가설 | 반증 방법 | 가장 작은 변경 |
| ----------- | --------- | --------- | -------------- |
|             |           |           |                |

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
