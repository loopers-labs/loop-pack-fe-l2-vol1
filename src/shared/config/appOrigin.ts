// 서버가 자기 API를 부를 때 쓰는 origin이다. 서버 실행에서만 읽어 브라우저 번들에 넣지 않는다.
// 값이 없거나 URL이 아니면 여기서 던진다. 설정 오류라 build와 runtime을 즉시 멈춰야 한다.
// 값은 멀쩡한데 닿지 못하는 것은 조회 실패라서 호출한 쪽이 다룬다.
// 기본값은 두지 않는다. 조용한 localhost 기본값이 불일치를 숨기고 결과물에 굳는다.

const REQUIREMENT =
  'APP_ORIGIN must be an absolute http(s) URL.\nSet the same value for build and runtime.'

export const getAppOrigin = (): string => {
  const value = process.env.APP_ORIGIN

  if (!value) {
    throw new Error(`APP_ORIGIN is not set.\n${REQUIREMENT}`)
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`APP_ORIGIN is not a valid URL: ${value}\n${REQUIREMENT}`)
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(
      `APP_ORIGIN must use http or https: ${value}\n${REQUIREMENT}`,
    )
  }

  // origin만 남긴다. 끝의 슬래시나 경로가 붙어도 같은 결과가 되게 한다.
  return parsed.origin
}
