/*
 * 브라우저 요청은 현재 origin을 기준으로 상대경로를 사용할 수 있지만, 서버 렌더링에는 기준
 * origin이 없으므로 절대 URL이 필요하다. APP_ORIGIN은 서버 전용으로 유지하고, 설정이 누락된
 * 경우에는 잘못된 localhost로 조용히 대체하지 않고 즉시 실패시킨다.
 */
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') return ''

  // 커스텀 도메인이 있으면 배포 URL보다 우선한다.
  if (process.env.APP_ORIGIN) return new URL(process.env.APP_ORIGIN).origin

  // Vercel은 배포별 URL을 제공하므로 프로토콜을 붙여 origin으로 정규화한다.
  if (process.env.VERCEL_URL) return new URL(`https://${process.env.VERCEL_URL}`).origin

  throw new Error(
    'APP_ORIGIN이 없습니다. 서버 렌더링이 API를 호출할 절대 origin이 필요합니다. ' +
      '로컬에서는 .env.local에 APP_ORIGIN=http://localhost:3000 을 추가하세요.',
  )
}
