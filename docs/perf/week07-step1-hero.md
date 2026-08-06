# 7주차 1단계 — Hero LCP 결과 (After)

<!-- AI 초안 — 측정·기록 자동화, 검토 필요 -->

- **After SHA**: `7f5755b` / Before SHA: `c572ae2`
- 측정 조건: `week07-before.md`와 SHA 제외 전부 동일 (Lighthouse 13.4.1 · Chrome 151 headless · 모바일 412×823 · 시뮬레이트 slow 4G + CPU 4x · 매회 새 프로필 · 홈 cold load)

## Before → After

| 지표 | Before 중앙값 (범위) | After 중앙값 (범위) | 변화 |
| --- | --- | --- | --- |
| FCP | 904ms (904–909) | 904ms (904–905) | 불변 — 셸 페인트는 원래 빠름 |
| **LCP** | **40,662ms** (40662–40678) | **2,913ms** (2760–3082) | **−92.8%** (−37.7s). 변화가 측정 범위(322ms)를 압도 |
| CLS | 0.000 | 0.003 | +0.003 (아래 원인·판정) |

After raw 5회: FCP 905/904/904/904/904 · LCP 3082/2914/2761/2760/2913 · CLS 0.003×5.

## 병목 구간별 인과 (완료조건: 구간과 변경의 인과관계)

| LCP 구간 (관측 기준) | Before | After | 무엇이 바꿨나 |
| --- | --- | --- | --- |
| TTFB | 4ms | 4ms | — |
| **load delay (발견 지연)** | **595ms** | **37ms** | hero를 쿼리 경계 밖으로 → 정적 셸(초기 문서)에 `<img>`+`<link rel=preload imagesrcset>` 포함. `discoverable in initial document: false → true` |
| **load time (전송)** | 108ms 관측 / **스로틀 ~39s** | 86ms | `next/image` srcset — 모바일 뷰포트가 750w 후보(**32KB**)를 받음. Before는 원본 **7,369KB** |
| render delay | 147ms | 20ms | 조기 발견·조기 디코드의 부수 효과 |

- 요청 시작: **599ms → 43ms** (문서 파싱 즉시)
- LCP element: 변함없이 hero `<img>` — 시각적 크기·비율·주요 피사체·문구 유지(스크린샷 대조), 품질 저하로 수치만 줄이지 않음(같은 원본을 표시 폭 기준 후보로 제공, q75)
- `priority`로 preload + `fetchpriority=high` — 이 페이지의 최상단 유일 대형 이미지라 우선순위를 높일 이유가 있다(0단계 discovery 체크 지적 해소)

## 변경 내용 (구조)

1. **`_pages/home/ui/HeroSection.tsx` 신설** (0단계에서 미룬 FSD 통합 — examples 원본은 강사 자료로 유지, import 제거)
2. **데이터 소유권에 맞춘 렌더링 경계 재구성**: 이미지 URL·h1(`이번 주의 발견`)·페이지 설명은 프론트 정적 소유 → 쿼리 밖. 배너 문구(title·description)만 서버 소유 → 같은 쿼리 키를 hero가 직접 구독(`homeQueries.home()` — 캐시 공유라 요청은 1회)
3. `HomePage` = 정적 `<HeroSection/>` + 데이터 `<HomeContent/>`(카테고리·상품 섹션 + 기존 인라인 로딩/에러 유지). 홈 데이터가 늦거나 실패해도 **헤더·h1·hero가 함께 막히지 않는다** — 1단계 요구사항 충족, 3단계(초기 HTML의 의미)의 선행 작업이기도 함
4. h1: Before는 배너 title(데이터 의존)이 h1이었고 Hero 교체 후엔 h1이 없었다 → eyebrow 문구를 정적 h1로 승격(시각 스타일 동일), 배너 title은 h2 유지

## CLS +0.003 — 원인과 판정

원인(Lighthouse culprit): `.copy` 박스 — 배너 문구 도착 시 정적 설명 1줄이 h2+p로 교체되며 박스가 위로 확장(absolute·bottom 고정이라 페이지 흐름은 무영향, 박스 자신의 이동만 계산됨). 1회성이고 good 임계(0.1)의 3%라 **"눈에 띄는 layout shift 아님"으로 수용**. min-height로 0을 만들 수 있으나 두 상태의 높이를 맞추는 매직 넘버가 생겨 개입하지 않는다 — 필요해지는 시점에 도입.

(후기: 3단계의 서버 prefetch + hydration으로 배너 문구가 SSR에 포함되면서 이 교체 자체가 사라져 CLS 0.000으로 복귀했다 — `week07-step4-after.md`. 개입하지 않은 판단이 결과로 정당화됐다.)

hero 컨테이너 자체는 `aspect-ratio` 선점 + `fill`이라 fallback(배경색)→이미지 교체에서 shift 0 유지.

## 초기 HTML 증거 (production document 응답)

```
<link rel="preload" as="image" imageSrcSet="/_next/image?...&w=640... 640w, ... 3840w"
      imageSizes="(min-width: 1232px) 1200px, 100vw"/>
<h1 id="home-hero-title" class="...eyebrow">이번 주의 발견</h1>
```

`curl localhost:3000/`로 확인 — JS 실행 전에 이미지 발견·제목 존재. 750w 후보 직접 요청: 200 · 36,149 bytes.

## 회귀 확인

- `pnpm check` 41/41 통과
- 홈 렌더·배너 문구 도착·배지(담기+찜 → 1/1)·헤더 유지 확인
- 참고: 데스크톱 고DPR에서는 srcset이 3840 후보를 고를 수 있다(sizes 1200px × DPR2 = 2400 > 2048 → 다음 후보). 표시 폭 요구를 만족하는 최소 후보라 과대 전송은 아니지만, 측정 기준(모바일)은 750w=32KB
