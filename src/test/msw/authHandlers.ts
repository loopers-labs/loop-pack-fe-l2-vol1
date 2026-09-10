import { HttpResponse, http } from 'msw'

// 인증·주문 API의 기본 응답이다. 실패와 로그인 상태는 각 테스트에서 handler를 재정의한다.
//
// 판정에 운영 코드(findAccount)를 쓰지 않는다. 재사용하면 계정 목록이 바뀔 때
// 관련 테스트가 함께 실패하고, 실패 원인이 앱인지 fixture인지 구분하기 어렵다.

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

  // 기본값은 익명이다. 로그인 상태가 필요한 테스트에서 authStates.signedIn()을 적용한다.
  // 로그인 상태를 기본값으로 사용하면 세션을 생성하지 않은 테스트도 통과할 수 있다.
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
// 메시지를 인자로 받는 이유는, 화면이 서버 메시지를 그대로 보여주는지 확인할 때
// 테스트가 준 문구와 화면의 문구를 비교하기 위해서다. 문구를 테스트에 하드코딩하면
// 서버 문구가 바뀔 때 앱이 아니라 테스트가 깨진다.
export const authFailures = {
  // 자격 증명 불일치. 로그인 폼이 인라인으로 받는 401이다.
  loginRejected: (message = '이메일 또는 비밀번호를 확인해주세요.') =>
    http.post('*/api/auth/login', () =>
      HttpResponse.json({ message }, { status: 401 }),
    ),

  loginServerError: (message = '로그인에 실패했습니다.') =>
    http.post('*/api/auth/login', () =>
      HttpResponse.json({ message }, { status: 500 }),
    ),
}
