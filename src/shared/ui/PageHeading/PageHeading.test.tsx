import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeading } from './PageHeading';

/* AI-generated : week06-fsd.md 애매한 파일 결정표 기준 — 비즈니스 로직 없는 순수 프레젠테이션 렌더링만 검증 */
describe('PageHeading', () => {
  it('title을 표시한다', () => {
    render(<PageHeading title="상품 목록" />);

    expect(screen.getByText('상품 목록')).toBeTruthy();
  });

  it('description이 없으면 렌더링하지 않는다', () => {
    const { container } = render(<PageHeading title="상품 목록" />);

    expect(container.querySelector('p')).toBeNull();
  });

  it('description이 있으면 함께 표시한다', () => {
    render(<PageHeading title="상품 목록" description="원하는 상품을 찾아보세요" />);

    expect(screen.getByText('원하는 상품을 찾아보세요')).toBeTruthy();
  });
});
