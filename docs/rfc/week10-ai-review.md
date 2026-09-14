# 10주차 AI 코드 리뷰 기록

이 문서는 PR #2의 CI 변경을 AI로 검토한 입력과 결과를 보존한다. AI 지적은 그대로 병합하지 않고 재현 가능한 테스트나 프로젝트 규칙으로 확인했다. 수용한 지적 1건과 반려한 지적 1건을 통해 프롬프트를 어떻게 좁혔는지도 기록한다.

## 1. 리뷰 범위

| 항목 | 값 |
| --- | --- |
| 대상 저장소 | `manual-hue/loop-pack-fe-l2-vol1` |
| 기준 브랜치 | `feat/week-10` |
| 대상 범위 | `feat/week-10...c76722c4` |
| 중심 파일 | `.github/workflows/quality.yml`, `scripts/ci/*.mjs`, `scripts/validate-env.mjs`, `eslint.config.mjs` |
| 배치 | 로컬 대화형 리뷰, CI 미통합 |

리뷰에는 `CLAUDE.md`, `docs/frontend-conventions.md`, 6주차 FSD RFC, 8주차 테스트 계획, 9주차 E2E 범위, 10주차 과제를 함께 제공했다. 시스템 지침처럼 도구가 자동으로 포함한 문맥은 프롬프트 본문과 구분했다.

## 2. 첫 번째 프롬프트

```text
Review the diff feat/week-10...c76722c4 as a production code review.

Use this repository's rules and report only actionable defects. Check:
- workflow permissions, trigger and path-filter safety, required-check behavior,
  concurrency and toolchain pinning;
- fail-closed parsing and validation of build artifacts and environment values;
- FSD upward imports through aliases and relative paths;
- whether tests prove normal, boundary, failure and recovery behavior.

For each finding, provide severity, file and line, a minimal reproduction,
the violated repository rule, and confidence. Do not suggest style-only changes.
If there is no actionable defect, say so.
```

이 프롬프트는 재현과 규칙을 요구했지만 번들 지표의 의미를 설명하지 않았다. 그 결과 파서 결함은 정확히 찾았지만 전송 크기 계산 방식에는 프로젝트 계약과 맞지 않는 지적이 포함됐다.

## 3. 수용한 지적

AI의 출력은 다음과 같았다.

```text
[Medium] scripts/ci/bundle-budget.mjs:21
parseClientReferenceManifest가 __RSC_MANIFEST marker가 없을 때 0부터 첫 '='를 찾아
unrelated JSON assignment를 정상 manifest로 받아들입니다.

재현:
parseClientReferenceManifest(
  'globalThis.value = {"entryJSFiles":{"page":[]}};'
)
가 예외 대신 객체를 반환합니다.

build format mismatch는 fail closed 해야 합니다.
```

### 재현과 수정

지적에 포함된 문자열을 `bundle-budget.test.mjs`에 넣자 기존 구현이 통과했다. `lastIndexOf('globalThis.__RSC_MANIFEST[')`가 `-1`이어도 이후 `indexOf('=', 0)`이 다른 할당문의 등호를 찾는 것이 원인이었다.

`da9fea6a`에서 필수 식별자가 없으면 즉시 예외를 일으키도록 바꾸고 회귀 테스트를 추가했다. Node.js 24.17.0에서 CI 대상 테스트 5개가 통과했고, 이후 Ubuntu Actions에서도 bundle 검사가 성공했다.

수용 이유는 세 가지다.

- 최소 입력으로 재현할 수 있었다.
- manifest 형식이 달라졌는데도 성공하는 동작은 fail-closed 계약을 어겼다.
- 한 조건문과 회귀 테스트로 수정 범위가 분명했다.

## 4. 반려한 지적

AI의 출력은 다음과 같았다.

```text
[Medium] route chunk를 각각 gzip한 값을 더하면 공통 chunk가 route 사이에서 중복됩니다.
모든 chunk를 이어 붙여 한 번 gzip하거나 shared chunk를 한 route에서만 계산해야 합니다.
```

이 지적은 적용하지 않았다. 이 프로젝트의 지표는 사용자가 각 route에 처음 진입할 때 받는 JavaScript 전송량이다. 브라우저는 chunk 파일을 각각 전송받으므로 파일별 gzip 크기를 더하는 방식이 HTTP 전송과 맞다.

같은 route 안에서는 `Set`으로 중복 chunk를 제거한다. 서로 다른 route 표에서 공통 chunk가 각각 포함되는 것은 두 진입점의 초기 비용을 독립적으로 보여 주기 위한 의도다. 모든 파일을 연결해 한 번 gzip하면 실제 응답에 없는 압축 이득이 생기고, 공통 chunk를 한 route에서만 빼면 다른 route의 첫 방문 비용이 과소 계산된다.

## 5. 프롬프트 개선

오탐의 원인은 리뷰 입력에 번들 지표의 관찰 단위가 없었던 것이다. 두 번째 프롬프트에는 다음 조건을 추가했다.

```text
The bundle metric is a per-route initial transfer estimate.
Each JavaScript file is delivered and gzip-compressed separately.
Deduplicate paths within one route, but evaluate routes independently.

Before reporting a parser or metric defect:
1. quote the exact documented contract it violates;
2. provide the smallest input that reproduces a wrong result;
3. distinguish accepting malformed input from choosing a different metric.
```

개선 프롬프트는 “다른 측정 방식이 가능하다”는 의견과 현재 계약을 어기는 결함을 구분한다. 최소 재현이 없는 성능·구조 제안은 finding이 아니라 검토 후보로만 남긴다.

## 6. AI 리뷰 배치 결정

AI 리뷰는 required GitHub check가 아니라 advisory로 유지한다. 같은 diff도 모델 버전과 문맥에 따라 결과가 달라지고, 실행 비용과 외부 API 장애가 병합 가능 여부에 영향을 줄 수 있기 때문이다.

역할은 다음처럼 나눈다.

| 주체 | 맡은 역할 |
| --- | --- |
| AI | 넓은 diff에서 의심 지점과 재현 후보 찾기 |
| 사람 | 프로젝트 계약 확인, 수용·반려, 예산과 병합 정책 결정 |
| 기계 | 테스트, lint, 환경 검사, 번들 예산, build, E2E로 결정적 판정 |

AI가 만든 workflow나 검사 스크립트도 같은 required gate를 통과해야 한다. 특히 권한, 외부 PR trigger, cache key, path filter, secret 전달, 실패 시 기본 동작은 사람이 diff에서 다시 확인한다.

FSD 규칙은 AI 리뷰의 중심 성과가 아니다. 6주차에 실제로 반복된 역방향 import를 작은 lint 규칙으로 고정한 사례이며, 같은 레이어의 설계 판단까지 자동화하지 않는다.
