// 홈 슬라이스의 Public API. 라우팅 파일이 이 계약만 보고 화면과 metadata를 붙인다.
// 슬라이스 내부 파일(HomeContent 등)은 여기서 공개하지 않는다 — 외부에서 조립할 대상이 아니다.
// 로딩 스켈레톤은 HomePage 내부 Suspense가 소유하므로 라우팅 파일에 공개하지 않는다.
export { HomePage } from '@/_pages/home/ui/HomePage'
// 라우팅 파일이 generateMetadata라는 이름으로 다시 내보낸다. Next가 요구하는 이름은 라우트의 계약이라
// 슬라이스 안에서는 무엇을 만드는지 드러나는 이름을 쓰고 이름 변환은 라우팅 파일에서 한다.
export { generateHomeMetadata } from '@/_pages/home/model/generate-metadata'
