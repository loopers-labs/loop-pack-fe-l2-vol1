// 요청마다 서버에서 홈 query를 prefetch하므로 빌드 시 정적 생성하지 않는다.
// 라우트 세그먼트 설정은 Next.js가 이 파일에서만 읽으므로 화면 구현과 함께 내리지 않는다.
export const dynamic = 'force-dynamic'

export { generateHomeMetadata as generateMetadata } from '@/_pages/home'
export { HomePage as default } from '@/_pages/home'
