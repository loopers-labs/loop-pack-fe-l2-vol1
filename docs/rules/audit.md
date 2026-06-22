# 감사 운영 방식

이 저장소는 OpenCode의 `/audit` 커맨드로 변경 범위가 FSD, 컨벤션, 접근성, 품질 게이트를 따르는지 점검한다.

## 기본 철학

- 감사는 기본적으로 read-only다. 코드를 직접 수정하지 않고 문제와 해결 방향을 보고한다.
- 기본 범위는 변경 파일(`--changed`)이다.
- 전체 감사(`--full`)는 비용이 크므로 필요한 경우에만 사용한다.
- 결과는 설정 파일과 `docs/rules` 문서를 기준으로 판단한다.

## 감사 범위

예시:

```txt
/audit
/audit --changed
/audit --full
/audit src/widgets
/audit src/features/cart
```

- 인자가 없으면 변경 파일 기준으로 감사한다.
- `--changed`는 현재 작업 트리의 변경 파일을 기준으로 감사한다.
- `--full`은 `src`, 설정 파일, `docs/rules`, `.opencode` 문서를 포함해 넓게 감사한다.
- 경로 인자가 있으면 해당 경로만 감사한다.

## 감사 에이전트

`.opencode/agents` 아래의 에이전트 지침을 사용한다.

- `fsd-auditor`: FSD 레이어, slice 책임, import 경계, public API 점검
- `convention-auditor`: TypeScript/React/스타일/AI 협업 컨벤션 점검
- `a11y-auditor`: UI 변경의 semantic HTML, keyboard, focus, aria, contrast 리스크 점검
- `quality-auditor`: lint/type/build/test 검증 계획과 설정 우회 여부 점검

## 심각도 기준

- P0: 즉시 수정해야 하는 correctness, security, 데이터 손상, 빌드 불가 문제
- P1: merge 전에 수정해야 하는 아키텍처, 접근성, 타입 안정성, 검증 실패 문제
- P2: 유지보수성, 경계 흐림, 반복 패턴 등 단기 개선 필요 문제
- P3: 스타일, 문서, 네이밍 등 낮은 위험의 개선 제안

## 보고 형식

감사 결과는 다음 형식을 우선한다.

```txt
[P1] 위치: src/features/example/...
원인: 어떤 규칙을 왜 위반했는지
해결: 어떤 방향으로 수정할지
근거: 참조한 설정 또는 docs/rules 문서
신뢰도: High | Medium | Low
```

문제가 없으면 “확인한 범위”와 “실행하지 못한 검증”을 함께 적는다. 정적 분석으로 확인할 수 없는 접근성, 브라우저 동작, 시각적 대비는 수동 확인 필요 항목으로 분리한다.
