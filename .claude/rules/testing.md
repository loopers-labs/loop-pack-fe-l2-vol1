# 테스트 작성 기준 (Playwright E2E)

- 테스트 파일: `e2e/<feature>.spec.ts`, 각 테스트는 독립적으로 실행 가능해야 함
- locator는 접근 가능한 role과 name을 우선 사용
- 구현 세부 사항보다 사용자에게 보이는 결과, 키보드 조작, ARIA 상태, 이미지 로딩 여부를 검증
- Chromium과 WebKit의 동작 차이를 고려한다
- 공통 준비 과정은 필요한 경우 `test.beforeEach`에 둔다
- 현재 별도의 커버리지 기준은 없음
