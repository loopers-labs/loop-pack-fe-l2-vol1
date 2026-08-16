/**
 * 서버가 자기 자신에게 HTTP 요청을 보낼 때 쓰는 origin.
 *
 * **기본값을 두지 않는다.** `?? 'http://localhost:3000'` 을 두면 배포 환경에서 값이 빠져도
 * 조용히 localhost 로 떨어진다. 서버는 자기 자신을 가리키므로 API 호출은 그대로 성공하고,
 * 대신 `metadataBase` 가 localhost 가 되어 공유 링크의 OG 이미지 주소만 깨진 채 나간다.
 * 실패가 눈에 띄지 않는 자리다.
 *
 * 기본값이 없으면 값이 빠진 순간 build 가 실패해 배포 전에 잡힌다.
 *
 * `NEXT_PUBLIC_` 을 쓰지 않는다. 이 값은 서버 분기에서만 읽으므로 클라이언트 번들에
 * 인라인될 이유가 없다. 그래서 호출도 서버 경로에서만 해야 한다.
 */
export function getAppOrigin(): string {
  const origin = process.env.APP_ORIGIN;

  if (!origin) {
    throw new Error(
      'APP_ORIGIN 이 설정되지 않았습니다. 서버가 자기 자신에게 보내는 요청과 metadataBase 가 이 값을 씁니다.\n' +
        'build 와 runtime 에 같은 값을 넣어 주세요. 예) APP_ORIGIN=http://localhost:3000 pnpm build',
    );
  }

  return origin;
}
