# 10주 기술 회고

## 1. 프로젝트 요약

커머스 프론트엔드를 Next.js App Router 기반으로 만들고, 상품 탐색, 장바구니, 위시리스트, 인증, 주문 흐름까지 단계적으로 확장했다. 핵심 사용자 흐름은 상품을 찾고, 장바구니에 담고, 인증을 거쳐 주문을 완료한 뒤 주문 내역에서 결과를 확인하는 과정이다. 10주 동안 핵심으로 둔 것은 기능을 늘리는 일이 아니라 상태 원본, 폴더 경계, 테스트 레벨, 성능 측정, CI 게이트를 설명 가능한 기준으로 고정하는 일이었다.

최종 제출 기준에서는 `Quality` workflow가 lint, typecheck, unit test, E2E, 번들 예산, 환경 변수 검증을 묶어 main 진입 전 검증한다. 측정과 판단 근거는 `docs/rfc/week10-ci.md`에, 성능 근거는 `docs/performance/week-07/step-4-regression/after/summary.md`에, 구조 판단은 `docs/rfc/week06-fsd.md`에 남겼다.

## 2. 10주 동안의 구조 변화

초반에는 페이지와 컴포넌트 중심으로 구현했지만, 6주차에는 FSD 기준으로 구조를 다시 잡았다. `src/app`은 Next.js 라우팅 entry로 얇게 두고, 화면 조합은 `_pages`, 사용자 행위는 `features`, 도메인 표현과 모델은 `entities`, 공통 기반은 `shared`가 맡도록 나눴다.

이동 과정에서 중요한 기준은 "폴더를 옮긴다고 상태 원본을 바꾸지 않는다"였다. 서버 응답은 TanStack Query에, URL 조건은 URL에, 장바구니와 위시리스트는 각 entity store에 두고 서로 복사하지 않았다. 이 결정은 `docs/rfc/week06-fsd.md`의 Source of Truth 표와 `pnpm architecture:check`로 검증했다.

## 3. 주요 기술 결정과 근거

### 결정 1. 서버 상태, URL 상태, 클라이언트 상태의 원본을 분리한다

가장 먼저 고정한 기준은 상태 원본을 섞지 않는 것이었다. 서버 응답은 TanStack Query에 두고, 상품 목록의 검색·카테고리·정렬·페이지 조건은 URL에 둔다. 장바구니와 위시리스트처럼 사용자가 직접 조작하는 클라이언트 상태는 각 entity store가 원본을 가진다.

같은 값을 여러 곳에 복사하면 동기화 버그가 생긴다. 서버 응답을 Zustand에 다시 복사하거나 URL 조건을 별도 local state로 들고 있으면, 새로고침, 뒤로 가기, 직접 URL 진입에서 서로 다른 상태가 생길 수 있다. 그래서 6주차 FSD 전환 때도 "폴더를 옮긴다고 Source of Truth를 바꾸지 않는다"는 기준을 유지했다.

근거는 테스트와 문서에 남겼다. `docs/rfc/week06-fsd.md`에는 상태별 Source of Truth 표를 남겼고, 8주차 테스트에서는 URL 조건이 query key와 MSW 요청 조건, 화면 렌더링까지 이어지는 흐름을 검증했다. 뒤로 가기, 앞으로 가기, 새로고침처럼 URL이 원본이어야 하는 부분은 E2E로 보강했다.

### 결정 2. FSD import 경계는 사람 리뷰가 아니라 기계 검증으로 내린다

FSD 경계는 문서 규칙이나 리뷰 코멘트로만 남기지 않고 아키텍처 테스트로 검증하기로 했다. `src/shared/config/architecture/fsdImportBoundaries.test.ts`는 하위 레이어가 상위 레이어를 import하지 못하게 막고, 같은 레이어의 다른 slice 직접 import도 막는다.

import 방향 위반은 경로만 보면 참/거짓을 판별할 수 있다. 사람이 리뷰로 매번 잡으면 놓칠 수 있고, AI 리뷰에 맡기면 맞는 지적과 그럴듯한 오탐이 섞인다. 그래서 10주차에는 AI가 잡은 `entities/product -> features/add-to-cart` 위반을 `architecture:check`로 승격했다.

확인 가능한 증거는 두 가지다. 정상 브랜치에서는 `pnpm architecture:check`가 `1 passed`, `2 passed`로 통과했고, `test/ai-review-sample` 브랜치에서는 `src/entities/product/ui/ProductCard.tsx -> src/features/add-to-cart/index.ts` 위반을 잡아 실패했다. 이 기록은 `docs/rfc/week10-ci.md`의 5단계 자가 검증에 남겼다.

### 결정 3. 테스트 레벨은 실행 비용이 아니라 검증 경계로 나눈다

테스트는 단위, 통합, E2E를 역할별로 나눴다. 순수 로직은 단위 테스트, URL 조건과 MSW 응답이 이어지는 흐름은 통합 테스트, production build와 브라우저 history, hydration, 보호 경로는 E2E로 뒀다.

모든 흐름을 E2E로 올리면 느리고, 실패했을 때 원인을 좁히기도 어렵다. 반대로 모든 것을 통합 테스트로만 보면 실제 document 요청, 브라우저 history, production hydration 같은 경계를 놓친다. 8주차에는 상품 목록과 URL 상태를 기준으로 어떤 흐름을 어떤 테스트 레벨에 둘지 문서화했고, 9주차에는 인증과 주문처럼 실패 비용이 큰 흐름만 E2E로 올렸다.

증거도 실험으로 남겼다. 8주차에서는 구현을 일부러 망가뜨려 단위·통합·E2E 테스트가 실제 회귀를 잡는지 확인했다. 9주차에서는 보호 경로 redirect 제거, 서버 세션 hydrate 제거, `expired` 분기 제거 같은 회귀를 E2E가 잡는지 확인했다.

## 4. 테스트와 품질 게이트

현재 CI는 `checks`, `e2e`, `budget`, `quality` job으로 나뉜다. `checks`는 한 번 install한 뒤 unit test, lint, typecheck를 실행하고, E2E와 Budget은 앱 런타임이나 설정에 영향을 주는 경로에서만 실행한다. 조건부 job 자체를 required로 두지 않고 항상 실행되는 `Quality` job이 최종 판정을 맡게 해, skipped job 때문에 PR이 대기 상태에 빠지는 문제를 피했다.

E2E는 비싸고 흔들릴 수 있으므로 모든 PR에 무조건 붙이지 않았다. 대신 `src/**`, `e2e/**`, `public/**`, 주요 설정 파일, workflow 변경에서는 실행하고, `push` to main과 `merge_group`에서는 항상 실행한다. 문서-only PR에서는 E2E가 skipped 되는 캡처와, workflow 변경 PR에서는 E2E가 실행되는 캡처를 `docs/images/week10`에 남겼다.

환경 변수와 번들 예산도 gate로 올렸다. `scripts/validate-env.mjs`는 CI/production에서 `APP_ORIGIN`, `AUTH_SESSION_SECRET`을 요구하고, URL 형식과 `NEXT_PUBLIC_*` secret 노출 위험을 검사한다. `.size-limit.json`은 `.next/static/chunks/*.{js,css}`의 brotli 크기를 `340 KiB`로 제한하며, 초과 PR에서는 `Budget`과 `Quality`가 실패하는 것을 확인했다.

## 5. 성능 개선 결과

7주차 성능 작업에서는 Lighthouse 점수만 보지 않고 Network, Trace를 함께 확인했다. Home 성능은 Performance median이 `75`에서 `94`로 올랐고, LCP median은 `40.590s`에서 `3.156s`로 줄었다. LCP resource도 `hero-original.jpg`에서 `hero-mobile-768.webp`로 바뀌었고, CLS는 Before/After 모두 `0`이었다. 이 결과로 Home 병목이 레이아웃보다 Hero 이미지 전송 크기에 가까웠다는 판단을 확인했다.

10주차에서는 이 측정값을 CI 예산으로 옮겼다. Lighthouse 점수는 runner 상태에 따라 흔들릴 수 있어 required gate로 두지 않고, 더 결정적인 산출물 크기인 client JS/CSS brotli 값을 budget gate로 잡았다. 현재 값은 `238.04 kB`였고, 예산은 `340 KiB`로 뒀다. 작은 빌드 변동으로 불필요하게 막히지 않도록 여유를 두되, 7주차 Home 전체 전송량 `459.5 KiB`보다 낮은 상한을 둬 큰 회귀를 막는 기준으로 삼았다.

## 6. CI/CD와 AI 협업

CI는 먼저 같은 검증을 유지한 채 병목만 줄였다. Before에서 `Run quality checks`가 가장 긴 구간이었기 때문에 정적 검증과 E2E를 분리했고, 정적 검증은 `Checks` job에서 한 번 install한 뒤 test, lint, typecheck를 실행하게 했다. cache hit/miss도 lockfile hash를 일부러 바꿔 검증했고, warm hit에서는 install이 `2s`, miss에서는 `8s`로 늘어나는 것을 기록했다.

workflow 보안도 기본값을 좁혔다. `permissions`는 `contents: read`, `pull-requests: read`로 제한했고, 모든 action은 commit SHA로 고정했다. `pull_request_target`은 쓰지 않았고, `actions/checkout`에는 `persist-credentials: false`를 둬 이후 step에 credential이 남지 않게 했다.

AI는 리뷰 기준을 만드는 데 사용했지만 required gate로 두지 않았다. `docs/ai/review-skill.md`와 rule 파일들은 AI가 일반론을 말하지 않고 이 프로젝트의 규칙으로 diff를 보게 하는 장치다. 잘 잡은 FSD import 위반은 결정적 테스트로 승격했고, `aria-label` 일반론처럼 실제 결함과 이어지지 않은 지적은 헛소리로 반려했다.

## 7. AI 활용 회고

이번 주 결론은 "AI가 찾을 수 있는 것"과 "기계가 막아야 하는 것"을 나누는 것이었다. import 방향처럼 경로만으로 참/거짓을 판별할 수 있는 규칙은 AI나 사람에게 남기지 않고 `architecture:check`로 내렸다. 반대로 slice 배치, Public API 의도, `shared` 오염처럼 맥락 판단이 필요한 문제는 AI와 사람 리뷰에 남겼다.

이 구분은 10주 전체의 결론과도 이어진다. 1주차의 lint/type 규칙, 6주차의 FSD import 방향, 8주차의 테스트 회귀 검증, 10주차의 번들 예산과 환경 변수 검증은 모두 결정적으로 판별할 수 있으므로 기계에 맡기는 편이 맞았다. 반대로 컴포넌트 책임 분리, feature 승격 시점, E2E 범위 선정, Lighthouse를 gate로 둘지 여부는 맥락과 비용 판단이 필요해서 AI와 사람 리뷰에 남기는 편이 맞았다.

AI는 초안 작성과 빠른 관점 확장에는 유용했다. workflow YAML, 리뷰 프롬프트, 문서 초안, 실패 원인 후보를 빠르게 만들 수 있었다. 하지만 최종 판단은 항상 로그, 측정값, 실패 재현으로 확인해야 했다. 특히 CI 보안, path filter, required check, secret 주입 같은 부분은 AI가 만든 모양이 맞아 보여도 실제 실행 조건을 대조하지 않으면 위험하다.

## 8. 다시 만든다면

다시 만든다면 초반부터 "어떤 상태를 어디에 둘지"와 "어떤 동작을 어떤 테스트 레벨에서 검증할지"를 표로 먼저 정리했을 것이다. 이번 프로젝트에서는 FSD 전환과 테스트 보강을 하면서 이 기준을 정리했기 때문에, URL 상태를 어디까지 로컬 상태로 둘지, 어떤 흐름을 E2E로 올릴지 같은 판단을 중간에 반복했다.

기준을 먼저 고정했다면 기능 추가나 리팩터링 때 서버 응답을 로컬 상태에 복사하거나, E2E를 필요 이상으로 늘릴 위험을 더 일찍 줄일 수 있었을 것이다. 중간에 구조를 옮긴 뒤에도 동작이 유지된 것은 다행이지만, 상태 원본과 테스트 책임이 먼저 문서화되어 있었다면 리팩터링 중 판단이 더 단순했을 것이다.

CI는 이번에는 필요한 수준에서 멈췄지만, 운영까지 간다면 배포 플랫폼의 preview URL과 연결한 smoke test, 주기적인 Lighthouse 관찰, Playwright browser cache를 추가로 검토할 것이다. 다만 이번 과제에서는 검증을 많이 붙이는 것보다 어떤 검증을 왜 required로 두는지 설명하는 것이 더 중요했으므로, `Quality` 집계 job과 결정적 gate 중심으로 마무리했다.
