# 10주 기술 회고

## 1. 프로젝트 요약

이 프로젝트는 Next.js App Router로 만든 커머스 애플리케이션이다. 홈과 상품 탐색, 장바구니와 위시리스트, 로그인, 주문 생성과 조회를 제공한다. 서버 데이터는 TanStack Query, 공유 가능한 검색 조건은 URL, 브라우저에 남는 사용자 상태는 Zustand가 맡는다.

10주 동안의 목표는 화면 수를 늘리는 데서 검증 가능한 변경으로 이동했다. 마지막 상태에서는 Node.js와 pnpm 버전, 단위·통합 테스트, lint, typecheck, production build, JavaScript 예산, 핵심 E2E를 GitHub Actions가 검사한다.

## 2. 구조 변화

### 2주차: 컴포넌트 경계

2주차에는 컴포넌트를 많이 나누는 것보다 변경 이유가 다른 책임을 분리하는 기준을 배웠다. props 수와 boolean 여부만으로 고치지 않고, 파생 가능한 값은 계산하며 구조 확장은 합성으로 열어 두는 원칙을 세웠다.

### 3주차: UI와 로직 분리

3주차에는 한 파일에 있던 UI, 상태 전이, API 호출을 component, hook, service로 나눴다. custom hook을 만드는 행위보다 “한 문장으로 설명할 수 있는 책임인가”를 분리 기준으로 삼았다. 검색·필터·페이지 상태를 URL에서 복원해야 한다는 문제도 이때 구조 문제로 드러났다.

### 5주차: 상태의 원본 결정

5주차에는 도구보다 원본을 먼저 정했다. 서버 응답은 TanStack Query, 공유·새로고침·방문 기록이 필요한 조건은 nuqs URL 상태, 여러 화면에서 쓰는 비로그인 장바구니와 위시리스트는 Zustand, 입력 초안과 열림 여부는 React 로컬 상태에 뒀다. 로그인 기능이 추가된 뒤에는 장바구니 owner 전환과 guest 병합을 이 경계 위에서 확장했다.

### 6주차: 변경 반경 설계

6주차에는 `app → _pages → widgets → features → entities → shared` 방향으로 코드를 옮겼다. 첫 아키텍처 리뷰에서 `entities → app`, `_pages → app` 역방향 참조가 발견되어 서비스와 타입의 실제 소유 레이어를 다시 정했다. FSD를 폴더 정답으로 사용하기보다, 기능을 삭제하거나 옮길 때 같이 바뀌는 파일을 예측하는 도구로 사용했다.

## 3. 주요 기술 결정

### 상태를 복사하지 않는다

서버 응답, URL 조건, 브라우저 저장 상태가 같은 값을 각각 보관하면 갱신 순서에 따라 화면이 달라진다. 상품 데이터는 Query cache에 두고 Zustand에는 ID와 수량만 저장했다. 표시 가격과 합계는 상품 원본과 수량으로 계산한다.

### E2E는 브라우저 경계만 검증한다

검색 응답, 로딩, 오류, 페이지 계산은 MSW 통합 테스트가 더 빠르게 실패 원인을 알려 준다. E2E에는 URL 새로고침·방문 기록, 인증 cookie와 보호 경로 복원, guest 장바구니 병합, 주문 생성 후 조회처럼 브라우저와 서버가 함께 있어야 드러나는 9개 흐름만 남겼다.

### 하나의 병합 결과를 제공한다

조건부 step을 여러 required check로 노출하면 정상적인 E2E 생략도 pending으로 남을 수 있다. Quality job이 모든 단계 outcome과 실행 계획을 검사하고, `merge-gate` 하나가 병합 가능 여부를 전달하도록 만들었다. GitHub Ruleset은 `main`과 `feat/week-10`에서 최신 base의 `merge-gate` 성공을 요구한다.

## 4. 테스트와 품질 게이트

8주차에는 상태 전이와 실패 비용을 기준으로 단위·통합·E2E 책임을 나눴다. 테스트 수를 늘리는 대신 어떤 결함을 어느 단계가 가장 싸게 찾는지 표로 먼저 정했다. Zustand storage와 owner 전환, URL 조건과 요청, 주문 실패 후 상태 보존은 단위·통합 테스트가 맡았다.

9주차에는 30일 시드 로그의 빈도와 이탈률을 참고하되 트래픽만으로 E2E를 고르지 않았다. 실패 비용과 실제 브라우저 경계를 함께 평가해 상품 회귀 2개, 인증 5개, guest 병합 1개, 주문 1개를 선택했다. Playwright는 CI에서 worker 1개와 retry 1개를 사용하며, 실패 시 trace와 screenshot을 로컬 진단 자료로 만든다.

10주차에는 이 검증을 PR gate로 옮겼다. 허용된 Markdown 변경은 E2E만 생략하고 나머지 검사를 유지한다. 번들 예산, 환경 변수, FSD import를 의도적으로 깨뜨린 원격 실행에서 `merge-gate`가 실패했고, 원래 상태로 복구한 실행은 모두 성공했다.

## 5. 성능 개선 결과

7주차의 가장 큰 병목은 7.20MiB Hero JPEG였다. 같은 Slow 4G 조건에서 Lighthouse를 Before와 After 각각 5회 측정했고, LCP 중앙값은 44,846ms에서 2,262ms로 42,584ms 줄었다. 대표 1080px AVIF는 60,748B였고 CLS는 전후 모두 0이었다.

상품 목록에서는 최초 로딩과 기존 결과 갱신을 분리했다. `keepPreviousData`와 요청 취소를 적용해 검색·정렬 중 기존 목록을 유지했고, 스켈레톤과 콘텐츠 높이를 맞춘 뒤 상호작용 구간 CLS는 0.006681이었다. 효과가 확인되지 않은 `fetchPriority`는 LCP 개선 원인으로 계산하지 않았다.

10주차 CI에서도 같은 측정 태도를 유지했다. Chromium 다운로드 중앙값은 12초에서 6초로 줄었지만 전체 quality 중앙값은 러너 편차 범위 안이었다. 따라서 다운로드 구간 개선은 인정하되 전체 CI가 유의미하게 빨라졌다고 확대하지 않았다.

## 6. CI/CD와 AI 협업

CI는 Node.js 24.17.0과 pnpm 10.15.1을 고정하고 frozen lockfile을 사용한다. PR의 연속 실행만 취소하며 `main` 검증은 취소하지 않는다. `/`와 `/products`의 route 초기 JavaScript를 파일별 gzip 합계로 측정하고, actual·budget·delta를 Summary에 남긴다.

AI 리뷰는 CI에 자동 연결하지 않았다. PR #2 diff를 대화형으로 검토해 manifest 식별자가 없는 입력을 정상 처리하는 결함을 찾았고, 재현 테스트 뒤 `da9fea6a`에서 수정했다. 반대로 route 파일을 모두 연결해 한 번 gzip하라는 지적은 실제 HTTP 전송과 문서화한 지표에 맞지 않아 반려했다.

현재 작업 환경에는 Vercel 프로젝트 연결과 인증이 없다. Preview와 Production 배포, 환경별 validator 연결, smoke test, rollback은 완료했다고 주장하지 않는다. GitHub CI와 Ruleset까지가 이번에 직접 확인한 범위다.

## 7. AI·사람·기계의 책임

AI에는 넓은 diff에서 의심 지점 찾기, 테스트 후보 만들기, 누락된 경계 질문하기를 맡겼다. AI가 낸 결론은 파일과 줄, 최소 재현, 프로젝트 규칙이 없으면 채택하지 않았다.

사람은 상태 소유자, E2E 범위, 번들 예산, required check, 규칙 승격 여부를 결정했다. 같은 수치라도 제품 범위와 측정 조건이 다르면 비교하지 않았고, 배포하지 못한 환경은 문서에서 한계로 남겼다.

기계에는 결과가 항상 같아야 하는 판정을 맡겼다. 테스트, lint, typecheck, build, 환경 계약, 번들 예산과 병합 보호가 여기에 해당한다. FSD도 전체 설계를 자동 판단하게 하지 않고 반복된 상향 import만 lint로 막았다.

## 8. 다시 만든다면

첫째, 2주차부터 상태 원본 표와 모듈 의존 방향을 작은 테스트로 남기겠다. 후반에 규칙을 추가하면서 과거 결정을 다시 복원하는 비용을 줄일 수 있다.

둘째, Preview와 Production 환경 계약을 인증 기능과 함께 설계하겠다. 로컬 mock이 동작한다는 사실과 실제 배포에서 secret·origin·영속 저장소가 준비됐다는 사실을 처음부터 분리할 수 있다.

셋째, CI 최적화 전에 측정용 cache scope와 단계별 시간 수집을 먼저 만들겠다. 이번에는 비교 환경을 마련하는 작업과 개선 작업이 같은 주차에 섞여 판단이 늦어졌다.

넷째, 문서는 계획과 결과를 같은 문장에 누적하지 않겠다. 현재 결론, 원시 증거, 남은 외부 조건을 분리하면 다른 사람이 완료 범위를 더 빨리 판단할 수 있다.

## 제출 질문

### E2E를 모든 PR의 required 검사로 두면 어떤 문제가 생기는가

현재 E2E는 브라우저 설치와 실행에 약 30초가 더 들고 외부 러너 편차도 크다. 문서만 바뀐 PR까지 강제하면 비용과 대기 시간이 늘고, 조건부 job을 잘못 설계하면 정상 생략도 required pending으로 남는다. 그래서 저비용 검사는 항상 실행하고 E2E step만 안전한 Markdown 변경에서 생략한 뒤 `merge-gate`가 계획과 실제 outcome을 대조한다.

### Lighthouse 하락을 항상 병합 차단으로 쓰지 않는 이유는 무엇인가

Lighthouse는 브라우저, CPU, 네트워크와 cache 조건에 따라 점수가 달라진다. 이 프로젝트는 7주차처럼 같은 조건의 반복 측정으로 병목을 찾되, hosted runner의 단일 점수 하락은 advisory로 본다. 반복 범위와 제품 예산을 합의할 만큼 데이터가 쌓이면 별도 성능 gate를 검토할 수 있다.

### Preview가 Production API를 바라보면 어떤 사고가 생기는가

Preview의 미검증 코드가 실제 주문이나 사용자 데이터를 읽고 쓸 수 있으며, 테스트 계정과 cookie가 Production에 남을 수 있다. `APP_ORIGIN`과 `EXPECTED_APP_ORIGIN`을 환경별로 분리하고 Preview build 전에 두 값의 일치와 비Production 호스트를 검사해야 한다. 쓰기 smoke test도 격리된 Preview 자원에서만 실행한다.

### AI가 만든 workflow를 그대로 병합하면 어떤 위험이 있는가

AI는 `pull_request_target`, 과도한 token 권한, secret 전달, 넓은 cache key, 잘못된 path filter처럼 정상 경로에서는 드러나지 않는 위험을 놓칠 수 있다. 사람이 권한·trigger·실패 기본값을 검토하고, 결함 주입 PR에서 required check가 실제로 막는지 확인해야 한다. AI 리뷰 자체는 advisory로 두고 AI가 만든 코드도 동일한 결정적 gate를 통과시킨다.

## 관련 문서

- [10주차 CI 설계 및 검증 기록](./week10-ci.md)
- [10주차 AI 코드 리뷰 기록](./week10-ai-review.md)
- [7주차 성능 측정](../week-07-performance/README.md)
- [8주차 테스트 계획](./week08-test-plan.md)
- [9주차 E2E 범위](./week09-e2e-scope.md)
- [6주차 FSD 설계](./week06-fsd.md)
