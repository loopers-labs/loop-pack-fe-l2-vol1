# Week 7 requirement-to-starter verification map

<!--
source_document: pasted-text.txt
source_sha256: 39e307e915f0ebcb787cac091f54cee4b1f5fc2710d96d8b17080d43fd954cce
source_line_count: 458
source_transform: 사용자 결정으로 폐기한 선택 범위의 본문·체크리스트·상호 참조 제거
base_revision: 8708cb2d7e0f8da0ac98fe0153a750aeee7b69dc
assignment_branch: codex/week-07-performance-assignment
-->

[Week 7 과제 문서](./week-07.md)의 Basic 1~5와 선택형 Advanced A를 starter 제공물, 학습자 소유 작업, 필수 증거, 자동 검증, 멘토 수동 검토, 인정하지 않는 우회에 1:1로 연결한 독립 검증 산출물이에요. 두 문서의 표가 다르면 `pnpm verify:week07:starter --scope=document`가 실패해요.

| ID | 요구사항 | starter 제공물 | 학습자 소유 작업 | 필수 증거 | 자동 검증 | 멘토 수동 검토 | 인정하지 않는 우회 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `W7-B1` | 같은 조건의 production Before를 고정한다 | 1.5초 slow API, 결정적 홈·상품 fixture, evidence template의 Before 칸 | 재현 행동을 정하고 관찰·가설·반증·최소 변경을 기록한다 | 홈 Lighthouse 5회 원값·중앙값·최솟값·최댓값, filmstrip·waterfall, 목록 최초/갱신 녹화와 요청 순서 | `--scope=basic-infrastructure`, `--scope=basic-checkpoints`; Basic submission은 clean starter에서 `INCOMPLETE` | 측정 조건의 동일성, LCP 원인 가설과 반증 가능성 | 코드 변경 뒤 Before를 만들거나 최고 점수만 고르기 |
| `W7-B2` | 느린 히어로와 관계없는 셸을 먼저 보낸다 | 홈 slow API와 데이터 계약만 제공하며 렌더 경계·fallback은 제공하지 않는다 | RSC/Client 경계, 데이터 소유자, 실제 크기 fallback을 설계한다 | 셸 선표시 filmstrip, FCP·LCP·CLS 5회, Layout shifts, document·데이터·이미지 waterfall | `--scope=basic-infrastructure`, `--scope=basic-checkpoints`; `basic-2-shell` 형식만 판정 | 경계 선택의 타당성, fallback 교체와 지표 변화 해석 | 지연 제거, 숨김 처리로 히어로 생략, starter가 정답 경계를 강제하기 |
| `W7-B3` | 최초 pending과 기존 목록 갱신 UX를 구분하고 마지막 URL·결과를 일치시킨다 | 상품 slow API, 결정적 목록 fixture와 연속 조건 변경 재현 입력 | pending/fetching, 성공·실패·빈 결과·취소 의미론과 필요한 최적화만 구현한다 | 최초/갱신 녹화, 요청 순서·취소, 마지막 URL·요청·화면 결과, 적용 증거 또는 무개입 근거 | `--scope=basic-infrastructure`, `--scope=basic-checkpoints`; `basic-3-transition` 형식만 판정 | 클릭 직후 피드백, 상태 구분, 선택 전략과 무개입 근거 | 지연 제거, 서버 응답 복제, 모든 Query API를 체크리스트처럼 추가하기 |
| `W7-B4` | JavaScript 전 초기 HTML에 페이지 의미와 이동 경로를 담는다 | 기존 홈·목록 데이터 계약과 slow 재현 경로만 제공한다 | metadata, 하나의 `h1`, 설명, 의미 구조, 링크, 이미지 대체 텍스트를 구현한다 | document Response·View Source·JavaScript 비활성 요청 중 하나 이상의 원본 | `--scope=basic-checkpoints`; `basic-4-html` 필수 칸과 증거 위치 형식만 판정 | 초기 응답의 실제 의미, 시맨틱 요소와 링크의 역할 | Elements의 hydration 결과만 제출하거나 기존 페이지를 starter 답안으로 교체하기 |
| `W7-B5` | 같은 조건의 After와 기능·구조 회귀를 함께 확인한다 | evidence template의 Before / After 표와 기존 `pnpm check` 계약 | 가장 작은 변경을 평가하고 무효 변경을 되돌리거나 유지 근거를 남긴다 | 동일 조건 After 원본, URL·뒤로/앞으로·상태·오류·빈 상태·FSD 회귀 결과, 악화된 값 | `pnpm check`, `--scope=basic-checkpoints`; Basic submission은 필수 원본 누락 시 `INCOMPLETE` | 변화가 흔들림보다 큰지, 원인 설명, 무효 변경과 악화 결과의 정직한 처리 | 조건을 바꾸어 비교하거나 문서에 없는 점수·향상률을 합격 기준으로 삼기 |
| `W7-AA` | Basic 완료 뒤 찜 하나가 만드는 관계없는 카드 렌더와 필수 계산을 줄인다 | 독립된 24개 카드, store, 찜 동작, 카드별 필수 화면 계산과 측정 checkpoint | 구독·selector·props·컴포넌트 경계를 진단하고 가장 작은 최적화를 구현한다 | 동일 초기 상태·4x slowdown의 Performance 3회 원값·중앙값, interaction 구간, Profiler 렌더 카드 수·원인 | `--scope=advanced-a`, `--advanced=a`; clean starter에서는 `INCOMPLETE` | trace와 Profiler의 원인 연결, 렌더 범위와 interaction 변화 해석 | 카드 수·필수 계산 축소, `setTimeout`, 즉시 피드백 제거, 하네스 수정 |
