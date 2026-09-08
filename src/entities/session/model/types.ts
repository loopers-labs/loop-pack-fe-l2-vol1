export interface AuthUser {
  id: string
  name: string
  email: string
}

export type AuthScenario = 'invalid' | 'expired' | 'error' | 'slow'

export interface AuthErrorResponse {
  message: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SessionResponse {
  user: AuthUser
}
