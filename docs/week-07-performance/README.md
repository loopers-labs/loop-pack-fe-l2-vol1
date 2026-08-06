# 7주차 측정 기록

조건은 [`measure-protocol.md`](./measure-protocol.md)를 따른다. **SHA를 뺀 모든 조건은 라운드마다 같아야 한다.**

판정 기준(스펙 D10): 중앙값 변화가 **R0의 5회 raw 범위(최댓값 − 최솟값)보다 크고**, 그 변화가 **R0에서 지목한 병목 구간에서 나왔을 때만** 효과로 인정한다. 하나라도 못 채우면 되돌리거나 유지하는 이유를 적는다.

## 궤적 요약

### 홈
| 라운드 | SHA | 변경 내용 | FCP | LCP | CLS | 움직인 구간 | 판정 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R0 Before | `4a04dddf` | 7.5MB 원본, `h1` 데이터 의존 | 0.3 s | 6.7 s | 0.004 | — | 기준 |
| R1 | `cf571ae6` | `next/image` + `sizes` + `loading="eager"` | 0.3 s | 1.0 s | 0 | 이미지 전송 `7,368 → 399.7 KiB` | 유지 |
| R2 | `f787a51a` | Hero 이미지·카드를 `Suspense` 밖으로 | 0.3 s | 0.9 s | 0.008 | 발견 지연 `520 → 10~30 ms` | 유지 |
| R3 | `4070396f` | Hero 카드에 `min-height` 예약 | 0.3 s | 0.9 s | 0.006 | CLS `0.008 → 0.006` | 유지 |
| R최종 After | | | | | | | |

지표는 5회 중앙값이다. **움직인 구간**은 라운드 `notes.md`의 "바뀐 구간" 표에서 가져온다.

### 상품 목록

| 라운드 | SHA | 변경 내용 | FCP | LCP | CLS | 표적 | 판정 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 기준선 | `6ff6885c` | 텍스트 한 줄 대기 화면 | 0.3 s | 0.7 s | 0 | — | 기준 |
| R4 | `a0a6d7fb` | 대기 화면을 카드 골격 12장으로 | 0.2 s | 0.6 s | 0 | 화면 요건 + CLS 0 유지 | 유지 |
| R5 | `a0fc24e9` | 조건이 바뀌어도 이전 목록 유지 | — | — | **갱신 중 0.33** | 갱신 화면 구분 | 유지(회귀 있음) |

- Chrome `151.0.7922.75` (arm64) · macOS `26.5.2` · V8 `15.1.206.10`
- Lighthouse `13.4.0` · Chromium `151.0.0.0 with devtools`
- 리포트 표기: `Emulated Desktop` · `Custom throttling` · `Initial page load` · `Single page session`
- 별도 브라우저 프로필(`perf-week07`) 사용 ☑ (로그인·확장 없음)
- Lighthouse Device: **Desktop** (1350×940 / 40ms / 10 Mbps / CPU 1x), throttling 설정은 건드리지 않음 ☑

---

## 캡쳐 체크리스트

라운드 폴더 안에 `{순번}-{내용}.png`로 둔다. 같은 순번은 라운드가 달라도 같은 화면을 가리켜서, `r0-before/03-waterfall.png`와 `rf-after/03-waterfall.png`를 나란히 두면 Before/After 비교가 된다.

| # | 무엇을 | 파일명 | R0 | R최종 |
| --- | --- | --- | --- | --- |
| 01 | Lighthouse 리포트 요약 (FCP·LCP·CLS와 LCP element) | `01-lighthouse.png` | ☐ | ☐ |
| 02 | Performance filmstrip (Header→제목→Hero 순서가 보이게) | `02-filmstrip.png` | ☐ | ☐ |
| 03 | Network waterfall (document·`/api/home`·hero 이미지) | `03-waterfall.png` | ☐ | ☐ |
| 04 | Hero 이미지 요소 (Elements에서 표시 크기와 전송 크기) | `04-hero-size.png` | ☐ | ☐ |
| 05 | Layout Shifts track | `05-layout-shifts.png` | ☐ | ☐ |
| 06 | 목록 slow — 데이터 없는 최초 진입 | `06-list-initial.png` | ☐ | ☐ |
| 07 | 목록 slow — 기존 목록이 있는 갱신 | `07-list-refetch.png` | ☐ | ☐ |
| 08 | 목록 slow — 취소 (조건 연속 변경) | `08-list-cancel.png` | ☐ | ☐ |
| 09 | 목록 — 성공 + 0건 | `09-list-empty.png` | ☐ | ☐ |
| 10 | 목록 — 최초 실패 | `10-list-error.png` | ☐ | ☐ |
| 11 | 목록 — 갱신 실패 배너 | `11-list-refetch-error.png` | ☐ | ☐ |
| 12 | 초기 HTML (View Source 또는 document Response) | `12-initial-html.png` | ☐ | ☐ |

3단계에서만 쓰는 것 (R최종에서 한 번):

| # | 무엇을 | 파일명 | ☐ |
| --- | --- | --- | --- |
| 13 | 정상 empty의 metadata·OG | `rf-13-meta-empty.png` | ☐ |
| 14 | metadata query failure의 metadata (root 상속 확인) | `rf-14-meta-failure.png` | ☐ |
| 15 | UA별 응답 시점 비교 터미널 출력 | `rf-15-ua-compare.png` | ☐ |
| 16 | 서버 호출 계수 로그 | `rf-16-call-count.png` | ☐ |

---

## 라운드

| 라운드 | 폴더 | 상태 |
| --- | --- | --- |
| R0 Before | [`r0-before/`](./r0-before/notes.md) | 완료 |
| R1 Hero 이미지 | [`r1-hero-image/`](./r1-hero-image/notes.md) | 완료 |
| R2 렌더링 경계 | [`r2-render-boundary/`](./r2-render-boundary/notes.md) | 완료 |
| R3 카드 공간 예약 | [`r3-cls-reservation/`](./r3-cls-reservation/notes.md) | 완료 |
| R4 목록 최초 진입 대기 화면 | [`r4-list-pending/`](./r4-list-pending/notes.md) | 완료 |
| R5 갱신 중 이전 목록 유지 | [`r5-list-refresh/`](./r5-list-refresh/notes.md) | 완료 (CLS 회귀는 다음 라운드) |

라운드마다 폴더를 하나 만들고 그 안에 `notes.md`와 캡쳐를 함께 둔다. 캡쳐 이름은 `{순번}-{내용}.png`이고, 순번은 아래 체크리스트와 같다. 같은 순번은 라운드가 달라도 같은 화면을 가리킨다.

## 라운드 템플릿 (중간 라운드용 `notes.md`)

> 복사해서 쓴다.

- SHA: `______`
- 변경 내용: `______`
- 이 변경을 고른 근거(R0의 어느 관찰에서 나왔는가): `______`

### Lighthouse 5회

| 회차 | FCP | LCP | CLS |
| --- | --- | --- | --- |
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |
| 4 |  |  |  |
| 5 |  |  |  |
| **중앙값** |  |  |  |
| **최솟값** |  |  |  |
| **최댓값** |  |  |  |
| **범위(max−min)** |  |  |  |

- 조건 1 — 중앙값 변화가 R0 범위 밖인가: `______`

### 바뀐 구간

| 관찰 항목 | R0 | 이번 라운드 | 예상대로 움직였는가 |
| --- | --- | --- | --- |
| LCP element | | | |
| 가장 긴 구간 | | | |
| Hero 전송 크기 | | | |
| Hero 요청 시작 시점 | | | |

- 조건 2 — 변화가 이 라운드에서 지목한 병목 구간에서 나왔는가: `______`

### 판정

- 유지 / 되돌림: `______`
- 근거: `______`

---

## 최종 After 템플릿

> R0와 같은 항목을 전부 다시 채운다. 추가로 회귀 확인.

### 회귀 확인

| 항목 | 결과 |
| --- | --- |
| 검색·카테고리·정렬·페이지 URL 복원 | |
| 뒤로 가기 / 앞으로 가기 | |
| 장바구니·위시리스트·Header 개수 | |
| 로딩·에러·빈 상태·재시도 | |
| Hero 이미지 품질(피사체·문구·비율) | |
| FSD 하네스(`pnpm lint`) | |

### 효과가 없었거나 악화된 변경

| 변경 | 결과 | 되돌림 / 유지 | 이유 |
| --- | --- | --- | --- |
| | | | |

### 개입하지 않은 것과 근거

| 대상 | 이미 만족한 이유 | 확인한 방법 |
| --- | --- | --- |
| | | |

---

## metadata 증거 (3단계)

**UA별 응답 시점** — `./scripts/week-07-performance/ua-compare.sh /products`

| 상황 | UA | `time_starttransfer` | `time_total` |
| --- | --- | --- | --- |
| normal | normal | | |
| normal | facebookexternalhit | | |
| `?scenario=slow` | normal | | |
| `?scenario=slow` | facebookexternalhit | | |

**초기 HTML (3단계 이후)** — normal · 정상 empty · metadata query failure 비교

| 항목 | normal | 정상 empty | metadata query failure |
| --- | --- | --- | --- |
| `<title>` | | | |
| `description` | | | |
| Open Graph (`siteName`·`locale`·`type`) | | | |
| OG image | | | |

**서버 호출 계수** — document 요청 1회당 slow Route Handler 호출 횟수

| 경로 | 호출 횟수 | 계측 제거 |
| --- | --- | --- |
| `/` | | ☐ |
| `/products` | | ☐ |
