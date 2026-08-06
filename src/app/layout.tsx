import type { Metadata } from 'next';
import { getAppOrigin } from '@/shared/api/response';
import './globals.css';
/* AI-generated : Week 7 Part 2 — layout.css를 HomeView/ProductView 각각에서 import하면 Turbopack이 페이지별로 별도 CSS 청크를 만들어 render-blocking 요청이 2개(globals.css 계열 1개 + layout.css 1개)로 늘어난다(Lighthouse render-blocking-insight에서 확인). 루트 레이아웃에서 한 번만 import해 globals.css와 같은 청크로 묶는다 */
import './layout.css';
import '@/shared/ui/dialog/dialog_style.css';
import '@/shared/ui/select/select_style.css';
import { MainProvider } from './providers';

/* AI-generated : Week 7 Part 2 Round 12 — create-next-app 템플릿에서 온 Geist/Geist_Mono 설정을 제거.
   최초 커밋부터 globals.css의 body는 `Arial, Helvetica, sans-serif`였고 --font-geist-* 변수를 참조하는
   CSS가 한 줄도 없어, 화면은 계속 Arial로 렌더되면서 woff2 2개(약 52KB)만 매 요청 받고 있었다.
   next/font가 이들을 preload까지 걸어 hero(LCP 요소)와 같은 시점에 High 우선순위로 출발했고,
   대역폭을 나눠 쓰며 hero 다운로드를 늦추고 있었다. 렌더 결과는 바뀌지 않는다 */

const SITE_NAME = 'Commerce';
const SITE_DESCRIPTION = 'Loopers 커머스 - 4주차부터 여기에 쌓아갑니다.';

/* AI-generated : Week 7 Part 3 — Next.js의 metadata 병합은 shallow merge라, 페이지가 openGraph를 지정하면
   루트 openGraph 객체가 통째로 대체돼 siteName·locale·type이 사라진다. 페이지에서 `{ ...COMMON_OPEN_GRAPH, ... }`로
   명시적으로 펼쳐 쓰도록 공통 객체를 export한다 */
export const OG_FALLBACK_IMAGE = {
  url: '/images/week-07/og-default.jpg',
  width: 1200,
  height: 630,
};

export const COMMON_OPEN_GRAPH = {
  siteName: SITE_NAME,
  locale: 'ko_KR',
  type: 'website',
} satisfies NonNullable<Metadata['openGraph']>;

/* AI-generated : Week 7 Part 3 — metadataBase가 있어야 openGraph.images의 상대경로가 절대 URL로 확장된다.
   title.template으로 페이지 title에 공통 접미사를 붙인다(페이지가 title을 주지 않으면 default가 쓰인다) */
export const metadata: Metadata = {
  metadataBase: new URL(getAppOrigin()),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: {
    ...COMMON_OPEN_GRAPH,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_FALLBACK_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <MainProvider>{children}</MainProvider>
      </body>
    </html>
  );
}
