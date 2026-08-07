// 클라이언트는 상대경로(`/api/...`)로 충분하다.
// 서버(SSR·prefetch·generateMetadata)에는 기준 origin이 없어 상대경로 fetch가 실패하므로 절대 URL이 필요하다.
//
// origin은 서버 분기에서만 쓰므로 `NEXT_PUBLIC_` 접두사를 붙이지 않는다. 접두사가 붙으면 Next가
// 빌드 시점에 그 값을 클라이언트 번들에 문자열로 박아 넣는데, 클라이언트 분기는 빈 문자열을 반환해
// 값을 쓰지 않는다. 쓰지도 않는 값이 번들에 남고, 배포 환경에서는 서버 내부 origin이 브라우저에
// 그대로 노출된다.
//
// env가 없는 로컬 개발을 위해 `http://localhost:${PORT}` 폴백은 남긴다.
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') return ''
  return process.env.APP_ORIGIN ?? `http://localhost:${process.env.PORT ?? '3000'}`
}
