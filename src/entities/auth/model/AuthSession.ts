import type { AuthUser } from '@/entities/auth/model/AuthSchema'

export type AuthSession =
  | { readonly status: 'authenticated'; readonly user: AuthUser }
  | { readonly status: 'anonymous' }
  | { readonly status: 'expired' }
