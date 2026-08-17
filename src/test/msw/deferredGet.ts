import { HttpResponse, http } from 'msw'
import type { JsonBodyType } from 'msw'
import { server } from './server'

// 응답 시점을 테스트가 정하는 핸들러다. "기다리는 중"의 화면은 응답이 오기 전에만
// 관찰할 수 있어서, 지연 시간을 추측하는 대신 응답을 손에 쥐고 푼다.
//
// 요청과 응답 중 무엇이 먼저 준비되는지는 실행마다 다르다. 렌더 직후 settle을 부르면
// 요청이 아직 핸들러에 닿지 않았을 수 있다. 그래서 양쪽을 큐로 두고 도착 순서대로 짝짓는다.
export const deferredGet = (path: string) => {
  const requestedUrls: URL[] = []
  const readyResponses: Response[] = []
  const waitingRequests: Array<(response: Response) => void> = []

  server.use(
    http.get(path, ({ request }) => {
      requestedUrls.push(new URL(request.url))
      const ready = readyResponses.shift()
      if (ready) return ready
      return new Promise<Response>((resolve) => waitingRequests.push(resolve))
    }),
  )

  const respond = (response: Response) => {
    const waiting = waitingRequests.shift()
    if (waiting) {
      waiting(response)
      return
    }
    readyResponses.push(response)
  }

  return {
    settle: (body: JsonBodyType) => respond(HttpResponse.json(body)),
    // 중단이 아니라 실제 실패 응답이어야 갱신 실패와 취소가 섞이지 않는다.
    fail: (message = '상품 목록을 불러오지 못했습니다.') =>
      respond(HttpResponse.json({ message }, { status: 500 })),
    requestedUrls,
    callCount: () => requestedUrls.length,
  }
}
