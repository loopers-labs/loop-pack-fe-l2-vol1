# 6주차 과제 피드백 반영 계획

## 목적

과제 피드백에서 확인된 미사용 코드, FSD 검사 사각지대, 과도한 Public API, 결정 문서와 커밋 이력의 불일치를 정리한다. 단순히 지적된 줄만 고치는 데 그치지 않고, 같은 누락이 self-review에서 다시 발생하지 않도록 확인 기준도 함께 보완한다.

## 누락 원인

1. self-review가 미사용 UI를 삭제 대상으로 찾고도 `[개선]`으로 분류한 채 전체 결과를 `PASS`로 판정했다. 발견한 문제와 완료 판정이 연결되지 않았다.
2. FSD ESLint가 통과한다는 결과만 확인하고, 설정의 `files`·`boundaries/include`·element pattern이 실제 라우팅 트리를 포함하는지 대조하지 않았다.
3. Public API의 내부 정의와 역할은 검토했지만, 각 export의 슬라이스 외부 소비처가 실제로 존재하는지 확인하지 않았다.
4. decisions 문서를 현재 코드와만 비교하고, 과거 작업을 사실로 서술한 문장은 관련 커밋과 대조하지 않았다.

## 반영 순서

### 1. 소비처가 없는 UI 삭제

- 상품 옵션 select 3종과 옵션 모델을 삭제한다.
- 해당 UI만 사용하던 controlled select 기반과 `SelectToggleIcon`을 삭제한다.
- 소비처와 구체적인 재사용 계획이 없는 `Dialog`를 삭제한다.
- 필요해지기 전에는 선제적으로 복원하지 않고, 실제 요구사항이 생기면 git 이력에서 필요한 계약만 다시 검토한다.

완료 조건:

- 삭제 대상 경로가 작업 트리에 남아 있지 않다.
- 실행 코드에서 삭제된 심볼이나 경로를 참조하지 않는다.
- RFC와 decisions의 최종 상태가 “소비처와 계획이 없어 삭제”로 일치한다.

### 2. FSD 하네스 검사 범위 수정

- `next-app` element가 실제 Next.js 라우터인 루트 `app/`을 가리키도록 수정한다.
- ESLint `files`와 `boundaries/include`에 루트 `app/`을 포함한다.
- 일반 라우트 조합과 Route Handler의 책임을 구분할 수 있도록 `app/api`를 별도 element로 분리한다.
- Route Handler가 `_pages`·`widgets`·`features`를 참조하지 못하도록 하고, 같은 `app/api` 내부와 필요한 하위 도메인 계층만 참조하게 한다.

완료 조건:

- 루트 `app/**/*.{ts,tsx}`가 FSD ESLint 설정의 검사 대상이다.
- `app/api`의 현재 정상 import는 통과한다.
- `app/api → _pages` 같은 프론트 화면 조합 의존은 규칙으로 차단된다.

### 3. `entities/product` Public API 축소

- query parser 내부에서 필요한 `PRODUCT_CATEGORY_FILTERS` 정의는 유지한다.
- 슬라이스 외부 소비처가 없는 `PRODUCT_CATEGORY_FILTERS` re-export는 제거한다.
- 화면이 해당 상수를 참조한다는 잘못된 Public API 주석을 실제 소비 관계에 맞게 수정한다.
- `_pages/product-list`에서 실제 사용하는 `PRODUCT_SORT_VALUES`와 parser 공개는 유지한다.

완료 조건:

- `PRODUCT_CATEGORY_FILTERS`는 `entities/product` 내부 구현에서만 사용된다.
- Public API의 각 공개 심볼에 실제 외부 소비처 또는 명확한 공개 계약이 있다.

### 4. 결정 문서와 작업 이력 동기화

- ProductCard를 “3단계에서 실제로 entities로 옮겼다”는 문장을 수정한다.
- 작업 트리에서 `entities/product/ui` 배치를 시도했지만 커밋 전에 철회했고, 실제 커밋 `30f0dc3`에서는 `components`에서 `features`로 바로 이동했다는 사실을 구분해 기록한다.
- select와 Dialog의 삭제→복원→재사용 근거 철회→재삭제 흐름 및 최종 결정을 decisions와 RFC에 일관되게 반영한다.
- self-review가 삭제 필요성을 발견하고도 `PASS`로 끝낸 판정 오류와 후속 해결 상태를 기록한다.

완료 조건:

- 현재 구조를 설명하는 문서에 삭제된 경로가 현행 구조처럼 남지 않는다.
- 과거 작업을 서술하는 문장이 관련 커밋과 모순되지 않는다.
- self-review 결과에서 미해결 지적과 최종 판정이 충돌하지 않는다.

### 5. 검증과 재발 방지

- `rg`로 삭제 경로와 `PRODUCT_CATEGORY_FILTERS`의 소비처를 다시 확인한다.
- `rg --files src app` 결과와 FSD 설정의 검사 범위를 대조한다.
- `pnpm lint`와 `pnpm exec tsc --noEmit`을 실행한다.
- 앞으로 self-review에서는 미사용 코드, Public API 외부 소비처, 자동화 설정의 실제 include 범위, 역사적 서술의 커밋 근거를 별도 항목으로 확인한다.

완료 조건:

- lint와 TypeScript 검사가 통과한다.
- 남은 미검증 항목과 런타임 검증 여부가 완료 보고에 명시된다.

## 변경 단위

1. `refactor: 소비처 없는 상품 옵션 select와 Dialog 삭제`
2. `fix: FSD 경계 검사에 app 라우팅 트리 포함`
3. `refactor: product Public API에서 미사용 export 제거`
4. `docs: self-review 완료 판정과 검증 기준 보완`
5. `docs: 6주차 피드백 반영 계획과 결정 기록 갱신`

4는 주차와 무관한 스킬 워크플로 변경(`.agents/skills/self-review`, `.agents/skills/pr-description`)이라 5의 주차 문서 갱신과 분리한다.

커밋은 실제로 요청받았을 때만 생성하며, 위 구분은 변경을 검토하고 커밋 메시지를 작성할 때 사용할 논리적 단위다.
