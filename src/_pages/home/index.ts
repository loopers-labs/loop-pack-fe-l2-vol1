export { HomeSection } from "./ui/HomeSection";
// /api/home 라우트 핸들러가 응답 타입으로 소비하므로 타입만 공개(구현·prefetch 배선은 HomeSection 이 은닉).
export { type HomeResponse } from "./api/home";
