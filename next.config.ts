import type { NextConfig } from 'next';

/* AI-generated : Week 7 Part 1 — DPR 2 화면에서 실제 렌더 폭(1200px)의 2배(2400px)가 필요한데 기본 deviceSizes(1920/2048 다음이 3840)엔 맞는 후보가 없어 3840까지 건너뛰던 문제를 완화하기 위해 2400을 추가 */
/* AI-generated : Week 7 Part 1 — AVIF 지원 브라우저에는 WebP보다 더 작은 AVIF를 우선 협상하도록 images.formats에 추가(미지원 브라우저는 자동으로 WebP/원본 폴백) */
/* AI-generated : Week 7 Part 1 Round 4 — DPR 1.25~1.5(스케일된 레티나 디스플레이에서 흔함)일 때 필요 폭(1200×DPR=1500~1800)에 맞는 후보가 1200과 1920 사이에 없어 1920까지 건너뛰던 문제를 완화하기 위해 1800(=1200×1.5)을 추가 */
/* AI-generated : Week 7 Part 4 — FCP 개선. FCP까지의 임계 경로가 "문서 왕복 → render-blocking CSS 왕복" 2회 직렬이었고(Lighthouse render-blocking-insight가 650ms 절감 추정), CSS 총량이 3.7KB뿐이라 문서에 인라인하면 왕복 하나를 통째로 없앨 수 있다 */
const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1800, 1920, 2048, 2400, 3840],
    formats: ['image/avif', 'image/webp'],
  },
  compiler: {
    // 프로덕션 빌드에서 console.* 호출 제거 (error는 남겨서 실제 장애 로그는 유지)
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
};

export default nextConfig;
