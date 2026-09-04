// 로그인으로 보낼 때 붙이는 복원 경로 계약. 만드는 곳이 셋이라(proxy.ts 가드, 담기 버튼, 찜 버튼)
// 파라미터 이름이 한 곳에서만 정해져야 한다. 이름이 갈리면 로그인 화면이 값을 못 읽고
// 조용히 홈으로 보낸다 — 실패가 눈에 띄지 않는 종류의 어긋남이다.
//
// 안전성은 여기가 지지 않는다. 받는 쪽(LoginPage)이 toSafeReturnPath로 다시 좁힌다.
// 만드는 값은 전부 앱이 아는 현재 경로라 검증할 것이 없고, 검증은 외부에서 들어온 값의 몫이다.
export const LOGIN_PATH = '/login'
export const RETURN_URL_PARAM = 'returnUrl'
export const LOGIN_ENTRY_POINT_PARAM = 'entryPoint'
export const LOGIN_PRODUCT_ID_PARAM = 'productId'

type LoginPathContext = {
  entryPoint?: string
  productId?: string
}

export const toLoginPath = (returnPath: string, context: LoginPathContext = {}): string => {
  const params = new URLSearchParams({ [RETURN_URL_PARAM]: returnPath })

  if (context.entryPoint !== undefined) {
    params.set(LOGIN_ENTRY_POINT_PARAM, context.entryPoint)
  }
  if (context.productId !== undefined) {
    params.set(LOGIN_PRODUCT_ID_PARAM, context.productId)
  }

  return `${LOGIN_PATH}?${params.toString()}`
}
