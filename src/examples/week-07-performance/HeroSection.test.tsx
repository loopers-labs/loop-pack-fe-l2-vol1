import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

describe('HeroSection', () => {
  it('renders the existing banner contract as a stable hero', async () => {
    const { HeroSection } = await import('./HeroSection');

    const markup = renderToStaticMarkup(
      <HeroSection
        title="매일 새롭게 발견하는 취향"
        description="지금 가장 사랑받는 상품을 만나보세요."
      />
    );

    expect(markup).toContain('매일 새롭게 발견하는 취향');
    expect(markup).toContain('지금 가장 사랑받는 상품을 만나보세요.');
    // [AI] next/image로 교체: 원본 경로는 /_next/image?url= 인코딩으로 들어가지만
    // 파일명(hero-original.jpg)은 인코딩되지 않아 그대로 검출된다.
    expect(markup).toContain('hero-original.jpg');
    expect(markup).toContain('data-nimg="fill"');
    // [AI] sizes는 .page의 width(min(100% - 32px, 1200px))와 일치하도록 보정.
    //       100vw가 아님을 검증하여 잘못된 srcset 선택을 방지한다.
    expect(markup).toContain('sizes="(max-width: 1232px) calc(100vw - 32px), 1200px"');
    // priority=true 적용 증거: next/image가 <link rel="preload" as="image">를 주입한다.
    expect(markup).toContain('rel="preload" as="image"');
    // 반응형 srcset이 자동 생성되었는지 확인 (여러 너비 후보).
    expect(markup).toContain('srcSet="/_next/image?url=');
  });
});
