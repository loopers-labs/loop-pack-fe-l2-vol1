
## 🧭 0단계 — 측정 조건을 고정하고 Before를 남기기

**before commit SHA**: a0dfbfe17d5cbfafc2660ca29bab30de63cf21f1
**After commit SHA**: After 적용 후 기재

**Lighthouse 측정 조건**
- viewport: 모바일 412×823 (Lighthouse 모바일 기본 프리셋)
- CPU: 4x slowdown
- network: Fast 4G, Disable cache 체크
- 실행 환경: `pnpm build && pnpm start`
- 도구: Lighthouse 5회 지표 FCP·LCP·CLS raw 5회 + 중앙값 + 최소 + 최대
- 크롬 게스트 프로필로 측정하여 extension들 영향 안받게

### Lighthouse FCP, LCP, CLS 5회 측정 값

| 지표 | raw값 | 중앙값 | 최소 | 최대 |
| --- | --- | --- | --- | --- | 
| FCP | 0.5s, 0.5s, 0.5s, 0.5s, 0.5s | 0.5s | 0.5s | 0.5s |
| LCP | 8.5s, 8.5s, 8.5s, 8.5s, 8.5s | 8.5s | 8.5s | 8.5s |
| CLS | 0, 0, 0, 0, 0 | 0 | 0 | 0 |

### LCP element, Performance filmstrip의 Header·페이지 제목·Hero 표시 순서, Network waterfall의 document·홈 데이터·Hero 이미지 요청 시작 순서와 전송 크기

**LCP element**

![LCP element](images/LCP_element.jpg)

**Performance filmstrip**

![Performance filmstrip](images/performance_filmstrip.jpg)

**Network waterfall의 document·홈 데이터·Hero 이미지 요청 시작 순서와 전송 크기**
| 항목       | 요청 시작 순서 | 전송 크기 | 비고                                                                                 |
| -------- | -------- | ----: | -------- |
| document | 1        | 8.2 KB | -                                                    |
| 홈 데이터    | 확인 불가 | - | React Query prefetch(dehydrate)로 서버에서 조회되어 브라우저 Network Waterfall에는 별도 요청이 나타나지 않음 |
| Hero 이미지 | 2       | 7.5 MB | - |


### 관찰한 사실, 원인 가설, 가설을 반증할 방법, 먼저 시도할 가장 작은 변경
| 관찰한 사실 | 원인 가설 | 가설을 반증할 방법 | 먼저 시도할 가장 작은 변경 |
| --- | --- | --- | --- |
| LCP로 인하여 Performance 점수가 크게 떨어짐 | hero image의 큰 용량으로 인하여 인터넷 속도가 느리다면 사용자가 이미지를 보는데 큰 시간이 소요됨  | 용량이 작은 이미지를 변경해 보고 재측정 | next/image를 사용하여 이미지 사이즈를 줄여보기 |

### /api/products?scenario=slow에서 이전 요청이 늦게 끝나도 현재 화면을 덮지 않는지 확인 녹화
docs/read0more-week7/recordings/step0_race_condition_check.webm

## 🖼️ 1단계 — Hero의 실제 LCP 병목을 줄이기

### LCP를 서버 응답 대기, 이미지 요청 시작 대기, 이미지 전송, 화면에 그려질 때까지의 시간으로 나눠 관찰

![LCP breakdown](images/LCP_breakdown.jpg)
- Time to first byte = 서버 응답 대기
- Resource load delay = 이미지 요청 시작 대기
- Resource load duration = 이미지 전송
- Element Render delay = 화면에 그려질 때까지의 시간

### 실제 표시 크기와 viewport에 맞는 이미지 후보·포맷·압축률을 선택하고, 불필요하게 큰 이미지가 내려가지 않게

**표시 크기 (HeroSection.module.css 확인)**
- hero는 컨테이너 100% 폭으로 렌더되며 데스크탑은 컨테이너 max-width 1280px, 모바일은 100vw.
- 비율은 `aspect-ratio: 16/9`(모바일 `4/5`), `object-fit: cover`

**필요 해상도 판단**
- 데스크탑: CSS 표시 폭은 최대 1280px. 단 레티나 등 DPR이 높은 화면도 고려. DPR 2면 이론상 1280×2 = 2560px가 필요하다. 다만 2560px를 그대로 내리면 전송이 과하므로, 중간치인 1920로 시도.
- 모바일: 모바일 기기는 일반적으로 DPR이 2~3이라 실제 필요 픽셀이 큼(예: 390px × DPR 3 ≈ 1170px, 큰 폰도 ~1290px). 즉 모바일 최대 필요치도 데스크탑 CSS 폭(1280)과 비슷한 수준이라 1280 이하 후보로 커버
- 결론: 모바일(≤~1290) ~ 고DPR 데스크탑(~1920)까지의 필요 픽셀을 하나의 srcset 후보 세트(640·828·1080·1280·1920)로 함께 커버하고, 브라우저가 각 기기의 폭×DPR에 맞는 최소 후보를 고르게

**결정 사항**

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 해상도 후보 | 640 / 828 / 1080 / 1280 / 1920 px | 표시 폭 × DPR. 고DPR 데스크탑은 이론상 2560px지만 전송 절충으로 상한 1920px. |
| `sizes` | `(min-width: 1280px) 1280px, 100vw` | 컨테이너 1280 캡, 그 아래는 뷰포트 100% |
| 포맷 | AVIF 우선, WebP fallback (미지원 시 JPEG) | 동일 화질에 JPEG 대비 50%+ 작음 |
| 압축률(quality) | 75(default) | default값인 만큼 hero 사진 기준 화질 손실 미미할 것으로 예상. 실무였다면 디자이너와 같이 육안으로 확인해 봤을듯 합니다. |
| 큰 이미지 방지 | 위 후보 + `sizes`로 뷰포트·DPR에 맞는 최소 이미지만 다운로드 | — |

### Hero 이미지가 언제 발견되어 요청되는지, 이 페이지에서 요청 우선순위를 높일 이유가 있는지
- 발견 시점: hero는 홈 데이터(~500ms) 대기 뒤 `Suspense` 경계 안에서 렌더되므로, 진입 즉시가 아니라 **경계가 스트리밍되는 ~500ms 뒤에 발견·요청**된다. (홈 HTML상 hero preload `<link as=image>`가 초기 `<head>`가 아니라 Suspense fallback보다 뒤에 방출됨 → LCP breakdown의 ② load delay ≈ 524ms와 일치.) 정적 hero를 셸(경계 밖)으로 빼면 초기 `<head>`에서 즉시 발견되게 만들 수 있다.
- hero는 화면 최상단 **LCP 요소**라 늦게 받으면 LCP가 곧바로 늦어지므로, 다른 리소스에 밀리지 않게 우선순위를 높일 이유가 있다. 따라서 `next/image`의 `priority`를 적용. `priority`는 `fetchpriority="high"`(다른 리소스보다 먼저 요청) + `preload`(img 태그 파싱 전에 미리 발견) + `eager`(lazy 로딩 해제)를 한 번에 적용한다.

### Hero의 시각적 크기, 비율, 주요 피사체와 문구를 유지, 이미지를 작게 보이게 하거나 품질을 낮춰 수치만 줄이지 않게
- 크기, 비율, 주요 피사체와 문구를 유지 하였으며, 품질의 경우 next/image의 사용 시 default값(75)으로 사용
