
## 🧭 0단계 — 측정 조건을 고정하고 Before를 남기기

**before commit SHA**: 

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
