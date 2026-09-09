import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Header } from '@/widgets/header/ui/Header';
import { PageHeading } from '@/shared/ui/PageHeading/PageHeading';
import { getQueryClient } from '@/shared/api/getQueryClient';
import { readServerSession } from '@/app/_lib/readServerSession';
import { SESSION_QUERY_KEY } from '@/entities/session/api/sessionQueryOptions';

/** 첫 화면에 실제로 채워지는 카드 수(pageSize)와 같은 값 — 목록 크기를 그대로 예고하기 위해 맞춘다 */
const SKELETON_CARD_COUNT = 12;

/* AI-generated : Week 7 Part 4 — fallback과 본 콘텐츠가 초기 HTML에 함께 실리므로 제목 id를 분리한다.
   PageHeading 기본값을 그대로 쓰면 같은 id를 가진 h2가 한 문서에 2개가 된다(실측) */
/** fallback 전용 제목 id — 본 화면의 기본 id와 겹치지 않게 한다 */
const LOADING_TITLE_ID = 'week07-hero-title-loading';

/* AI-generated : week06-fsd.md 9단계 기준 — Next.js가 이 파일을 fallback으로 라우트 세그먼트를 자동으로 <Suspense>로 감싼다 */
/* AI-generated : Week 7 Part 2 Round 7 — 기존에는 "불러오는 중입니다…" 텍스트 한 줄만 있어서 요구사항인
   "실제 목록 크기를 예상할 수 있는 pending UI"를 만족하지 못했다(Round 4 캡처로 확인). 실제 페이지와 같은
   골격(Header·히어로·필터 자리·12칸 그리드)을 그려 곧 채워질 목록의 크기·형태를 미리 알린다.
   Header·PageHeading은 실제 컴포넌트를 그대로 재사용해 fallback과 본 화면의 기하가 어긋나지 않게 했다 */
/* Week 9 1단계 — fallback도 세션을 직접 읽는다. fallback과 본 콘텐츠는 같은 초기 HTML에 함께 실리는데,
   fallback은 page의 HydrationBoundary 밖이라 세션을 물려받지 못한다. 그대로 두면 로그인한 사용자에게도
   먼저 그려지는 Header가 "로그인" 링크를 보여준다. cookies() 읽기는 I/O가 없어 shell 지연이 사실상 없고,
   이 라우트는 이미 요청 시 렌더링이라 렌더링 범위도 달라지지 않는다 */
export default async function ProductsLoading() {
  const session = await readServerSession();
  const queryClient = getQueryClient();
  queryClient.setQueryData(SESSION_QUERY_KEY, session.user);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="week05-page">
        <Header />
        <main>
          <PageHeading
            title="상품 목록"
            description="카테고리와 조건으로 원하는 상품을 찾아보세요."
            compact
            titleId={LOADING_TITLE_ID}
          />
          <section className="week05-section" aria-hidden="true">
            <div className="week05-skeleton-filters">
              <span className="week05-skeleton week05-skeleton-field" />
              <span className="week05-skeleton week05-skeleton-field" />
              <span className="week05-skeleton week05-skeleton-field" />
            </div>
          </section>
          <section
            className="week05-section"
            aria-busy="true"
            aria-label="상품 목록을 불러오는 중입니다"
          >
            <p className="week05-skeleton week05-skeleton-count" />
            <div className="week05-grid">
              {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
                <div className="week05-product week05-skeleton-card" key={index} aria-hidden="true">
                  <div className="week05-image-wrap week05-skeleton" />
                  <span className="week05-skeleton week05-skeleton-brand" />
                  <span className="week05-skeleton week05-skeleton-name" />
                  <span className="week05-skeleton week05-skeleton-price" />
                </div>
              ))}
            </div>
          </section>
          <nav className="week05-pagination" aria-hidden="true">
            <span className="week05-skeleton week05-skeleton-pagination" />
          </nav>
        </main>
      </div>
    </HydrationBoundary>
  );
}
