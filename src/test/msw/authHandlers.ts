import { HttpResponse, http } from 'msw'

// 인증·주문 API의 기본 응답이다. 실패와 로그인 상태는 각 테스트가 override로 덮는다.
//
// 판정에 운영 코드(findAccount)를 쓰지 않는다. 재사용하면 계정 목록이 바뀔 때
// 테스트가 함께 흔들리고, 실패해도 원인이 앱인지 fixture인지 갈리지 않는다.

export const testAccount = {
  id: 'u1',
  name: '루퍼1',
  email: 'looper1@loopers.dev',
}

export const testPassword = 'looper1234'

export const authHandlers = [
  http.post('*/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    const matched =
      body.email === testAccount.email && body.password === testPassword

    return matched
      ? HttpResponse.json({ user: testAccount })
      : HttpResponse.json(
          { message: '이메일 또는 비밀번호를 확인해주세요.' },
          { status: 401 },
        )
  }),

  http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 204 })),

  // 기본값은 익명이다. 로그인 상태가 필요한 테스트가 authStates.signedIn()으로 덮는다.
  // 반대로 두면 세션을 만든 적 없는 테스트도 로그인 상태로 통과한다.
  http.get('*/api/auth/me', () =>
    HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 }),
  ),

  http.get('*/api/orders', () =>
    HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 }),
  ),

  http.post('*/api/orders', () =>
    HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 }),
  ),
]

// 로그인 상태를 만드는 override다.
export const authStates = {
  signedIn: () =>
    http.get('*/api/auth/me', () => HttpResponse.json({ user: testAccount })),

  orders: (orders: unknown[] = []) =>
    http.get('*/api/orders', () => HttpResponse.json({ orders })),
}

// 실패 응답이다. server.use()에 넘겨 쓴다.
export const authFailures = {
  // 자격 증명 불일치. 로그인 폼이 인라인으로 받는 401이다.
  loginRejected: () =>
    http.post('*/api/auth/login', () =>
      HttpResponse.json(
        { message: '이메일 또는 비밀번호를 확인해주세요.' },
        { status: 401 },
      ),
    ),

  loginServerError: () =>
    http.post('*/api/auth/login', () =>
      HttpResponse.json({ message: '로그인에 실패했습니다.' }, { status: 500 }),
    ),
}
