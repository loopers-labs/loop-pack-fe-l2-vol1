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

    // sizes가 없으면 브라우저는 100vw로 가정해서 필요 이상으로 큰 후보를 고른다.
    // 반대로 실제보다 좁게 적으면 작은 후보를 골라 화질이 떨어진다.
    // 레이아웃 컨테이너와 같은 값인지가 이 변경의 핵심이라 구간별로 고정한다.
    // 760px 이하는 여백이 24px이라 별도 구간이다. 이 줄이 빠지면 모바일이 48px로 계산된다.
    expect(markup).toContain('(max-width: 760px) calc(100vw - 24px)')
    expect(markup).toContain('(min-width: 1488px) 1440px')

    // 종횡비는 유지한다. Hero의 시각적 크기와 비율은 개선 대상이 아니다.
    expect(markup).toContain('width="3840"')
    expect(markup).toContain('height="2160"')

    // next/image 기본값 lazy가 들어오면 전송 크기 외에 로드 시점까지 바뀐다.
    // 바꾸기 전 raw img의 eager를 유지해야 두 변경이 섞이지 않는다.
    expect(markup).toContain('loading="eager"')
  })
})
