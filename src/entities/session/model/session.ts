// GET /api/auth/me가 돌려주는 전부다. 그 외 필드는 API에 없다.
export type SessionUser = {
  id: string
  name: string
  email: string
}
