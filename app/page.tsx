export { HomePage as default, generateHomeMetadata as generateMetadata } from '@/_pages/home';

// AI 생성: HomeSection이 apiFetch에 상대 경로('/api/home')를 넘긴다. Next.js는 실제 요청이 있을 때만
// fetch의 상대 경로를 요청 origin 기준으로 풀어준다 — `next build`의 정적 생성 단계는 요청 컨텍스트가 없어
// URL 파싱에 즉시 실패하고, 재시도 백오프가 걸리며 빌드가 60초 타임아웃으로 멈춘다. 동적 렌더링으로 두어
// 정적 생성 자체를 건너뛰고 실제 요청 시점에 렌더링하게 한다.
export const dynamic = 'force-dynamic';
