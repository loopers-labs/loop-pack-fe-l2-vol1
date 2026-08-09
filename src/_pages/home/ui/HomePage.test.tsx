import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import HomePage from './HomePage'

// 홈 셸이 느린 응답과 분리됐는지 고정한다. 이 파일이 지키는 것은 화면 문구가 아니라
// "응답이 오기 전에도 초기 HTML에 무엇이 있는가"다.
// 셸이 다시 client로 넘어가거나 pending이 main을 통째로 대체하면 여기서 깨진다.

// 서버 렌더에서는 queryFn이 돌지 않아 useQuery가 pending으로 남는다.
// 그 상태가 곧 사용자가 보는 초기 HTML이다.
const renderPendingShell = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>,
  )
}

describe('HomePage 셸', () => {
  it('응답을 기다리는 동안에도 제목과 설명을 초기 HTML에 둔다', () => {
    const markup = renderPendingShell()

    expect(markup).toContain('<h1>매일 새롭게 발견하는 취향</h1>')
    expect(markup).toContain('지금 가장 사랑받는 상품을 만나보세요.')
    expect(markup.match(/<h1[\s>]/g)).toHaveLength(1)
  })

  it('응답을 기다리는 동안에도 Hero 이미지를 초기 HTML에 둔다', () => {
    const markup = renderPendingShell()

    expect(markup).toContain('%2Fimages%2Fweek-07%2Fhero-original.jpg')
    expect(markup).not.toContain('loading="lazy"')
  })

  it('Hero 이미지의 preload 힌트를 초기 HTML에 싣는다', () => {
    const markup = renderPendingShell()

    // 이 커밋의 핵심 계약이다. 마크업에 img가 있는 것만으로는 부족하다.
    // 힌트가 없으면 브라우저는 문서를 파싱해 img에 닿을 때까지 요청을 시작하지 않는다.
    // 속성 이름은 HTML에서 대소문자를 구분하지 않으므로 표기 변화에 걸리지 않게 둔다.
    const preloadLink = markup.match(
      /<link rel="preload" as="image"[^>]*>/i,
    )?.[0]
    expect(preloadLink).toBeDefined()

    // 힌트가 본문 img와 다른 후보를 가리키면 두 번 받는다. 같은 계약인지 확인한다.
    expect(preloadLink).toMatch(/imagesrcset=/i)
    expect(preloadLink).toContain('%2Fimages%2Fweek-07%2Fhero-original.jpg')
    expect(preloadLink).toMatch(/imagesizes=/i)
    expect(preloadLink).toContain(
      '(max-width: 760px) calc(222.222vw - 53.333px)',
    )
  })

  it('pending 영역이 Hero를 대체하지 않고 그 아래에 온다', () => {
    const markup = renderPendingShell()

    // main이 둘이면 셸과 데이터 영역이 각자 문서 구조를 만들고 있다는 뜻이다.
    expect(markup.match(/<main[\s>]/g)).toHaveLength(1)

    const heroAt = markup.indexOf('week07-hero')
    const pendingAt = markup.indexOf('Loading home…')
    expect(heroAt).toBeGreaterThanOrEqual(0)
    expect(pendingAt).toBeGreaterThan(heroAt)
  })
})
