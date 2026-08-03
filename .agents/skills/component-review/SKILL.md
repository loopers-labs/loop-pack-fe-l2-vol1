---
name: component-review
description: '컴포넌트 리팩터링·관심사 분리 리뷰, Hook 책임 점검 요청에 사용. 지정 컴포넌트나 Hook을 FSD 배치·관심사·API·Server/Client 경계 등 5개 관점으로 점검하고 우선순위 리포트 생성'
---

# 컴포넌트 리뷰

TRIGGER — 컴포넌트 리팩터링/관심사 분리 리뷰, Hook 책임 점검 요청 시 이 스킬을 먼저 로드.

`self-review`가 PR 전 diff를 점검하는 스킬이라면, 이 스킬은 diff와 무관하게 지정된 컴포넌트/Hook의 구조 자체를 점검한다.

## 입력

- 대상: 사용자가 지정한 파일 또는 폴더 경로 (예: `src/productList/`)
- 경로가 지정되지 않으면 리뷰를 시작하기 전에 먼저 사용자에게 되물어 확인한다 (diff 기반이 아니므로 대상이 명확해야 한다)

## 5개 병렬 점검 관점

각 관점의 세부 체크 항목과 출력 형식은 [template.md](template.md) 참고.

1. **파일 배치 (FSD)** — 대상 파일/폴더가 올바른 레이어·슬라이스에 있는가? ([FSD 검증 규칙](../../../.claude/rules/fsd-verification.md) 참고)
2. **관심사 분리** — JSX·API 호출·비즈니스 로직·유틸이 레이어별로 분리되었는가
3. **Custom Hook 책임** — 각 Hook이 단일 책임을 가지는가, 이름이 역할을 설명하는가, service에 의존하는가
4. **API 레이어** — endpoint·request/response 변환이 한 곳에 모여 있는가
5. **Server/Client 경계 (Next.js)** — `'use client'` 범위가 최소인가, mutation이 Server Actions 원칙을 따르는가, App Router 파일 컨벤션을 우회하지 않는가

## 실행 방법

1. 지정된 경로의 파일 구조를 파악한다
2. 5개 관점을 각각 독립적으로 리뷰한다. 실행 환경이 병렬 에이전트를 지원하면 관점별로 병렬 점검한다
   - 파일 배치 (FSD) — [FSD 검증 규칙](../../../.claude/rules/fsd-verification.md) 참고
   - 관심사 분리
   - Custom Hook 책임
   - API 레이어
   - Server/Client 경계
3. 각 관점의 결과를 종합해 template.md의 출력 형식에 맞춰 우선순위 리포트를 생성한다

## 범위 밖

- git diff 기반 자동 트리거 — `self-review`와 역할이 겹치므로 이 스킬은 경로 지정 기반으로만 동작한다
- 특정 과제의 산출물 파일명(`separation-checklist.md` 등) 강제 — 일반화된 원칙만 다룬다
