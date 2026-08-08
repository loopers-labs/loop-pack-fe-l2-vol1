// 홈 슬라이스가 외부에 공개하는 전부다. 나머지 세그먼트는 내부 구현이다.
// 조회 계약이 슬라이스 안에 모여 있다는 Decision 4의 이득은
// 외부가 그 안을 직접 참조하지 않을 때만 성립한다.
//
// HomePage는 라우팅이 마운트하는 서버 셸이다. 조회는 그 아래 Suspense 안에서 기다린다.
// HomeContent는 서버가 준비한 Query Cache를 이어받아 브라우저 상태 전환을 소유하는
// 클라이언트 경계다. 서버 요청 컨텍스트와 분리해 상태 계약을 독립적으로 검증한다.
// generateHomeMetadata는 이 화면의 metadata 계약이다. 본문과 같은 조회를 쓴다.
export { default as HomePage } from './ui/HomePage'
export { default as HomeContent } from './ui/HomeContent'
export { generateHomeMetadata } from './api/homeMetadata'
