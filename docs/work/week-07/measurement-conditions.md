# 7주차 성능 측정 — 재현 조건

> **작성 안내**
> 값이 `-` 인 항목은 아직 측정·관찰하지 않은 자리다. 실측 후 채운다.
> Before·After 전 단계가 공유하는 재현 조건이다. [pr-description.md](./pr-description.md)의 최종 비교 결과, [baseline-and-regression.md](./baseline-and-regression.md)의 0·4단계, [diagnosis-log.md](./diagnosis-log.md), [01-hero-lcp.md](./01-hero-lcp.md), [02-list-pending-cls.md](./02-list-pending-cls.md), [03-metadata-og.md](./03-metadata-og.md)가 모두 이 조건을 전제로 한다.

---

## 🧪 재현 조건 (Before·After 동일)

SHA를 제외한 모든 조건을 Before/After에서 같게 둔다.

| 조건            | 값                                                                                                                                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before SHA      | `e81e7296d8b969c05de697583305cdf23c997a63`                                                                                                                                                                                              |
| After SHA       | `e3fdf8e545f8c5bab28f45e431eea5c817188422`                                                                                                                                                                                              |
| 실행            | `pnpm build && pnpm start` (개발 서버 측정 없음)                                                                                                                                                                                        |
| URL             | `http://localhost:3000/`                                                                                                                                                                                                                |
| 사용자 행동     | 홈 진입 1회 (navigation, 추가 조작 없음)                                                                                                                                                                                                |
| load 조건       | cold load (섞지 않음)                                                                                                                                                                                                                   |
| viewport        | 1350×940 (dpr 1) — Lighthouse `--preset=desktop`의 화면 에뮬레이션                                                                                                                                                                      |
| throttling      | **CPU 2.4x + 지연 167 ms + 하향 7,910 Kbps** — `--throttling-method=devtools`로 값을 명시                                                                                                                                               |
| 브라우저        | HeadlessChrome 151.0.0.0 (Lighthouse CLI가 실행)                                                                                                                                                                                        |
| Lighthouse 버전 | 13.3.0                                                                                                                                                                                                                                  |
| 브라우저 프로필 | CLI가 실행마다 새로 만드는 임시 프로필 (확장·캐시 없음) — 5회 모두 Hero가 캐시 히트 없이 full transfer(7,545,525 B, 7,989~8,025 ms)된 것으로 회차 간 캐시가 남지 않음을 확인했다. 시크릿 창 재사용과 달리 매 회차 cold load가 보장된다. |
| 측정 방법       | `scripts/lighthouse-measure.sh` — raw JSON·트레이스·filmstrip을 `measurements/<label>/`에 저장한다. 이 원본들은 용량이 커서(트레이스 회당 5~23 MB) 원격에 올리지 않고 로컬에만 보관하며, 측정으로 얻은 수치와 판정은 모두 이 문서 묶음의 본문에 옮겨 적었다. 같은 스크립트를 같은 조건으로 실행하면 재현된다 |
| `APP_ORIGIN`    | build와 runtime에 같은 값 — -                                                                                                                                                                                                           |

> localhost Open Graph URL은 배포 증거로 쓰지 않는다.

**throttling 환경 선택 근거**: 평균적인 사용자 환경에 가깝다고 판단해 CPU 2.4x + Fast 4G 상당 조건으로 고정한다. 0단계 Before부터 4단계 After까지 남은 실측을 모두 이 조건으로 진행한다.

이 값은 처음 DevTools 패널에서 측정할 때 쓰던 조건을 요청 타이밍에서 역산해 얻었고(패널 실행은 실제 조건이 JSON에 기록되지 않는다 — 아래 주의), CLI에 명시해 같은 결과가 나오는지 대조해 확정했다.

**조건이 실제로 적용됐는지 검증** — 기록값을 믿지 않고 5회 모두 요청 타이밍에서 역산해 대조했다.

| 회차 | Hero 실효 대역폭        | 소형 요청 중앙 소요 |
| ---- | ----------------------- | ------------------- |
| 1    | 943,978 B/s (7.55 Mbps) | 179.9 ms            |
| 2    | 942,394 B/s (7.54 Mbps) | 180.9 ms            |
| 3    | 944,070 B/s (7.55 Mbps) | 178.6 ms            |
| 4    | 940,270 B/s (7.52 Mbps) | 178.1 ms            |
| 5    | 944,416 B/s (7.56 Mbps) | 179.8 ms            |

설정한 하향 7,910 Kbps의 이론 최대는 1,012,480 B/s이고, 실측은 그 93.3 %다(프로토콜 오버헤드). 5회 편차는 0.4 % 이내다.

동일 조건 재현 명령:

```bash
./scripts/lighthouse-measure.sh before 5
# 내부적으로 실행되는 값
#   --preset=desktop --throttling-method=devtools
#   --throttling.requestLatencyMs=167
#   --throttling.downloadThroughputKbps=7910
#   --throttling.cpuSlowdownMultiplier=2.4
```

> ⚠️ DevTools 패널로 실행하면 결과 JSON의 `configSettings.throttling`에 Lighthouse 프리셋 기본값(`requestLatencyMs: 0`, `downloadThroughputKbps: 0`, `cpuSlowdownMultiplier: 1`)이 기록되고 실제 적용 조건은 기록되지 않는다. 브라우저에 이미 걸린 쓰로틀링을 그대로 물려받아 측정하기 때문이다(통제 실험으로 확인, 상세는 별도 분석 노트 `lighthouse-devtools-throttling-분석`). CLI에 값을 명시하면 기록값과 실제 적용값이 일치하므로, 이 문서의 측정은 모두 CLI 경로로 진행한다.

**production build 검증** (아래 모든 단계 공통): 서버 프로세스 부모가 `pnpm start`인지, Network 요청에 `hmr-client`·`next-devtools` 청크가 없는지로 확인한다 — 0단계 5회는 PID 95309(`pnpm start`), BUILD_ID `zk38Z7Rd-BErHCPrcxXfj`, 요청 35건×5회 모두 dev 마커 0건으로 확인됨.
