// session 슬라이스의 Public API.
// 세션은 요청마다 값이 달라지는 서버 상태라 클라이언트 store를 두지 않는다
// (docs/week-09/decisions.md 7번). 조회 계약과 타입만 공개한다.
export type { SessionUser } from '@/entities/session/model/session'
export { getSession } from '@/entities/session/api/api'
export { sessionQueries, sessionQueryKeys } from '@/entities/session/api/queries'
export { useSessionQuery, useCurrentUserId } from '@/entities/session/api/service'
