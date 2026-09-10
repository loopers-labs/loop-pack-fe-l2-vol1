import { generateHomeMetadata, HomePage } from '@/_pages/home'

// 라우팅 진입점이다. 화면 조합과 metadata 계약은 페이지 슬라이스가 소유한다.
export const generateMetadata = generateHomeMetadata

export default function Page() {
  return <HomePage />
}
