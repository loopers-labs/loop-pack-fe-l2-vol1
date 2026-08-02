// header 슬라이스가 외부에 공개하는 전부다.
// HeaderCounts는 내부 구현이다. 개수 배지만 클라이언트 컴포넌트로 두고 Header 자체는
// 서버 컴포넌트로 남기는 분리인데, 외부가 HeaderCounts를 직접 쓰면 그 의도가 깨진다.
export { default as Header } from './ui/Header'
