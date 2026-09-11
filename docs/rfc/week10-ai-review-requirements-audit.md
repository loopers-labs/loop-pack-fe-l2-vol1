# 10주차 4·5단계 요구사항 재검토

1~10주차 학습 기준과 프로젝트의 rule·skill·기계 검사를 대조한 반영 목록이다.

## 검토 기준

- 규칙 명문화, AI 도구 연결, 결정적 차단 여부를 구분한다. C1~C9는 기존 기준의 일부이며 전체 학습 범위를 대조한다.
- 스킬의 입력·판정 기준·출력·실행 시점·호출 경로를 확인한다. 누락 여부는 저장소에 기록된 지침과 연결을 기준으로 판단한다.
- 5단계는 실제 반복 지적 중 하나를 선택하고 규칙 성격에 맞는 검사 수단을 적용한다.
- RFC 검토는 범위에서 제외한다. 성능 분석 전용 스킬은 만들지 않고 측정 기준을 rule에 반영한다.

## 검토 범위

1~9주차 발제와 1~10주차 과제를 프로젝트 지침·스킬·실제 검사 설정에 대조했다. 10주차 발제 원본은 미확보이며 추가 확인이 필요하다. 최종 workflow 검토는 3단계 CI 구현 반영 후 수행한다.

## 요구사항 반영 현황

스펙 정의와 실제 구현·검증 상태를 구분한다.

| 요구사항 | 현재 상태 | 보완해야 할 계약 |
| --- | --- | --- |
| 4-1. PR diff 도구 | CI 모드 설계는 있음. 현재 Quality에는 AI 리뷰 job 없음. 로컬 code-review 스킬은 존재 | 고정 base/head diff를 어떤 도구로 읽고 프로젝트 기준을 어떻게 전달하는지 실제 실행 경로 확인. CI는 과제상 선택 |
| 4-2. 10주 학습의 rule·skill 업데이트 | 스펙에 반영 범위 정의. rule·skill의 실제 변경 필요 | 아래 주차별 검토 기능과 규칙 목록을 각각 기존 유지/수정/신규/해당 없음으로 배치하고 실제 호출·검수까지 완료 조건에 포함 |
| 4-3. 폭주·과금 방지 | turns·timeout·concurrency는 설계됨. 실물 미연결 | 실행 위치·트리거·대상·인증·한도와 소진 시 행동 확정. turns/시간 제한을 금액 상한과 동일하게 설명하지 않기 |
| 4-4. required/advisory 및 근거 | advisory와 비결정성 근거 있음 | 기존 선택은 보존하되 CI 배치 여부와 구별. AI 실패/부분 리뷰가 결정적 검사 성공이나 병합 차단으로 오인되지 않도록 검증 |
| 4-5. 유효 리뷰 1 / 오탐 1 | 제출 형식 있음. 이번 도구의 실행·판정 증거는 아직 연결되지 않음 | 원문·대상 SHA·기준·작성자 판정·코드 반례. 실제 오탐 미확보는 미확보로 보고 |
| 4-6. 프롬프트 수정 | v1/v2 비교 설계 있음 | 어떤 조항의 어떤 오해를 고쳤는지, 같은 diff에서 오탐뿐 아니라 기존 유효 지적도 유지되는지 확인 |
| 5-1. 반복 지적 선택 | 승격 대상 미선정 | AI뿐 아니라 사람의 10주간 실제 반복 지적도 조사. 아래 목록에서 후보를 열어 두고 중복 출력 제외 |
| 5-2. 결정적 게이트 승격 | 규칙 선택 후 검사 수단 결정 | import·구문·파일/구조 등 실제 규칙 성격으로 수단 선택. 기존 스크립트/CI 검사도 가능 |
| 5-3. 위반/정상·오탐 검증 | 양방향 검사 설계 있음 | 실제 적용 경로·별칭·정상 예외·다른 룰 오류 혼입까지 검증. 정상 코드를 바꿔 룰에 억지로 맞추지 않기 |
| 5-4. 책임 모델 | 문단 설계 있음 | 무엇을 기계로 옮겼고 어떤 맥락 판단이 AI/사람에 남는지 프로젝트 사례로 표 작성 |
| 5-5. AI 작성 룰의 실검증 | AI 초안 작성·작성자 검수 절차 정의. 실제 실행 필요 | 사람이 판정식·예외 확정 → AI 구현 초안 → 실제 위반/정상 실행 → 사람이 결과 검수의 순서 명시 |

## 주차별 AI 검토 기능: 기존 스킬로 무엇이 되고 무엇이 안 되는가

별도 SKILL 파일 하나씩을 과제가 의무화했다는 뜻은 아니다. **검토 기능의 누락을 먼저 확인하고**, 독립적인 입력/출력을 갖는 기능은 신규 스킬, 같은 검토의 빠진 기준은 기존 스킬 확장으로 제안한다.

| ID / 출처 | 요구되거나 제안된 AI 활용 | 저장소에서 확인한 범위 | 이번 스펙에 넣을 보완안 |
| --- | --- | --- | --- |
| A01 · 1주 과제 ‘셀프 리뷰’ | 상태 변화·의존성/기존 유틸·타입 침묵·입력/XSS를 diff 전체에서 검토. AI 생성 부분을 작성자가 설명 | self-review의 spec/품질 검토와 기존 lint는 있음. 네 축의 추적 가능한 연결은 약함 | self-review와 공통 리뷰 지침에 누락된 축·수용 책임·미검토 보고 추가 |
| A02 · 2주 props, 3주 발제의 AI 프롬프트 | 리팩터링 **전** UI/상태/서버/도메인 책임 분류, Hook 후보와 분리하지 않을 이유, 한 문장 책임 검토 | component-review는 분리 후 책임/상태/props를 상당 부분 검토 | component-review에 사전 분석 모드: 책임 표 → 분리 후보/유지 근거 → 작성자 판단. 모든 함수를 Hook으로 만들지 않기 |
| A03 · 4주 발제 | 라이브러리 소스와 실제 사용처를 근거로 Headless·Compound·제어권·Provider/Singleton·Portal 검토 | **analyze-component가 이미 존재하고 주요 기준도 있음** | 신규 중복 스킬 대신 실제 사용처/소스 근거와 PR 리뷰 연결 확인. 적용하지 않은 패턴도 이유로 설명 |
| A04 · 5주 발제 ‘AI는 설계 토론 상대로’ | 상태 분류 표의 전제를 반박하고 로그인 전환 시 원본·소유권·동기화 위험 검토 | component-review의 구현 후 3분할 검토는 있음. 상태 분류 표를 입력으로 공격하는 절차는 없음 | **state-design-review 신설 제안**: 분류 표·전환 시나리오 입력 → 성립 전제/반례/미결정 사항. 코드 생성 없이 설계 토론 |
| A05 · 6주 과제 ‘RFC 작성 직후’ | RADIO·대안·애매한 파일·마이그레이션·검증 계획을 구현 전에 AI 검토 | architecture-review는 **구현된 FSD 구조** 판단. specify는 일반 스펙 합의. 둘 다 RFC 검토 계약을 대체하지 않음 | 범위 제외. RFC 검토와 전용 스킬을 추가하지 않음 |
| A06 · 6주 과제 ‘마이그레이션이 끝나면’ | FSD 구조 점검, 수용과 반려를 각각 이유와 함께 기록 | architecture-review는 이미 존재, 공인 예외도 있음 | 현 코드와 프로젝트 구조 규칙을 대조하고 지적 판정 기록을 code-review에 연결 |
| A07 · 7주 과제 ‘AI 활용: 성능 분석 리뷰’ | raw 값·waterfall·filmstrip·최종 URL·서버 호출 수를 보고 가설/반증/가장 작은 변경 검토 | 전용 성능 분석 절차 없음. 일반 code-review는 측정 입력/반증 조건을 요구하지 않음 | 전용 스킬 미생성. 관찰 사실/가설 구분·비교 조건·반증 기준을 rule로 명문화해 관련 변경 리뷰에 적용 |
| A08 · 8주 과제 ‘AI 활용: 테스트 설계 리뷰’ | 사용자 시나리오 후보와 공개 동작/구현 세부 구분. 단언·모킹 경계는 사람 결정 | 기존 테스트 계획과 test-review는 있음. test-review는 **작성된 테스트** 검수 | **test-design-review 신설 제안**. 구현 전 시나리오·위험·가장 적절한 검증 경계·제외 이유 → 사람의 단언/모킹 확정 |
| A09 · 8주 발제 Part 5 | 스펙 기반 픽스처·MSW 생성, 불가능한 값 조합과 오래된 계약 검수 | testing rule/MSW 기반 및 test-review의 낡은 mock 점검 있음. 생성 시 입력 계약/도메인 반례는 약함 | test-design-review에서 계약/필요 사례 지정, test-review에서 생성물 계약과 경계값 검수. 별도 생성 스킬 분리는 반복 사용 필요에 따라 결정 |
| A10 · 8주 과제 3단계, 9주 발제 마지막 AI 활용 | 구현을 망가뜨려 AI 생성 테스트가 실패하는지 확인. 초록불을 만들려고 단언을 약화하지 않기 | 8주 자가 검증 **실제 기록 존재**. 모든 생성물 검수에서 이 절차를 연결하는 계약은 부족 | test-review에 필요 시 수행할 mutation 검수와 원복/결과 기록 연결. 과거 실험 재작성이나 모든 테스트 mutation을 강제하지 않기 |
| A11 · 9주 발제 ‘AI를 쓸 때’ | 흐름 후보 → 통합 테스트로 못 보는 부분 → 사람이 로그 세션 비율로 선택 → 확정 단언으로 생성 | E2E 범위 RFC는 이미 있음. AI 후보 검토의 입력/출력과 사람 결정 경계는 재사용 절차로 없음 | **e2e-scope-review 신설 제안**. 로그 산식/관측 한계·통합 테스트 중복·포함/제외 근거까지 검토 |
| A12 · 9주 발제 Test Agents, 과제 심화 B | AI E2E 생성물과 사람이 쓴 테스트 비교, 지운 단언의 이유, healer 경계 | test-review가 e2e 파일을 대상으로 삼지만 브라우저 전용 검토 기준 부족 | test-review의 **E2E 모드 확장**: 시작 경계·최종 결과 단언·worker/account/storageState·의도적 실패. 실제 planner/generator 실행은 심화 선택 여부와 별도 |
| A13 · 10주 과제 ‘CI workflow 리뷰 요청 예시’ | 병합 방어·concurrency·캐시/path filter·required/생략·권한/secrets의 5관점 검토 | ADR에 최종 1회 실행 계획만 있음. 재사용 가능한 workflow 검토 지침은 없음 | **workflow-review 신설 제안**. YAML뿐 아니라 호출 스크립트·이벤트/조건표·실제 run 증거를 함께 입력 |
| A14 · 10주 4·5단계 | 프로젝트 기준 PR 리뷰 → 판정 → 프롬프트 개선 → 반복 패턴의 룰 초안/실검증 | code-review는 Standards/Spec 일반 틀. 프로젝트 전문 스킬 연결과 승격 절차는 미정 | code-review를 프로젝트 기준에 연결하고 **rule-promotion 절차 신설 제안**. 별도 스킬로 노출하되 판정/선택을 AI가 대행하지 않기 |

신규 스킬 후보는 state-design-review, test-design-review, e2e-scope-review, workflow-review, rule-promotion이다. 기존 component-review·analyze-component·architecture-review·test-review·self-review·code-review는 보완·연결 대상으로 둔다. 최종 배치는 입력·출력과 적용 시점에 따라 결정한다.

### 발제의 선택 기능도 누락 목록에 남긴다

| 기능 | 근거 / 제약 | 이번 검토 제안 |
| --- | --- | --- |
| AI 브라우저 탐색 후 회귀 테스트로 고정 | 8주 발제의 ‘밤새 도는 E2E’는 발견용이며 비결정적 CI 게이트가 아님 | 탐색 → 사람 판정 → 결정적 회귀 테스트의 책임을 명문화. 무인 야간 실행 도입은 별도 범위 결정 |
| planner/generator 실제 비교 실험 | 9주 과제 심화 B. 해당 과제에서는 **healer를 쓰지 말라고 명시** | 선택 여부를 확인하고 실행 결과를 보강. 발제의 조건부 healer 허용 설명이 과제 금지를 덮지 않도록 함 |
| 시각적 회귀 | 9주 과제 심화 A. 기준선·마스킹·비결정성 제거·의도/비의도 변경 구분 | 검수 기준은 목록에 포함. story/gallery와 새 스크린샷 테스트 도입은 별도 선택 |

## Rule 후보: C1~C9 밖에서 빠진 실제 판단 기준

아래 R 번호는 **이 감사의 추적 번호**다. 새 린트 30개를 만들자는 뜻이 아니다. 각각 문서 규칙, AI 검토, 기계 검사로 나눠 담당을 정해야 한다. 현재 코드가 이미 잘 구현한 부분도 미래 변경에 적용할 규칙/호출 계약이 없으면 보완 대상으로 남긴다.

| ID / 주차 | 규칙으로 남길 구체적 내용과 예외 | 현재 상태 / 보완 위치 제안 |
| --- | --- | --- |
| R01 · 1 | any/as/disable로 오류 숨기지 않기, 기존 유틸 확인, 입력 신뢰 경계·XSS 확인. 경계에서 검증한 단언/as const까지 금지하지 않기 | 일부 lint·컨벤션 있음. 공통 지침에 기존 유틸/보안 검토 근거와 lint 담당 범위 연결 |
| R02 · 2·3 | 크기 대신 변경 이유로 분리, 함께 변하는 것 유지, 작은 중복만으로 추상화 강요하지 않기 | component-review에 상당 부분 있음. 사전 책임 분류 및 유지 근거 출력 보완 |
| R03 · 2·4 | 유효한 props 조합, 제어권, children/slot, 필요한 native prop/className 위임, on/handle, 사용처 단순성 | 기존 두 컴포넌트 스킬 존재. 누락 조항을 해당 스킬에 보완; 모든 컴포넌트에 as/asChild 강제 금지 |
| R04 · 3·5 | Hook은 로직 재사용이지 자동 상태 공유가 아님. 파생값 effect 금지와 외부 동기화/cleanup 구별, 오래된 응답·불안정 의존성 검토 | 상태 중복 기준은 있음. 비동기 경쟁/cleanup 및 사전 Hook 판단 보완 |
| R05 · 3·5 | API 전송·공통 오류 변환과 Query 정책/사용자 알림/화면 모델 분리. 실제 조회 컴포넌트의 Query Hook 사용 허용 | CONVENTIONS·component-review 부분 충족. 새 데이터 규칙에서 경계·예외를 하나의 출처로 명시 |
| R06 · 5 | 상태마다 원본·소유권·수명·공유 범위·로그인 전환을 명시. 서버 응답 복제와 사용자 선택/초안을 구별 | C4·component-review보다 넓음. 상태 설계 rule + state-design-review |
| R07 · 5·7 | queryFn 입력이 key와 일치, 공용 팩토리 계약, staleTime/gcTime 의미, factory spread+enabled 허용 | C7은 요약뿐. 인라인 객체/개별 staleTime 누락 일괄 금지 후보 수정 |
| R08 · 5·7·9 | 브라우저 QueryClient 수명 안정, 서버 요청별 격리, 서버/클라 key·파라미터·hydration 일치 | 기존 스킬에 요청 간 데이터 섞임과 hydration 계약의 구체 검토 부족. 상태/SSR 규칙으로 보완 |
| R09 · 5 | mutation의 취소·snapshot·rollback·재검증, pending 의미에 따른 invalidate 완료 대기, 필수 정합성 콜백과 UI 콜백 구별 | CONVENTIONS의 mutation 후 갱신만으로 부족. 상태 rule 보완. 결제 등 실패 비용 큰 동작에 낙관적 갱신 강제 금지 |
| R10 · 5 | URL parser/default/검증·페이지 보정·뒤로가기·검색 입력 초안과 확정값·reset의 계약 | C5/테스트는 있음. “nuqs 사용”보다 구체적인 URL 상태 rule 필요 |
| R11 · 5·9 | selector, persist version/migration·손상 데이터·hydration, 사용자 전환 시 상태 수명 | selector C9/구현 테스트는 있음. 지속 상태와 사용자 간 잔존 검토 보완 |
| R12 · 6 | 레이어 역할·슬라이스 결합·Public API·shared의 비즈니스 오염, 실제 프로젝트 예외 | architecture-review/lint 이미 있음. 신규 승격으로 재집계 금지. 구조 판단은 AI/사람에 유지 |
| R13 · 6 | RFC의 문제/대안/선택 근거·애매한 파일·단계별 검증/원복·상태 소유권 보존 | 기존 RFC 산출물 있음. 이번 범위에서 RFC 검토 제외 |
| R14 · 6·7 | HTTP/network/business/render/async 오류별 처리 위치, throw 정책, 가장 가까운 복구 UI, Query와 ErrorBoundary reset 연결 | CONVENTIONS/일반 스킬의 “에러 상태 확인”은 불충분. 에러 처리 rule와 컴포넌트 검토에 연결 |
| R15 · 7 | 초기/재조회·성공/빈값/오류/취소 UI, 오래된 데이터의 액션 가능 여부, 콘텐츠별 로딩 경계·CLS 공간 | 기존 self-review의 loading/error/empty보다 넓음. 렌더링 rule 보완 |
| R16 · 7 | 실측→가설→반증→작은 변경→같은 조건 재측정. raw·중앙값·범위와 URL/응답/서버 호출 증거 구별 | 측정 기준을 rule로 명문화. 근거 없는 memo/preload·API 비활성화로 점수 개선 제안 금지 |
| R17 · 7 | 초기 HTML 메타데이터·상위 메타 병합·빈 결과와 조회 실패 구별, 서버 중복 호출과 브라우저 요청 구별 | C1~C9에 없음. SSR/성능 rule. 프레임워크 캐시와 Query 캐시가 둘 다 있을 때 각각 정합성 검토 |
| R18 · 2·4·7 | 링크 href, 의미 있는 이미지 alt, 버튼/링크 의미, 실제 제어 API의 키보드/포커스 책임 | 패턴 분석과 앱 접근성 기준 연결 보완. 특정 주차 구현 제외를 앱 전체 접근성 예외로 확대하지 않기 |
| R19 · 8 | 테스트 의도·공개 동작·시나리오·단언·모킹 경계를 구현 전에 사람과 정하기 | testing rule/test-review는 일부 존재. test-design-review 입력·출력으로 보완 |
| R20 · 8 | 현재 출력에 기대값 맞추지 않기, skip/only/무의미한 단언 금지, 구현을 깨뜨려 검출 확인 | rule·lint·자가 검증 기록 존재. **E2E/scripts까지 lint 보장이라고 말하는 것은 오류**; 실제 범위 표시/보완 |
| R21 · 8 | 실제 검증 대상 실행, Vitest 네트워크는 MSW, 미처리 요청 실패·handler reset, 도메인 계약에 맞는 fixture | 기존 설정/규칙 상당 충족. API client mock 금지의 적용 범위와 허용 환경 mock 구별, 생성 픽스처의 불가능한 조합 검토 |
| R22 · 8·9 | 시간/랜덤/storage 상태 격리, 전환 완료 조건 대기, jsdom으로 CSS·시각 동작 보장하지 않기 | test-review에 일부 있음. 실행 환경별 가능한 관찰과 불가능한 관찰 보완 |
| R23 · 9 | 로그의 세션/이벤트·봇/중복·실패율 분모/대용 지표 구별, E2E 빈도×실패 비용×재현 난도와 제외 근거 | E2E RFC 이미 있음. e2e-scope-review에 계산/관측 한계 확인 절차 |
| R24 · 9 | 인증 return URL 신뢰 경계, 비로그인/만료 구별, SSR cookie·초기 HTML·요청 격리, 로그아웃 후 캐시/진행 중 응답 처리 | 구현·테스트는 존재. auth rule과 상태/E2E 리뷰 연결은 부족. 오래된 인증 설계를 정답으로 강요하지 않기 |
| R25 · 9 | 분석 이벤트의 타입·발행 위치·중복·상관관계와 민감 정보 처리 | typed 이벤트 래퍼는 이미 있음. 이벤트 검토 기준 정리. 현재 합의 없이 모든 track 호출을 새 문법 규칙으로 금지하지 않기 |
| R26 · 9 | E2E 최종 사용자 결과 단언, 시작 경계 명시, storageState는 로그인 자체를 검증할 때 우회 수단으로 쓰지 않기 | test-review의 E2E 모드에 구체 조항 필요 |
| R27 · 9 | worker별 계정/상태 격리, production 실행, 의미 기반 selector·조건 대기, 고정 sleep과 retry로 원인 은폐하지 않기 | Playwright 설정 일부 있음. sleep ban의 결정적 lint는 현재 없음; flaky trace·격리 시 검증 공백 판정 보완 |
| R28 · 9 | 시각적 기준선 변경 이유, font/time/random/image 안정화, masking이 줄인 검증 범위, healer가 바꾼 단언의 의미 | 선택 기능 기준으로 test-review에 경계 명시. 실제 도입은 심화 선택과 구별 |
| R29 · 10 | 이벤트×변경 범위×필수 검증×배포의 조건, 실패/생략/0개/미완료 구별, 캐시·취소·권한·동일 SHA 추적 | 실제 CI/ADR는 있음. workflow-review에 코드+스크립트+실험 증거 계약 |
| R30 · 10 | AI 입력/프롬프트 버전 고정·부분 리뷰 표시·실행 한도·오탐 판별·반복 집계·룰 양방향 검증·책임 이동 | 기존 스펙 일부 충족. code-review 연결 및 rule-promotion 절차로 보완 |

### Rule 파일 배치 제안

현재 프로젝트의 별도 rule 파일은 testing 하나다. 다음 주제 묶음을 **실제 파일 내용/호출 범위까지** 검토하는 대상으로 제안한다. 파일 수 자체를 요구사항으로 만들지는 않는다.

- 공통 컨벤션: R01~R05 중 모든 코드에 필요한 짧은 원칙. 기존 CONVENTIONS와 모순/중복을 없애고 전문 설명은 링크한다.
- 상태·데이터: R05~R11. 서버/URL/클라이언트 원본, Query·mutation·persist·hydration의 예외 포함.
- 에러·렌더링: R14~R15 및 R18. 상태 전환/복구와 접근성 판단.
- SSR·성능: R08·R16~R17. 측정 규칙과 캐시/메타데이터 계약.
- 인증·계측: R23~R25 중 코드 변경 기준. 로그 기반 E2E 선택 절차 자체는 스킬에 둔다.
- testing 기존 확장: R19~R22, R26~R28. Vitest/브라우저/시각 검토의 적용 범위를 구분한다.
- CI·AI 리뷰: R29~R30. 실행 조건·근거·한도·신뢰 경계 및 판별 기록.

FSD는 이미 있는 architecture-review/ESLint를 정본으로 연결한다. 동일 규칙을 여러 파일에 복사하는 대신 **정본·적용 경로·불러올 스킬**을 매핑한다. `.claude/rules` 파일을 추가했다고 로컬 Codex나 CI의 다른 도구가 자동으로 읽는다고 간주하지 않는다.

## 배치 결정

티켓별로 확정한 항목을 여기에 누적한다. 아직 없는 ID는 담당 티켓에서 채운다.

### 컴포넌트·구조·화면 (티켓 03)

| ID | 판정 | 정본 | 읽히는 경로 | 결정 근거 |
| --- | --- | --- | --- | --- |
| 공통 컨벤션 | 유지 | `CONVENTIONS.md` | AGENTS.md 코드 규칙 | CONVENTIONS 5장과 겹치던 문장(메시지 대신 에러 코드로 분기, 업데이트 버튼 pending 비활성화)은 rule에서 뺐다. `rendering.md`에는 이 프로젝트에만 있는 형태(`ApiError.status`로 분기, 조회 재시도 버튼도 비활성화)만 남겼다 |
| A01 | 보완 | `self-review` 검증 관점 4) | AGENTS.md 워크플로의 구현 후 `/self-review` | 상태 변화·기존 유틸·타입 침묵·입력 신뢰 경계를 diff 전체 검토 항목으로 명시하고 AI 생성분의 설명 책임을 덧붙였다 |
| A02 | 보완 | `component-review` 리뷰 관점 0) | 작성자가 분리 전에 호출, `self-review` 4단계 라우팅 | 분리 후 검토만 있던 스킬에 사전 책임 분류 모드를 넣고 최종 결정은 작성자에게 남겼다 |
| A03 | 유지 + 보완 | `analyze-component` | 작성자가 공통 UI 검토 시 호출, `self-review` 4단계 라우팅 | 신규 스킬을 만들지 않는다. 미적용 패턴의 이유, native prop 위임, 키보드·포커스 책임을 추가했다 |
| A06 | 유지 + 보완 | `architecture-review` | 구조 변경 시 `self-review` 4단계 라우팅 | 기계가 막는 범위와 판단으로 남는 범위를 표로 갈랐고, 공인 예외로 통과시킨 사실을 보고에 남기게 했다 |
| A05 · A07 · R13 | 해당 없음 | — | — | RFC 검토와 성능 분석 전용 스킬은 스펙의 Out of Scope. A07의 판단 기준은 `performance.md`로 옮겼다 |
| R01 | 보완 | `self-review` 검증 관점 4) + 기존 ESLint | `pnpm lint`, `/self-review` | 경계에서 검증한 단언과 `as const`는 침묵으로 보지 않는다고 명시했다 |
| R02 | 보완 | `component-review` 0) · 3) | 위 A02와 같음 | 크기가 아니라 변경 이유로 분리하고, 분리하지 않을 근거도 같은 비중으로 내게 했다 |
| R03 | 보완 | `analyze-component` 리뷰 관점 5) | 위 A03과 같음 | 성립하지 않는 props 조합, native prop 위임, `on*`/`handle*`를 추가하고 `as`/`asChild` 강제는 금지했다 |
| R04 | 보완 | `component-review` 3) · 7) | 위 A02와 같음 | Hook은 상태 공유 수단이 아니라는 점, cleanup·오래된 응답·불안정 deps를 추가했다 |
| R12 | 유지 | `architecture-review` + `boundaries/dependencies` · `no-restricted-imports` | `pnpm lint`, `/architecture-review` | 이미 결정적으로 막히므로 5단계 신규 승격으로 세지 않는다. 레이어 적합성·응집 판단은 AI와 사람에 남긴다 |
| R14 | 신규 | `.claude/rules/rendering.md` — 오류 절 | AGENTS.md 코드 규칙의 규칙 파일 포인터, `component-review` 8), `self-review` 2단계 | 처리 위치(API 계층 / 401 공통 / 화면 인라인 / error.tsx), throw 정책, 복구 수단을 이 프로젝트 계약대로 적었다 |
| R15 | 신규 | `.claude/rules/rendering.md` — 상태 절 | 위 R14와 같음 | 초기 대기·재조회·성공·빈 결과·오류·취소를 모두 정하게 하고 최초 실패와 갱신 실패를 갈랐다 |
| R16 | 신규 | `.claude/rules/performance.md` | AGENTS.md 코드 규칙의 규칙 파일 포인터, `component-review` 8) | 측정 조건의 정본은 `docs/week-07-performance/measure-protocol.md`이고, 규칙 파일은 관찰/가설/반증과 근거 없는 최적화 금지를 맡는다 |
| R18 | 신규 | `.claude/rules/rendering.md` — 접근성 절 + `analyze-component` 5) | 위 R14 · A03과 같음 | 링크/버튼 의미, `alt`, `aria-label`은 규칙으로, 제어 API의 키보드·포커스 책임은 패턴 검토로 나눴다 |

`.claude/rules/`가 자동으로 읽힌다고 가정하지 않기 위해 AGENTS.md 코드 규칙에 세 규칙 파일을 조건과 함께 한 줄로 걸어, Codex도 같은 경로로 찾게 했다.

### 상태·데이터·인증 (티켓 04)

| ID | 판정 | 정본 | 읽히는 경로 | 결정 근거 |
| --- | --- | --- | --- | --- |
| A04 | 신규 | `.claude/skills/state-design-review/SKILL.md` | AGENTS.md 코드 규칙의 스킬 포인터 + description 트리거 | 코드를 쓰지 않고 전제·반례·미결정만 낸다. 입력은 분류 표·파일 지정·`git diff` 셋 다 받고, 코드에서 뽑은 표에는 근거를 붙인다. 채택은 작성자가 한다 |
| R06 | 신규 | `state-data.md` 「원본의 위치가 도구를 정한다」 + `state-design-review` | AGENTS.md 코드 규칙의 규칙 파일 포인터 | 발제 5주차의 축(원본으로 도구를 정하고 수명·공유 범위로 검증, 서버→URL→남은 것 순으로 소거)을 그대로 쓰고, 분류 표는 양식이며 근거 칸이 본체라는 점을 명시했다 |
| R05 | 보완 | `state-data.md` 「서버 상태는 내 상태가 아니라 캐시다」 | 위와 같음 | API 순수성 자체는 CONVENTIONS 3장이 정본이라 복사하지 않고, 이 규칙에는 Query 옵션·표시 모델 경계와 "조회 컴포넌트의 Query Hook 사용은 정상"만 남겼다 |
| R07 | 신규 | `state-data.md` 「서버 상태는 내 상태가 아니라 캐시다」 | 위와 같음 | queryKey는 queryFn의 의존성이라는 발제 조항. 쿠키는 예외로 열었고, 인라인 객체 금지·staleTime 명시 강제는 채택하지 않고 상속을 정상으로 뒀다 |
| R08 · R17 | 신규 | `state-data.md` 「서버가 채우고 클라이언트가 이어받는다」 | 위와 같음 | 요청별 client, 브라우저 client 수명, HydrationBoundary 이어받기, 서버 호출 수 세기, 메타데이터 상속과 0건 구별 |
| R09 | 신규 | `state-data.md` 「낙관적 갱신은 캐시를 잠깐 빌리는 것이다」 + 「서버 상태는 내 상태가 아니라 캐시다」 | 위와 같음 | 빌리고·되돌리고·돌려주고, 무효화는 기다린다, 낙관이 정당화되는 자리는 롤백이 화면 안에서 끝나는 곳. 세션 전환 시 취소→제거→교체 순서도 여기 있다 |
| R10 | 신규 | `state-data.md` 「URL 상태」 | 위와 같음 | parser 한 곳 검증, push/replace 구분, 조건 변경 시 페이지 초기화, 초안과 확정값 구분 |
| R11 | 신규 | `state-data.md` 「저장해 두는 상태」 | 위와 같음 | 저장값 검증, version·migrate 분담, 복원 전과 값 없음 구별, selector 범위, 계정 범위 잔존 판단 |
| R24 | 기존 위임 | `rendering.md`(401 처리 위치) · `self-review` 네 축(입력 신뢰 경계) · `state-data.md`(세션 전환 시 캐시 정리) | 각 파일의 기존 경로 | 별도 auth 규칙 파일을 만들었다가 지웠다. 조항 대부분이 위 셋과 중복이었고, 남는 것은 정리 순서 한 줄뿐이라 `state-data.md`로 옮겼다 |
| R25 | 부분 위임 | `src/analytics/events.ts`의 유니온 타입 + `self-review` 네 축(입력 신뢰 경계) | 컴파일 · `/self-review` | 이름·props 조합은 타입이 막고, 민감 정보는 self-review가 밖으로 나가는 값으로 본다. 발행 위치와 중복 발행은 규칙 없이 남겼다 — 계측을 새로 붙일 때만 걸리는데 이 저장소에 그 작업이 없다 |

이 티켓의 규칙은 `state-design-review`가 판정 기준으로 읽고, 코드 변경에서는 AGENTS.md 포인터로 걸린다. 작업 중 `architecture-review`의 `app/api` 공인 예외가 `proxy.ts`와 두 파일의 테스트를 빠뜨린 것을 발견해 함께 고쳤다 — A06은 티켓 03 소유이므로 그 행의 사실 정정으로 본다. 검수 기록은 [04-state-auth-checks](../../.scratch/week10-step4-5-ai-review-and-rule-promotion/verification/04-state-auth-checks.md)에 있다.

A11·R23은 [e2e-scope-review](../../.claude/skills/e2e-scope-review/SKILL.md)로 구현하고 AGENTS.md에서 연결한다.

### 테스트 설계·생성물 (티켓 05)

| ID | 판정 | 정본 | 읽히는 경로 | 결정 근거 |
| --- | --- | --- | --- | --- |
| A08 · R19 | 신규 | `.claude/skills/test-design-review/SKILL.md` | AGENTS.md 코드 규칙의 스킬 포인터 + description 트리거 | 의도(무엇을 지킬지·단언·모킹 경계)와 실행(픽스처·핸들러·셀렉터)을 가르는 발제 8주차의 축을 그대로 썼다. 출력은 후보·층·포기 목록까지고 단언 문구와 모킹 경계는 작성자가 정한다. 코드도 스펙도 없으면 후보를 지어내지 않고 입력 부족으로 끝낸다 |
| A09 · R21 | 보완 | `testing.md` 「픽스처와 핸들러」 | AGENTS.md 코드 규칙의 규칙 파일 포인터 | 픽스처는 앱 타입에서 가져오고 한 곳에서 만든다, 실제 서버가 보낼 수 없는 조합은 만들지 않는다, 픽스처의 개수·순서·경계값은 그 자체가 계약이라 이유를 남긴다. 검수 쪽은 `test-review` 거짓 초록불 표에 「불가능한 값」·「검증 대상 mock」 두 행으로 넣었다 |
| A10 | 보완 | `test-review` 6단계 | `/self-review` 3단계 → `test-review` | 대상을 **하나**로 좁혔다 — 새 대표 테스트나 진단이 불명확한 테스트. 원복 후 다시 초록불을 확인하는 것까지가 이 단계이고, 전수는 기존 `pnpm test:mutation`이 맡는다. 과거 실험 재작성이나 전 테스트 강제는 하지 않는다 |
| A12 · R26 · R27 | 보완 | `testing.md` 「E2E」 (조항) | AGENTS.md 코드 규칙의 규칙 파일 포인터 | 시작 경계·최종 결과 단언·`storageState`·계정/데이터 격리·조건 대기·flaky 대응 7개 조항. `test-review` 5단계 E2E 표는 이 조항의 **신호와 심각도만** 정하고 조항을 다시 쓰지 않는다. 로그인 검증 테스트의 `storageState` 우회는 정상 예외로 명시했다 |
| R20 | 보완 (사실 정정) | `eslint.config.mjs`의 테스트 블록(범위) + `testing.md` 「이 레포 하네스」 · `test-review` 2단계(서술) | `pnpm lint`, `/self-review` | 실제 범위는 설정 파일이 정본이다. 오늘 기준 비활성화·단언 없음·truthiness는 `{src,tests}/**/*.test.{ts,tsx}`에서 에러가 되고, **`src/app/api/**`는 truthiness 조항만 꺼져 있다**(나머지 Vitest 규칙은 그대로 걸린다). 어느 조항도 걸리지 않는 곳은 `scripts/**`와 `e2e/**`뿐이라 리뷰가 눈으로 대조한다. 위반이 지금 없는 것과 앞으로 막히는 것을 구별한다 |
| R22 | 유지 | `test-review` 거짓 초록불 표(시간·타임존·순서·비동기) | 위와 같음 | 이미 있던 네 행이 실행 환경별 관찰 한계를 덮는다. 층별로 무엇이 관찰되는지는 `test-design-review`의 층 판정 표가 맡아 규칙 파일에 복사하지 않았다 |
| R28 | 부분 위임 | `testing.md` 「E2E」 마지막 줄 | 위와 같음 | 마스킹으로 줄어든 범위와 healer가 바꾼 단언의 기록을 요구하되, **그 산출물이 대상에 있을 때만** 적용한다. 검수 기준을 두는 것과 도구를 도입하는 것을 갈랐다 |
| 검사기 테스트 | 신규 | `testing.md` 「검사기 테스트」 | 위와 같음 | 감사 「빈틈 1」의 결론이다. CLI 검사기의 공개 동작은 종료 코드와 진단 출력이다. 테스트 범위(`scripts/**/*.test.ts`)는 `testing.md` paths · `test-review` 대상 · `self-review` 라우팅 셋 다에 넣었다. 종료 코드를 **어떻게 나눌지는 스크립트 설계**라 규칙으로 정하지 않고, 테스트가 세 경우를 각각 실행해 갈리는 지점을 단언하도록만 요구한다 |

검수 기록은 [05-test-design-checks](../../.scratch/week10-step4-5-ai-review-and-rule-promotion/verification/05-test-design-checks.md)에 있다. 대표 테스트 하나는 구현을 실제로 깨뜨려 검출을 확인했다(6 failed → 원복 후 18 passed). E2E 고정 sleep과 `scripts`·`e2e`의 테스트 무력화 차단은 4단계에서 문장 규칙까지만 두고 **5단계 승격 후보**로 남긴다.

### CI·workflow 검토 (티켓 07)

| ID | 판정 | 정본 | 읽히는 경로 | 결정 근거 |
| --- | --- | --- | --- | --- |
| A13 · R29 | 신규 | `.claude/skills/workflow-review/SKILL.md` | AGENTS.md 코드 규칙의 스킬 포인터 + description 트리거 | 다섯 관점(병합 방어·concurrency·캐시/path filter·required와 생략·최소 권한/secrets)은 과제 예시를 그대로 쓰고, 판정 기준을 YAML 문면이 아니라 호출 스크립트·branch protection 설정·실제 run 증거에 뒀다. CI 실행 정책의 정본은 이미 workflow 주석·ADR·week10-ci.md에 있어 별도 rule 파일로 복사하지 않았다 — 스킬에는 검토 계약(입력과 실행 코드 출처, 실패·취소·정상 생략·0개 실행·미완료 구별, 동일 SHA 대조, 근거 없는 실행 보장은 보류)만 둔다 |

최종 workflow 리뷰는 [07-workflow-checks](../../.scratch/week10-step4-5-ai-review-and-rule-promotion/verification/07-workflow-checks.md)에 있다. 수용 2건(트리의 낡은 `pr-review.mjs` 사본, `decide-e2e-scope`·`pr-comment.yml`의 main 미이관 — 둘 다 작성자 결정 대기), 반려 2건, 보류 1건(schedule cron 첫 발화 증거 — 2026-09-14 확인). 정상 생략·입력 부족 사례의 산출 형태도 같은 기록에서 검수했다.

> **추기 (2026-09-11)**: 수용 2건은 같은 날 해소됐다 — 미이관 커밋은 PR #34 병합으로 main에 반영됐고, 낡은 `pr-review.mjs` 사본은 main 버전으로 교체했다. 리뷰 미결은 schedule 첫 발화 확인(09-14)만 남는다.

### E2E 범위 (티켓 06)

| ID | 판정 | 정본 | 읽히는 경로 | 결정 근거 |
| --- | --- | --- | --- | --- |
| A11 · R23 | 신규 | `.claude/skills/e2e-scope-review/SKILL.md` | AGENTS.md 코드 규칙의 스킬 포인터 + description 트리거 | 발제 9주차의 순서(흐름 후보 → 통합 테스트로 못 보는 부분 → 사람이 로그 세션 비율로 선택)를 그대로 절차로 썼다. 로그 산식·봇/중복·분모와 대용 지표, 관측 한계는 이 스킬이 판정 기준으로 들고, **최종 범위 결정은 작성자**가 한다. 기존 `docs/rfc/week09-e2e-scope.md` C절의 결정은 출처와 함께 보존하고 새 범위 결정은 하지 않았다. 계측 코드 계약은 티켓 04(`state-data.md`·`self-review`)와 중복 복사하지 않았다 |

### PR diff 리뷰·판별·프롬프트 개선 (티켓 02 · 08)

| ID | 판정 | 정본 | 읽히는 경로 | 결정 근거 |
| --- | --- | --- | --- | --- |
| A14 (리뷰 쪽) | 보완 | `.claude/skills/code-review/SKILL.md` 3단계 「Identify the standards sources」 | 작성자가 `/code-review` 호출, `self-review` 4단계 라우팅 | 일반 Standards/Spec 두 축은 유지하고 **이 저장소의 정본과 라우팅만** 얹었다 — 변경 경로별로 어떤 rule 파일과 어떤 검토 스킬을 고를지 표 하나. 규칙 내용은 복사하지 않고 정본을 인용하게 했다. 존재하지 않던 `docs/agents/issue-tracker.md` 참조를 지우고 spec 출처를 `specs/*.spec.md` → `.scratch/*/issues/` → `docs/rfc/`로 바로잡았다(아래 「빈틈 3」). 스펙이 시점 기록이라 나중 결정이 덮을 수 있다는 점도 명시했다 |
| A14 (승격 쪽) | 해당 없음 | — | — | `rule-promotion`을 **별도 스킬로 만들지 않는다.** 5단계에서 한 번 쓰는 절차이고 판정식·예외·최종 선택이 전부 작성자 몫이라, 재사용 가능한 입력·출력 계약이 서지 않는다. 절차는 스펙 5절에 두고 실행 기록은 티켓 09가 남긴다 |
| R30 | 신규 | `scripts/week-10-ci/pr-review.md` + `.github/workflows/ai-review.yml` + `scripts/week-10-ci/pr-review.mjs` · 판별 기록은 [week10-ai-review.md](week10-ai-review.md) | `workflow_run` 자동 실행 (advisory), 기준·프롬프트는 **base SHA에서** 읽음 | 입력·프롬프트 버전 고정(`rulesRef`·`promptHash`), 부분 리뷰 표시(`status`가 `completed`·`partial`·`input_limit`·`invalid_output`·`timeout`·`auth_unavailable`을 구별), 실행 한도(1회 + 수동 재실행 1회·3분·1MiB·6,000토큰). **유효 지적 1·오탐 1의 작성자 판정과 프롬프트 v1/v2 비교는 [week10-ai-review.md](week10-ai-review.md)에 제출물로 커밋한다** — `.scratch/`는 추적되지 않아 제출에 들어가지 않는다. 룰 양방향 검증과 책임 이동은 5단계(티켓 09) 몫 |

**설계 입력과 diff 입력의 구별** — `pr-review.mjs:136-155`가 변경 경로로 `route`를 넷으로 가른다.

| route | 조건 | 처리 |
| --- | --- | --- |
| `guidance` | `AGENTS.md`·`CONVENTIONS.md`·`.claude/**`·`pr-review.*` 변경 | 리뷰한다 — 리뷰 품질을 바꾸는 변경이므로 문서라고 생략하지 않는다 (감사 「빈틈 4」) |
| `code` | 런타임 파일이 하나라도 있음 | 리뷰한다 |
| `design` | `docs/rfc/**`·`specs/**`만 변경 | 리뷰한다 — 전제와 관찰 경계를 본다 |
| `docs` | 나머지(일반 안내 문서) | **`skipped: ordinary_docs_manual_review`** — 사람 검토로 넘긴다 |

즉 "모든 변경에 모든 스킬"도 아니고 "문서면 전부 생략"도 아니다. 설계 문서(`design`)와 지침(`guidance`)은 diff 입력으로 리뷰하되 적용 기준이 다르고(`pr-review.md` 3항), 일반 문서만 생략한다. 로컬 스킬 중 `state-design-review`·`test-design-review`·`e2e-scope-review`는 diff가 아니라 **분류 표·시나리오·로그**를 입력으로 받는 설계 절차라 이 경로와 별개다 — 작성자가 구현 전에 직접 호출한다.

**실제 도구가 관련 기준을 골라 읽는지 확인** — CI AI 리뷰가 남긴 `rules_read`를 run별로 대조했다. 기준 목록은 `pr-review.mjs:167-184`가 변경 경로로 정한다.

| run | 변경 성격 | 실제로 실린 기준 | 판정 |
| --- | --- | --- | --- |
| [34519398473](https://github.com/heeji289/loop-pack-fe-l2-vol1/actions/runs/34519398473) | `CurrencySelect.tsx`(저장 상태를 쓰는 컴포넌트) | rules 4 + `architecture-review`·`component-review` | **부분 성공** — `state-design-review`가 안 실렸다. 파일 경로에 `state|store|query|auth`가 없어서다. 지적은 항상 실리는 `state-data.md`가 만들어냈다 |
| [34517159942](https://github.com/heeji289/loop-pack-fe-l2-vol1/actions/runs/34517159942) | `quality.yml`·`decide-e2e-scope.mjs` 등 CI | rules 4 + `architecture-review`·`component-review`·`e2e-scope-review`·`state-design-review`·`test-review` | **과다** — CI 변경에 상태 설계·E2E 범위 스킬까지 실렸다 |
| [34515892450](https://github.com/heeji289/loop-pack-fe-l2-vol1/actions/runs/34515892450) | `week10-ci.md`(측정 문서) | `testing.md` + 3개 스킬 | base(`2483119b`)에 `.claude/rules/`가 `testing.md`뿐이던 시점이라 정상. `performance.md` 부재는 기준 고정의 결과이지 라우팅 실패가 아니다 |

**결론**: 파일 경로 정규식 라우팅은 놓침과 과다를 모두 낸다. 지금은 rule 파일 4개가 **항상** 실려 받쳐 주고 있어 결과가 맞았다. 경로가 아니라 diff 내용으로 고르려면 모델 호출이 한 번 더 필요해 이번 범위에서는 바꾸지 않는다 — 대신 **rule 파일을 항상 싣는 현재 설계가 라우팅 오차를 흡수한다**는 것을 근거로 남긴다. 로컬 스킬 쪽은 `code-review` 3단계 표와 AGENTS.md 포인터가 사람·에이전트의 선택 경로다.

## 현재 연결에서 확인한 구체적인 빈틈

1. **테스트 검사 범위 불일치.** testing rule과 test-review의 테스트 파일 범위에는 `scripts/**/*.test.*`가 빠져 있다. ESLint의 Vitest 특화 규칙도 `{src,tests}/**/*.test.*`에만 적용된다. E2E가 test-review 대상이라는 사실과 skip/only/truthiness가 E2E에서도 lint로 차단된다는 것은 별개다. 기존 E2E 결과 검사는 실행 수/상태를 검사하지만 모든 테스트 코드 패턴의 정적 검사를 대체하지 않는다. test-review는 의도 출처에서 정적 검사 조건을 제외하므로, 새 CI/룰 회귀 검수에서는 **검사기의 입력 → 진단/exit code도 공개 동작으로 검토**하도록 적용 계약을 보완해야 한다. → 티켓 05에서 닫았다(아래 배치 결정). 다만 `src/app/api/**`는 truthiness 조항만 꺼져 있고 나머지 Vitest 규칙은 걸린다는 점을 이 문단이 뭉뚱그렸다 — 정확한 범위는 `eslint.config.mjs`가 정본이다.
2. **명문화와 차단 혼동.** 고정 대기 금지, 검증 대상/API client를 mock하지 말라는 문장이 있어도 해당 패턴의 결정적 차단은 별도 확인이 필요하다. 현재 E2E의 실효 ESLint 설정에는 고정 sleep을 막는 규칙이 없다. 현재 위반이 발견되지 않은 것을 미래 위반 차단의 증거로 세면 안 된다.
3. **code-review와 프로젝트 지침의 연결.** 일반 Standards/Spec 두 축은 있지만 어떤 변경에 상태/테스트/CI 검토와 관련 규칙를 선택하는지 없다. 참조하는 `docs/agents/issue-tracker.md`도 현재 저장소에 없어, 로컬 spec/issue를 실제로 찾아가는 경로를 바로잡아야 한다. → **티켓 08에서 닫았다** — 없는 참조 두 곳을 지우고, 3단계에 변경 경로 → rule 파일·검토 스킬 라우팅 표를 넣었으며, spec 출처를 이 저장소의 실제 위치로 바로잡았다. 표준 출처로 들던 `CODING_STANDARDS.md`·`CONTRIBUTING.md`도 이 저장소에 없어 `CONVENTIONS.md`·`AGENTS.md`로 교체했다.
4. **문서 전용 PR 생략의 예외.** 일반 설명 문서와 review rule·skill·prompt·ADR 변경을 동일하게 생략하면 리뷰 품질을 바꾼 변경이 검수되지 않는다. 상태·테스트 설계 문서는 해당 검토 절차, 기준 문서는 고정 사례 검수 등 목적별 검증을 정해야 한다. 이 때문에 E2E 실행 조건을 바꿀 필요는 없다.
5. **C1~C9 외 관찰로 밀려나는 주요 요구.** 성능·테스트·인증·SSR·오류 처리 기준이 대부분 “기준 외 관찰”이 되면 10주 학습 명문화의 목적을 달성하지 못한다. 해당 변경에서는 정식 검토 항목이어야 한다.
6. **지침 우선순위.** 발제의 Context 인증 예시나 오래된 스펙을 최신 세션 Query 설계보다 우선하면 정상 코드를 오탐한다. 유효한 프로젝트 요구사항·결정 → 실제 계약 → 발제의 일반 원칙 순서로 적용하고, 충돌은 보고한다.

## 4단계가 실제로 모은 반복 지적 (5단계 입력)

티켓 08에서 돌린 리뷰 10건(로컬 스킬 9 + 프롬프트 v2 재실행 1)과 CI AI 리뷰 기록을 합쳐 집계했다. **같은 대상을 다시 돌려 나온 중복은 제외**했다 — 리뷰 ⑨와 ⑩은 같은 파일 목록이므로 겹치는 지적을 한 번으로 센다. 원문은 [verification/08-review-*](../../.scratch/week10-step4-5-ai-review-and-rule-promotion/verification/).

규칙 선택·승격 스킬·게이트 구현은 이 절의 범위가 아니다. 작성자가 티켓 09에서 고른다.

| 패턴 | 독립 리뷰 수 | 실제 위치 | 이미 지키는 반례 | 결정적 판별 가능성 |
| --- | --- | --- | --- | --- |
| 복구 버튼이 재시도 중 비활성화되지 않음 | 3 (③⑦⑧) | `CartPage.tsx:112,125` · `SessionMenu.tsx:34` · `MyPage.tsx:45` · `OrderNewPage.tsx:31` · `OrdersPage.tsx:57,81,112` | `HomeContent.tsx:21` · `ProductList.tsx:89,111` | **높음** — "`refetch`를 부르는 `onClick`을 가진 `button`에 `disabled`가 없다"는 구문으로 갈린다. 경계는 refetch가 아닌 버튼과 유니온이 `isFetching`을 안 내주는 경우 |
| 픽스처·핸들러가 정본에서 파생되지 않고 재생성 | 3 (⑥⑨⑩) | `e2e/auth.fixture.ts:13-27` · `tests/msw/handlers.ts`에 `/api/orders` 기본 핸들러 부재 · `USER_ORDERS` 리터럴이 파일마다 | `tests/commerce-header.dom.test.tsx`가 `app/api/_data/auth`를 import | 중간 — "픽스처 파일 밖에서 엔티티 리터럴을 만든다"는 구문으로는 정상 override와 안 갈린다 |
| 테스트 이름이 주장하는 것을 단언이 확인하지 않음 | 3 (②⑥⑨) | `useSelect.dom.test.tsx:125,633` · `order-new-page.dom.test.tsx:196` · `queries.test.ts:11` | — | **낮음** — 이름과 단언의 의미 대조는 맥락 판단. AI·사람에 남긴다 |
| 갱신 실패가 직전 화면을 파괴 (`isError`를 데이터 유무보다 먼저 판정) | 2 (⑦⑧) | `SessionMenu.tsx:33` · `use-order-draft.ts:45` · `OrdersPage.tsx:78` | `HomeContent.tsx:15` · `ProductList.tsx:82` · `CartPage.tsx:109` | 중간 — 구문은 갈리지만 "결제 직전이라 일부러 전면 차단"이 정상 예외로 있을 수 있다(리뷰 ⑧ 질문 1) |
| 수동 동기화를 지키는 장치 없음 (보호 경로 3곳) | 3 (④⑦⑩) | `proxy.ts:31` matcher · `login-url.ts:44` `isProtectedPath` · `requireServerSession` 호출부 | — | 중간 — 룰이 아니라 **드리프트 테스트 한 개**로 닫는 게 성격에 맞다(⑩ 제안) |
| 제품 사용처가 없는 코드 | 2 (①⑤) | `shared/ui/select/**` · `examples/week-05-layout/**` · `app/demos/**` | — | **높음** — 도달 불가 모듈은 스크립트로 판별 가능. 단 데모·학습 자산을 공인 예외로 둘지가 선결 |
| catalog 조인 중복 | 3 (③⑤⑧) | `CartPage.tsx:65` · `OrdersPage.tsx:103` · `use-order-draft.ts:56` | — | **낮음 + 결론 불일치** — ③은 공통화하라, ⑧은 하지 마라. 맥락 판단이라 기계에 못 내린다 |
| `role="status"` 누락 | 1 (⑧) | `OrderNewPage.tsx:24` · `OrdersPage.tsx:75` | `ProductListPending.tsx:11` · `HomeContent.tsx:32` · `ProductList.tsx:76` | 반복 미달 — 리뷰 1건 |
| 타임존 고정 없는 `toLocaleString` 단언 | 1 (⑥) | `orders-page.dom.test.tsx:53` | — | 반복 미달 — 리뷰 1건 |

**티켓 05가 넘긴 후보**도 함께 둔다 — E2E 고정 sleep 금지와 `scripts`·`e2e`의 테스트 무력화 차단. 둘 다 4단계에서 문장 규칙까지만 두었고 실효 ESLint에는 없다(감사 「빈틈 1·2」).

**반복 미달 주의**: 위 「독립 리뷰 수」는 이번 4단계 한 번의 집계다. 2 이상이라고 해서 10주간 반복된 지적이라는 뜻은 아니다. 5단계 선택 시 과거 사람 리뷰·PR 기록과 대조해야 "반복"이 성립한다.

## 5단계 승격 후보

4단계의 rule·skill 정비와 별도로 5단계에서는 결정적 규칙 하나를 승격한다. 아래 후보를 실제 반복 지적과 대조한 뒤 작성자가 선택한다.

| 후보 | 판별 전에 정할 경계 | 현재 상태 / 주의 |
| --- | --- | --- |
| HTTP 계층 우회 | 클라이언트/서버/테스트별 허용 호출, 별칭, API client 자신의 호출 | 기존 후보. `fetch` 전체 금지나 문자열만으로 범위 단정 금지 |
| 불필요한 타입 침묵 | 기존 lint가 못 잡는 정확한 단언 범위와 검증된 경계 예외 | 이미 있는 any/unnecessary assertion lint를 신규 성과로 세지 않기 |
| Query 계약 위반 | 공용 팩토리 우회와 정상 옵션 조합 구별, 상속된 기본값 인정 | “인라인 객체 금지/staleTime 항상 명시”는 그대로 채택 불가 |
| Zustand 전체 구독 | 실제 React store Hook 식별, 비구독 getState/별칭/동명 함수 | 기존 후보. 이름 패턴의 한계를 검증 |
| E2E 고정 sleep | Playwright page의 고정 대기인지, 허용된 시간 검증인지 | 실효 lint에 없음. 위반 없는 현 상태와 반복 지적 증거를 구별 |
| 테스트 무력화 범위 보강 | scripts/E2E의 skip/only/단언을 각 runner에 맞게 식별 | 현재 검사 공백은 확인됨. 과거 반복 지적과 연결할 수 있어야 5단계 대상으로 선택 |
| 검증 대상/API client mock | 통합 검증 대상의 mock과 허용 브라우저/프레임워크 환경 mock 구별 | `vi.mock` 일괄 금지 불가. 정확한 import/path 계약부터 필요 |
| 파일·workflow 구조 규칙 | 정해진 파일 계약/필수 필드의 참·거짓, 실제 parser/스크립트 경계 | 과제가 허용하는 CI 스크립트 경로도 후보. YAML 의미를 부정확한 grep으로 판별하지 않기 |

기존 FSD/Public API·Vitest 단언 규칙은 재구현하지 않는다. 상태 복사·추상화·성능 개선 효과처럼 맥락이 핵심인 판단은 문장 규칙/AI/사람에 남긴다. 새로운 의존성이 필요한 수단은 프로젝트 Ask first 대상이지만, 후보 조사와 기존 도구로 표현 가능한지 확인하는 일은 먼저 수행할 수 있다.

## 책임 배치 (4단계 종료 시점)

5단계가 이 표의 한 칸을 「AI·사람」에서 「기계」로 옮긴다. 옮기기 **전** 상태를 여기 고정해 두어 전후를 대조할 수 있게 한다.

### ID별 담당

위 배치 표의 44개 ID를 담당으로 다시 묶는다. 같은 ID가 두 칸에 걸치면 **기계가 막는 범위와 판단으로 남는 범위를 갈라** 적는다.

| 담당 | ID | 무엇이 그렇게 만드나 |
| --- | --- | --- |
| **기계가 전부 막음** | R12 (레이어·Public API) · R20 (테스트 무력화·단언 없음, **단 `{src,tests}/**/*.test.*` 범위 안에서만**) | ESLint `boundaries/dependencies` · `no-restricted-imports` · `import-x/no-cycle` · vitest 규칙 블록 |
| **기계 + 판단 병행** | R01 (any/as는 lint, 기존 유틸 재사용·입력 신뢰 경계는 판단) · R25 (이름·props 조합은 타입, 발행 위치·중복은 규칙 없이 남김) · 검사기 테스트 (종료 코드는 테스트, 어떻게 나눌지는 설계) | lint·typecheck가 일부만 덮는다 |
| **AI·사람 판단** | A01~A04 · A06 · A08~A14 · R02~R11 · R14~R19 · R21~R24 · R26 · R27 · R29 · R30 | 맥락이 핵심이라 문장 규칙 + 검토 절차로 둔다 |
| **해당 없음 (범위 제외)** | A05 · A07 · R13 | RFC 검토와 성능 분석 전용 스킬은 스펙 Out of Scope |
| **5단계 승격 후보로 남김** | R20의 `scripts`·`e2e` 구간 · R27의 고정 sleep | 문장 규칙까지만 두었고 실효 ESLint에 없다 (「빈틈 1·2」) |
| **R28** | 부분 위임 | 산출물이 대상에 있을 때만 적용 — 도입 자체는 별도 선택 |

「AI·사람 판단」이 가장 큰 묶음인 것이 이 단계의 결론이다. 10주 학습 기준의 대부분은 참·거짓을 기계로 가를 수 없고, 5단계가 옮기는 것은 그중 **하나**다.

| 담당 | 이 프로젝트에서 실제로 맡는 것 | 증거 |
| --- | --- | --- |
| **기계** (CI·lint·type·test) | 레이어 import 방향·슬라이스 격리·딥 import·순환(ESLint `boundaries`·`no-restricted-imports`·`import-x/no-cycle`) · 테스트 비활성화·단언 없음·truthiness(`{src,tests}/**/*.test.*`) · 타입 · 번들 예산 · Lighthouse 임계값 · env 생명주기 · E2E 실행 수와 상태 | `pnpm lint` exit 0 (리뷰 ⑤) · `eslint.config.mjs:99,128-226,239` · `scripts/week-10-ci/**` · `quality.yml` |
| **AI 리뷰** | 설계 냄새와 반례 제안, 규칙 위반 후보 지목, 룰 초안. **비결정적이라 advisory** — required·PR guard·배포 조건에 넣지 않는다 | 리뷰 10건 원문 [08-review-*](../../.scratch/week10-step4-5-ai-review-and-rule-promotion/verification/) · CI AI 리뷰 `ai-review.yml`(`permissions: contents: read`, required 아님) |
| **사람 리뷰어** | 설계 대안, 변경 위험, 맥락 판단 | 이번 주차에는 셀프 리뷰로 대체 — 별도 사람 리뷰어 없음을 명시한다 |
| **작성자** | 지적의 수용·반려 판정 · 단언 문구와 모킹 경계 · E2E 범위 · 예산과 required 배치 · 승격할 규칙 선택 · 최종 검증 | 유효/오탐 판정과 근거: [08-review-evidence](../../.scratch/week10-step4-5-ai-review-and-rule-promotion/verification/08-review-evidence.md) |

**기계에 못 내리는 것으로 확인된 것** — 위 집계표의 「결정적 판별 가능성: 낮음」 두 줄이다. 테스트 이름과 단언의 의미 대조, catalog 조인의 공통화 여부. 후자는 같은 스킬이 대상 범위에 따라 정반대 결론을 냈다(리뷰 ③ vs ⑧)는 것이 그 자체로 근거다.

**AI가 틀리는 방식으로 확인된 것** — 자료에 없는 사실을 전제로 삼는다. CI AI 리뷰는 GitHub Actions의 `!cancelled()` 의미론을 지어냈고(`confidence: high` 2건, run [34518767357](https://github.com/heeji289/loop-pack-fe-l2-vol1/actions/runs/34518767357)의 실제 실행으로 반증), 로컬 `test-review` v1은 다른 문서의 명령(`--workers=2`)을 CI 명령으로 옮겨 적었다. 두 오탐 모두 **결론이 아니라 근거**가 틀렸다는 점이 같다.

## 미결정 사항

| 논의 지점 | 이미 확인한 것 | 아직 결정하지 않은 것 / 제안 |
| --- | --- | --- |
| 4·5단계 통합 | ADR에 4→5 연결 기록이 있음 | 한 스펙으로 진행하며 4단계 실제 판별 후 5단계 규칙 선택 |
| AI 리뷰의 역할 | PR 리뷰뿐 아니라 설계/측정/테스트 검토가 발제에 있음 | 위 A01~A14의 적용 여부를 빠짐없이 기록하고 필요한 rule·skill 업데이트를 기본 범위로 제안. 독립 스킬 이름/파일 배치는 구현 전 확정 |
| 실행 위치/트리거 | 기존 ADR은 CI 코드 PR 자동·advisory, 현재 과제는 CI 선택 | 로컬+CI 여부와 자동/명시 트리거 재검토. 일반 코드 PR, 설계 문서, 리뷰 기준 변경을 각각 어디에서 검토할지 함께 결정 |
| 실제 실행 한도 | 약 5 turns·10분은 이전 초깃값 | 사용 도구·인증 지원·구독/API 비용 구조 확인 후 한도 및 재실행 정책 확정. 숫자만 적고 비용 제어가 끝났다고 하지 않기 |
| 검토 기능 검수 | 스킬 파일 존재만으로 완료 아님 | 신규/변경된 기능마다 대표 입력·유효 지적·정상 예외·입력 부족 사례로 호출/출력 확인. 모두를 매 PR 실행하지 않고 관련 기능 선택 |
| 선택 기능 | 탐색형 AI E2E, 시각 회귀, planner/generator는 발제/심화에 있음 | 규칙/판단 경계는 보존. 실제 도구 설치·무인 실행·추가 실험 도입 여부는 별도 결정 |
| 승격 선택 | 실제 반복 증거와 결정 가능성이 기준 | 현재 편한 후보로 선결정하지 않기. 두 개 이상 독립 사례는 반복성 검증 제안이며 과제에 정해진 숫자는 아님 |

## 완료 조건

- A01~A14와 R01~R30에 유지/보완/신규/해당 없음의 최종 배치·이유·정본 링크가 있다. 권장/선택 기능을 필수 과제로 둔갑시키지 않는다.
- 스펙에 정한 rule·skill 내용을 실제로 작성/수정하고, 로컬 도구/PR 리뷰가 필요한 지침을 읽는 경로를 확인한다. 스킬 이름만 나열하거나 C1~C9 문장만 복사해서 완료 처리하지 않는다.
- 상태 설계 검토에는 상태 분류와 전환 시나리오를, 테스트 검토에는 작성자가 정한 의도를 준다. 성능 관련 변경에는 측정 근거를 확인한다. 부족한 입력은 추측으로 채우지 않는다.
- 대표 적용 사례와 정상 예외로 변경된 검토 기능을 검수한다. 실행 로그가 없는 과거 활동은 완료로 꾸미지 않는다.
- 요구사항 4-1~4-6, 5-1~5-5의 실제 산출물·판정·게이트 증거가 연결된다. 10주차 발제 미확보는 별도로 남긴다.
