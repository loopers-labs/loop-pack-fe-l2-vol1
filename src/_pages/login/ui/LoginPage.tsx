import { LoginForm } from '@/features/login'
import { isLoginEntryPoint } from '@/analytics/app-events'
import { PageContainer } from '@/shared/ui/PageContainer/PageContainer'
import { NoticeBanner } from '@/shared/ui/NoticeBanner/NoticeBanner'
import { LOGIN_QUERY_PARAMS, LOGIN_REASON, isLoginReason } from '@/shared/lib/to-login-path'
import { toSafeReturnPath } from '@/shared/lib/to-safe-return-path'
import '@/shared/styles/layout.css'

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const params = await searchParams
  const returnUrl = params[LOGIN_QUERY_PARAMS.RETURN_URL]
  const entryPointParam = params[LOGIN_QUERY_PARAMS.ENTRY_POINT]
  const productIdParam = params[LOGIN_QUERY_PARAMS.PRODUCT_ID]
  const reasonParam = params[LOGIN_QUERY_PARAMS.REASON]

  // 같은 이름이 여러 번 오면 배열이 된다. 그런 요청은 정상 흐름이 아니라 홈으로 대체된다.
  const returnPath = toSafeReturnPath(typeof returnUrl === 'string' ? returnUrl : null)
  const entryPoint = isLoginEntryPoint(entryPointParam) ? entryPointParam : 'protected_route'
  const productId = typeof productIdParam === 'string' ? productIdParam : undefined
  const reason = isLoginReason(reasonParam) ? reasonParam : undefined

  return (
    <PageContainer>
      <section className="layout-section login-layout">
        <h1>로그인</h1>
        {reason === LOGIN_REASON.SESSION_EXPIRED && (
          <NoticeBanner role="status">세션이 만료되었습니다. 다시 로그인해 주세요.</NoticeBanner>
        )}
        <LoginForm returnPath={returnPath} entryPoint={entryPoint} productId={productId} />
      </section>
    </PageContainer>
  )
}
