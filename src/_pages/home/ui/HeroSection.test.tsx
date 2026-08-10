import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

describe('HeroSection', () => {
  // 이미지가 홈 데이터를 기다리지 않아야 첫 flush에 들어간다.
  // props로 데이터를 받으면 다시 대기 안으로 끌려가므로 children만 받는 계약을 고정한다.
  it('renders the image shell without waiting for home data', async () => {
    const { HeroSection } = await import('./HeroSection')

    const markup = renderToStaticMarkup(
      <HeroSection>
        <div>카피 자리</div>
      </HeroSection>,
    )

    expect(markup).toContain('src="/images/week-07/hero-1200.webp"')
    expect(markup).toContain('width="2400"')
    expect(markup).toContain('height="1350"')
    expect(markup).toContain('카피 자리')
  })

  // 컨테이너 최대 폭이 1200px이라 3840px 원본은 표시 크기의 3배가 넘는다.
  // 표시 폭에 맞춘 후보만 내려보내는지 고정한다.
  it('offers width-matched candidates instead of the original', async () => {
    const { HeroSection } = await import('./HeroSection')

    const markup = renderToStaticMarkup(<HeroSection>{null}</HeroSection>)

    expect(markup).toContain('/images/week-07/hero-1200.webp 1200w')
    expect(markup).toContain('/images/week-07/hero-2400.webp 2400w')
    expect(markup).not.toContain('hero-original.jpg')
  })

  // 홈의 h1은 HomePage가 소유한다. 카피 fallback이 h1을 들고 오면 홈에 h1이 둘이 된다.
  it('keeps the copy fallback free of a second h1', async () => {
    const { HeroCopySkeleton } = await import('./HeroCopySkeleton')

    const markup = renderToStaticMarkup(<HeroCopySkeleton />)

    expect(markup).not.toContain('<h1')
    expect(markup).toContain('aria-hidden="true"')
  })
})
