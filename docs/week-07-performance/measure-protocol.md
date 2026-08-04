# 7주차 측정 절차

Before와 After에서 **SHA를 뺀 모든 조건이 같아야** 비교가 성립한다. 기억에 의존하지 말고 이 문서를 옆에 띄워 체크하면서 측정한다.

## 고정 조건 — 매 측정마다 확인

| 항목 | 값 | 확인 |
| --- | --- | --- |
| 실행 | `pnpm build` → `pnpm start` (dev 서버 금지) | ☐ |
| `APP_ORIGIN` | `http://localhost:3000` (build·runtime 동일) | ☐ |
| 브라우저 프로필 | 확장·캐시·로그인 없는 새 프로필 (시크릿창 아님) | ☐ |
| 프로필 이름 | `perf-week07` | ☐ |
| **Lighthouse Device** | **Desktop** | ☐ |
| Throttling | 프리셋 기본값 그대로 (커스텀으로 바꾸지 않는다) | ☐ |
| load 조건 | cold — 매 회 Empty cache and hard reload | ☐ |
| Chrome 버전 | `기록: ______` | ☐ |
| Lighthouse 버전 | `기록: ______` | ☐ |

**Desktop 프리셋이 세 조건을 함께 고정한다.** 따로 맞출 것이 없고, 커스텀으로 바꾸면 그것부터 Before/After에서 어긋난다.

| 프리셋 | viewport | RTT | 대역폭 | CPU |
| --- | --- | --- | --- | --- |
| **Desktop (사용)** | **1350 × 940** | **40ms** | **10 Mbps** (`desktopDense4G`) | **1x** |
| Mobile (미사용) | 412 × 823 | 150ms | 1.6 Mbps | 4x |

> 10 Mbps면 7.5MB 원본을 받는 데 약 6초가 걸린다. 스로틀링 없이 localhost에서 재면 디스크에서 바로 읽어 병목이 아예 안 잡힌다.

**Performance 패널 녹화는 Lighthouse와 별개 도구라 emulation을 자동으로 맞춰주지 않는다.** 수동으로 같은 조건에 둔다.

| 항목 | 값 | 확인 |
| --- | --- | --- |
| Device toolbar | `1350 × 940` | ☐ |
| Network | Custom — 40ms RTT / 10 Mbps | ☐ |
| CPU | `No throttling` (1x, Desktop 프리셋과 동일) | ☐ |

> **Advanced A만 예외다.** 과제가 CPU `4x slowdown`을 명시했다. Basic 측정(Desktop 프리셋, CPU 1x)과 섞지 않는다.

> 프로필 만들기: Chrome → 프로필 아이콘 → 추가 → 로그인 없이 계속. 확장 프로그램이 없는지 `chrome://extensions`로 확인한다. 시크릿창은 "시크릿에서 허용"한 확장이 살아 있을 수 있어 쓰지 않는다.

## 실행 순서

### 1. 빌드와 기동

```bash
APP_ORIGIN=http://localhost:3000 pnpm build
APP_ORIGIN=http://localhost:3000 pnpm start
```

측정 대상 SHA를 먼저 적는다.

```bash
git rev-parse --short HEAD
```

### 2. 홈 cold load — Lighthouse 5회

`http://localhost:3000/`

- DevTools → Lighthouse → Mode `Navigation`, Device `Desktop`, Categories `Performance`만
- Throttling은 프리셋 기본값 그대로 둔다
- 매 회 전에 Network 탭 우클릭 → `Empty cache and hard reload`
- 회차마다 **FCP · LCP · CLS raw 값**을 기록표에 적는다

### 3. 홈 — Performance 녹화 1회

- LCP element가 무엇인지 (Lighthouse 리포트의 `Largest Contentful Paint element`)
- filmstrip에서 **Header → 페이지 제목 → Hero** 가 각각 언제 보이는지
- Layout Shifts track에 이동이 있는지, 있다면 어느 요소인지
- Network waterfall에서 **document / `/api/home` / `hero-original.jpg`** 의 요청 시작 시점과 전송 크기
- Hero 이미지의 **표시 크기**(레이아웃상 실제 폭·높이)와 전송 크기를 함께 적는다

### 4. 목록 slow — 3가지 상황 녹화

| 상황 | 방법 |
| --- | --- |
| 데이터 없는 최초 진입 | 새 탭에서 `http://localhost:3000/products?scenario=slow` |
| 기존 목록이 있는 갱신 | 위 화면이 뜬 뒤 카테고리·정렬·페이지 변경 |
| 취소 | 검색·카테고리·정렬·페이지를 **빠르게 연속으로** 변경 |

각 상황에서 확인할 것:

- 화면이 어떻게 바뀌는지 (비워지는가, 유지되는가, 크기를 예상할 수 있는가)
- 현재 URL의 active query와 화면 결과가 일치하는가
- 이전 요청이 늦게 끝나도 현재 화면을 덮지 않는가
- 취소된 요청이 오류로 보이지 않는가
- fallback ↔ 실제 목록 교체에서 Layout shift가 생기는가

### 5. metadata 증거 (3단계에서 사용)

```bash
# 일반 UA vs 페이스북 크롤러 응답 시점
./scripts/week-07-performance/ua-compare.sh /products
./scripts/week-07-performance/ua-compare.sh "/products?scenario=slow"

# 초기 HTML — JavaScript 실행 전 상태
curl -s http://localhost:3000/ | head -100
```

metadata query failure 재현 (닿지 않는 origin을 build·runtime 모두에 넣는다):

```bash
APP_ORIGIN=http://127.0.0.1:9 pnpm build
APP_ORIGIN=http://127.0.0.1:9 pnpm start
```

> 로컬 origin으로 응답 시점과 HTML은 측정하되, localhost가 박힌 Open Graph URL을 "공유가 잘 된다"는 증거로 쓰지 않는다.

### 6. 서버 호출 계수

Route Handler에 임시 카운터를 넣고 document 요청 1회에 몇 번 불리는지 센다. **브라우저 Network로 판정하지 않는다** — 서버에서 일어나는 호출은 거기 안 보인다. 관찰이 끝나면 계측을 제거한다.

## 기록 위치

[`measurements.md`](./measurements.md) 한 파일에 라운드를 이어 쓴다. 최상단 궤적 요약표에 라운드마다 SHA·변경 내용·중앙값·판정을 남기고, 아래에 상세를 붙인다.

- R0(Before)와 최종 After는 풀 기록
- 중간 라운드는 5회 raw + 바뀐 구간만. 단 PR에서 효과를 주장할 라운드는 반드시 5회

## 하지 말 것

- `pnpm dev`로 측정
- Lighthouse throttling을 커스텀으로 바꾸기 (프리셋이 이미 세 조건을 고정한다)
- 스로틀링 없이 localhost에서 재기 (7.5MB가 공짜가 되어 병목이 안 잡힌다)
- Basic 측정과 Advanced A의 CPU 설정을 섞기 (1x vs 4x)
- 한 번의 최고 점수만 기록 (5회 raw가 필요하다)
- 확장 프로그램이 있는 평소 프로필 사용, 시크릿창 사용
