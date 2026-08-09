import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

// starter가 준 계약을 고정한다. 이미지를 바꾸더라도 시각적 크기와 비율과 문구,
// 그리고 홈의 유일한 h1은 유지되어야 한다.
describe('HeroSection', () => {
  it('셸이 넘긴 제목과 설명을 홈의 유일한 h1으로 보여준다', async () => {
    const { default: HeroSection } = await import('./HeroSection')

    const markup = renderToStaticMarkup(
      <HeroSection
        title="매일 새롭게 발견하는 취향"
        description="지금 가장 사랑받는 상품을 만나보세요."
      />,
    )

    expect(markup).toContain('<h1>매일 새롭게 발견하는 취향</h1>')
    expect(markup).toContain('지금 가장 사랑받는 상품을 만나보세요.')
    expect(markup).toContain('EDITOR&#x27;S PICK')
    expect(markup.match(/<h1[\s>]/g)).toHaveLength(1)
  })

  it('원본을 그대로 내려보내지 않고 표시 폭에 맞는 후보를 고르게 한다', async () => {
    const { default: HeroSection } = await import('./HeroSection')

    const markup = renderToStaticMarkup(
      <HeroSection title="제목" description="설명" />,
    )

    // 같은 원본을 가리킨다. 이미지를 바꿔치기해서 수치를 줄인 것이 아님을 고정한다.
    expect(markup).toContain('%2Fimages%2Fweek-07%2Fhero-original.jpg')

    // 후보가 하나뿐이면 브라우저가 고를 것이 없다. 폭이 다른 후보가 여러 개여야 한다.
    const srcSet = markup.match(/srcSet="([^"]*)"|srcset="([^"]*)"/)?.[0] ?? ''
    expect(srcSet.split(',').length).toBeGreaterThan(1)

    // sizes는 박스 폭이 아니라 object-fit: cover가 그리는 이미지 폭이어야 한다.
    // 760px 이하 박스는 세로형(4/5)이라 16:9 원본이 좌우로 넘쳐 잘린다. 그려지는 폭은
    // 박스 폭 W가 아니라 W x 20/9다. 박스 폭으로 적으면 후보가 절반이 되어 2배로 확대된다.
    expect(markup).toContain('(max-width: 760px) calc(222.222vw - 53.333px)')
    // 그 위 구간은 박스가 가로형(16/8)이라 폭이 그대로 크기를 정한다.
    expect(markup).toContain('(min-width: 1488px) 1440px')

    // 종횡비는 유지한다. Hero의 시각적 크기와 비율은 개선 대상이 아니다.
    expect(markup).toContain('width="3840"')
    expect(markup).toContain('height="2160"')

    // LCP 후보를 lazy로 미루지 않는다. 여기서 lazy가 보이면 발견 시점이 다시 밀린다.
    expect(markup).not.toContain('loading="lazy"')
  })
})
