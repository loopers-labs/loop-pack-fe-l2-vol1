/**
 * 서버가 자기 API를 부르거나 절대 URL을 만들 때 쓰는 origin.
 */
export function getAppOrigin() {
  try {
    const origin = new URL(process.env.APP_ORIGIN ?? '');

    return origin.protocol === 'http:' || origin.protocol === 'https:'
      ? origin
      : null;
  } catch {
    return null;
  }
}
