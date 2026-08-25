import Image from 'next/image';
import styles from './PageHeading.module.css';

/** 16:9로 표시되는 기본 히어로(홈) */
const HERO_IMAGE_WIDE = '/images/week-07/hero-original.jpg';
/** 21:9로 표시되는 축소 히어로(/products) — 원본을 21:9로 잘라둔 소스.
 *  next/image는 리사이즈만 하고 크롭은 못 하므로, 표시 비율과 다른 소스를 쓰면
 *  object-fit: cover가 잘라낼 픽셀까지 매번 내려받게 된다(실측 약 19% 낭비) */
const HERO_IMAGE_COMPACT = '/images/week-07/hero-original-21x9.jpg';
/** 페이지 컨테이너가 `min(100% - 32px, 1200px)`이므로 뷰포트 1232px을 기준으로 갈린다.
 *  좌우 여백 32px을 빼지 않으면 실제보다 넓게 신고돼 한 단계 큰 후보가 선택된다 */
const HERO_SIZES = '(min-width: 1232px) 1200px, calc(100vw - 32px)';

/** 한 문서에 이 컴포넌트가 하나만 있을 때 쓰는 기본 제목 id */
const DEFAULT_TITLE_ID = 'week07-hero-title';

type PageHeadingProps = {
  /** 페이지 제목 */
  title: string;
  /** 제목 위에 보여줄 설명 */
  description: string;
  /** 히어로 높이를 줄인 버전 — 검색·필터 변경마다 스크롤이 맨 위로 이동하는 페이지(/products)에서 그 이동 폭을 줄이기 위해 사용 */
  compact?: boolean;
  /** 제목 요소의 id. 같은 문서에 이 컴포넌트가 둘 이상 실릴 때(예: Suspense fallback과 본 화면) 서로 다른 값을 주어 id 중복을 피한다 */
  titleId?: string;
};

/* AI-generated : Home·Products 공통 Hero — shared는 entities/app을 몰라야 하므로 타입을 로컬에 선언하고 스타일도 shared 내부로 옮김 (FSD boundaries 위반 수정) */
/* AI-generated : Week 7 Part 1 — LCP 개선. 원본(hero-original.jpg)을 그대로 next/image(fill+priority)에 넘겨 요청 시점에 viewport·DPR에 맞는 크기로 서버에서 리사이즈·재인코딩하도록 하고, fetchpriority=high 프리로드를 적용. sizes는 실제 렌더 폭(최대 1200px)을 반영해 불필요하게 큰 srcset 후보가 선택되지 않게 함 */
/* AI-generated : Week 7 Part 2 Round 11 — hero 전송량 절감. 21:9로 표시되는 /products는 21:9로 잘라둔
   소스를 써서 object-fit: cover가 버릴 픽셀을 애초에 안 받는다(어떤 폭에서도 약 19% 감소:
   167,195 → 135,568 bytes). sizes에는 컨테이너 좌우 여백 32px을 반영해 실제 렌더 폭을 정확히 신고한다.
   quality는 기본 75 그대로 두어 화질은 건드리지 않는다 */
/* AI-generated : Week 7 Part 4 — 제목 id를 prop으로 뺐다. /products는 loading.tsx가 기하를 맞추려고 이 컴포넌트를
   그대로 재사용하는데, Suspense fallback과 본 콘텐츠가 초기 HTML에 함께 실려 같은 id를 가진 h2가 2개가 됐다(실측).
   JS를 켜면 하나가 제거되지만 JS 없이 받는 초기 HTML에는 중복 id와 그것을 가리키는 aria-labelledby 둘이 남는다 */
/* AI-generated : Week 7 Part 2 — nuqs의 scroll:true 때문에 검색어를 입력할 때마다 페이지가 맨 위로 스크롤되는데, 히어로가 크면 그 이동 폭이 커서 체감이 나쁘다. compact prop으로 /products의 히어로 높이를 줄여 이동 폭 자체를 줄인다(스크롤 동작 자체는 그대로 둠) */
export function PageHeading({
  title,
  description,
  compact = false,
  titleId = DEFAULT_TITLE_ID,
}: PageHeadingProps) {
  return (
    <section
      className={`${styles.hero}${compact ? ` ${styles.heroCompact}` : ''}`}
      aria-labelledby={titleId}
    >
      <Image
        className={styles.image}
        src={compact ? HERO_IMAGE_COMPACT : HERO_IMAGE_WIDE}
        alt=""
        fill
        sizes={HERO_SIZES}
        preload //priority deprecated로 변경
        fetchPriority="high"
        // Element Timing API 실험용 — React 타입 정의에 elementtiming이 아직 없어 우회
        {...({ elementtiming: 'hero-image' } as Record<string, string>)}
      />
      <div className={styles.copy}>
        <p className={styles.eyebrow}>이번 주의 발견</p>
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}
