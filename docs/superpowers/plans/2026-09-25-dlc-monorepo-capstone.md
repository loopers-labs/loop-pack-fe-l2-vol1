# DLC 모노레포 캡스톤 과제 문서 구현 계획

> 기준 설계: `docs/superpowers/specs/2026-09-25-dlc-monorepo-capstone-design.md`
>
> 작업 브랜치: `codex/dlc-monorepo-capstone`
>
> 작업 범위: 학생용 2주 과제 문서와 멘토 준비 계약. starter/grader 코드와 실제 VM provisioning은 이 문서 작업 이후 별도 구현 계획으로 다룬다.

## 목표

승인된 설계를 학생이 실제로 수행할 수 있는 두 주 분량의 과제 문서로 변환한다. 도구 사용법 목록이 아니라 경계 설계 → graph 검증 → affected CI → app별 image → 실제 배포 → 요청 격리의 인과관계를 유지한다.

## 산출물

- `docs/assignments/dlc-monorepo-capstone.md`
- `docs/assignments/dlc-monorepo-week-01.md`
- `docs/assignments/dlc-monorepo-week-02.md`
- `docs/superpowers/specs/2026-09-25-dlc-monorepo-starter-contract.md`
- `README.md` DLC 링크

## Task 1 — 캡스톤 진입 문서 작성

**Files**

- Create: `docs/assignments/dlc-monorepo-capstone.md`

**Steps**

1. 2주 전체 목표와 최종 성공 상태를 한 문장으로 제시한다.
2. `web`, `admin`, mentor-owned `commerce-api`의 역할을 구분한다.
3. 학생이 결정할 것과 starter가 제공할 것을 분리한다.
4. 2주 흐름과 100점 평가표를 요약한다.
5. 총점과 무관한 필수 탈락 조건을 명시한다.
6. 토스·Next.js·Turborepo 공식 레퍼런스를 연결한다.

**Verification**

- 1주차·2주차 링크가 실제 파일 경로와 일치한다.
- 설계서의 점수 합계 100점과 필수 결함 목록이 유지된다.
- 특정 package tree를 정답으로 제시하지 않는다.

## Task 2 — DLC 1주차 과제 작성

**Files**

- Create: `docs/assignments/dlc-monorepo-week-01.md`

**Steps**

1. 단일 앱 Before와 보존할 web 사용자 경로를 고정한다.
2. 구현 전 RFC 요구사항과 애매한 대상 5개 결정표를 제시한다.
3. pnpm workspace와 Turborepo task graph 전환 요구사항을 작성한다.
4. admin 주문 read + 상태 변경 한 흐름을 완성하게 한다.
5. app-to-app source/runtime 참조 금지를 명시한다.
6. auth·analytics에서 계약/정책과 앱별 요청 상태를 구분한다.
7. `package.json#exports`, manifest dependency, cycle, deep import를 결정적 gate로 내린다.
8. 위반/정상 fixture 자가검증과 제출 증거를 명시한다.
9. N-app synthetic graph 사고 질문을 포함한다.

**Verification**

- Product가 아니라 starter의 Order 흐름과 일치한다.
- auth package가 current user를 보관하도록 읽히는 문장이 없다.
- app-to-app HTTP 호출도 금지 범위에 포함된다.
- UI 완성도나 CRUD 양이 평가 중심으로 읽히지 않는다.

## Task 3 — DLC 2주차 과제 작성

**Files**

- Create: `docs/assignments/dlc-monorepo-week-02.md`

**Steps**

1. 전체 실행 CI Before의 cold/warm 측정 계약을 작성한다.
2. 변경 시나리오별 예상 검증·배포 대상 표를 제공한다.
3. package 단위 affected와 task `inputs`/cache를 구분한다.
4. `deployment-plan.json`을 모든 후속 job의 단일 입력으로 요구한다.
5. Actions cache 기반 지속 cache, fork PR 정책, 전체 fallback을 명시한다.
6. app별 standalone Docker image와 최종 Linux image 내부 검증을 요구한다.
7. build-time public env, runtime env, secret, Turbo hash input을 구분한다.
8. OCI revision label, immutable digest, external provenance를 구분한다.
9. 실제 Linux VM 배포, health probe, proxy switch, 독립 재배포, rollback을 요구한다.
10. zero-downtime가 Basic 완료조건이 아님을 명시한다.
11. barrier/latch, same-instance, session matrix, cookie replay, browser analytics 격리 시험을 작성한다.
12. public ingress에서 grader hook이 닫혀 있는지 확인한다.
13. After 측정과 최종 제출 증거를 정리한다.

**Verification**

- CI 영향 계산과 build/push/deploy가 모두 같은 plan을 소비한다.
- image digest와 commit SHA를 “일치하는 값”이라고 표현하지 않는다.
- 단순 반복 요청을 race 재현으로 인정하지 않는다.
- customer/order 데이터와 viewer identity를 혼동하지 않는다.
- Docker 분리와 요청 격리를 서로 다른 증명으로 둔다.

## Task 4 — starter·grader·배포 환경 계약 작성

**Files**

- Create: `docs/superpowers/specs/2026-09-25-dlc-monorepo-starter-contract.md`

**Steps**

1. 모든 학생이 같은 공식 starter tag에서 시작한다고 고정한다.
2. `dlc.manifest.json` schema의 필수 필드를 정의한다.
3. `deployment-plan.json` schema의 필수 필드를 정의한다.
4. pinned `commerce-api` image, readiness, seed reset, 장애 판정 계약을 정의한다.
5. race barrier, sentinel, instance/request ID, analytics sink를 정의한다.
6. boundary/affected/cache/image/deploy/security fixture 목록을 정의한다.
7. VM·registry·ingress·blue/green scaffold의 멘토 책임을 정의한다.
8. 과제 공개 전 실제 VM end-to-end go/no-go 체크리스트를 작성한다.
9. 학생이 구현해야 하는 것과 starter가 제공하는 것을 교차 표로 확인한다.

**Verification**

- starter가 학생 판단 대상의 답을 미리 구현하지 않는다.
- grader endpoint와 reset/barrier가 public ingress에 노출되지 않는다.
- mentor infra 장애를 학생 실패로 채점하지 않는 재실행 규칙이 있다.
- schema가 자유로운 package 이름과 구조를 허용한다.

## Task 5 — README 연결과 문서 일관성 검증

**Files**

- Modify: `README.md`
- Verify: 위 네 문서와 승인된 설계서

**Steps**

1. README 주차별 과제에 DLC 캡스톤 진입 링크를 추가한다.
2. 문서 간 링크와 파일명을 검사한다.
3. `TBD`, `TODO`, 모순된 app/domain 명칭을 검색한다.
4. 점수 합계, 단계 수, 제출물 위치를 교차 확인한다.
5. diff whitespace와 Git 상태를 확인한다.
6. 과제 작성 pass와 독립 reviewer pass를 분리해 검토한다.

**Verification commands**

```bash
git diff --check
rg -n "TBD|TODO|FIXME|Product 타입|상품 상태 변경" \
  docs/assignments/dlc-monorepo-*.md \
  docs/superpowers/specs/2026-09-25-dlc-monorepo-starter-contract.md
rg -n "dlc-monorepo-(capstone|week-01|week-02)" README.md docs/assignments
```

## Task 6 — 커밋과 다음 단계 분리

**Steps**

1. 계획 문서를 별도 커밋한다.
2. 학생용 과제 문서와 starter contract를 한 개의 문서 커밋으로 묶는다.
3. starter/grader 코드 구현은 새 계획으로 분리한다.
4. push, PR, merge, 실제 VM provisioning은 사용자 승인 전 수행하지 않는다.

## 완료 정의

- 학생이 두 문서만 읽고 2주 작업 순서, 필수 증거, 평가 기준을 이해할 수 있다.
- 멘토가 starter contract만 읽고 과제 공개 전 준비물을 구현·검증할 수 있다.
- 아직 없는 starter/VM을 이미 제공된 것처럼 서술하지 않는다.
- 문서상의 모든 자동 검증은 starter contract의 fixture나 schema에 대응한다.
