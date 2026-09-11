# 10주차 2단계 — E2E 스킵 증거용 PR

이 PR은 **앱 코드를 하나도 바꾸지 않는다.** 이 문서 한 개만 추가한다.

목적은 `ci.yml`의 `changes` job이 `app=false`를 내고, `e2e` job이
**실행되지 않으면서도 성공으로 보고**되는 것을 Actions 로그로 남기는 것이다.

기대하는 결과:

- `changes` → `app=false` ("앱 코드 변경 없음: E2E 스킵")
- `e2e` → **success**. 테스트는 돌지 않고 `스킵 기록` step이 job summary에 이유를 적는다
- `verify` → lint · typecheck · test · format:check · build 전부 실행 (저비용 결정적 검증은 조건을 붙이지 않는다)

`e2e`를 required status check로 둬도 이 PR이 머지 가능해야 한다 —
job에 `if:`를 걸어 실행 자체를 막으면 "체크 대기"로 영영 머지되지 않는다.

근거 문서: `docs/rfc/week10-ci.md` E절.
