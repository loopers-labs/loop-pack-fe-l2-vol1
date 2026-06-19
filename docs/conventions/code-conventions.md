# 코드 컨벤션 (요약)

- 의도가 이름에 드러난다 — `data` / `temp` / `flag` 같은 범용 이름 ✗
- 한 함수가 한 가지 일을 한다
- 타입이 코드를 설명한다 — `any` / `@ts-ignore`로 회피 ✗
- 에러를 명시적으로 처리한다 — `catch(e) {}` 빈 블록 ✗
- 기존 코드를 재사용한다 — 비슷한 유틸 매번 새로 생성 ✗ (AI 고질병)
- 린트/포맷 예외 시 PR 본문에 이유 명시
- 입력 검증, XSS, 민감정보 노출 점검
- React 19 컴포넌트 컨벤션: [component-conventions.md](component-conventions.md)
- 커밋 메시지: [commit-conventions.md](commit-conventions.md)
- PR 전 `pnpm format`, lint, 타입 검사 수행
