import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Docker runner에는 production 서버와 실제로 참조하는 파일만 복사한다.
  // Vercel 빌드에는 영향을 주지 않으며 `server.js`로 같은 Next 서버를 실행한다.
  output: 'standalone',
}

export default nextConfig
