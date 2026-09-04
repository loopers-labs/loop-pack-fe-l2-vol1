import Link from "next/link";

// 주문서로 가는 링크. 무엇을 살지는 URL이 나른다 —
// 근거는 `_pages/checkout/model/resolveCheckoutQuery.ts`에 적었다.
//
// `order_start`를 여기서 보내지 않는다. 이 링크는 미로그인일 때 proxy에 막혀
// 로그인으로 튕기는데, 클릭 시점에 보내면 주문서를 못 본 세션까지
// "주문서에 진입했다"로 집계된다. 진입은 주문서 화면이 스스로 알린다.
export function StartOrderLink({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  return (
    <Link
      href={`/checkout?productId=${productId}`}
      aria-label={`${productName} 주문하기`}
      // 보호 경로는 프리페치하지 않는다. 미로그인 방문자에게는 목록에 보이는
      // 카드 12장이 전부 307을 받아 버려지고(실측: 클릭 한 번에 무관한 상품
      // 여러 개의 /checkout 요청이 나갔다), 그 리다이렉트 결과가 라우터 캐시에
      // 남아 로그인 후 복원을 방해한다.
      prefetch={false}
    >
      주문하기
    </Link>
  );
}
