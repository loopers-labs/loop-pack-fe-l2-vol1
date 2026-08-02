import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

// starter가 준 계약을 고정한다. 1단계에서 이미지를 바꾸더라도
// 시각적 크기·비율·문구와 홈의 유일한 h1은 유지되어야 한다.
describe('HeroSection', () => {
  it('배너 응답의 제목과 설명을 홈의 유일한 h1으로 보여준다', async () => {
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

  it('Before 측정용 원본 이미지를 표시 비율이 드러나는 크기로 내려보낸다', async () => {
    const { default: HeroSection } = await import('./HeroSection')

    const markup = renderToStaticMarkup(
      <HeroSection title="제목" description="설명" />,
    )

    // 0단계 Before의 재현 조건이다. 여기가 바뀌면 Before 측정과 비교할 수 없다.
    expect(markup).toContain('src="/images/week-07/hero-original.jpg"')
    expect(markup).toContain('width="3840"')
    expect(markup).toContain('height="2160"')
  })
})
