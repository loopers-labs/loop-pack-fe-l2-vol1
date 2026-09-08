import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

describe('HeroSection', () => {
  it('renders the existing banner contract as a stable hero', async () => {
    const { HeroSection } = await import('./HeroSection')

    const markup = renderToStaticMarkup(
      <HeroSection
        title="매일 새롭게 발견하는 취향"
        description="지금 가장 사랑받는 상품을 만나보세요."
      />,
    )

    expect(markup).toContain('매일 새롭게 발견하는 취향')
    expect(markup).toContain('지금 가장 사랑받는 상품을 만나보세요.')
    expect(markup).toContain('src="/images/week-07/hero-original.jpg"')
    expect(markup).toContain('width="3840"')
    expect(markup).toContain('height="2160"')
  })
})
