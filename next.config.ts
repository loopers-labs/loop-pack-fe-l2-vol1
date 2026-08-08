import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // AI 생성: week-07 1단계 — Hero LCP 이미지 전송 크기 축소. AVIF 우선, 미지원 브라우저는 WebP로 폴백.
    // AI 생성: week-07 1단계 — avif 대비 실측 비교(2회) 후 webp를 선택.
    // 비교 결과와 남은 재검토 항목은 docs/work/week-07/01-hero-lcp.md의 "포맷 선택 기록" 참고.
    formats: ['image/webp']
  }
};

export default nextConfig;
