import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

describe('HeroSection', () => {
  it('renders a responsive decorative image without discovery hints', async () => {
    const { HeroSection } = await import('./HeroSection')

    const markup = renderToStaticMarkup(
      <HeroSection
        title="매일 새롭게 발견하는 취향"
        description="지금 가장 사랑받는 상품을 만나보세요."
      />,
    )

    expect(markup).toContain('매일 새롭게 발견하는 취향')
    expect(markup).toContain('지금 가장 사랑받는 상품을 만나보세요.')
    expect(markup).toContain('[aspect-ratio:16/9]')
    expect(markup).toContain('[@media(max-width:640px)]:[aspect-ratio:4/5]')
    expect(markup).toContain('alt=""')
    expect(markup).toContain('object-cover')
    expect(markup).toContain(
      '[@media(max-width:640px)]:[object-position:56%_center]',
    )
    expect(markup).toContain(
      'sizes="(max-width: 640px) calc(222.2222vw - 106.6667px), (max-width: 1152px) calc(100vw - 48px), 1104px"',
    )
    expect(markup).toContain(
      'srcSet="/_next/image?url=%2Fimages%2Fweek-07%2Fhero-original.jpg',
    )
    expect(markup).toContain(' 640w')
    expect(markup).not.toContain('<link rel="preload"')
    expect(markup).not.toContain('fetchPriority="high"')
    expect(markup).not.toContain('loading="eager"')
  })
})
