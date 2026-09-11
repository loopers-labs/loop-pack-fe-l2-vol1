# 10주차 2단계 — E2E 스킵 증거

이 PR은 **앱 코드를 하나도 바꾸지 않는다.** 이 문서 한 개만 추가한다.
base는 `volume-10`이라, PR 전체의 diff가 이 파일 하나다.

기대하는 결과:

- `changes` → `app=false` ("앱 코드 변경 없음: E2E 스킵")
- `e2e` → **success**. 테스트는 돌지 않고 `스킵 기록` step이 job summary에 이유를 적는다
- `verify` → lint · typecheck · test · format:check · build 전부 실행

`e2e`를 required status check로 둬도 이 PR이 머지 가능해야 한다 —
job에 `if:`를 걸어 실행 자체를 막으면 "체크 대기"로 영영 머지되지 않는다.

근거 문서: `docs/rfc/week10-ci.md` E절. 짝이 되는 "조건에 걸리는 PR"은 #206.
