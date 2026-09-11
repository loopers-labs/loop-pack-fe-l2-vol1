// 표시 타임존을 코드에 고정한다. 고정하지 않으면 같은 시각이 실행 환경마다 다른
// 문자열이 되고(CI는 UTC, 로컬은 KST), 테스트가 구현과 같은 식으로 기대값을 만들면
// 서로 다른 값을 단언하면서 양쪽 다 통과한다.
// 환경별 설정이 아니라 이 서비스가 한국 사용자에게 보여주기로 한 시각이라 상수로 둔다.
const DISPLAY_LOCALE = 'ko-KR';
const DISPLAY_TIME_ZONE = 'Asia/Seoul';

/** ISO 문자열을 화면에 보여줄 날짜·시각으로 바꾼다. 예: `26. 08. 30. (일) 오후 06:00` */
export function formatDateTime(isoDateTime: string) {
  return new Date(isoDateTime).toLocaleString(DISPLAY_LOCALE, {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: DISPLAY_TIME_ZONE,
  });
}
