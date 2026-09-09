/**
 * ISO 문자열을 화면에 읽을 수 있는 날짜·시각으로 바꾼다.
 *
 * 로케일과 타임존을 둘 다 고정한다. 고정하지 않으면 서버와 브라우저의 설정이 달라졌을 때
 * 같은 값이 다른 문자열로 찍혀 하이드레이션 불일치가 난다. 날짜 포맷은 그 불일치의 흔한
 * 원인이라 실행 환경에 기대지 않는다.
 *
 * 출력도 `formatToParts`로 직접 조립한다. 로케일이 붙이는 구두점("2026. 09. 01.")이
 * ICU 버전에 따라 달라질 수 있어, 자리값만 꺼내 쓰면 그 변동에서 벗어난다.
 */

const DISPLAY_TIME_ZONE = 'Asia/Seoul';

const formatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: DISPLAY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * @param isoString ISO 8601 문자열
 * @returns `2026-09-01 20:02` 형식. 읽을 수 없는 값이면 원문을 그대로 돌려준다
 */
export function formatDateTime(isoString: string): string {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return isoString;
  }

  const parts = Object.fromEntries(
    formatter.formatToParts(parsed).map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}
