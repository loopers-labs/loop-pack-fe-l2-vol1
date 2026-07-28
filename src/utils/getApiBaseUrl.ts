// 클라이언트는 상대경로(`/api/...`)로 충분하다.
// 서버(SSR·prefetch)에서는 origin이 없어 상대경로 fetch가 실패하므로 절대 URL이 필요하다.
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') return ''
  return process.env.NEXT_PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? '3000'}`
}
