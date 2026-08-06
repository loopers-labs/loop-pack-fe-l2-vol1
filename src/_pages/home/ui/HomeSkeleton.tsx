import { ProductGridSkeleton } from "@/features/products/ui/ProductSkeleton";
import { Skeleton } from "@/shared/ui/loading/Skeleton";

// API가 홈 상품을 섹션당 6개 준다. 로딩과 성공의 그리드 높이를 맞추려고 같은 개수를 그린다.
const HOME_SECTION_PRODUCT_COUNT = 6;

// 실제 마크업과 같은 클래스를 써서 로딩과 성공 사이에 레이아웃이 흔들리지 않게 한다.
export function HomeSkeleton() {
  return (
    <div aria-busy="true">
      {/* Hero와 같은 aspect-ratio(데스크톱 16/9·모바일 4/5)로 공간을 잡아 교체 시 CLS를 막는다. */}
      <Skeleton className="aspect-[16/9] max-[640px]:aspect-[4/5]" />
      <section className="week05-section">
        <Skeleton className="mb-4 h-6 w-24" />
        <div className="week05-categories">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-20" />
          ))}
        </div>
      </section>
      {["popular", "new"].map((section) => (
        <section className="week05-section" key={section}>
          <Skeleton className="mb-4 h-6 w-24" />
          <ProductGridSkeleton count={HOME_SECTION_PRODUCT_COUNT} />
        </section>
      ))}
    </div>
  );
}
