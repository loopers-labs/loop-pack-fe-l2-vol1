import { LoginForm } from '@/features/login'
import { isLoginEntryPoint } from '@/analytics/app-events'
import { PageContainer } from '@/shared/ui/PageContainer/PageContainer'
import {
  LOGIN_ENTRY_POINT_PARAM,
  LOGIN_PRODUCT_ID_PARAM,
  RETURN_URL_PARAM,
} from '@/shared/lib/to-login-path'
import { toSafeReturnPath } from '@/shared/lib/to-safe-return-path'
import '@/shared/styles/layout.css'

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// 헤더를 두지 않는 유일한 화면 중 하나다(세션 만료 화면과 함께).
// 로그인 화면에서 장바구니·위시리스트로 나가는 링크는 다시 이 화면으로 돌아오게 된다.
//
// returnUrl을 서버에서 읽어 내려보낸다. useSearchParams로 읽으면 Suspense 경계가 필요하고,
// 그만큼 폼이 늦게 붙는다. 값 하나를 읽는 데 그럴 이유가 없다.
export const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const params = await searchParams
  const returnUrl = params[RETURN_URL_PARAM]
  const entryPointParam = params[LOGIN_ENTRY_POINT_PARAM]
  const productIdParam = params[LOGIN_PRODUCT_ID_PARAM]

  // 같은 이름이 여러 번 오면 배열이 된다. 그런 요청은 정상 흐름이 아니라 홈으로 대체된다.
  const returnPath = toSafeReturnPath(typeof returnUrl === 'string' ? returnUrl : null)
  const entryPoint = isLoginEntryPoint(entryPointParam) ? entryPointParam : 'protected_route'
  const productId = typeof productIdParam === 'string' ? productIdParam : undefined

  return (
    <PageContainer>
      <section className="layout-section login-layout">
        <h1>로그인</h1>
        <LoginForm returnPath={returnPath} entryPoint={entryPoint} productId={productId} />
      </section>
    </PageContainer>
  )
}
