// 서버가 자기 API를 부를 때의 base와 metadataBase(OG 절대 URL)가 같은 origin을 쓰도록 한 곳에 둔다.
// 배포는 APP_ORIGIN(build·runtime 동일, 서버가 접근 가능한 origin)을 넣고, 없으면 기존 base, 그다음 로컬 기본값.
export const APP_ORIGIN =
  process.env.APP_ORIGIN ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
