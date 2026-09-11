import { screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { HomePage } from './HomePage';

// connection()은 Next 요청 컨텍스트 밖에서 던진다. 셸만 그리는 데는 필요 없다.
vi.mock('next/server', () => ({ connection: () => Promise.resolve() }));

/** 조회를 기다리지 않고 브라우저가 먼저 그리는 초기 HTML */
const paintInitialHtml = () => {
  document.body.innerHTML = renderToStaticMarkup(<HomePage />);
};

describe('홈 초기 HTML', () => {
  // 배너 제목은 조회 뒤에 오는 h2라, 대기 없이 나오는 문구가 홈의 h1이어야 한다.
  it('조회 전에도 화면 제목을 h1으로 읽을 수 있다', () => {
    paintInitialHtml();

    expect(
      screen.getByRole('heading', { level: 1, name: '이번 주의 발견' }),
    ).toBeInTheDocument();
  });

  it('배너 영역의 이름을 그 제목으로 읽는다', () => {
    paintInitialHtml();

    expect(
      screen.getByRole('region', { name: '이번 주의 발견' }),
    ).toBeInTheDocument();
  });
});
