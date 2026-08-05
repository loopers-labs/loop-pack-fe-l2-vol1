# 7주차 측정 절차

Before와 After에서 **SHA를 뺀 모든 조건이 같아야** 비교가 성립한다. 이 문서를 옆에 띄워 체크하면서 측정한다.

## 공통 조건

| 항목 | 값 | 확인 |
| --- | --- | --- |
| 실행 | `pnpm build` → `pnpm start` (dev 서버 금지) | ☐ |
| `APP_ORIGIN` | `http://localhost:3000` (build·runtime 같은 값) | ☐ |
| 브라우저 프로필 | `perf-week07` — 확장·캐시·로그인 없는 별도 프로필 | ☐ |
| Chrome 버전 | `______` (`chrome://version`) | ☐ |
| Lighthouse 버전 | `______` | ☐ |

## 실험별 조건

측정은 독립된 실험 셋이다. 실험 안에서만 조건이 고정되면 되고, 실험끼리 달라도 비교가 깨지지 않는다.

| 실험 | 도구 | 설정 |
| --- | --- | --- |
| **홈 지표** | Lighthouse | Mode `Navigation` · Device `Desktop` · Categories `Performance`만 · `Clear storage` 켬 · Throttling은 **기본값 그대로** |
| **홈 녹화** | Performance | Device toolbar `1350 × 940` · Network `Desktop 10Mbps`(10240 Kbps / 40 ms) · CPU `No throttling` · `Disable network cache` 켬 |
| **목록 관찰** | 화면 | Network·CPU 스로틀 **없음**. 기다림은 `?scenario=slow`(1.5초)가 만든다 |

**Lighthouse는 Device를 고르면 나머지가 따라온다.** Desktop 프리셋이 viewport·네트워크·CPU를 함께 고정하므로 따로 맞출 것이 없다.

| Device | viewport | RTT | 대역폭 | CPU |
| --- | --- | --- | --- | --- |
| Desktop | 1350 × 940 | 40 ms | 10 Mbps (`desktopDense4G`) | 1x |

**Performance 녹화는 Lighthouse와 별개 도구라 이 값을 자동으로 맞춰주지 않는다.** 위 표대로 수동 설정한다. Lighthouse와 같은 조건에 두어야 두 증거가 같은 지반 위에 놓인다.

**목록 관찰에 스로틀을 걸지 않는 이유**는 볼 것이 시간이 아니라 화면 상태이기 때문이다. 기다림은 slow API가 이미 만들고, 거기에 네트워크까지 조이면 지연의 원인이 섞인다.

> localhost 서버는 같은 컴퓨터에 있어 네트워크를 타지 않는다. 스로틀 없이 재면 7.5MB Hero가 29 ms에 도착해(실측) 이미지가 병목이라는 사실이 측정에 나타나지 않는다. 스로틀을 걸면 같은 파일이 6.14초가 된다.

## 실행 순서

### 1. 빌드와 기동

```bash
APP_ORIGIN=http://localhost:3000 pnpm build
APP_ORIGIN=http://localhost:3000 pnpm start
git rev-parse --short HEAD
```

SHA를 먼저 기록한다.

### 2. 홈 지표 — Lighthouse 5회

`http://localhost:3000/`

- 회차마다 **FCP · LCP · CLS raw 값**을 적는다
- 캐시는 Lighthouse가 `Clear storage`로 매 회 비운다
- 리포트 하단의 `LCP breakdown`(구간 4개)과 `Improve image delivery`(표시·전송 크기)를 함께 남긴다

### 3. 홈 녹화 — Performance 1회

- LCP element가 무엇인지
- filmstrip에서 헤더 · 콘텐츠 · Hero가 각각 언제 보이는지
- Layout Shifts track에 이동이 있는지, 있다면 어느 요소인지
- Network waterfall에서 document · `/api/home` · `hero-original.jpg`의 요청 시작 시점과 전송 크기
- 대기 중 프레임을 클릭해 사용자가 실제로 보는 화면을 남긴다

### 4. 목록 6화면

| 상태 | 방법 |
| --- | --- |
| 데이터 없는 최초 진입 | `/products?scenario=slow` |
| 이전 데이터 있는 갱신 | 목록이 뜬 뒤 카테고리·정렬·페이지 변경 |
| 성공 + 0건 | `/products?scenario=empty` |
| 최초 실패 | `/products?scenario=error` |
| 갱신 실패 | Network 탭에서 `/api/products` 차단 후 조건 변경 |
| 취소 | 조건을 빠르게 연속 변경 |

각 상태에서 확인할 것

- 화면이 비워지는가, 유지되는가, 목록 크기를 예상할 수 있는가
- 현재 URL의 active query와 화면 결과가 일치하는가
- 이전 요청이 늦게 끝나도 현재 화면을 덮지 않는가
- fallback과 실제 목록 교체에서 layout shift가 생기는가

> Query 캐시가 1분이라 이미 본 조건으로 돌아가면 네트워크를 타지 않는다. 취소를 관찰할 때는 새로고침으로 캐시를 비우고 아직 안 누른 값들로 바꾼다.

### 5. metadata 증거

```bash
./scripts/week-07-performance/ua-compare.sh /products
curl -s http://localhost:3000/ | head -100
```

일반 UA와 `facebookexternalhit`의 응답 시점을 비교하고, JavaScript 실행 전 document에 무엇이 있는지 확인한다.

**조회 실패 재현** — 아무도 듣지 않는 포트를 origin으로 두면 서버가 자기 API를 부를 때 반드시 실패한다. metadata 조회가 실패했을 때 페이지별 빈 값이 아니라 root 공통 metadata를 상속하는지 확인하는 용도다. build와 runtime 둘 다 같은 값이어야 재현된다.

```bash
APP_ORIGIN=http://127.0.0.1:9 pnpm build
APP_ORIGIN=http://127.0.0.1:9 pnpm start
```

> Open Graph 이미지 주소가 `localhost`면 외부 크롤러가 자기네 localhost를 찾아가 가져오지 못한다. 로컬에서 응답 시점과 HTML은 측정하되, 이 URL을 "공유가 잘 된다"는 증거로 쓰지 않는다.

### 6. 서버 호출 계수

Route Handler에 임시 카운터를 넣고 document 요청 1회에 몇 번 불리는지 센다. 관찰이 끝나면 계측을 제거한다.

`generateMetadata`와 페이지 본문이 같은 데이터를 각각 조회하면 QueryClient가 둘 생긴다. 그래도 React가 같은 render에서 URL·옵션이 같은 native fetch를 하나로 합치므로 실제 HTTP 호출은 한 번일 수 있다. **서버가 자기 API를 부르는 것은 브라우저 Network에 보이지 않으므로 서버 측에서 세야 한다.**

## 기록 위치

라운드마다 폴더를 하나 만들고 그 안에 `notes.md`와 캡쳐를 함께 둔다. 궤적 요약표는 [`README.md`](./README.md)에 이어 쓴다.

```
docs/week-07-performance/
├── README.md          궤적 요약 · 캡쳐 체크리스트 · 라운드 템플릿
├── measure-protocol.md
└── r0-before/
    ├── notes.md
    └── 01-lighthouse.png ...
```

R0(Before)와 최종 After는 풀 기록, 중간 라운드는 5회 raw와 바뀐 구간만 적는다.
