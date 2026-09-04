import {
  type LoginRequest,
  loginRequestSchema,
  type SessionResponse,
  sessionResponseSchema,
} from '@/entities/auth/model/AuthSchema'
import { apiClient } from '@/shared/api/ApiClient'

export class AuthRepository {
  constructor(private readonly api: typeof apiClient = apiClient) {}

  async login(request: LoginRequest): Promise<SessionResponse> {
    const input = loginRequestSchema.parse(request)
    const json = await this.api
      .post('api/auth/login', { json: input })
      .json<unknown>()

    return sessionResponseSchema.parse(json)
  }

  async me(): Promise<SessionResponse> {
    const json = await this.api.get('api/auth/me').json<unknown>()
    return sessionResponseSchema.parse(json)
  }

  async logout(): Promise<void> {
    await this.api.post('api/auth/logout')
  }
}
