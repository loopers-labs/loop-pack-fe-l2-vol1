# RFC Week 06 남은 실행 절차

현재 상태와 완료 여부의 단일 기준은 [`week06-fsd.md`의 `남은 이슈와 최종 검증`](../rfc/week06-fsd.md#남은-이슈와-최종-검증) 표다. 이 문서에는 아직 실행하거나 관찰해야 하는 항목만 둔다.

작업이 끝나면 이 문서에 완료 표시를 남기지 않고 RFC의 상태·근거·검증 결과를 갱신한다.

현재 구현·정적 검사가 끝난 항목:

- R1 홈 Route Handler 응답 타입 소유권
- R2 두 reset 연결 및 런타임 확인(Chromium·WebKit, Chromium 3/3 반복)
- R4 Zustand action·selector·persist 단위 테스트 전환
- R3 `ApiError`·`throwOnError` 구현
- V1 `pnpm check`(test 47/47·lint·typecheck·build) 전체 통과, 라우트 5개 확인
- R3·V2 Playwright 전체 36/36(Chromium+WebKit, 4회 반복 확인), 대표 HTTP 오류에서 필터 유지·재시도 복구 확인. WebKit debounce 이탈 플레이키는 격리 재현 시 실패율 상승을 관찰했으나 병렬 스위트는 4/4 통과해 회귀로 판정하지 않음(원인 미상, [decisions.md](./decisions.md) 참고)

## 1. V3 수동·예상 밖 오류 검증

1. 완료된 M2를 제외하고 RFC의 M1·M3–M9를 순서대로 확인한다.
2. M5에서는 필터·카드 스켈레톤과 실제 콘텐츠의 높이·간격·반응형 배치를 비교한다.
3. 로딩 완료 전후 결과 영역이 밀리는 layout shift가 없는지 확인한다.
4. 임시 렌더링 `throw`로 루트 fallback과 reset을 확인한 뒤 임시 코드를 제거한다.
5. 문자열과 URL을 포함한 실제 관찰값이 기대와 일치할 때만 RFC 표를 완료 처리한다.
