# analyze-component skill 스펙

## 목표

강의 자료 마지막의 제안인 `analyze-component` skill을 프로젝트 로컬 skill로 만든다.

## 비범위

- 실제 공통 컴포넌트 구현은 하지 않는다.
- 새 외부 의존성을 추가하지 않는다.
- 전역 `~/.codex/skills`나 `~/.claude/skills`에는 설치하지 않는다.

## 확정 목표

`.claude/skills/analyze-component/SKILL.md`를 추가해 React 컴포넌트의 디자인 패턴, 리렌더 경로, 책임 범위, 패턴 적합성을 같은 기준으로 분석할 수 있게 한다.

## 조사 결과

- 강의 자료 마지막에서 `analyze-component` skill을 만들면 리렌더 경로, 책임 범위, 패턴 적합성을 매번 같은 기준으로 리뷰할 수 있다고 제안한다.
- 기존 프로젝트 skill은 `.claude/skills/{name}/SKILL.md` 구조를 사용한다.
- `component-review`는 리팩토링 결과의 관심사 분리와 레이어 경계를 검토한다.
- `CONVENTIONS.md`는 책임 분리, 단일 출처 상태, 이름으로 동작 예측, 도메인 단위 폴더 구조를 강조한다.

## 결정 사항

- D1: skill 위치는 프로젝트의 기존 구조와 맞춰 `.claude/skills/analyze-component`로 둔다.
- D2: 자동화 스크립트 없이 `SKILL.md` 중심으로 작성한다. 이 skill은 판단 기준과 결과 형식이 핵심이다.
- D3: 강의의 네 가지 패턴인 Headless, Compound, Controlled/Uncontrolled, Provider vs Singleton/Portal을 패턴 선택 가이드에 포함한다.
- D4: 실제 라이브러리 소스 분석과 프로젝트 공통 컴포넌트 리뷰를 모두 다룰 수 있게 한다.
- D5: 패턴 라벨링에 그치지 않도록 사용처 단순성과 대안 비교를 결과 형식에 포함한다.
- D6: 리렌더 경로는 상태 소유자, 전달/구독 경로, 렌더 범위를 표로 확인한다.

## 완료 조건

- [x] `analyze-component` skill이 프로젝트 로컬 skill 경로에 생성된다.
- [x] frontmatter의 `name`과 `description`이 skill trigger 역할을 하도록 작성된다.
- [x] 분석 절차, 패턴 선택 가이드, 리뷰 관점, 결과 형식이 포함된다.
- [x] 가능한 범위에서 skill 구조와 frontmatter를 검증한다.
- [x] 결과 형식에 사용처 단순성, 대안 비교, 표 형태의 리렌더 경로가 포함된다.

## 태스크

- T1: skill 생성 템플릿을 만든다. fulfills: 완료 조건 1
- T2: 강의 자료 기반으로 `SKILL.md`를 작성한다. fulfills: 완료 조건 2, 3
- T3: 생성된 파일을 확인하고 검증한다. fulfills: 완료 조건 4
- T4: 리뷰 결과 형식을 강의 의도에 맞게 보강한다. fulfills: 완료 조건 5
