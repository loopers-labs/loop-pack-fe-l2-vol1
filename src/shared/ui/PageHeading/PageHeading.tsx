type PageHeadingProps = {
  /** 페이지 제목 */
  title: string;
  /** 제목 위에 보여줄 설명 (선택) */
  description?: string;
};

/* AI-generated : week06-fsd.md 애매한 파일 결정표 기준 — 비즈니스 로직 없는 순수 프레젠테이션 */
export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <section className="week05-hero">
      {description && <p>{description}</p>}
      <h1>{title}</h1>
    </section>
  );
}
