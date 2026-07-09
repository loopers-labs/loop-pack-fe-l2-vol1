'use client';

import { TitlePriceSelect } from './TitlePriceSelect';
import { SizeSelect } from './SizeSelect';
import { ThumbnailSelect } from './ThumbnailSelect';

const sectionStyle: React.CSSProperties = {
  marginBottom: 32,
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#5a6675',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

export function SelectPlayground() {
  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
        Select Playground — 세 가지 스타일
      </h1>
      <p style={{ fontSize: 13, color: '#8794a3', marginBottom: 32, lineHeight: 1.6 }}>
        같은 <code>useSelect</code> 로직 한 벌으로 서로 다른 세 가지 생김새를 렌더합니다. 각 항목을
        클릭하거나 방향키로 탐색하세요. 콘솔에 선택 로그가 찍힙니다.
      </p>

      <section style={sectionStyle}>
        <div style={labelStyle}>1) 제목 + 가격 + 무료배송 뱃지</div>
        <TitlePriceSelect />
      </section>

      <section style={sectionStyle}>
        <div style={labelStyle}>2) 사이즈 + 도착요일 (품절 스킵)</div>
        <SizeSelect />
      </section>

      <section style={sectionStyle}>
        <div style={labelStyle}>3) 썸네일 이미지</div>
        <ThumbnailSelect />
      </section>
    </main>
  );
}
