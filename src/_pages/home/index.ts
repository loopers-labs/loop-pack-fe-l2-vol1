// 홈 슬라이스가 외부에 공개하는 전부다.
// api와 ui 세그먼트의 나머지는 내부 구현이며, 조회 계약이 이 슬라이스 안에 모여 있다는
// Decision 4의 이득은 외부가 그 안을 직접 참조하지 않을 때만 성립한다.
// HomeResponse는 프론트엔드 소비자가 아니라 mock 백엔드가 응답 형태로 참조한다.
export { default as HomePage } from './ui/HomePage'
export type { HomeResponse } from './api/home'
